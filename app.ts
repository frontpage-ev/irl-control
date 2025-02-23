import OBSWebSocket from 'obs-websocket-js'
import axios, { AxiosResponse } from 'axios'
import { EventEmitter } from 'events'
import { joinStats, setText } from './helpers'
import * as fs from 'node:fs'

const config: Config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
const socketsUrl: string = sprintf('%s/sockets', config.srt_relay.url)

const obs = new OBSWebSocket()
const ee = new EventEmitter()

obs.on('ConnectionOpened', () => {
    console.log('OBS Websocket connection opened')
})

obs.on('ConnectionClosed', async () => {
    console.log('OBS Websocket connection closed')
})

obs.on('ConnectionError', (error) => {
    console.error('Connection error:', error)
})

ee.on('SocketOnlineHeartbeat', async (socket: Socket) => {
    await setText(obs, config.obs.text_sources.info, 'Stream: Connected')
    await setText(obs, config.obs.text_sources.stats, joinStats(socket.stats))
})

ee.on('SocketOfflineHeartbeat', async (socket: Socket | undefined) => {
    await setText(obs, config.obs.text_sources.info, `Stream: Disconnected (${offlineDuration}s)`)
    if (socket) {
        await setText(obs, config.obs.text_sources.stats, joinStats(socket.stats))
    } else {
        await setText(obs, config.obs.text_sources.stats, '')
    }
})

ee.on('StreamOffline', async (duration: number) => {
    console.log(`Stream has been offline for ${duration} seconds`)
    try {
        await obs.call('SetCurrentProgramScene', {
            sceneName: config.obs.scenes.offline,
        })
    } catch (error) {
        console.error('Failed to update OBS (already disconnected?).', error)
    }
})

ee.on('StreamReconnected', async () => {
    console.log('Stream has reconnected')
    try {
        await obs.call('SetCurrentProgramScene', {
            sceneName: config.obs.scenes.normal,
        })
    } catch (error) {
        console.error('Failed to update OBS (already live?).', error)
    }
})

let offlineStartTime: any = null  // Variable to track the start time of offline state
let offlineDuration = 0  // Variable to count seconds offline
let markedOffline = false  // Variable to track if the stream was marked offline

// here is our core logic, checking the stream status every second
setInterval(async () => {
    try {
        if (!obs.identified) {
            await obs.connect(config.obs.url, config.obs.password)
        }
        const {data} = await axios.get(socketsUrl) as AxiosResponse<Socket[]>
        const stream = data.find((socket: Socket) => socket.stream_id.startsWith('publish/test/'))

        if (stream) {
            logStats(stream.stats).then(_r => {})
            if (stream.stats.MsRTT > config.health_check.max_ms_rtt) {
                console.log('Stream is unhealthy, RTT is too high:', stream.stats.MsRTT)
                await handleStreamUnhealthy(stream)
            } else {
                await handleStreamHealthy(stream)
            }
        } else {
            await handleStreamUnhealthy()
        }
    } catch (error) {
        console.error('Error checking stream status:', error)
    }
}, 1000)

function sprintf(format: string, ...args: any[]) {
    let i = 0
    return format.replace(/%s/g, () => args[i++])
}

async function handleStreamHealthy(stream: Socket) {
    // Stream is live, reset the offline timer
    offlineStartTime = null
    offlineDuration = 0

    if (stream.stats.MsRTT > config.health_check.warn_ms_rtt) {
        console.log('Stream is live, RTT is high:', stream.stats.MsRTT)
    } else {
        console.log('Stream is live, RTT is good:', stream.stats.MsRTT)
    }
    ee.emit('SocketOnlineHeartbeat', stream)

    if (markedOffline) {
        ee.emit('StreamReconnected')
        markedOffline = false
    }
}

async function handleStreamUnhealthy(stream: Socket | undefined = undefined) {
    // Stream is offline, start or continue the offline timer
    if (offlineStartTime === null) {
        // Start timing if it's the first offline check
        offlineStartTime = Date.now()
    }

    // Calculate the duration in seconds
    offlineDuration = Math.floor((Date.now() - offlineStartTime) / 1000)
    console.log(`Stream is offline for ${offlineDuration} seconds`)
    ee.emit('SocketOfflineHeartbeat', stream)

    if (offlineDuration >= 5 && !markedOffline) {
        ee.emit('StreamOffline', offlineDuration)
        markedOffline = true
    }
}

async function logStats(stats: any) {
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
