import { EventEmitter } from 'events'
import { useStatsServer } from './useStatsServer'
import OBSWebSocket from 'obs-websocket-js'
import { logStats } from '../helpers'

interface State {
    offlineDuration: number
    offlineStartTime: number | null
    markedOffline: boolean
    paused: boolean
}

export function useHealthCheck(
    config: Config,
    ee: EventEmitter,
    obs: OBSWebSocket,
) {
    const {getStreamStats} = useStatsServer(config)

    const state: State = {
        offlineDuration: 0,
        offlineStartTime: null,
        markedOffline: false,
        paused: false,
    }

    // here is our core logic, checking the stream status every second
    setInterval(async () => {
        if (state.paused) {
            return
        }
        try {
            if (!obs.identified) {
                await obs.connect(config.obs.url, config.obs.password)
            }
            const stats: Stats | undefined = await getStreamStats()

            if (stats) {
                // noinspection ES6MissingAwait
                logStats(stats)
                if (stats.MsRTT > config.health_check.max_ms_rtt) {
                    console.log('Stream is unhealthy, RTT is too high:', stats.MsRTT)
                    await handleStreamUnhealthy(stats)
                } else {
                    await handleStreamHealthy(stats)
                }
            } else {
                await handleStreamUnhealthy()
            }
        } catch (error) {
            console.error('Error checking stream status:', error)
        }
    }, 1000)

    async function handleStreamHealthy(stats: Stats) {
        // Stream is live, reset the offline timer
        state.offlineStartTime = null
        state.offlineDuration = 0

        if (stats.MsRTT > config.health_check.warn_ms_rtt) {
            console.log('Stream is live, RTT is high:', stats.MsRTT)
        } else {
            console.log('Stream is live, RTT is good:', stats.MsRTT)
        }
        ee.emit('SocketOnlineHeartbeat', stats)

        if (state.markedOffline) {
            ee.emit('StreamReconnected')
            state.markedOffline = false
        }
    }

    async function handleStreamUnhealthy(stream: Stats | undefined = undefined) {
        // Stream is offline, start or continue the offline timer
        if (state.offlineStartTime === null) {
            // Start timing if it's the first offline check
            state.offlineStartTime = Date.now()
        }

        // Calculate the duration in seconds
        state.offlineDuration = Math.floor((Date.now() - state.offlineStartTime) / 1000)
        console.log(`Stream is offline for ${state.offlineDuration} seconds`)
        ee.emit('SocketOfflineHeartbeat', stream)

        if (state.offlineDuration >= 5 && !state.markedOffline) {
            ee.emit('StreamOffline', state.offlineDuration)
            state.markedOffline = true
        }
    }

    return {
        state,
    }
}