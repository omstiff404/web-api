/**
 * GET /api/download?url=...&quality=best
 * Vercel serverless — pilih 1 URL download
 */
import { aiodl } from "../scraper/aio.js";
import downloadSpotify from "../scraper/spotify.js";

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const url = String(req.query.url || "").trim();
  const quality = String(req.query.quality || "best").toLowerCase();

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ success: false, error: "URL tidak valid" });
  }

  try {
    if (/spotify\.com/i.test(url)) {
      const sp = await downloadSpotify(url);
      return res.status(200).json({
        success: true,
        platform: "spotify",
        title: sp.title,
        downloadUrl: sp.download,
        type: "audio",
        quality: "mp3",
      });
    }

    const result = await aiodl(url);
    const media = Array.isArray(result.media) ? result.media : [];

    if (!media.length) {
      return res.status(404).json({ success: false, error: "Tidak ada media" });
    }

    let chosen = media[0];
    if (quality === "audio") {
      chosen = media.find((m) => m.type === "audio") || media[0];
    } else if (quality === "720" || quality === "480") {
      const match = media.find((m) =>
        String(m.quality || "").toLowerCase().includes(quality)
      );
      if (match) chosen = match;
    } else {
      const video = media.find((m) => m.type === "video");
      if (video) chosen = video;
    }

    return res.status(200).json({
      success: true,
      platform: result.platform,
      title: result.title || "",
      downloadUrl: chosen.url,
      type: chosen.type || "video",
      quality: chosen.quality || quality,
      thumbnail: result.thumbnail || null,
    });
  } catch (err) {
    console.error("[api/download]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Gagal download",
    });
  }
}
