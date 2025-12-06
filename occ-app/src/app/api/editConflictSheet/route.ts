import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { tmpdir } from "os";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { join } from "path";
import { readFile, unlink, writeFile } from "fs/promises";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);
const QPDF = "C:\\Users\\william.mcvay\\Downloads\\OCCApp\\qpdf\\bin\\qpdf.exe";

export const barIdMap = {
    '4447': 'Ron Poliquin',
    '7013': 'Amit Vyas',
    '3263': 'Scott Wilson',
    '3547': 'Chris Tease',
    '7231': 'Angelica Mamani',
    '2542': 'Bob Bria',
    '5092': 'Adam Windett',
    '2235': 'Kevin Howard',
    '5947': 'Alicia Porter',
    '5613': 'Zach George',
    '3944': 'Tom Donovan',
} as { [k: string]: string; };

function parsePdf(data: ArrayBuffer): Promise<any> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataReady', data => resolve(data));
        pdfParser.on('pdfParser_dataError', err => reject(err));

        pdfParser.parseBuffer(Buffer.from(data));
    });
}

export async function POST(request: NextRequest) {
    const url = new URL(request.url);
    const barId = url.searchParams.get('barId')!;
    const fileBuffer = await request.arrayBuffer();

    const pdfData = await parsePdf(fileBuffer);
    const page = pdfData.Pages[0];
    
    const nameTextObj = page.Texts.find((t: any) =>
        t.R.some((r: any) => decodeURIComponent(r.T).includes('ATTORNEY:')));

    if (!nameTextObj) return NextResponse.json({ error: `Text not found: ${'ATTORNEY:'}`}, { status: 404 });
    const nameX = nameTextObj.x;
    const nameY = nameTextObj.y;

    const bufferedFile = Buffer.from(fileBuffer);
    
    const inputFile = join(tmpdir(), `input-${Date.now()}.pdf`);
    const outputFile = join(tmpdir(), `output-${Date.now()}.pdf`);
    await writeFile(inputFile, bufferedFile);
    await execFileAsync(QPDF, ['--decrypt', inputFile, outputFile]);
    const decryptedBuffer = await readFile(outputFile);
    
    const pdfDocument = await PDFDocument.load(decryptedBuffer);
    const firstPage = pdfDocument.getPages()[0];
    const font = await pdfDocument.embedFont(StandardFonts.Helvetica);

    const scaleX = firstPage.getSize().width / page.Width;
    const scaleY = firstPage.getSize().height / page.Height;

    firstPage.drawText(barIdMap[barId], {
        x: (nameX * scaleX) + 70,
        y: firstPage.getSize().height - (nameY * scaleY) - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    firstPage.drawText(barId, {
        x: (nameX * scaleX) + 420,
        y: firstPage.getSize().height - (nameY * scaleY) - 10,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    firstPage.drawText('Thomas Donovan', {
        x: (nameX * scaleX) + 40,
        y: firstPage.getSize().height - (nameY * scaleY) - 32,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    firstPage.drawText(new Date().toLocaleDateString(), {
        x: (nameX * scaleX) + 400,
        y: firstPage.getSize().height - (nameY * scaleY) - 32,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    const modifiedBytes = await pdfDocument.save();

    await unlink(inputFile);
    await unlink(outputFile);

    return new NextResponse(Buffer.from(modifiedBytes), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="edited.pdf"'
        }
    });
}