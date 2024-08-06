import dotenv from 'dotenv';
dotenv.config({
    path: ['.env', '.env.defaults']
});
import Bot from './bot';
import { update } from './download';

let token = process.env.DISCORD_TOKEN;

if (!token || token.length < 5) {
    console.error('Environment variable DISCORD_TOKEN not set');
    setTimeout(() => {
        process.exit(1);
    }, 1000);
} else {
    let bot = new Bot();
    let updateInterval = parseInt(process.env.YTDL_UPDATE_INTERVAL);

    setInterval(() => {
        update().catch((e) => {
            console.error('Error updating:', e);
        });
    }, updateInterval * 1000);
}

