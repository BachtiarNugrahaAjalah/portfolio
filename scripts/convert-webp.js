/**
 * convert-webp.js
 * Konversi gambar di assets/gallery/originals/ ke WebP lalu simpan ke assets/gallery/webp/
 *
 * Prasyarat: `npm install sharp` atau `pnpm add sharp` di root proyek
 *
 * Cara pakai:
 *   node scripts/convert-webp.js
 *   node scripts/convert-webp.js --quality 85
 *
 * Format yang didukung sebagai input: jpg, jpeg, png, gif, tiff, avif
 * Output: .webp di folder assets/gallery/webp/ dengan nama file yang sama
 */

'use strict';

const path  = require('path');
const fs    = require('fs');

// Cek apakah sharp tersedia
let sharp;
try {
  sharp = require('sharp');
} catch (_) {
  console.error(
    '[convert-webp] Modul "sharp" tidak ditemukan.\n' +
    '  Jalankan: npm install sharp\n' +
    '  Atau    : pnpm add sharp\n' +
    '  Lalu coba lagi.'
  );
  process.exit(1);
}

// Parse argumen --quality (default 82)
const qualityArg = process.argv.find(function (a) { return a.startsWith('--quality=') || a === '--quality'; });
let quality = 82;
if (qualityArg) {
  if (qualityArg.includes('=')) {
    quality = parseInt(qualityArg.split('=')[1], 10) || 82;
  } else {
    const idx = process.argv.indexOf(qualityArg);
    quality = parseInt(process.argv[idx + 1], 10) || 82;
  }
}

const INPUT_DIR  = path.join(__dirname, '..', 'assets', 'gallery', 'originals');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'gallery', 'webp');
const SUPPORTED  = new Set(['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.tif', '.avif']);

if (!fs.existsSync(INPUT_DIR)) {
  console.error('[convert-webp] Folder input tidak ditemukan:', INPUT_DIR);
  process.exit(1);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const files = fs.readdirSync(INPUT_DIR).filter(function (f) {
  return SUPPORTED.has(path.extname(f).toLowerCase());
});

if (files.length === 0) {
  console.log('[convert-webp] Tidak ada gambar yang ditemukan di:', INPUT_DIR);
  console.log('  Letakkan file jpg/png/etc di folder tersebut lalu jalankan ulang.');
  process.exit(0);
}

console.log('[convert-webp] Memproses ' + files.length + ' gambar (quality=' + quality + ')...\n');

let done = 0;
let failed = 0;

files.forEach(function (file) {
  const inputPath  = path.join(INPUT_DIR, file);
  const baseName   = path.basename(file, path.extname(file));
  const outputPath = path.join(OUTPUT_DIR, baseName + '.webp');

  sharp(inputPath)
    .webp({ quality: quality })
    .toFile(outputPath, function (err, info) {
      if (err) {
        console.error('  GAGAL  ' + file + ' ->', err.message);
        failed++;
      } else {
        const inKb  = Math.round(fs.statSync(inputPath).size / 1024);
        const outKb = Math.round(info.size / 1024);
        const pct   = Math.round((1 - info.size / fs.statSync(inputPath).size) * 100);
        console.log(
          '  OK     ' + file +
          ' -> ' + baseName + '.webp' +
          ' (' + inKb + 'KB -> ' + outKb + 'KB, -' + pct + '%)'
        );
      }

      done++;
      if (done === files.length) {
        console.log(
          '\nSelesai: ' + (done - failed) + ' berhasil, ' + failed + ' gagal.'
        );
        if (failed > 0) process.exit(1);
      }
    });
});

