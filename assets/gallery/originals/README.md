# assets/gallery/originals/

Letakkan file gambar asli desain grafismu di sini.

**Format yang didukung:** JPG, JPEG, PNG, GIF, TIFF, AVIF

## Alur kerja

1. Letakkan gambar asli di folder ini (`originals/`)
2. Jalankan konverter:
   ```
   node scripts/convert-webp.js
   ```
3. File WebP hasil konversi akan muncul di `assets/gallery/webp/`
4. Daftarkan entri baru di `data/gallery.json` dengan field `"file": "nama-file.webp"`

## Penamaan file

Gunakan nama file yang deskriptif dan tanpa spasi, contoh:
- `ui-dashboard-mobile.png`
- `poster-acara-kampus.jpg`
- `logo-gradien-ukm.png`

