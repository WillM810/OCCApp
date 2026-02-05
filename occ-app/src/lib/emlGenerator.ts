import { readFileSync } from "fs";
import { basename } from "path";

export type ConflictType = 'fam' | 'ccp' | 'sup';

type EmailData = {
    from: string;
    to: string;
    cc?: string;
    subject: string;
    body: string;
    signatureLogo: string;
    attachments: { name: string, data: string }[];
}

function encodeBase64(fileData: ArrayBuffer) {
    return Buffer.from(fileData).toString("base64").replace(/(.{76})/g, "$1\n");
}

export function getConflictSubject(flag: ConflictType) {
    if (!flag) return "Conflict";

    const f = flag.toLowerCase();

    if (f === "fam") return "Family Conflict";
    if (f === "ccp") return "CCP Conflict";
    if (f === "sup") return "Superior Conflict";

    // default fallback if unknown
    return "Conflict";
}

export function generateBody(attorneyName: string, conflictType: ConflictType, caseInfo: string[], filename: string) {
    const tod = new Date().getHours() >= 12 ? 'afternoon' : 'morning';
    caseInfo = caseInfo.map(c => {
        const endash = ' – ';
        const parts = c.split(endash);
        if (parts[1] === 'NONE') return c;
        const date = new Date(parts[1].match(/ \d\d\/\d\d\/\d{4}/)![0].trim());
        const event = (date.getTime() - Date.now() < (7 * 24 * 60 * 60 * 1000)) ?
            `<span style="background-color:red">${parts[1]}</span>` :
            `<span style="background-color:yellow">${parts[1]}</span>`;
        return [ parts[0], event ].join(endash);
    });
    console.log(caseInfo);
    const body = `Good ${tod}.\n\nThe following case(s) have been assigned to ${attorneyName}${conflictType !== 'ccp' ? ' and entered in JIC' : ''}:\n` +
                `<strong>${caseInfo.join('\n')}</strong><!--filename:${filename}-->`;
    return body;
}

export async function generateEml({ from, to, cc, subject, body, signatureLogo, attachments }: EmailData) {
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
    if (cc) eml += `CC: ${cc}\n`;
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
        const base64 = encodeBase64(Buffer.from(readFileSync(signatureLogo)).buffer);

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
        const filename = filePath.name;
        const base64 = filePath.data;

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