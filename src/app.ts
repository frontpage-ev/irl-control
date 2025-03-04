import { EventEmitter } from 'events'
import { joinStats, setText } from './helpers'
import * as fs from 'node:fs'

import { useChat } from './composables/useChat'
import { useObs } from './composables/useObs'
import { useHealthCheck } from './composables/useHealthCheck'

const ee = new EventEmitter()

ee.on('SocketOnlineHeartbeat', async (stats: Stats) => {
    await setText(obs, config.obs.sources.info, 'Stream: Connected')
    await setText(obs, config.obs.sources.stats, joinStats(stats))
})

ee.on('SocketOfflineHeartbeat', async (stats: Stats | undefined) => {
    await setText(obs, config.obs.sources.info, `Stream: Disconnected (${offlineDuration}s)`)
    if (stats) {
        await setText(obs, config.obs.sources.stats, joinStats(stats))
    } else {
        await setText(obs, config.obs.sources.stats, '')
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


// bootstrap the app
const config: Config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
const {obs} = useObs(config, ee)
const {offlineDuration} = useHealthCheck(config, ee, obs)
useChat(config, ee)
