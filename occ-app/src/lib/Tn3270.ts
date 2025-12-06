import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import 'dotenv/config';

type deferred = {
    resolve: (value?: string[]) => void,
    reject: (reason?: string) => void
};

const s3270exe = process.env.USERPROFILE + '\\Downloads\\OCCApp\\wc3270\\s3270.exe';
const s3270args = [ './src/assets/s3270config.s3270' ];

export class Tn3270 {
    s3270process: ChildProcessWithoutNullStreams;
    screenDataBuffer: string[] = [];
    waitingForOutput: boolean = false;
    cmdPromise!: deferred | null;
    ready!: Promise<void | string[]>;
    verbose: boolean = true;

    static async connect(verbose: boolean = true): Promise<Tn3270> {
        const client = new Tn3270(verbose);
        await client.ready;
        return client;
    }

    constructor(verbose: boolean = true) {
        this.verbose = verbose;
        this.s3270process = spawn(s3270exe, s3270args);
        if (this.verbose) console.log('Spawned emulator client');
        
        this.s3270process.stderr.on('data', data => {
            console.error(`s3270 Error: ${data.toString().trim()}`);
        });
        
        this.s3270process.on('close', code => {
            if (this.verbose) console.log(`s3270 process exited with code ${code}`);
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
                            this.cmdPromise.resolve(this.screenDataBuffer.map(line => line.startsWith('data: ') ? line.substring(6) : ''));
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

    sendCommand: (command: string, silent?: boolean) => Promise<string[] | void> = async (command: string, silent: boolean = false) => {
        return new Promise<string[] | void>((resolve, reject) => {
            this.cmdPromise = { resolve, reject };

            if (this.s3270process.stdin.writable) {
                if (!silent && this.verbose) console.log(`Sending command: ${command}`);
                else if (this.verbose) console.log('Sending silent command.')
                this.waitingForOutput = true;
                this.screenDataBuffer = [];
                this.s3270process.stdin.write(command + '\n');
            }
        });
    }

    sendString: (command: string, silent?: boolean) => Promise<void> = async (command: string, silent: boolean = false) =>
        this.sendCommand(`String("${command}")`, silent) as Promise<void>;

    read: () => Promise<string[]> = async () => this.sendCommand('Ascii()') as Promise<string[]>;

    runCommands: (commands: string[]) => Promise<void | string[]> =
        async (commands: string[]) => commands.reduce((chain, command) => chain.then(() => this.sendCommand(command)), Promise.resolve() as Promise<void | string[]>);
    
    quit: () => Promise<void> =
        async () => this.sendCommand('Quit()') as Promise<void>;
    
    login: (system: string, user: string, pass: string) => Promise<'ok' | 'expire' | 'logged' | 'fail'> =
        async (system: string, user: string, pass: string) => {
            await this.runCommands([
                `String("${system}")`,
                `Enter()`,
                `String("${user}")`,
                `Tab()`,
            ]);
            await this.sendString(pass, true);
            await this.runCommands([
                `Enter()`,
                `Wait(Unlock)`
            ]);

            const reply = await this.read();
            if (this.verbose) console.log(reply);
            if (reply.some(l => l.includes('YOUR PASSWORD WILL EXPIRE ON'))) return 'expire'
            if (reply.some(l => l.includes('Signon OK'))) return 'ok';
            if (reply.some(l => l.includes('Already signed on'))) return 'logged';
            return 'fail';
        }
}

// (async function() {
//     const client = await Tn3270.connect();
//     await client.runCommands([
//         `String("jic")`,
//         `Enter()`,
//         `String("JDEFWRM")`,
//         `Tab()`,
//         `String("${process.env.JIC_PASS}")`,
//         `Enter()`,
//         `String("jic")`,
//         `Enter()`,
//         `String("x")`,
//         `Enter()`,
//         `String("1")`,
//         `Enter()`,
//     ]);
//     const reply = await client.read();
//     console.log(reply!.join('\n'));
// })()