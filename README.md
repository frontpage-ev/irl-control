# IRL Control

A quite simple application wich allow you to automatically switch OBS scenes depending on the current state of
your [Streaming-Relay](https://github.com/frontpage-ev/srtrelay) connection. At the moment it is only possible to switch
between two scenes (one for online and one for offline).

## Installation

### Requirements

- [Node.js](https://nodejs.org/en/download/)
- [OBS Studio](https://obsproject.com/download)
- [Streaming-Relay](https://github.com/frontpage-ev/srtrelay)

### Clone the repository

```bash
git clone https://github.com/frontpage-ev/irl-control.git
cd irl-control
```

### Install dependencies

```bash
yarn install
```

### Configuration

Create a `config.json` file in the root directory of the project and add the following content:

```json
{
  "obs": {
    "url": "ws://127.0.0.1:4455",
    "password": "password",
    "scenes": {
      "normal": "Live",
      "offline": "Disconnected"
    },
    "sources": {
      "info": "Info",
      "stats": "Stats"
    }
  },
  "stats_server": {
    "type": "belabox_cloud",
    "url": "https://stats.srt.belabox.net/XXXXX",
    "publisher": "live"
  },
  "health_check": {
    "warn_ms_rtt": 500,
    "max_ms_rtt": 2000
  }
}
```

**Belabox Cloud**

```json
{
  "stats_server": {
    "type": "belabox_cloud",
    "url": "https://stats.srt.belabox.net/XXXXX",
    "publisher": "live"
  }
}
```

**SRT Relay**

```json
{
  "stats_server": {
    "type": "srtrelay",
    "url": "http://127.0.0.1:34101",
    "publisher": "publish/test/"
  }
}
```

### Run the application

```bash
pm2 start ecosystem.config.js
```