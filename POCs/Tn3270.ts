import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import 'dotenv/config';

type deferred = {
    resolve: (value?: string[]) => void,
    reject: (reason?: string) => void
};

const s3270exe = process.env.USERPROFILE + '\\Downloads\\OCCApp\\wc3270\\s3270.exe';
const s3270args = [ 's3270config.s3270' ];

export class Tn3270 {
    s3270process: ChildProcessWithoutNullStreams;
    screenDataBuffer: string[] = [];
    waitingForOutput: boolean = false;
    cmdPromise!: deferred | null;
    ready!: Promise<void | string[]>;

    static async connect(): Promise<Tn3270> {
        const client = new Tn3270();
        await client.ready;
        return client;
    }

    constructor() {
        this.s3270process = spawn(s3270exe, s3270args);
        console.log('Spawned emulator client');
        
        this.s3270process.stderr.on('data', data => {
            console.error(`s3270 Error: ${data.toString().trim()}`);
        });
        
        this.s3270process.on('close', code => {
            console.log(`s3270 process exited with code ${code}`);
        });
        
        this.s3270process.stdout.on('data', data => {
            const lines: string[] = data.toString().trim().split('\n');
            lines.forEach(line => {
                if (this.waitingForOutput) {
                    this.screenDataBuffer.push(line);
                }
                if (line === 'ok') {
                    this.waitingForOutput = false;
                    
                    if (this.cmdPromise)
                        if (this.screenDataBuffer.some(line => line.startsWith('data: ')))
                            this.cmdPromise.resolve(this.screenDataBuffer.map(line => line.startsWith('data: ') ? line.substring(6) : '')
                                                        .filter(l => l));
                        else this.cmdPromise.resolve();
                        this.cmdPromise = null;
                } else if (line === 'error') {
                    this.waitingForOutput = false;
                    this.cmdPromise?.reject('Error running command');
                }
            });
        });
            
        this.ready = new Promise((resolve, reject) => {
            this.sendCommand('Wait(Unlock)').then(resolve);
        });
    }

    sendCommand: (command: string) => Promise<string[] | void> = async (command: string) => {
        return new Promise<string[] | void>((resolve, reject) => {
            this.cmdPromise = { resolve, reject };

            if (this.s3270process.stdin.writable) {
                console.log(`Sending command: ${command}`)
                this.waitingForOutput = true;
                this.screenDataBuffer = [];
                this.s3270process.stdin.write(command + '\n');
            }
        });
    }

    sendString: (command: string) => Promise<void> = async (command: string) => this.sendCommand(`String("${command}")`) as Promise<void>;

    read: () => Promise<string[]> = async () => this.sendCommand('Ascii()') as Promise<string[]>;

    runCommands: (commands: string[]) => Promise<void | string[]> =
        async (commands: string[]) => commands.reduce((chain, command) => chain.then(() => this.sendCommand(command)), Promise.resolve() as Promise<void | string[]>)
}

(async function() {
    const client = await Tn3270.connect();
    await client.runCommands([
        `String("jic")`,
        `Enter()`,
        `String("JDEFWRM")`,
        `Tab()`,
        `String("${process.env.JIC_PASS}")`,
        `Enter()`,
        `String("jic")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
    ]);
    const reply = await client.read();
    console.log(reply!.join('\n'));
})()