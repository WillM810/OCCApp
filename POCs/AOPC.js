import { exec, fork, spawn } from 'child_process';
import fs from 'fs';

const duc = process.argv[2];

const qwsClientPath = '"c:\\Program Files (x86)\\QWS3270 Secure\\QWS3270s.exe"';
const templatePath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\POCs\\scripts\\aopc.jgp';
const scriptPath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\POCs\\scripts\\script.jgp';
const aopcPath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\AOPCs\\' + duc + '.txt';

const scriptTemplate = fs.readFileSync(templatePath, { encoding: 'utf8' });
const populatedScript = scriptTemplate.replaceAll('$DUC', duc)
                                        .replaceAll('$AOPC_PATH', aopcPath);
fs.writeFileSync(scriptPath, populatedScript);

exec(qwsClientPath + ' -w ' + scriptPath, (error) => {
    if (error) console.error(error);
    fs.rm(scriptPath, e => e && console.error(e));
});