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
    await setText(obs, config.obs.sources.info, `Stream: Disconnected (${healthCheck.state.offlineDuration}s)`)
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

ee.on('PauseHealthCheck', () => {
    healthCheck.state.paused = true
    console.log('Health check paused')
})

ee.on('ResumeHealthCheck', () => {
    healthCheck.state.paused = false
    console.log('Health check resumed')
})

ee.on('ChangeProfile', (profile: string) => {
    console.log(`Changing profile to: ${profile}`)
    const newConfig: ProfiledConfig = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
    if (!newConfig.profiles[profile]) {
        console.error(`Profile ${profile} not found`)
        return
    }
    newConfig.profile = profile
    // save the new profile
    fs.writeFileSync('config.json', JSON.stringify(newConfig, null, 2))
    // restart the app
    process.exit()
})


// bootstrap the app
const config: ProfiledConfig = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
if (config.profile) {
    console.log(`Using profile: ${config.profile}`)
    Object.assign(config, config.profiles[config.profile])
}
const {obs} = useObs(config, ee)
const healthCheck = useHealthCheck(config, ee, obs)
useChat(config, ee)
