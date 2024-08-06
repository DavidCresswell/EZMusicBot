import { AudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import MusicItem from "./musicitem";
import { CommandInteraction, TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { downloadStream, getJson } from "./download";

export class BotPlayer {
    queue: MusicItem[];
    player: AudioPlayer;
    connection: VoiceConnection;
    guildId: string;
    channel: VoiceBasedChannel;
    textChannel: TextBasedChannel;
    nowPlaying: MusicItem;
    
    constructor(guildId: string, channel: VoiceBasedChannel) {
        this.queue = [];
        this.player = new AudioPlayer();
        this.connection = null;
        this.guildId = guildId;
        this.channel = channel;
        this.player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle') {
                this.playNext();
            }
        });
    }

    isConnected() {
        switch (this.connection?.state.status) {
            case 'destroyed':
            case 'disconnected':
            case null:
            case undefined:
                return false;
        }
        return true;
    }

    async reconnect() {
        console.log('Connecting...');
        this.connection = await joinVoiceChannel({
            channelId: this.channel.id,
            guildId: this.guildId,
            adapterCreator: this.channel.guild.voiceAdapterCreator
        });
        this.connection.subscribe(this.player);
    }

    async reconnectIfNeeded() {
        if (!this.isConnected()) {
            await this.reconnect();
        }
    }

    async play(url: string, interaction: CommandInteraction) {
        this.textChannel = interaction.channel;
        let json = await getJson(url);
        if (json.error) {
            console.error('Error:', json.error);
            let trimmed = json.error.substring(0, 1950);
            await interaction.editReply("Error: " + trimmed);
            return;
        }
        let musicItem : MusicItem = {
            url: url,
            title: json.data.title,
            durationSeconds: json.data.duration,
        };
        this.queue.push(musicItem);

        await this.reconnectIfNeeded();


        let durationFormatted = new Date(musicItem.durationSeconds * 1000).toISOString().substr(11, 8);

        if (this.player.state.status === 'idle') {
            this.nowPlaying = null;
            await this.playNext();
            await interaction.editReply("Playing " + musicItem.title + " (" + durationFormatted + ")");
        } else {
            await interaction.editReply("Enqueued " + musicItem.title + " (" + durationFormatted + ")");
        }
    }

    async playNext() {
        let item = this.queue.shift();
        if (this.connection.state)
        if (!item) {
            console.log('Queue empty, disconnecting');
            this.connection.destroy();
            this.connection = null;
            return;
        }
        try {
            let audioStream = await downloadStream(item.url);
            let streamRes = createAudioResource(audioStream, {
                inlineVolume: true
            });
            streamRes.volume.setVolume(0.2);
            this.player.play(streamRes);
        } catch (e) {
            console.error('Error playing:', e);
            this.textChannel.send(`Error playing ${item.title}: ${e}`).catch(() => {});
            await this.playNext();
            return;
        }
        this.nowPlaying = item;
        let formattedDuration = new Date(item.durationSeconds * 1000).toISOString().substr(11, 8);
        console.log(`Now playing: ${item.title} (${formattedDuration})`);
        this.textChannel.send(`Now playing: ${item.title} (${formattedDuration})`).catch(() => {});
    }

    async ensureChannel(channel: VoiceBasedChannel) {
        if (this.channel.id !== channel.id) {
            this.channel = channel;
            await this.reconnect();
        }
    }

    stop() {
        this.queue = [];
        this.player.stop();
        this.connection.destroy();
        this.connection = null;
        this.nowPlaying = null;
    }
}