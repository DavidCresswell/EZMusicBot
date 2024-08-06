import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

export async function configureCommands(clientId: string, token: string) {
    console.log('Configuring commands');
    let commands : RESTPostAPIApplicationCommandsJSONBody[] = [
        {
            name: 'play',
            description: 'Play a song',
            options: [
                {
                    name: 'url',
                    type: 3,
                    description: 'URL of the song to play',
                    required: true
                }
            ]
        },
        {
            name: 'skip',
            description: 'Skip the current song'
        },
        {
            name: 'stop',
            description: 'Stop the music'
        },
        {
            name: 'queue',
            description: 'Show the queue'
        },
        {
            name: 'nowplaying',
            description: 'Show the currently playing song'
        },
        {
            name: 'np',
            description: 'Show the currently playing song'
        },
    ];
    let url = `https://discord.com/api/v10/applications/${clientId}/commands`;
    let result = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commands)
    });
    console.log('Commands configured');
}
