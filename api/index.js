// api/index.js
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');

const app = express();
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve views from root
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Serve static files (e.g., public/downloads)
app.use('/downloads', express.static(path.join(__dirname, '../public/downloads')));

router.get('/', (req, res) => {
  res.render('index', { downloadLinks: null });
});

router.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.send('No file uploaded!');
  try {
    const srcDoc = await PDFDocument.load(req.file.buffer);
    const totalPages = srcDoc.getPageCount();
    const half = Math.ceil(totalPages / 2);

    const firstHalf = Array.from({ length: half }, (_, i) => i);
    const secondHalf = Array.from({ length: totalPages - half }, (_, i) => i + half);

    const fileName = Date.now();
    const labelPdf = `public/downloads/${fileName}_LABEL.pdf`;
    const invoicePdf = `public/downloads/${fileName}_INVOICE.pdf`;

    async function writeSplit(indices, outPath) {
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, indices);
      pages.forEach((page) => newDoc.addPage(page));
      const pdfBytes = await newDoc.save();
      fs.writeFileSync(path.join(__dirname, '../', outPath), pdfBytes);
    }

    await writeSplit(firstHalf, labelPdf);
    await writeSplit(secondHalf, invoicePdf);

    res.render('index', {
      downloadLinks: {
        label: `/downloads/${fileName}_LABEL.pdf`,
        invoice: `/downloads/${fileName}_INVOICE.pdf`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing PDF');
  }
});

app.use('/', router);

module.exports = app;
module.exports.handler = serverless(app);
