/**
 * Contoh minimal API server untuk Omstiff404
 * Copy ke server.js lalu sesuaikan.
 *
 * npm i express cors
 * node server.js
 */

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Validasi sederhana
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

app.get("/api/review", (req, res) => {
  const { url, platform } = req.query;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ success: false, error: "URL tidak valid" });
  }

  // TODO: ganti dengan scraper nyata (yt-dlp, playwright, dll)
  res.json({
    success: true,
    title: `[Demo] Konten ${platform || "unknown"}`,
    author: "—",
    thumbnail: null,
    duration: null,
    availableQualities: ["best", "720", "480", "audio"],
  });
});

app.get("/api/download", (req, res) => {
  const { url, platform, quality = "best" } = req.query;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ success: false, error: "URL tidak valid" });
  }

  // TODO: implement download / stream
  res.status(501).json({
    success: false,
    error: "Scraper belum diimplementasikan. Lihat scraper/README.md",
  });
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Omstiff404 scraper API → http://localhost:${PORT}`);
});
