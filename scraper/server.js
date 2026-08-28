/**
 * Omstiff404 Scraper API
 * Endpoint:
 *   GET  /api/review?url=...
 *   GET  /api/download?url=...&quality=best
 *   GET  /health
 */

import express from "express";
import cors from "cors";
import { aiodl, detectPlatform } from "./aio.js";
import downloadSpotify from "./spotify.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Normalisasi hasil aiodl ke format frontend */
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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "omstiff404-scraper" });
});

app.get("/api/review", async (req, res) => {
  const url = String(req.query.url || "").trim();
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ success: false, error: "URL tidak valid" });
  }

  try {
    // Spotify khusus
    if (/spotify\.com/i.test(url)) {
      const sp = await downloadSpotify(url);
      return res.json({
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
        error: "Platform tidak dikenali. Support: TikTok, IG, FB, YT, Pinterest, CapCut, X, Threads, Reddit, Spotify",
      });
    }

    const result = await aiodl(url);
    res.json(normalize(result));
  } catch (err) {
    console.error("[review]", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Gagal mengambil data",
    });
  }
});

app.get("/api/download", async (req, res) => {
  const url = String(req.query.url || "").trim();
  const quality = String(req.query.quality || "best").toLowerCase();

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ success: false, error: "URL tidak valid" });
  }

  try {
    if (/spotify\.com/i.test(url)) {
      const sp = await downloadSpotify(url);
      return res.json({
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

    // Pilih quality
    let chosen = media[0];
    if (quality === "audio") {
      chosen = media.find((m) => m.type === "audio") || media[0];
    } else if (quality === "720" || quality === "480") {
      const match = media.find(
        (m) =>
          String(m.quality || "").toLowerCase().includes(quality) ||
          String(m.quality || "") === quality
      );
      if (match) chosen = match;
    } else {
      // best: prioritaskan video HD / quality tertinggi
      const video = media.find((m) => m.type === "video");
      if (video) chosen = video;
    }

    res.json({
      success: true,
      platform: result.platform,
      title: result.title || "",
      downloadUrl: chosen.url,
      type: chosen.type || "video",
      quality: chosen.quality || quality,
      thumbnail: result.thumbnail || null,
    });
  } catch (err) {
    console.error("[download]", err.message);
    res.status(500).json({
      success: false,
      error: err.message || "Gagal download",
    });
  }
});


/** Cache profil TikTok (hindari spam request) */
const profileCache = {
  data: null,
  at: 0,
  ttl: 4000, // min 4s antar fetch server-side
};

async function fetchTikTokProfile(username = "omstiff404") {
  const now = Date.now();
  if (profileCache.data && now - profileCache.at < profileCache.ttl) {
    return profileCache.data;
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
  };

  // 1) Coba parse HTML TikTok (SIGI / UNIVERSAL_DATA)
  try {
    const res = await fetch(`https://www.tiktok.com/@${username}`, {
      headers,
      redirect: "follow",
    });
    const html = await res.text();

    // __UNIVERSAL_DATA_FOR_REHYDRATION__
    let m = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (m) {
      const json = JSON.parse(m[1]);
      const user =
        json?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo ||
        json?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo?.user;
      const u = user?.user || user;
      const stats = user?.stats || u?.stats;
      if (u?.uniqueId || u?.nickname) {
        const data = {
          success: true,
          username: u.uniqueId || username,
          nickname: u.nickname || "",
          avatar:
            u.avatarLarger || u.avatarMedium || u.avatarThumb || null,
          bio: u.signature || "",
          followers: Number(stats?.followerCount ?? 0),
          following: Number(stats?.followingCount ?? 0),
          likes: Number(stats?.heartCount ?? stats?.heart ?? 0),
          videos: Number(stats?.videoCount ?? 0),
          verified: !!u.verified,
          link: `https://www.tiktok.com/@${u.uniqueId || username}`,
          source: "tiktok-html",
        };
        profileCache.data = data;
        profileCache.at = now;
        return data;
      }
    }

    // SIGI_STATE fallback
    m = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
    if (m) {
      const json = JSON.parse(m[1]);
      const users = json?.UserModule?.users || {};
      const u = Object.values(users).find(
        (x) => (x.uniqueId || "").toLowerCase() === username.toLowerCase()
      ) || Object.values(users)[0];
      const statsMap = json?.UserModule?.stats || {};
      const st = statsMap[u?.id] || {};
      if (u) {
        const data = {
          success: true,
          username: u.uniqueId || username,
          nickname: u.nickname || "",
          avatar: u.avatarLarger || u.avatarMedium || u.avatarThumb || null,
          bio: u.signature || "",
          followers: Number(st.followerCount ?? 0),
          following: Number(st.followingCount ?? 0),
          likes: Number(st.heartCount ?? st.heart ?? 0),
          videos: Number(st.videoCount ?? 0),
          verified: !!u.verified,
          link: `https://www.tiktok.com/@${u.uniqueId || username}`,
          source: "sigi",
        };
        profileCache.data = data;
        profileCache.at = now;
        return data;
      }
    }
  } catch (e) {
    console.error("[tiktok-profile html]", e.message);
  }

  // 2) Fallback nilai terakhir / seed (dari profil publik)
  const fallback = profileCache.data || {
    success: true,
    username: "omstiff404",
    nickname: "omstiff404",
    avatar: null,
    bio: "Aku suka ngedit & game",
    followers: 13900,
    following: 138,
    likes: 578400,
    videos: 0,
    verified: false,
    link: "https://www.tiktok.com/@omstiff404",
    source: "cache-seed",
  };
  return fallback;
}

app.get("/api/profile/tiktok", async (req, res) => {
  const username = String(req.query.user || "omstiff404").replace(/^@/, "");
  try {
    const data = await fetchTikTokProfile(username);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Omstiff404 scraper API → http://localhost:${PORT}`);
  console.log(`  GET /api/review?url=...`);
  console.log(`  GET /api/download?url=...&quality=best`);
});
