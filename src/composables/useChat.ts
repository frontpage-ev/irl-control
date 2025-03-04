import { EventEmitter } from 'events'
import TES from 'tesjs'

export function useChat(config: Config, ee: EventEmitter) {
    const tes = new TES({
        identity: config.twitch.identity,
        listener: {type: 'websocket'},
    })

    tes.on('channel.chat.message', (event: any) => {
        if (event.message_type !== 'text' || !event.message.text.startsWith('!irlc')) {
            return
        }
        const args = event.message.text.split(' ')
        if (args.length < 2) {
            return
        }
        if (!event.badges || !event.badges.find((badge: any) => badge.set_id === 'broadcaster' || badge.set_id === 'moderator')) {
            console.warn(`User ${event.chatter_user_name} is not a broadcaster or moderator`)
            return
        }
        const command = args[1]
        if (command === 'pause') {
            ee.emit('PauseHealthCheck')
        } else if (['start', 'resume'].includes(command)) {
            ee.emit('ResumeHealthCheck')
        } else if (command === 'offline') {
            ee.emit('StreamOffline')
        } else if (['live', 'online'].includes(command)) {
            ee.emit('StreamReconnected')
        } else if (command === 'profile') {
            ee.emit('ChangeProfile', args[2] ?? 'default')
        } else if (command === 'rtt') {
            console.log('RTT')
        } else {
            console.warn(`Unknown command: ${command}`)
        }
    })

    tes.subscribe('channel.chat.message', {
        broadcaster_user_id: config.chat.broadcaster_user_id,
        user_id: config.chat.user_id,
    }, '1')
        .then(() => console.log('Subscription for channel.chat.message successful'))
        .catch((err: any) => console.log(err))
}