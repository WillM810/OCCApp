import PDFParser from "pdf2json";
import fs from 'fs';

function parsePdf(data) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataReady', data => resolve(data));
        pdfParser.on('pdfParser_dataError', err => reject(err));

        pdfParser.parseBuffer(Buffer.from(data));
    });
}

async function main() {
    const fb = fs.readFileSync('./test.pdf');

    const data = await parsePdf(fb.buffer.slice(fb.byteOffset, fb.byteOffset + fb.byteLength));
    const page = data.Pages[0];

    const thisDuc = page.Texts[1].R[0].T;
    const conflictDuc = page.Texts[page.Texts.findIndex(l => l.R[0].T === 'Basis of Conflict') - 1].R[0].T;

    console.log(thisDuc, conflictDuc);
    console.log([...new Set(page.Texts.map(t => t.R[0].T.match(/\d{10}/)).filter(l => l).map(l => l[0]))]);
    // console.log(page.Texts.map(t => t.R))
}

console.log('read pdf');
await main();
console.log('read pdf');