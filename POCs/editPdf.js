import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const execFileAsync = promisify(execFile);

// UPDATE THIS: the full path to your portable qpdf.exe
const QPDF = "C:\\Users\\william.mcvay\\Downloads\\OCCApp\\qpdf\\bin\\qpdf.exe";

async function decryptPDF(inputPath, outputPath) {
  console.log("Decrypting PDF...");
  await execFileAsync(QPDF, ["--decrypt", inputPath, outputPath]);
}

async function editPDF(inputPath, outputPath, searchText, newText) {
  console.log("Loading decrypted PDF...");

  const bytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(bytes);

  const pages = pdfDoc.getPages();
  const page = pages[0];

  // 👇 Very dumb POC: always draw text at top-left
  // (You’ll replace this with real positioning later)
  const { width, height } = page.getSize();

  page.drawText(newText, {
    x: 50,
    y: height - 100,
    size: 24,
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    color: rgb(0, 0, 0)
  });

  console.log("Saving output PDF...");
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

async function run() {
  const input = "input.pdf";
  const decrypted = "decrypted.pdf";
  const output = "output.pdf";

  try {
    // 1. Remove soft encryption
    await decryptPDF(input, decrypted);

    // 2. Edit PDF
    await editPDF(decrypted, output, "SEARCH TEXT", "HELLO WORLD");

    console.log(`Done. Open: ${output}`);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

run();
