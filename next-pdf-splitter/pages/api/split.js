// pages/api/split.js
import { PDFDocument } from 'pdf-lib';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buffer = await getBufferFromRequest(req);
  const srcDoc = await PDFDocument.load(buffer);
  const totalPages = srcDoc.getPageCount();
  const half = Math.ceil(totalPages / 2);

  const firstHalf = Array.from({ length: half }, (_, i) => i);
  const secondHalf = Array.from({ length: totalPages - half }, (_, i) => i + half);

  const [labelBytes, invoiceBytes] = await Promise.all([
    splitPDF(srcDoc, firstHalf),
    splitPDF(srcDoc, secondHalf),
  ]);

  const labelBase64 = Buffer.from(labelBytes).toString('base64');
  const invoiceBase64 = Buffer.from(invoiceBytes).toString('base64');

  res.status(200).json({
    labelUrl: `data:application/pdf;base64,${labelBase64}`,
    invoiceUrl: `data:application/pdf;base64,${invoiceBase64}`,
  });
}

async function getBufferFromRequest(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function splitPDF(srcDoc, indices) {
  const newDoc = await PDFDocument.create();
  const pages = await newDoc.copyPages(srcDoc, indices);
  pages.forEach((page) => newDoc.addPage(page));
  return await newDoc.save();
}
