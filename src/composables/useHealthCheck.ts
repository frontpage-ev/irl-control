import { EventEmitter } from 'events'
import { useStatsServer } from './useStatsServer'
import OBSWebSocket from 'obs-websocket-js'
import { logStats } from '../helpers'

export function useHealthCheck(
    config: Config,
    ee: EventEmitter,
    obs: OBSWebSocket,
) {
    const {getStreamStats} = useStatsServer(config)

    let offlineStartTime: any = null  // Variable to track the start time of offline state
    let offlineDuration = 0  // Variable to count seconds offline
    let markedOffline = false  // Variable to track if the stream was marked offline

    // here is our core logic, checking the stream status every second
    setInterval(async () => {
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
        offlineStartTime = null
        offlineDuration = 0

        if (stats.MsRTT > config.health_check.warn_ms_rtt) {
            console.log('Stream is live, RTT is high:', stats.MsRTT)
        } else {
            console.log('Stream is live, RTT is good:', stats.MsRTT)
        }
        ee.emit('SocketOnlineHeartbeat', stats)

        if (markedOffline) {
            ee.emit('StreamReconnected')
            markedOffline = false
        }
    }

    async function handleStreamUnhealthy(stream: Stats | undefined = undefined) {
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

    return {
        offlineDuration,
    }
}