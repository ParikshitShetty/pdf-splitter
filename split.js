const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

function sanityChecker() {
  if (process.argv.length < 3) {
    console.error('Usage: node split.js <input.pdf>');
    process.exit(1);
  }
  const input = process.argv[2];
  if (!input.toLowerCase().endsWith('.pdf')) {
    console.error('Error: Please provide a .pdf file as input');
    process.exit(1);
  }
}

async function writeSplit(srcDoc, indices, outPath) {
  // Create a new PDF and copy over just the pages in `indices`
  const newDoc = await PDFDocument.create();
  const pages  = await newDoc.copyPages(srcDoc, indices);
  pages.forEach(page => newDoc.addPage(page));

  // Save and write to disk
  const pdfBytes = await newDoc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`✔ Saved ${outPath}`);
}

(async function split() {
  try {
    sanityChecker();

    const bytes = fs.readFileSync(process.argv[2]);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();
    const half = Math.ceil(totalPages / 2);

    // Build 0-based index arrays
    const firstHalf  = Array.from({ length: half }, (_, i) => i);
    const secondHalf = Array.from(
      { length: totalPages - half },
      (_, i) => i + half
    );

    const fileName = process.argv[2];  
    const dotIndex = fileName.indexOf('.'); 
    const labelPdf= fileName.slice(0, dotIndex) + '_LABEL'+ fileName.slice(dotIndex);
    const invoicePdf= fileName.slice(0, dotIndex) + '_INVOICE'+ fileName.slice(dotIndex);

    // Write both splits
    await writeSplit(srcDoc, firstHalf, labelPdf);
    await writeSplit(srcDoc, secondHalf, invoicePdf);

    console.log('PDF Written');
  } catch (err) {
    console.error('Error splitting PDF:', err);
    process.exit(1);
  }
})();