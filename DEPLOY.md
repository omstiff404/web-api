# Deploy Omstiff404 ke Vercel

Tidak memakai database. Stats TikTok di-fetch live + cache di browser.

## Deploy

```bash
cd omstiff404
npm install
npx vercel
```

Atau push ke GitHub → Import di vercel.com (Framework: Other).

## Endpoint

| URL | Fungsi |
|-----|--------|
| `GET /api/profile/tiktok?user=omstiff404` | Profil TikTok (followers, likes, avatar) |

Frontend production otomatis memakai `/api` (same origin).
Poll stats setiap 1 detik (hanya angka, tanpa reload halaman).

## Lokal

```bash
cd scraper && npm install && npm start
# http://localhost:3000
```
