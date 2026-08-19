/**
 * Extracts the official Cali district report with text coordinates.
 *
 * A plain text dump interleaves the report's columns, which makes it impossible
 * to tell which number belongs to which label. This groups text items into rows
 * by y position and prints them left to right so the table can be read correctly.
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] || join(ROOT, 'data-raw', 'reporte-oficial-016.pdf');

const doc = await getDocument({ url: file, useSystemFonts: true }).promise;

for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  const page = await doc.getPage(pageNum);
  const content = await page.getTextContent();

  const items = content.items
    .filter((i) => i.str.trim())
    .map((i) => ({ str: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(i.transform[5]) }));

  // Group into rows, tolerating a few points of baseline jitter.
  const rows = [];
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r.y - item.y) <= 4);
    if (row) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }

  console.log(`\n===== page ${pageNum} =====`);
  for (const row of rows) {
    const cells = row.items.sort((a, b) => a.x - b.x).map((i) => `[x${i.x}] ${i.str}`);
    console.log(`y${String(row.y).padStart(4)}  ${cells.join('   ')}`);
  }
}
