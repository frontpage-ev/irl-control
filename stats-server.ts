import { sprintf } from './helpers'
import axios, { AxiosResponse } from 'axios'

export class StatsServer {
    private options: StatsServerOptions

    constructor(options: StatsServerOptions) {
        this.options = options
    }

    async getStreamStats(): Promise<Stats | undefined> {
        try {
            if (this.options.type === 'srtrelay') {
                const socketsUrl: string = sprintf('%s/sockets', this.options.url)
                const {data} = await axios.get(socketsUrl) as AxiosResponse<Socket[]>
                const stream: Socket | undefined = data.find((socket: Socket) => socket.stream_id.startsWith(this.options.publisher))

                if (stream) {
                    return {
                        MsRTT: stream.stats.MsRTT,
                    } as Stats
                }
            }

            if (this.options.type === 'belabox_cloud') {
                const {data} = await axios.get(this.options.url) as AxiosResponse<BelaboxStats>
                const publisher: BelaboxPublisherStats | undefined = data.publishers[this.options.publisher]

                if (publisher) {
                    if (!publisher.connected) {
                        return
                    }
                    return {
                        MsRTT: publisher.rtt,
                    } as Stats
                }
            }
        } catch (error) {
            console.error('Failed to get stream stats', error)
        }
    }
}