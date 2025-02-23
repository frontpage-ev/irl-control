import OBSWebSocket from 'obs-websocket-js'

const excludedStats: string[] = [
    'PktSentTotalPktSentTotal',
]

const knownKeysNotNull: string[] = []

export function joinStats(stats: {
    [key: string]: number
}) {
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