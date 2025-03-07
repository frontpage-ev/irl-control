# IRL Control

A quite simple application which allows you to automatically switch OBS scenes depending on the current state of
your [Streaming-Relay](https://github.com/frontpage-ev/srtrelay) connection. At the moment it is only possible to switch
between two scenes (one for online and one for offline).

## Installation

### Requirements

- [Node.js](https://nodejs.org/en/download/)
- [OBS Studio](https://obsproject.com/download)
- [Streaming-Relay](https://github.com/frontpage-ev/srtrelay) or [Belabox Cloud](https://cloud.belabox.net)

### Clone the repository

```bash
git clone https://github.com/frontpage-ev/irl-control.git
cd irl-control
```

### Install dependencies

```bash
yarn install
```

### Getting Access Tokens for Twitch API

Our applications require access to the Twitch API to read chat messages and send messages to the chat. To get access to
the Twitch API you need to create a new application in the Twitch Developer Console.

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Use `http://localhost` as the OAuth Redirect URL (you can change this later)
4. Copy the `Client ID` and `Client Secret` to your `config.json` file in the `twitch.identity` section

**Generate Access Token**

With the following quick link you can generate an access token for the required scopes:

- `channel:bot`
- `user:bot`
- `user:read:chat`

1. Go to [Twitch Token Generator](https://twitchtokengenerator.com/quick/BtuUF4hq3O)
2. Provide the `Client ID` and `Client Secret` from the previous step
3. Click on `Generate Token`
4. Copy the `Access Token` and `Refresh Token` to your `config.json` file in the `twitch.identity` section

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
  "chat": {
    "broadcaster_user_id": "106415581",
    "user_id": "106415581"
  },
  "twitch": {
    "identity": {
      "id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "access_token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "refresh_token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
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

Our applications support the Belabox Cloud as a stats server. You can use the following configuration to connect to the
Belabox Cloud:

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

Our applications support the SRT Relay as a stats server. You can use the following configuration to connect to the
SRT Relay:

```json
{
  "stats_server": {
    "type": "srtrelay",
    "url": "http://127.0.0.1:34101",
    "publisher": "publish/test/"
  }
}
```

**Profiles**

Profiles allows you to switch between different configurations. You can define multiple profiles in the `config.json`
file and switch between them by setting the `profile` parameter in the `config.json` file. Each profile can have its own
configuration, which replaces the default configuration in your `config.json` file.

```json
{
  "profile": "gz",
  "profiles": {
    "gz": {
      "chat": {
        "broadcaster_user_id": "106415581",
        "user_id": "106415581"
      }
    },
    "gz_qa": {
      "chat": {
        "broadcaster_user_id": "810421919",
        "user_id": "106415581"
      }
    }
  }
}
```

## Run the application

```bash
pm2 start ecosystem.config.js
```

## Chat Commands

- `!irlc pause` - Pause the automatic scene switching
- `!irlc resume` - Resume the automatic scene switching
- `!irlc online` - Switch to the online scene
- `!irlc offline` - Switch to the offline scene
- `!irlc profile <profile>` - Switch to a different profile

## API

The application provides an API to control the process. By default, the API is one port relative to the OBS WebSocket
port and uses the same password for authentication. So if your OBS WebSocket port is `4455` the API port is `4456`.

The username is `admin`. Be sure to have a strong password set.

### Endpoints

- `GET /api/health-check` - Get the current health check status
- `POST /api/health-check/pause` - Pause the health check
- `POST /api/health-check/resume` - Resume the health check
- `POST /api/profiles` - Switch to a different profile
- `GET /api/config` - Get the current configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.