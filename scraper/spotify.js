import axios from "axios";

/** Spotify track download — multi provider */
export async function downloadSpotify(spotifyUrl) {
  const url = String(spotifyUrl || "").trim();
  if (!/spotify\.com/i.test(url)) throw new Error("URL Spotify tidak valid");

  const providers = [
    async () => {
      const { data } = await axios.post(
        "https://spotyloader.com/api/spotify/track",
        { url },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
            Referer: "https://spotyloader.com/",
          },
        }
      );
      if (data?.downloadLink) {
        return {
          title: data.post?.name || "Spotify",
          artist: data.post?.artist || "",
          download: data.downloadLink,
          thumbnail: data.post?.image || null,
        };
      }
      throw new Error("spotyloader kosong");
    },
    async () => {
      const { data } = await axios.get(
        `https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(url)}`,
        { timeout: 30000 }
      );
      const r = data?.result || data?.data || data;
      const dl = r?.download || r?.url || r?.mp3;
      if (!dl) throw new Error("siputzx kosong");
      return {
        title: r.title || r.name || "Spotify",
        artist: r.artist || r.artists || "",
        download: dl,
        thumbnail: r.thumbnail || r.image || null,
      };
    },
  ];

  const errors = [];
  for (const p of providers) {
    try {
      return await p();
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(
    "Spotify download sedang tidak tersedia (provider down). Coba lagi nanti.\n" +
      errors.slice(0, 2).join(" | ")
  );
}

export default downloadSpotify;
