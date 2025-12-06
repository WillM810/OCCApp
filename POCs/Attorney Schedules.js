import { exec } from 'child_process';
import fs from 'fs';

const qwsClientPath = '"c:\\Program Files (x86)\\QWS3270 Secure\\QWS3270s.exe"';
const templatePath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\POCs\\scripts\\schedules.jgp';
const scriptPath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\POCs\\scripts\\script.jgp';
const tSchedulePath = process.env.USERPROFILE + '\\Downloads\\OCCApp\\data\\Schedules\\';
const schedulePath = process.env.USERPROFILE + '\\OneDrive - STATE OF DELAWARE\\Attorney Schedules';

const attorneyData = [
    {
        'barId': '003944',
        'name': 'Thomas Donovan',
        'emails': [
            'thomas.donovan@delaware.gov',
            'zoe.patchell@delaware.gov',
            'william.mcvay@delaware.gov',
        ]
    }, {
        'barId': '005613',
        'name': 'Zach George',
        'emails': [
            'zach@georgevyas.com',
            'desiree@georgevyas.com',
        ]
    }, {
        'barId': '005947',
        'name': 'Alicia Porter',
        'emails': [
            'aporter@bentonshockleylaw.com',
            'speyton@bentonshockleylaw.com',
        ]
    }, {
        'barId': '002235',
        'name': 'Kevin Howard',
        'emails': [
            'kevin@hopkinswindett.com',
            'veronica@hopkinswindett.com',
        ]
    }, {
        'barId': '005092',
        'name': 'Adam Windett',
        'emails': [
            'adam@hopkinswindett.com',
            'veronica@hopkinswindett.com',
        ]
    }, {
        'barId': '002542',
        'name': 'Bob Bria',
        'emails': [
            'bob@poliquinfirm.com',
            'tatiyana@poliquinfirm.com',
        ]
    }, {
        'barId': '007231',
        'name': 'Angelica Mamani',
        'emails': [
            'amamani@delawarelaw.com',
        ]
    }, {
        'barId': '004447',
        'name': 'Ron Poliquin',
        'emails': [
            'ronpoliquin@gmail.com',
            'tatiyana@poliquinfirm.com',
            'morgan@poliquinfirm.com',
        ]
    }, {
        'barId': '003547',
        'name': 'Chris Tease',
        'emails': [
            'christease4@gmail.com',
        ]
    }, {
        'barId': '007013',
        'name': 'Amit Vyas',
        'emails': [
            'amit@georgevyas.com',
            'marla@georgevyas.com',
            'christina@georgevyas.com',
        ]
    }, {
        'barId': '003263',
        'name': 'Scott Wilson',
        'emails': [
            'swilson218@aol.com',
        ]
    }
];

const attorneySegment = `
    rem // Iterate Attorneys
    type "$BARID"
    key "enter"
    lookfor "Position cursor"
    screentodisk "${tSchedulePath}\\$NAME Schedule.txt, 2/0, 20/80"
    dowhile (!search, "*** End of Data ***")
        key "pf8"
        appendtodisk "${tSchedulePath}\\$NAME Schedule.txt, 10/0, 20/80"
    endwhile
    `;

const attorneySegments = attorneyData.map(attorney => attorneySegment.replaceAll('$BARID', attorney.barId)
                                                                    .replaceAll('$NAME', attorney.name));

const now = new Date()
const startDate = convertDate(now);
now.setFullYear(now.getFullYear() + 1);
const endDate = convertDate(now);

const scriptTemplate = fs.readFileSync(templatePath, { encoding: 'utf8' });

const populatedScript = scriptTemplate.replaceAll('$SDATE', startDate)
                                        .replaceAll('$EDATE', endDate)
                                        .replaceAll('$ATTYS', attorneySegments.join('\n'));

fs.writeFileSync(scriptPath, populatedScript);

exec(qwsClientPath + ' -w ' + scriptPath, (error) => {
    if (error) console.error(`exec error: ${error}`);
    fs.rm(scriptPath, e => e && console.log(e));

    attorneyData.forEach(attorney => {
        const fileName = `${tSchedulePath}\\${attorney.name} Schedule.txt`;
        const scheduleDataLines = fs.readFileSync(fileName, { encoding: 'utf8' }).trim().split('\n');
        for (let i = 8; i < scheduleDataLines.length; i++) {
            if (scheduleDataLines[i].length === 1) scheduleDataLines.splice(i--, 1);
            else scheduleDataLines[i] = scheduleDataLines[i].replaceAll(/^ [ 1]\d/g, '   ');
        }
        fs.writeFileSync(`${schedulePath}\\${attorney.name} Schedule.txt`, scheduleDataLines.join('\n'));
    });
});

function convertDate(d) {
    return (d.getMonth() + 1).toString().padStart(2, '0') +
            d.getDate().toString().padStart(2, '0') +
            d.getFullYear();
}