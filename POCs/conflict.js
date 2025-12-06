import { spawn } from 'node:child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs';

const duc = process.argv[2].slice(1);
const court = process.argv[2][0];

const qwsClientPath = '"c:\\Program Files (x86)\\QWS3270 Secure\\QWS3270s.exe"';

const templatePath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\POCs\\scripts\\conflict.jgp';
const scriptPath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\POCs\\scripts\\script.jgp';
const casesPath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\cases.txt';

const scriptTemplate = fs.readFileSync(templatePath, { encoding: 'utf8' });
const populatedScript = scriptTemplate.replaceAll('$DUC', duc)
                                        .replaceAll('$COURT', court)
                                        .replaceAll('$CASE_PATH', casesPath);

if (fs.existsSync(casesPath)) fs.unlinkSync(casesPath);
fs.writeFileSync(scriptPath, populatedScript);

console.log('Starting QWS3270...');
const qwsClient = spawn(qwsClientPath, ['-R', scriptPath], { shell: true });
console.log('QWS3270 Started...');

qwsClient.stdout.on('data', data => console.log(`STDOUT: ${data}`));
qwsClient.stderr.on('data', data => console.error(`STDERR: ${data}`));
qwsClient.on('error', err => console.error(`ERROR: ${err}`));
qwsClient.on('close', code => console.log(`Exited with code: ${code}`));

while (!fs.existsSync(casesPath) || !fs.readFileSync(casesPath, { encoding: 'utf8' }).includes('*** End of Data ***')) (async function() { await setTimeout(1000) })()

const cases = fs.readFileSync(casesPath, { encoding: 'utf8' }).split('\n').map((line) => { if (line[0] === ' ') return line.slice(23); else return line; });
console.log(cases);