# Panduan Galeri Desain Grafis & Konversi WebP

Direktori ini dirancang khusus untuk mengelola karya visual dan desain grafis secara terstruktur dan teroptimasi.

## Struktur Folder

```
assets/gallery/
├── originals/          <- Letakkan file gambar asli (PNG, JPG, JPEG, BMP, dsb.)
└── webp/               <- Hasil konversi otomatis format WebP untuk web
```

## Cara Menambah Karya Baru

1. **Simpan Desain Asli**:
   Ekspor desain dari Figma, Photoshop, Illustrator, dll. Simpan file gambar di dalam folder `assets/gallery/originals/`.
   Contoh penamaan: `mobile-banking-ui.png`

2. **Jalankan Skrip Konversi WebP**:
   Pilih salah satu skrip yang kamu sukai:
   
   - **Opsi A (Rekomendasi, Python):**
     ```bash
     python scripts/convert-webp.py
     ```
     *Opsi tambahan:* `--quality 85` (default: 82), `--force` (konversi ulang semua file).

   - **Opsi B (Node.js):**
     ```bash
     npm install sharp   # cukup sekali
     node scripts/convert-webp.js
     ```

   File hasil konversi berekstensi `.webp` akan otomatis tersimpan di folder `assets/gallery/webp/`.

3. **Daftarkan di `data/gallery.json`**:
   Buka file `data/gallery.json` dan tambahkan entri baru:
   ```json
   {
     "id": "design-04",
     "judul": "Aplikasi Perbankan Masa Depan",
     "kategori": "Mobile UI",
     "tahun": "2025",
     "deskripsi": "Perancangan UI interaktif untuk aplikasi perbankan modern.",
     "file": "mobile-banking-ui.webp",
     "platform": "Figma",
     "platform_url": "https://www.figma.com/design/...",
     "tags": ["Figma", "Fintech", "Mobile App"]
   }
   ```
   > **Catatan Hyperlink Opsional:** Jika karya tidak diunggah ke Figma atau platform publik, kosongkan saja:
   > `"platform": null,` dan `"platform_url": null`

