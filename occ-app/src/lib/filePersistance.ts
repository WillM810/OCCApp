import fs from 'fs';

export function readFile(file: string) {
    try {
        return JSON.parse(fs.readFileSync(process.cwd() + '/data/' + file).toString('utf8'));
    } catch (e) {
        console.error(e);
        return {};
    }
}

export function writeFile(file: string, data: Object) {
    try {
        fs.writeFileSync(process.cwd() + '/data/' + file, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
