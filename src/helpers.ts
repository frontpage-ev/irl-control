import OBSWebSocket from 'obs-websocket-js'
import fs from 'node:fs'

const excludedStats: string[] = [
    'PktSentTotalPktSentTotal',
]

const knownKeysNotNull: string[] = []

export function joinStats(stats: Kv): string {
    // join 3 stats each line where stats is not 0
    const lines = []
    let line = []
    // @ts-ignore
    const keys = Object.entries(stats)
        .filter(([key, value]) => !excludedStats.includes(key) && value > 0)

    for (const [key, value] of keys) {
        if (!knownKeysNotNull.includes(key)) {
            knownKeysNotNull.push(key)
        }

        // fix decimal places if necessary
        if (value === parseInt(value.toString())) {
            line.push(`${key}: ${value}`)
        } else {
            line.push(`${key}: ${value.toFixed(2)}`)
        }
        if (line.length === 3) {
            lines.push(line.join(', '))
            line = []
        }
    }
    if (line.length > 0) {
        lines.push(line.join(', '))
    }

    // add line with keys that are knownKeysNotNull but not in current keys
    const knownKeysNotNullNotInStats = knownKeysNotNull.filter(key => !keys.map(([key, value]) => key).includes(key))
    if (knownKeysNotNullNotInStats.length > 0) {
        lines.push(`[KK0] ${knownKeysNotNullNotInStats.join(', ')}`)
    }

    return lines.join('\n')
}

export async function setText(obs: OBSWebSocket, inputName: string, text: string): Promise<void> {
    try {
        await obs.call('SetInputSettings', {
            inputName,
            inputSettings: {
                text,
            },
            overlay: true,
        })
    } catch (error) {
        console.error('Failed to update OBS (text not existing?).')
    }
}

export function sprintf(format: string, ...args: any[]) {
    let i = 0
    return format.replace(/%s/g, () => args[i++])
}

export async function logStats(stats: any) {
    // copy stats object
    const statsCopy = {...stats}
    // trim zero values
    for (const key in statsCopy) {
        if (statsCopy[key] === 0) {
            delete statsCopy[key]
        }
    }
    // append to file with timestamp
    statsCopy.Timestamp = new Date().toISOString()
    fs.appendFileSync('stats.log', JSON.stringify(statsCopy) + '\n')
}