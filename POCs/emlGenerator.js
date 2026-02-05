import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";

const conflictType = process.argv[2];
const attorney = process.argv[3];

const ccpEmails = [
    '"Barry, Melanie (Courts)" <melanie.barry@delaware.gov>',
    '"Brooks, Julie (Courts)" <julie.brooks@delaware.gov>',
    '"Syva, Christine (Courts)" <christine.syva@delaware.gov>',
];

const fcEmails = [
    '"FC_Kent_Criminal (MailBox Resources)" <fc_kent_criminal@delaware.gov>',
    '"Licausi, Patricia A (Courts)" <patricia.licausi@delaware.gov>',
    '"Resh, Ashely R (Courts)" <ashely.r.resh@delaware.gov>',
    '"Whitney, Karen (Courts)" <karen.whitney@delaware.gov>',
    '"Tesoro, Rachel (Courts)" <rachel.tesoro@delaware.gov>',
    '"Cahall, Tiffany (Courts)" <tiffany.cahall@delaware.gov>',
];

const scEmails = [
    '"Ashley, Annette D (Courts)" <Annette.Ashley@delaware.gov>',
    '"Superior Kent, Criminal Proth (Mailbox Resources)" <Superior_Kent_Proth_Criminal@delaware.gov>',
    '"Britt, Kirra E (Courts)" <Kirra.Britt@delaware.gov>',
    '"Fries, Jenna (Courts)" <Jenna.Fries@delaware.gov>',
    '"Hitchens, Tracy L. (ODS)" <Tracy.Hitchens@delaware.gov>',
];

const attorneyData = [
    {
        'barId': '3944',
        'name': 'Thomas Donovan',
        'emails': [
            '"Thomas Donovan <thomas.donovan@delaware.gov>',
            '"=?UTF-8?B?Wm/Dqw==?= Patchell" <zoe.patchell@delaware.gov>',
            '"William McVay" <william.mcvay@delaware.gov>',
        ]
    }, {
        'barId': '5613',
        'name': 'Zach George',
        'emails': [
            '"Zack George" <zach@georgevyas.com>',
            '"Desiree Brubaker" <desiree@georgevyas.com>',
        ]
    }, {
        'barId': '5947',
        'name': 'Alicia Porter',
        'emails': [
            '"Alicia Porter" <aporter@bentonshockleylaw.com>',
            '"Stephanie Peyton" <speyton@bentonshockleylaw.com>',
        ]
    }, {
        'barId': '2235',
        'name': 'Kevin Howard',
        'emails': [
            '"Kevin Howard" <kevin@hopkinswindett.com>',
            '"Veronica August" <veronica@hopkinswindett.com>',
        ]
    }, {
        'barId': '5092',
        'name': 'Adam Windett',
        'emails': [
            '"Adam Windett" <adam@hopkinswindett.com>',
            '"Veronica August" <veronica@hopkinswindett.com>',
        ]
    }, {
        'barId': '2542',
        'name': 'Bob Bria',
        'emails': [
            '"Bob Bria" <bob@poliquinfirm.com>',
            '"Tatiyana Rickards" <tatiyana@poliquinfirm.com>',
        ]
    }, {
        'barId': '7231',
        'name': 'Angelica Mamani',
        'emails': [
            '"Angelica Mamani" <amamani@delawarelaw.com>',
            '"Linda Lambert" <llambert@delawarelaw.com>',
        ]
    }, {
        'barId': '4447',
        'name': 'Ron Poliquin',
        'emails': [
            '"Ron Poliquin" <ronpoliquin@gmail.com>',
            '"Tatiyana Rickards" <tatiyana@poliquinfirm.com>',
            '"Morgan Kramer" <morgan@poliquinfirm.com>',
        ]
    }, {
        'barId': '3547',
        'name': 'Chris Tease',
        'emails': [
            '"Chris Tease" <christease4@gmail.com>',
        ]
    }, {
        'barId': '7013',
        'name': 'Amit Vyas',
        'emails': [
            '"Amit Vyas" <amit@georgevyas.com>',
            '"Marla Carter" <marla@georgevyas.com>',
            '"Christina Mentis" <christina@georgevyas.com>',
        ]
    }, {
        'barId': '3263',
        'name': 'Scott Wilson',
        'emails': [
            '"Scott Wilson" <swilson218@aol.com>',
        ]
    }, {
        'barId': '6251',
        'name': 'Geena George',
        'emails': [
            '"Geena George" <geena@ggeorgelaw.com>'
        ]
    }
];

function encodeBase64(filePath) {
    const data = readFileSync(filePath);
    return data.toString("base64").replace(/(.{76})/g, "$1\n");
}

function getConflictSubject(flag) {
    if (!flag) return "Conflict";

    const f = flag.toLowerCase();

    if (f === "family") return "Family Conflict";
    if (f === "ccp") return "CCP Conflict";
    if (f === "sc") return "Superior Conflict";

    // default fallback if unknown
    return "Conflict";
}

