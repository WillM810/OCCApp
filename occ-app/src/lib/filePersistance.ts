import fs from 'fs';

export function readFile(file: string) {
    try {
        return JSON.parse(fs.readFileSync(process.cwd() + '/data/' + file).toString('utf8'));
    } catch (e) {
        console.error(e);
        return {};
    }
}