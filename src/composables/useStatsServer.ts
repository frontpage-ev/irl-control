import { sprintf } from '../helpers'
import axios, { AxiosResponse } from 'axios'

export function useStatsServer(config: Config) {
    const options = config.stats_server

    const getStreamStats = async (): Promise<Stats | undefined> => {
        try {
            if (options.type === 'srtrelay') {
                const socketsUrl: string = sprintf('%s/sockets', options.url)
                const {data} = await axios.get(socketsUrl) as AxiosResponse<Socket[]>
                const stream: Socket | undefined = data.find((socket: Socket) => socket.stream_id.startsWith(options.publisher))

                if (stream) {
                    return {
                        MsRTT: stream.stats.MsRTT,
                    } as Stats
                }
            }

            if (options.type === 'belabox_cloud') {
                const {data} = await axios.get(options.url) as AxiosResponse<BelaboxStats>
                const publisher: BelaboxPublisherStats | undefined = data.publishers[options.publisher]

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

    return {
        getStreamStats,
    }
}