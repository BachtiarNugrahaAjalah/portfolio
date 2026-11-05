#!/usr/bin/env python3
"""
sync-pinned-repos.py — Sinkronisasi Otomatis Repositori Pinned dari GitHub

Skrip ini berjalan secara otomatis di GitHub Actions (atau secara lokal):
1. Mengambil daftar repositori yang di-pin pada profil GitHub pengguna.
2. Mengambil metadata terbaru (stars, forks, bahasa, topik) via GitHub API.
3. Memperbarui file data/projects.json secara terstruktur.
"""

import os
import sys
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

GITHUB_USERNAME = "BachtiarNugrahaAjalah"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Antigravity-Sync/1.0"

def get_auth_headers():
    headers = {"User-Agent": USER_AGENT, "Accept": "application/vnd.github.v3+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def scrape_pinned_repos(username: str):
    profile_url = f"https://github.com/{username}"
    req = urllib.request.Request(profile_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
    except Exception as e:
        print(f"[ERROR] Gagal memuat profil GitHub {profile_url}: {e}")
        return []

    # Cari blok pinned-item-list-item-content
    pinned_blocks = re.findall(
        r'<div[^>]*class="[^"]*pinned-item-list-item-content[^"]*"[\s\S]*?</div>\s*</div>',
        html
    )
    pinned_repos = []
    for b in pinned_blocks:
        match = re.search(rf'href="/{username}/([^"/]+)"', b)
        if match:
            repo_name = match.group(1).strip()
            if repo_name and repo_name not in pinned_repos:
                pinned_repos.append(repo_name)

    # Fallback regex jika kelas GitHub berubah
    if not pinned_repos:
        matches = re.findall(rf'class="repo"[^>]*title="([^"]+)"', html)
        pinned_repos = list(dict.fromkeys(matches))

    return pinned_repos

def fetch_repo_metadata(username: str, repo_name: str):
    api_url = f"https://api.github.com/repos/{username}/{repo_name}"
    req = urllib.request.Request(api_url, headers=get_auth_headers())
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as e:
        print(f"[WARN] HTTP {e.code} saat mengambil {api_url}: {e.reason}")
        return None
    except Exception as e:
        print(f"[WARN] Error saat mengambil {api_url}: {e}")
        return None

def format_title_from_name(repo_name: str) -> str:
    cleaned = repo_name.replace("_", " ").replace("-", " ")
    return cleaned.title()

def sync():
    project_root = Path(__file__).resolve().parent.parent
    data_dir = project_root / "data"
    projects_file = data_dir / "projects.json"

    data_dir.mkdir(parents=True, exist_ok=True)

    # Muat data eksisting jika ada
    existing_map = {}
    if projects_file.exists():
        try:
            with open(projects_file, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                for item in old_data.get("proyek", []):
                    # Key berdasarkan nama repo (lowercase)
                    name = item.get("repo", "").split("/")[-1].lower()
                    if name:
                        existing_map[name] = item
        except Exception as e:
            print(f"[WARN] Gagal membaca data lama: {e}")

    print("=" * 64)
    print(f"  SINKRONISASI REPOSITORI PINNED GITHUB // @{GITHUB_USERNAME}")
    print("=" * 64)

    pinned_names = scrape_pinned_repos(GITHUB_USERNAME)
    if not pinned_names:
        print("[WARN] Tidak menemukan pinned repos via scraping (atau koneksi terhalang).")
        if existing_map:
            print("[INFO] Menggunakan data cache projects.json yang sudah ada.")
            return
        else:
            print("[ERROR] Tidak ada data pinned repos yang tersedia.")
            sys.exit(1)

    print(f"[INFO] Ditemukan {len(pinned_names)} pinned repos: {', '.join(pinned_names)}\n")

    synced_items = []
    for idx, repo_name in enumerate(pinned_names, start=1):
        meta = fetch_repo_metadata(GITHUB_USERNAME, repo_name) or {}
        existing = existing_map.get(repo_name.lower(), {})

        stars = meta.get("stargazers_count", existing.get("stars", 0))
        forks = meta.get("forks_count", existing.get("forks", 0))
        lang = meta.get("language") or existing.get("bahasa") or "Code"
        html_url = meta.get("html_url") or f"https://github.com/{GITHUB_USERNAME}/{repo_name}"

        # Pertahankan judul & kategori kustom jika sudah ada
        judul = existing.get("judul") or format_title_from_name(repo_name)
        kategori = existing.get("kategori") or f"{lang} Project"
        deskripsi = existing.get("deskripsi") or meta.get("description") or "Repositori pilihan yang dikembangkan untuk eksperimen komputasi dan rekayasa perangkat lunak."

        # Pertahankan tags atau buat dari topics + language
        tags = existing.get("tags")
        if not tags:
            topics = meta.get("topics", [])
            tags = [lang] + [t.title() for t in topics[:3]]
            if not tags:
                tags = [lang, "Open Source", "GitHub"]

        item = {
            "id": f"project-card-{idx}",
            "repo": f"{GITHUB_USERNAME}/{repo_name}",
            "judul": judul,
            "url": html_url,
            "kategori": kategori,
            "deskripsi": deskripsi,
            "bahasa": lang,
            "tags": tags,
            "stars": stars,
            "forks": forks
        }
        synced_items.append(item)
        print(f"  [{idx}] {repo_name} | {lang} | {stars} Stars | {forks} Forks")

    output_payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "github_username": GITHUB_USERNAME,
        "total_pinned": len(synced_items),
        "proyek": synced_items
    }

    with open(projects_file, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2, ensure_ascii=False)

    print("-" * 64)
    print(f"Berhasil memperbarui: {projects_file} ({len(synced_items)} repositori)")
    print("=" * 64)

if __name__ == "__main__":
    sync()

