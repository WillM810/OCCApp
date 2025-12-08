import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";

const conflictType = process.argv[2];

function encodeBase64(filePath) {
    const data = readFileSync(filePath);
    return data.toString("base64").replace(/(.{76})/g, "$1\n");
}

function getConflictSubject(flag) {
    if (!flag) return "Conflict";

    const f = flag.toLowerCase();

    if (f === "family") return "Family Conflict";
    if (f === "ccp") return "CCP Conflict";

    // default fallback if unknown
    return "Conflict";
}

function generateEml({ from, to, subject, body, signatureLogo, attachments }) {
    const boundaryMain = "----=_MIME_MAIN_" + Date.now();
    const boundaryRelated = "----=_MIME_RELATED_" + (Date.now() + 1);
    const boundaryAlt = "----=_MIME_ALT_" + (Date.now() + 2);

    const logoCid = "signaturelogo@" + Date.now();

    // Plain-text signature (no image)
    const signatureText = `
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
        <table style="border:none; border-collapse:collapse; padding:0; margin-top:10px; font-family:Arial, sans-serif; font-size:14px;">
            <tr>
                <td style="vertical-align:top; padding-right:10px;">
                <img src="cid:${logoCid}" style="height:90px;" alt="Logo">
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
    eml += `<html><body>\n${body.replace(/\n/g, "<br>")}\n<br><br>${signatureHtml}\n</body></html>\n\n`;

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

    // End related
    eml += `--${boundaryRelated}--\n\n`;

    // === ATTACHMENTS (normal attachments, not inline) ===
    for (const filePath of attachments) {
        const filename = basename(filePath);
        const base64 = encodeBase64(filePath);

        eml += `--${boundaryMain}\n`;
        eml += `Content-Type: application/octet-stream; name="${filename}"\n`;
        eml += `Content-Disposition: attachment; filename="${filename}"\n`;
        eml += `Content-Transfer-Encoding: base64\n\n`;
        eml += `${base64}\n\n`;
    }

    // End of main multipart
    eml += `--${boundaryMain}--\n`;

    return eml;
}


// ------------------------------------------------
// Example Usage
// ------------------------------------------------
const eml = generateEml({
    from: `"Will McVay" <William.McVay@delaware.gov>`,
    to: `"Recipient" <recipient@example.com>`,
    subject: getConflictSubject(conflictType),
    body: "Please find the documents attached.\nLet me know if you need anything further.",
    signatureLogo: "./sigLogo.png",  // <-- inline CID logo
    attachments: [
        "./test.pdf"
    ]
});

writeFileSync("occ-message-with-logo.eml", eml);
console.log("Created occ-message-with-logo.eml");
