/**
 * Fetch profil TikTok publik (HTML parse)
 * Fallback ke seed jika diblokir
 */

const SEED = {
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
  source: "seed",
};

export async function fetchTikTokProfile(username = "omstiff404") {
  const user = String(username || "omstiff404").replace(/^@/, "");
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
  };

  try {
    const res = await fetch(`https://www.tiktok.com/@${user}`, {
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
      const scope = json?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"];
      const userInfo = scope?.userInfo;
      const u = userInfo?.user || userInfo;
      const stats = userInfo?.stats || u?.stats;
      if (u?.uniqueId || u?.nickname) {
        return {
          success: true,
          username: u.uniqueId || user,
          nickname: u.nickname || "",
          avatar: u.avatarLarger || u.avatarMedium || u.avatarThumb || null,
          bio: u.signature || "",
          followers: Number(stats?.followerCount ?? 0),
          following: Number(stats?.followingCount ?? 0),
          likes: Number(stats?.heartCount ?? stats?.heart ?? 0),
          videos: Number(stats?.videoCount ?? 0),
          verified: !!u.verified,
          link: `https://www.tiktok.com/@${u.uniqueId || user}`,
          source: "tiktok-html",
        };
      }
    }

    // SIGI_STATE
    m = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
    if (m) {
      const json = JSON.parse(m[1]);
      const users = json?.UserModule?.users || {};
      const u =
        Object.values(users).find(
          (x) => (x.uniqueId || "").toLowerCase() === user.toLowerCase()
        ) || Object.values(users)[0];
      const statsMap = json?.UserModule?.stats || {};
      const st = statsMap[u?.id] || {};
      if (u) {
        return {
          success: true,
          username: u.uniqueId || user,
          nickname: u.nickname || "",
          avatar: u.avatarLarger || u.avatarMedium || u.avatarThumb || null,
          bio: u.signature || "",
          followers: Number(st.followerCount ?? 0),
          following: Number(st.followingCount ?? 0),
          likes: Number(st.heartCount ?? st.heart ?? 0),
          videos: Number(st.videoCount ?? 0),
          verified: !!u.verified,
          link: `https://www.tiktok.com/@${u.uniqueId || user}`,
          source: "sigi",
        };
      }
    }
  } catch (e) {
    console.error("[fetchTikTokProfile]", e.message);
  }

  return { ...SEED, username: user, link: `https://www.tiktok.com/@${user}` };
}
