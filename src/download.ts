import { execFile, spawn } from 'child_process';
import { Readable } from 'stream';

interface DownloadResult {
    success: boolean;
    error: string;
    filename: string;
}

interface DataResult {
    success: boolean;
    error: string;
    data: {
        title: string;
        duration: number;
        [key: string]: any;
    };
}

export async function getJson(url: string) {
    if (!url.startsWith('http:') && !url.startsWith('https:')) {
        throw new Error('URL must start with http: or https:');
    }
    let command = process.env.YTDL_NAME;
    let commandArgs = '--dump-json --no-playlist ';
    commandArgs += url;
    let result = await new Promise<DataResult>((resolve) => {
        execFile(command, commandArgs.split(' '), (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, data: null, error: stderr });
            } else {
                try {
                    let json = JSON.parse(stdout);
                    resolve({ success: true, data: json, error: '' });
                } catch (e) {
                    resolve({ success: false, data: null, error: 'Could not parse video JSON' });
                }
            }
        });
    });
    return result;
}

export function downloadStream(url: string): Promise<Readable> {
    let promise = new Promise<Readable>((resolve, reject) => {
        let resolved = false;
        if (!url.startsWith('http:') && !url.startsWith('https:')) {
            throw new Error('URL must start with http: or https:');
        }
        let command = process.env.YTDL_NAME;
        let commandArgs = '-f bestaudio -x --no-playlist ';
        if (process.env.REMOVE_NON_MUSIC) {
            commandArgs += ' --sponsorblock-remove music_offtopic,intro,outro';
        }
        commandArgs += "-o - ";
        commandArgs += url;
        let errorData = '';
        let stream = new Readable({
            read() { }
        });
        let proc = spawn(command, commandArgs.split(' '), { shell: false });
        proc.stderr.on('data', (data: Buffer) => {
            let errorString = data.toString();
            if (resolved) {
                if (errorString.startsWith('[download] ')) {
                    return;
                }
                console.error('Error downloading data:', errorString);
            } else {
                errorData += errorString;
            }
        });
        proc.stdout.once('data', (data) => {
            if (!resolved) {
                resolved = true;
                console.log('Started downloading stream');
                resolve(stream);
            }
        });
        proc.stdout.on('data', (data) => {
            stream.push(data);
        });
        proc.on('close', (code) => {
            stream.push(null);
            if (resolved) {
                if (code !== 0) {
                    console.error('Subprocess exited with code', code);
                }
            } else {
                resolved = true;
                reject(new Error('Subprocess exited with code ' + code + ': ' + errorData));
            }
        });
    });
    return promise;
}

export async function update() {
    let commandFull = process.env.YTDL_UPDATE_COMMAND;
    let split = commandFull.split(' ');
    let command = split[0];
    let args = split.slice(1);
    let errorMessage = await new Promise<string>((resolve) => {
        execFile(command, args, (error, stdout, stderr) => {
            if (error.code !== 0) {
                resolve(stderr);
            } else {
                resolve(null);
            }
        });
    });
    if (errorMessage) {
        console.error(`Error updating ${process.env.YTDL_NAME} using command ${commandFull}:`, errorMessage);
    }
}
