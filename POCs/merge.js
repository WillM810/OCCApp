import PDFMerger from 'pdf-merger-js';
import path from 'path';

process.argv.splice(0, 2);

const merger = new PDFMerger();

(async () => {
    let output = './merged.pdf'
    for (let i=0; i<process.argv.length; i++) {
        if (process.argv[i] === '-o' || process.argv[i] === '--output') {
            output = process.argv[i+1];
            process.argv.splice(i, 2);
        } else {
            await merger.add(path.join(process.cwd(), process.argv[i]));
        }
    }

    await merger.save(path.join(process.cwd(), output));
})();