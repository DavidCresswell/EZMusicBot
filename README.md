# EZMusicBot - A discord music bot

This is a simple music bot for discord that uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) to retrieve music.

## Running the bot
- Create an application and get a bot token [here](https://discord.com/developers/applications)
- Add the bot to your server by using the Discord provided link in the "Installation" tab (make sure you add the "bot" permission)
- I recommend using docker or docker-compose.
### Docker
Replace the discord token in the following command
```
docker run -e DISCORD_TOKEN=... --restart unless-stopped --name musicbot -d ghcr.io/davidcresswell/ezmusicbot:master
docker logs musicbot
```
### Docker Compose
Copy docker-compose.yml to your server, set your token in the file, then run
```
docker compose up -d
docker compose logs
```
### From source
- Install node.js v20
- Install ffmpeg
- Clone this repository
- Set your DISCORD_TOKEN environment variable or create a .env file and set it there.
- Run the following. If opus and sodium fail to install it will still work but use slightly slower fallbacks.
```
npm install -d @discordjs/opus sodium
npm run build
node out/main.js
```
### Windows / Linux (not very tested)
- Install [ffmpeg](https://www.ffmpeg.org/download.html) and [yt-dlp](https://github.com/yt-dlp/yt-dlp/releases/latest) to your path
  - Windows: Copy the prebuilt ezmusicbot.exe artifact to a folder
  - Linux: Copy the prebuilt ezmusicbot artifact to a folder, and run chmod +x on it.
- Set your DISCORD_TOKEN environment variable or create a .env file and set it there.
- Run the application
