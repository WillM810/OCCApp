import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";
import { tmpdir } from "os";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { join } from "path";
import { readFile, unlink, writeFile } from "fs/promises";
import { promisify } from "util";
import { execFile } from "child_process";
import { getAttorneyData } from "@/lib/attorneyEmails";

const execFileAsync = promisify(execFile);
const QPDF = "C:\\Users\\william.mcvay\\Downloads\\OCCApp\\qpdf\\bin\\qpdf.exe";

function parsePdf(data: ArrayBuffer): Promise<any> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataReady', data => resolve(data));
        pdfParser.on('pdfParser_dataError', err => reject(err));

        pdfParser.parseBuffer(Buffer.from(data));
    });
}

export async function POST(request: NextRequest) {
    const { barId, court, conflictSheetArrayBuffer, duc } = await request.json();
    const modifiedBytes = await modifyConflictPdf(barId, court, conflictSheetArrayBuffer, duc)

    return new NextResponse(Buffer.from(modifiedBytes), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="edited.pdf"'
        }
    });
}

export async function modifyConflictPdf(barId: string, court: string, conflictSheetArrayBuffer: string, duc: string) {
    const fileBuffer = Buffer.from(conflictSheetArrayBuffer, 'base64');

    const pdfData = await parsePdf(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));
    const page = pdfData.Pages[0];
    
    const nameTextObj = page.Texts.find((t: any) =>
        t.R.some((r: any) => decodeURIComponent(r.T).includes('ATTORNEY:')));

    if (!nameTextObj) throw new Error(`Text not found: ${'ATTORNEY:'}`);
    const nameX = nameTextObj.x;
    const nameY = nameTextObj.y;

    const bufferedFile = Buffer.from(fileBuffer);
    
    const inputFile = join(tmpdir(), `input-${Date.now()}-${duc}.pdf`);
    const outputFile = join(tmpdir(), `output-${Date.now()}-${duc}.pdf`);
    await writeFile(inputFile, bufferedFile);
    await execFileAsync(QPDF, ['--decrypt', inputFile, outputFile]);
    const decryptedBuffer = await readFile(outputFile);
    
    const pdfDocument = await PDFDocument.load(decryptedBuffer);
    const firstPage = pdfDocument.getPages()[0];
    const font = await pdfDocument.embedFont(StandardFonts.Helvetica);

    const scaleX = firstPage.getSize().width / page.Width;
    const scaleY = firstPage.getSize().height / page.Height;

    const barIdMap = Object.fromEntries((getAttorneyData()).map(atty => [atty.barId, atty]));

    if (barId !== '0000') {
        firstPage.drawText(barIdMap[barId].name, {
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
    } else {
        firstPage.drawRectangle({
            x: (nameX * scaleX) + 70,
            y: firstPage.getSize().height - (nameY * scaleY) - 12,
            width: 250,
            height: 20,
            color: rgb(1, 1, 1)
        });

        firstPage.drawRectangle({
            x: (nameX * scaleX) + 420,
            y: firstPage.getSize().height - (nameY * scaleY) - 12,
            width: 50,
            height: 20,
            color: rgb(1, 1, 1)
        });
    }

    if (court !== 'C') firstPage.drawText('Christopher Tease', {
        x: (nameX * scaleX) + 40,
        y: firstPage.getSize().height - (nameY * scaleY) - 32,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    if (court !== 'C') firstPage.drawText(new Date().toLocaleDateString(), {
        x: (nameX * scaleX) + 400,
        y: firstPage.getSize().height - (nameY * scaleY) - 32,
        size: 12,
        font,
        color: rgb(0, 0, 0)
    });

    const modifiedBytes = await pdfDocument.save();

    await unlink(inputFile);
    await unlink(outputFile);

    return modifiedBytes;
}