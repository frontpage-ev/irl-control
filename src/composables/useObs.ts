import OBSWebSocket from 'obs-websocket-js'

export function useObs() {
    const obs = new OBSWebSocket()

    obs.on('ConnectionOpened', () => {
        console.log('OBS Websocket connection opened')
    })

    obs.on('ConnectionClosed', async () => {
        console.log('OBS Websocket connection closed')
    })

    obs.on('ConnectionError', (error) => {
        console.error('Connection error:', error)
    })

    return {
        obs,
    }
}