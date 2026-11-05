#!/usr/bin/env python3
"""
convert-webp.py — Konversi Otomatis Gambar ke Format WebP

Skrip ini membaca semua file gambar mentah dari:
  assets/gallery/originals/
dan mengonversinya ke format WebP teroptimasi di:
  assets/gallery/webp/

Prasyarat: Python 3 dengan modul Pillow (PIL).
Cara pakai:
  python scripts/convert-webp.py
  python scripts/convert-webp.py --quality 85
  python scripts/convert-webp.py --force
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Modul 'Pillow' belum terpasang.")
    print("        Silakan pasang dengan: pip install Pillow")
    sys.exit(1)

# Format gambar yang didukung
SUPPORTED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif', '.webp'}

def convert_images(input_dir: Path, output_dir: Path, quality: int = 82, force: bool = False):
    if not input_dir.exists():
        print(f"[ERROR] Folder input tidak ditemukan: {input_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Temukan semua gambar yang didukung
    candidates = [
        p for p in input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not candidates:
        print(f"[INFO] Tidak ditemukan file gambar di: {input_dir}")
        print("       Letakkan gambar mentah (.png, .jpg, dll.) di folder tersebut.")
        return

    print("=" * 64)
    print(f"  KONVERTER GAMBAR KE WEBP (PIL v{Image.__version__})")
    print(f"  Folder Asli    : {input_dir}")
    print(f"  Folder Output  : {output_dir}")
    print(f"  Kualitas WebP  : {quality}%")
    print("=" * 64)

    total_in_bytes = 0
    total_out_bytes = 0
    success_count = 0
    skipped_count = 0

    for src in candidates:
        target_name = f"{src.stem}.webp"
        dst = output_dir / target_name

        # Jika sudah ada dan tidak dipaksa re-convert, periksa apakah file asli lebih baru
        if dst.exists() and not force:
            if dst.stat().st_mtime >= src.stat().st_mtime:
                print(f"  [LEWATI]  {src.name} -> {target_name} (sudah up-to-date)")
                skipped_count += 1
                continue

        try:
            with Image.open(src) as img:
                # Pertahankan mode warna yang kompatibel (RGBA untuk transparansi, RGB untuk sisanya)
                if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                    converted_img = img.convert("RGBA")
                else:
                    converted_img = img.convert("RGB")

                # Simpan sebagai WebP
                converted_img.save(dst, "WEBP", quality=quality, method=6)

            src_size = src.stat().st_size
            dst_size = dst.stat().st_size
            total_in_bytes += src_size
            total_out_bytes += dst_size

            ratio = ((src_size - dst_size) / src_size) * 100 if src_size > 0 else 0
            src_kb = src_size / 1024
            dst_kb = dst_size / 1024

            print(f"  [OK]      {src.name} ({src_kb:.1f} KB)")
            print(f"            -> {target_name} ({dst_kb:.1f} KB, hemat {ratio:.1f}%)")
            success_count += 1

        except Exception as e:
            print(f"  [GAGAL]   {src.name}: {e}")

    print("-" * 64)
    print(f"  Selesai: {success_count} dikonversi, {skipped_count} dilewati.")
    if total_in_bytes > 0:
        total_ratio = ((total_in_bytes - total_out_bytes) / total_in_bytes) * 100
        print(f"  Total Ukuran Asli : {total_in_bytes / 1024:.1f} KB")
        print(f"  Total Ukuran WebP : {total_out_bytes / 1024:.1f} KB")
        print(f"  Penghematan Total : {total_ratio:.1f}%")
    print("=" * 64)

def main():
    parser = argparse.ArgumentParser(description="Konversi gambar originals ke WebP")
    parser.add_argument("--quality", type=int, default=82, help="Kualitas kompresi WebP (1-100, default 82)")
    parser.add_argument("--force", action="store_true", help="Paksa konversi ulang semua gambar meski sudah ada")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    input_dir = project_root / "assets" / "gallery" / "originals"
    output_dir = project_root / "assets" / "gallery" / "webp"

    convert_images(input_dir, output_dir, quality=args.quality, force=args.force)

if __name__ == "__main__":
    main()

