# Scraper — Omstiff404

Backend API yang menghubungkan semua file scraper kamu ke website.

## File yang terhubung

| File | Fungsi |
|------|--------|
| `aio.js` | All-in-one: deteksi platform + handler |
| `ytdl.js` / `yt.js` / `youtube.js` | YouTube |
| `pindl.js` | Pinterest |
| `spotify.js` | Spotify track |
| `tiktok.js` / `multiDl.js` | TikTok (multiDl punya fallback tikwm) |
| `twitter.js` | X/Twitter wrapper |
| `hd.js` | Upscale gambar (imglarger) |
| `hdvid.js` / `hdvid2.js` / `wink.js` | Enhance video HD |
| `removebackground.js` | Remove BG |
| `server.js` | Express API |

## File yang masih stub (belum ada asli)

- `ig.js` — Instagram downloader (stub → fallback Savefbs)
- `multiDl.js` — multiInstagram / multiTiktok (ada fallback TikTok via tikwm)

Kalau kamu punya file asli `ig.js` dan `multiDl.js`, ganti saja file stub-nya.

## Install & jalankan

```bash
cd scraper
npm install
npm start
```

API jalan di **http://localhost:3000**

### Endpoint

| Method | Path | Contoh |
|--------|------|--------|
| GET | `/health` | cek status |
| GET | `/api/review?url=...` | metadata + list media |
| GET | `/api/download?url=...&quality=best` | pilih 1 URL download |

### Platform yang didukung (via aio.js)

- TikTok
- Instagram (butuh ig.js asli atau fallback Savefbs)
- Facebook (`btch-downloader`)
- YouTube (`ytdl.js`)
- Pinterest (`pindl.js`)
- CapCut (`btch-downloader`)
- Twitter / X, Threads, Reddit (Savefbs)
- Spotify (`spotify.js`)

## Frontend

File `js/app.js` memanggil:

```
http://localhost:3000/api/review
http://localhost:3000/api/download
```

Ubah base URL (kalau deploy) dengan:

```html
<script>window.OMSTIFF_API = "https://api.domainmu.com";</script>
```

sebelum load `app.js`.

## Catatan

- Banyak provider third-party bisa down / berubah kapan saja.
- Scraping konten platform sosial dapat melanggar ToS — gunakan bijak.
- Module HD video / remove BG siap dipakai, belum di-expose di UI tools utama (bisa ditambah nanti).
