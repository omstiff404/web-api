/**
 * GET /api/review?url=...
 * Vercel serverless — review media dari link sosial
 */
import { aiodl, detectPlatform } from "../scraper/aio.js";
import downloadSpotify from "../scraper/spotify.js";

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalize(result) {
  const media = Array.isArray(result.media) ? result.media : [];
  return {
    success: true,
    platform: result.platform || "unknown",
    title: result.title || "",
    author: result.author || "",
    thumbnail: result.thumbnail || null,
    media: media.map((m) => ({
      type: m.type || "video",
      url: m.url,
      quality: m.quality || null,
    })),
  };
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
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ success: false, error: "URL tidak valid" });
  }

  try {
    if (/spotify\.com/i.test(url)) {
      const sp = await downloadSpotify(url);
      return res.status(200).json({
        success: true,
        platform: "spotify",
        title: sp.title || "Spotify",
        author: sp.artist || "",
        thumbnail: sp.thumbnail || null,
        media: [{ type: "audio", url: sp.download, quality: "mp3" }],
      });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return res.status(400).json({
        success: false,
        error:
          "Platform tidak dikenali. Support: TikTok, IG, FB, YT, Pinterest, CapCut, X, Threads, Reddit, Spotify",
      });
    }

    const result = await aiodl(url);
    return res.status(200).json(normalize(result));
  } catch (err) {
    console.error("[api/review]", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Gagal mengambil data",
    });
  }
}
