# Daftar File Media — Omstiff404

Letakkan file berikut di folder **`assets/`**:

| Nama File              | Keterangan                                      | Ukuran disarankan          |
|------------------------|--------------------------------------------------|----------------------------|
| `avatar.jpg`           | Foto profil (avatar di depan cover)              | 400×400 px (persegi)       |
| `avatar.png`           | Alternatif avatar (jika pakai PNG transparan)    | 400×400 px                 |
| `cover.mp4`            | Video sampul di belakang avatar (persegi panjang)| 1280×720 atau 1920×1080    |
| `cover-poster.jpg`     | Poster/thumbnail video cover (muncul sebelum load)| Sama ratio dengan video    |
| `og-image.jpg`         | Gambar share ke social media (Open Graph)        | 1200×630 px                |
| `favicon.svg`          | Sudah ada (bisa diganti)                         | —                          |
| `avatar-placeholder.svg`| Fallback jika avatar.jpg belum ada              | Sudah ada                  |

## Cara ganti media

1. Upload file ke folder `assets/` dengan **nama persis** seperti di atas.
2. Refresh browser (Ctrl+F5).
3. Video cover otomatis autoplay + muted + loop.

## Catatan

- Format video: **MP4** (H.264) paling kompatibel.
- Avatar: JPG/PNG. Kalau file belum ada, akan muncul placeholder SVG.
- Jangan ubah path di `index.html` kecuali kamu tahu apa yang dilakukan.
