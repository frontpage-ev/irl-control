import { EventEmitter } from 'events'
import TES from 'tesjs'

export function useChat(config: Config, ee: EventEmitter) {
    const tes = new TES(config.tes)

    tes.on('channel.chat.message', (event: any) => {
        if (event.message_type !== 'text') {
            return
        }
        if (!event.message.text.startsWith('!irlc')) {
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
            ee.emit('PausePolling')
        } else if (command === 'start') {
            ee.emit('ResumePolling')
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