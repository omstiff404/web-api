/**
 * GET /api/profile/tiktok?user=omstiff404
 * Fetch profil TikTok (tanpa database)
 */
import { fetchTikTokProfile } from "../../lib/tiktok-profile.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const username = String(req.query.user || "omstiff404").replace(/^@/, "");

  try {
    const live = await fetchTikTokProfile(username);
    return res.status(200).json(live);
  } catch (err) {
    console.error("[api/profile/tiktok]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
