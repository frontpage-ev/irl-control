import { EventEmitter } from 'events'
import express, { json } from 'express'
import cors from 'cors'
import basicAuth from 'express-basic-auth'
import { exclude } from '../helpers'

export function useApi(
    config: Config,
    ee: EventEmitter,
    healthCheck: any,
) {
    const url = new URL(config.obs.url)
    const port: number = url.port ? (parseInt(url.port) + 1) : 4456
    const password: string = config.obs.password
        ? config.obs.password
        : 'password'

    const app = express()
    app.use(json())
    app.use(cors())
    app.use(basicAuth({
        users: {'admin': password},
    }))

    app.get('/', (_req, res) => {
        res.send('OK')
    })

    app.get('/api/health-check', (_req, res) => {
        res.json(healthCheck.state)
    })

    app.post('/api/health-check/pause', (_req, res) => {
        res.send('OK')
        ee.emit('PauseHealthCheck')
    })

    app.post('/api/health-check/resume', (_req, res) => {
        res.send('OK')
        ee.emit('ResumeHealthCheck')
    })

    app.get('/api/config', (_req, res) => {
        res.json(exclude(config, [
                'obs.password',
                'twitch.identity.secret',
                'twitch.identity.access_token',
                'twitch.identity.refresh_token',
            ],
        ))
    })

    app.post('/api/profiles', (req, res) => {
        const profile = req.body.profile
        if (!profile) {
            res.status(400).send('Profile is required')
            return
        }
        res.send('OK')
        ee.emit('ChangeProfile', profile)
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}