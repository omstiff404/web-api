/**
 * multiDl.js — fallback / stub
 * File asli multiDl.js belum disertakan.
 * TikTok & Instagram memakai handleSavefbs di aio.js sebagai fallback.
 * Ganti file ini dengan versi asli jika kamu punya.
 */

import axios from "axios";

/** Fallback TikTok via public-ish endpoints (bisa down sewaktu-waktu) */
export async function multiTiktok(url) {
  // Coba beberapa endpoint ringan; jika gagal, biarkan aio.js pakai handleSavefbs
  const errors = [];

  // 1) tikwm
  try {
    const { data } = await axios.get(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
      { timeout: 20000, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (data?.data) {
      const d = data.data;
      const media = [];
      if (d.play || d.hdplay) {
        media.push({
          type: "video",
          url: d.hdplay || d.play,
          quality: d.hdplay ? "HD" : "SD",
        });
      }
      if (d.music) {
        media.push({ type: "audio", url: d.music, quality: "mp3" });
      }
      if (d.images?.length) {
        d.images.forEach((img) =>
          media.push({ type: "image", url: img, quality: "original" })
        );
      }
      return {
        title: d.title || "",
        thumbnail: d.cover || d.origin_cover || null,
        author: d.author?.unique_id || d.author?.nickname || "",
        media,
      };
    }
  } catch (e) {
    errors.push("tikwm: " + e.message);
  }

  throw new Error(
    "multiTiktok gagal. Pastikan multiDl.js asli tersedia atau pakai Savefbs fallback.\n" +
      errors.join(" | ")
  );
}

/** Fallback Instagram — minimal, biasanya butuh ig.js / multiDl asli */
export async function multiInstagram(url) {
  throw new Error(
    "multiInstagram: file multiDl.js / ig.js asli belum ada. " +
      "aio.js akan coba Savefbs fallback otomatis."
  );
}

/** Fallback Twitter/X */
export async function multiTwitter(url) {
  throw new Error(
    "multiTwitter: gunakan handleSavefbs di aio.js (sudah otomatis)."
  );
}
