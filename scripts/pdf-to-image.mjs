// Renders a PDF to a high-quality JPEG using pdf-to-img (bundled pdfjs +
// renderer that handles vector overlays correctly).
//
// Usage: node scripts/pdf-to-image.mjs <input.pdf> <out.jpg|.png|.webp> [page=1] [scale=3] [quality=86]

import { writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { argv, exit } from 'node:process';
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';

const inputPath = argv[2];
const outputPath = argv[3];
const pageNum = parseInt(argv[4] ?? '1', 10);
const scale = parseFloat(argv[5] ?? '3');
const quality = parseInt(argv[6] ?? '86', 10);
if (!inputPath || !outputPath) {
  console.error('usage: node scripts/pdf-to-image.mjs <input.pdf> <out.jpg|.png|.webp> [page=1] [scale=3] [quality=86]');
  exit(2);
}

const doc = await pdf(inputPath, { scale });
console.log(`PDF: ${doc.length} page(s) — rendering page ${pageNum} at scale ${scale}`);

let i = 0;
let png = null;
for await (const buf of doc) {
  i++;
  if (i === pageNum) { png = buf; break; }
}
if (!png) { console.error(`page ${pageNum} not found`); exit(1); }

const ext = extname(outputPath).toLowerCase();
let pipeline = sharp(png);
let result;
if (ext === '.jpg' || ext === '.jpeg') {
  result = await pipeline.jpeg({ quality, mozjpeg: true }).toFile(resolve(outputPath));
} else if (ext === '.webp') {
  result = await pipeline.webp({ quality }).toFile(resolve(outputPath));
} else {
  result = await pipeline.png({ compressionLevel: 9 }).toFile(resolve(outputPath));
}
console.log(`Wrote ${outputPath} ${result.width}x${result.height} (${(result.size / 1024).toFixed(0)} KB)`);
