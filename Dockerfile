FROM node:20

RUN mkdir /bot

WORKDIR /bot

COPY package.json package-lock.json tsconfig.json ./

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp --create-dirs -o ~/bin/yt-dlp && \
    chmod a+rx ~/bin/yt-dlp

RUN npm install -d @discordjs/opus ffmpeg-static sodium

COPY src src

RUN npx tsc --project tsconfig.json

ENV DISCORD_TOKEN=
ENV YTDL_NAME=yt-dlp
ENV YTDL_UPDATE_COMMAND="yt-dlp -U"
ENV YTDL_UPDATE_INTERVAL=86400
ENV REMOVE_NON_MUSIC_PARTS=true

CMD ["node", "out/main.js"]
