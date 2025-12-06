import fs from 'fs';

const aopcData = fs.readFileSync('./aopc.txt', { encoding: 'utf8' });
const regex = /[SDWC]\d ((?:[A-Z]\w+ ?)*?) \(.*? DOB\: (.*?)\)/gm;

let match;
while (match = regex.exec(aopcData)) {
    console.log(match[1], match[2]);
}