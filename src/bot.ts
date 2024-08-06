import { Client, GuildMember, Interaction } from 'discord.js';
import { BotPlayer } from './botplayer';
import { configureCommands } from './configurecommands';

export default class Bot {
    client: Client;
    players: Map<string, BotPlayer>;

    constructor() {
        this.client = new Client({
            intents: ['Guilds', 'GuildVoiceStates']
        });
        this.players = new Map();
        this.client.login(process.env.DISCORD_TOKEN);
        this.client.on('interactionCreate', (interaction) => {
            try {
                this.onInteraction(interaction);
            } catch (e) {
                console.error('Error handling interaction:', e);
            }
        });
        this.client.on('ready', () => {
            console.log('Logged in as ' + this.client.user.tag);
            let clientId = this.client.user.id;
            configureCommands(clientId, process.env.DISCORD_TOKEN).catch((e) => {
                console.error('Error configuring commands:', e);
            });
        });
    }

    async onInteraction(interaction: Interaction) {
        if (!interaction.isCommand()) {
            return;
        }
        console.log('Command:', interaction.commandName);

        switch (interaction.commandName) {
            case 'play':
                {
                    let member = <GuildMember>interaction.member;
                    let vc = member.voice.channel;
                    if (!vc) {
                        await interaction.reply({
                            content: 'You must be in a voice channel to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    interaction.deferReply({
                        ephemeral: false
                    });
                    let guildId = vc.guildId;
                    let botPlayer = this.players.get(guildId);
                    if (!botPlayer) {
                        botPlayer = new BotPlayer(guildId, vc);
                        this.players.set(guildId, botPlayer);
                    } else {
                        botPlayer.ensureChannel(vc);
                    }

                    let url = <string>interaction.options.get('url').value;

                    await botPlayer.play(url, interaction);
                    break;
                }
            case 'skip':
                {
                    let member = <GuildMember>interaction.member;
                    let vc = member.voice.channel;
                    if (!vc) {
                        await interaction.reply({
                            content: 'You must be in a voice channel to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    let guildId = vc.guildId;
                    let botPlayer = this.players.get(guildId);
                    if (!botPlayer) {
                        await interaction.reply({
                            content: 'No music is playing',
                            ephemeral: true
                        });
                        return;
                    }
                    if (botPlayer.channel?.id !== vc.id) {
                        await interaction.reply({
                            content: 'You must be in the same voice channel as the bot to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    await botPlayer.playNext();
                    let nowPlaying = botPlayer.nowPlaying;
                    if (nowPlaying) {
                        await interaction.reply(`Now playing: ${nowPlaying.title}`);
                    } else {
                        await interaction.reply('Queue is now empty');
                    }
                    break;
                }
            case 'queue':
                {
                    let member = <GuildMember>interaction.member;
                    let vc = member.voice.channel;
                    if (!vc) {
                        await interaction.reply({
                            content: 'You must be in a voice channel to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    let guildId = vc.guildId;
                    let botPlayer = this.players.get(guildId);
                    if (!botPlayer) {
                        await interaction.reply({
                            content: 'No music is playing',
                            ephemeral: true
                        });
                        return;
                    }
                    if (botPlayer.channel?.id !== vc.id) {
                        await interaction.reply({
                            content: 'You must be in the same voice channel as the bot to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    let queue = botPlayer.queue;
                    let nowPlayingText = 'Now playing: ' + (botPlayer.nowPlaying?.title ?? 'Nothing');
                    if (queue.length === 0) {
                        await interaction.reply(nowPlayingText + '\nQueue is empty');
                    } else {
                        let queueText = queue.map((item, index) => `${index + 1}. ${item.title}`).join('\n');
                        await interaction.reply(nowPlayingText + `\nQueue:\n${queueText}`);
                    }
                    break;
                }
            case 'stop':
                {
                    let member = <GuildMember>interaction.member;
                    let vc = member.voice.channel;
                    if (!vc) {
                        await interaction.reply({
                            content: 'You must be in a voice channel to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    let guildId = vc.guildId;
                    let botPlayer = this.players.get(guildId);
                    if (!botPlayer || !botPlayer.isConnected()) {
                        await interaction.reply({
                            content: 'No music is playing',
                            ephemeral: true
                        });
                        return;
                    }
                    if (botPlayer.channel?.id !== vc.id) {
                        await interaction.reply({
                            content: 'You must be in the same voice channel as the bot to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    botPlayer.stop();
                    await interaction.reply('Music stopped');
                    break;
                }
            case 'nowplaying':
            case 'np':
                {
                    let member = <GuildMember>interaction.member;
                    let vc = member.voice.channel;
                    if (!vc) {
                        await interaction.reply({
                            content: 'You must be in a voice channel to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    let guildId = vc.guildId;
                    let botPlayer = this.players.get(guildId);
                    if (!botPlayer) {
                        await interaction.reply({
                            content: 'No music is playing',
                            ephemeral: true
                        });
                        return;
                    }
                    if (botPlayer.channel?.id !== vc.id) {
                        await interaction.reply({
                            content: 'You must be in the same voice channel as the bot to use this command',
                            ephemeral: true
                        });
                        return;
                    }
                    let nowPlaying = botPlayer.nowPlaying;
                    if (nowPlaying) {
                        await interaction.reply(`Now playing: ${nowPlaying.title}`);
                    } else {
                        await interaction.reply('Nothing is playing');
                    }
                    break;
                }
            default:
                interaction.reply({
                    content: 'Error: unknown command ' + interaction.commandName + '(' + interaction.commandId + ')',
                    ephemeral: true
                });
                break;
        }
    }
}

