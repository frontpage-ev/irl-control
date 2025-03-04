interface Config {
    obs: {
        url?: string
        port?: number
        password?: string
        scenes: {
            normal: string
            offline: string
        },
        sources: {
            info: string
            stats: string
        }
    }
    stats_server: StatsServerOptions
    health_check: {
        warn_ms_rtt: number
        max_ms_rtt: number
    }
}

interface StatsServerOptions {
    type: 'srtrelay' | 'belabox_cloud'
    url: string
    publisher: string
}

interface BelaboxPublisherStats {
    connected: boolean,
    latency: number,
    network: number,
    bitrate: number,
    rtt: number,
    dropped_pkts: number
}

interface BelaboxStats {
    publishers: {
        [key: string]: BelaboxPublisherStats
    },
    consumers: []
}

interface Kv {
    [key: string]: number
}

interface Stats extends Kv {
    MsRTT: number
}

interface Socket {
    address: string
    stream_id: string
    stats: {
        MsTimeStamp: number
        PktSentTotal: number
        PktRecvTotal: number
        PktSndLossTotal: number
        PktRcvLossTotal: number
        PktRetransTotal: number
        PktSentACKTotal: number
        PktRecvACKTotal: number
        PktSentNAKTotal: number
        PktRecvNAKTotal: number
        UsSndDurationTotal: number
        PktSndDropTotal: number
        PktRcvDropTotal: number
        PktRcvUndecryptTotal: number
        ByteSentTotal: number
        ByteRecvTotal: number
        ByteRcvLossTotal: number
        ByteRetransTotal: number
        ByteSndDropTotal: number
        ByteRcvDropTotal: number
        ByteRcvUndecryptTotal: number
        PktSent: number
        PktRecv: number
        PktSndLoss: number
        PktRcvLoss: number
        PktRetrans: number
        PktRcvRetrans: number
        PktSentACK: number
        PktRecvACK: number
        PktSentNAK: number
        PktRecvNAK: number
        MbpsSendRate: number
        MbpsRecvRate: number
        UsSndDuration: number
        PktReorderDistance: number
        PktRcvAvgBelatedTime: number
        PktRcvBelated: number
        PktSndDrop: number
        PktRcvDrop: number
        PktRcvUndecrypt: number
        ByteSent: number
        ByteRecv: number
        ByteRcvLoss: number
        ByteRetrans: number
        ByteSndDrop: number
        ByteRcvDrop: number
        ByteRcvUndecrypt: number
        UsPktSndPeriod: number
        PktFlowWindow: number
        PktCongestionWindow: number
        PktFlightSize: number
        MsRTT: number
        MbpsBandwidth: number
        ByteAvailSndBuf: number
        ByteAvailRcvBuf: number
        MbpsMaxBW: number
        ByteMSS: number
        PktSndBuf: number
        ByteSndBuf: number
        MsSndBuf: number
        MsSndTsbPdDelay: number
        PktRcvBuf: number
        ByteRcvBuf: number
        MsRcvBuf: number
        MsRcvTsbPdDelay: number
        PktSndFilterExtraTotal: number
        PktRcvFilterExtraTotal: number
        PktRcvFilterSupplyTotal: number
        PktRcvFilterLossTotal: number
        PktSndFilterExtra: number
        PktRcvFilterExtra: number
        PktRcvFilterSupply: number
        PktRcvFilterLoss: number
        PktReorderTolerance: number
    }
}