function generateEml({ from, to, cc, subject, body, signatureLogo, attachments }) {
    const boundaryMain = "----=_MIME_MAIN_" + Date.now();
    const boundaryRelated = "----=_MIME_RELATED_" + (Date.now() + 1);
    const boundaryAlt = "----=_MIME_ALT_" + (Date.now() + 2);

    const logoCid = "signaturelogo@" + Date.now();

    // Plain-text signature (no image)
    const signatureText = `
Thank you,

Will McVay
Legal Administrative Assistant
Office of Conflicts Counsel
(302) 674-7451
William.McVay@delaware.gov
38 The Green, Suite 259
Dover, DE 19901
    `.trim();

    // HTML signature with inline image on the left
    const signatureHtml = `
<p>Thank you,</p>
<table style="border:none; border-collapse:collapse; padding:0; font-family:Arial, sans-serif; font-size:14px;">
    <tr>
        <td style="vertical-align:top; padding-right:10px;">
        ${signatureLogo ? `<img src="cid:${logoCid}" height="120" width="auto" style="height:40px;" alt="Logo">` : ''}
        </td>
        <td style="border-left:2px solid #555; width:1px;"></td>
        <td style="vertical-align:top; padding-left:10px;">
        <strong>Will McVay</strong><br>
        Legal Administrative Assistant<br>
        Office of Conflicts Counsel<br>
        (302) 674-7451<br>
        <a href="mailto:William.McVay@delaware.gov">William.McVay@delaware.gov</a><br>
        38 The Green, Suite 259<br>
        Dover, DE 19901
        </td>
    </tr>
</table>
    `.trim();


    let eml = "";

    // === HEADERS ===
    eml += `From: ${from}\n`;
    eml += `To: ${to}\n`;
    eml += `CC: ${cc}\n`;
    eml += `Subject: ${subject}\n`;
    eml += `Date: ${new Date().toUTCString()}\n`;
    eml += `Message-ID: <${Date.now()}@occ.local>\n`;
    eml += `MIME-Version: 1.0\n`;
    eml += `Content-Type: multipart/mixed; boundary="${boundaryMain}"\n\n`;

    // === RELATED BLOCK (HTML + inline images) ===
    eml += `--${boundaryMain}\n`;
    eml += `Content-Type: multipart/related; boundary="${boundaryRelated}"\n\n`;

    // === ALTERNATIVE BLOCK (text + html) ===
    eml += `--${boundaryRelated}\n`;
    eml += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\n\n`;

    // PLAIN TEXT
    eml += `--${boundaryAlt}\n`;
    eml += `Content-Type: text/plain; charset="utf-8"\n`;
    eml += `Content-Transfer-Encoding: 7bit\n\n`;
    eml += `${body}\n\n${signatureText}\n\n`;

    // HTML
    eml += `--${boundaryAlt}\n`;
    eml += `Content-Type: text/html; charset="utf-8"\n`;
    eml += `Content-Transfer-Encoding: 7bit\n\n`;
    eml += `<html><body>${body.replace(/\n/g, "<br>")}<br><br>${signatureHtml}</body></html>\n\n`;

    // Close alternative block
    eml += `--${boundaryAlt}--\n\n`;

    // === INLINE IMAGE ===
    if (signatureLogo) {
        const filename = basename(signatureLogo);
        const base64 = encodeBase64(signatureLogo);

        eml += `--${boundaryRelated}\n`;
        eml += `Content-Type: image/png; name="${filename}"\n`;
        eml += `Content-ID: <${logoCid}>\n`;
        eml += `Content-Disposition: inline; filename="${filename}"\n`;
        eml += `Content-Transfer-Encoding: base64\n\n`;
        eml += `${base64}\n\n`;
    }

    // Close related block
    eml += `--${boundaryRelated}--\n\n`;

    // === ATTACHMENTS ===
    for (const filePath of attachments) {
        const filename = basename(filePath);
        const base64 = encodeBase64(filePath);

        eml += `--${boundaryMain}\n`;
        eml += `Content-Type: application/octet-stream; name="${filename}"\n`;
        eml += `Content-Disposition: attachment; filename="${filename}"\n`;
        eml += `Content-Transfer-Encoding: base64\n\n`;
        eml += `${base64}\n\n`;
    }

    // End main multipart
    eml += `--${boundaryMain}--\n`;

    return eml;

}

function generateBody(attorney, conflictType, caseInfo) {
    const tod = new Date().getHours() >= 12 ? 'afternoon' : 'morning';
    caseInfo = caseInfo.map(c => {
        const endash = ' – ';
        const parts = c.split(endash);
        const date = new Date(parts[1].match(/ \d\d\/\d\d\/\d{4}/)[0].trim());
        const event = (date.getTime() - Date.now() < (7 * 24 * 60 * 60 * 1000)) ?
            `<span style="background-color:red">${parts[1]}</span>` :
            `<span style="background-color:yellow">${parts[1]}</span>`;
        return [ parts[0], event ].join(endash);
    });
    console.log(caseInfo);
    const body = `Good ${tod}.\n\nThe following case(s) have been assigned to ${attorney}${conflictType !== 'ccp' ? ' and entered in JIC' : ''}:\n` +
                `<strong>${caseInfo.join('\n')}</strong>`;
    return body;
}

// ------------------------------------------------
// Example Usage
// ------------------------------------------------
const attyData = attorneyData.find(a => a.barId === attorney);
const courtEmails = (conflictType === 'ccp' ?
    ccpEmails :
    (conflictType === 'fam' ?
        fcEmails :
        scEmails
    )
);
const eml = generateEml({
    from: `"Will McVay" <William.McVay@delaware.gov>`,
    to: [ attyData.emails.join('; '), courtEmails.join('; ') ].join('; '),
    cc: attorneyData.find(a => a.barId === '3944').emails.join('; '),
    subject: getConflictSubject(conflictType),
    body: generateBody(attyData.name, conflictType, []),
    signatureLogo: "./sigLogo.png",  // <-- inline CID logo
    attachments: []
});

writeFileSync("occ-message-with-logo.eml", eml);
console.log("Created occ-message-with-logo.eml");
