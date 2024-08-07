import { execFile, spawn } from 'child_process';
import { Readable } from 'stream';

export interface DataResult {
    success: boolean;
    error: string;
    data: {
        title: string;
        duration: number;
        webpage_url: string;
        [key: string]: any;
    };
}

export async function searchJson(query: string) {
    let command = process.env.YTDL_NAME;
    let commandArgs = ['--dump-json', '--no-playlist', 'ytsearch1:' + query]
    let result = await new Promise<DataResult>((resolve) => {
        execFile(command, commandArgs, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, data: null, error: `${error.code} ${error.message} -- ${stderr}` });
            } else {
                if (stderr.length > 0) {
                    console.error('yt-dlp stderr:', stderr);
                }
                try {
                    if (stdout.length === 0) {
                        resolve({ success: false, data: null, error: 'No results found' });
                    }
                    let json = JSON.parse(stdout);
                    resolve({ success: true, data: json, error: '' });
                } catch (e) {
                    resolve({ success: false, data: null, error: 'Could not parse search JSON' });
                }
            }
        });
    });
    return result;
}

export async function getJson(url: string) {
    if (!url.startsWith('http:') && !url.startsWith('https:')) {
        throw new Error('URL must start with http: or https:');
    }
    let command = process.env.YTDL_NAME;
    let commandArgs = ['--dump-json', '--no-playlist', url];
    let result = await new Promise<DataResult>((resolve) => {
        execFile(command, commandArgs, (error, stdout, stderr) => {
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
        let commandArgs = ['-f', 'bestaudio', '-x', '--no-playlist', '--limit-rate', '500K'];
        if (process.env.REMOVE_NON_MUSIC_PARTS) {
            // this doesn't actually work, probably needs an actual file to post-process on
            commandArgs.push('--sponsorblock-remove', 'music_offtopic,intro,outro');
        }
        commandArgs.push('-o', '-', url);
        let errorData = '';
        let proc = spawn(command, commandArgs, { shell: false });
        let stream = new Readable({
            read() { },
            destroy: () => {
                console.log('Destroying download stream');
                proc.kill(2);
            }
        });
        proc.stderr.on('data', (data: Buffer) => {
            let errorString = data.toString().trim();
            if (resolved) {
                if (errorString.length === 0 || errorString.startsWith('[download] ')) {
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
            console.log('Download stream closed');
            stream.push(null);
            if (resolved) {
                if (code !== null && code !== 0) {
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
    console.log('Updating using', process.env.YTDL_UPDATE_COMMAND);
    let commandFull = process.env.YTDL_UPDATE_COMMAND;
    let split = commandFull.split(' ');
    let command = split[0];
    let args = split.slice(1);
    let errorMessage = await new Promise<string>((resolve) => {
        execFile(command, args, (error, stdout, stderr) => {
            console.log(stdout);
            if (error) {
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
