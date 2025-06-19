const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 3000;

// Setup EJS
app.set('view engine', 'ejs');

// Static folder for downloading files
app.use(express.static('public'));

// Storage config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

app.get('/', (req, res) => {
  res.render('index', { downloadLinks: null });
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.send('No file uploaded!');

  const filePath = req.file.path;
  const fileName = path.basename(filePath, '.pdf');
  const outputLabel = `public/downloads/${fileName}_LABEL.pdf`;
  const outputInvoice = `public/downloads/${fileName}_INVOICE.pdf`;

  try {
    const bytes = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();
    const half = Math.ceil(totalPages / 2);

    const firstHalf = Array.from({ length: half }, (_, i) => i);
    const secondHalf = Array.from({ length: totalPages - half }, (_, i) => i + half);

    async function writeSplit(indices, outPath) {
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(srcDoc, indices);
      pages.forEach(p => newDoc.addPage(p));
      const pdfBytes = await newDoc.save();
      fs.writeFileSync(outPath, pdfBytes);
    }

    await writeSplit(firstHalf, outputLabel);
    await writeSplit(secondHalf, outputInvoice);

    res.render('index', {
      downloadLinks: {
        label: `/downloads/${fileName}_LABEL.pdf`,
        invoice: `/downloads/${fileName}_INVOICE.pdf`
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing PDF');
  } finally {
    // Optional: delete uploaded file after processing
    fs.unlinkSync(filePath);
  }
});

app.listen(port, () => {
  console.log(`PDF Splitter app listening at http://localhost:${port}`);
});
