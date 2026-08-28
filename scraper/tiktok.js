import { multiTiktok } from "./multiDl.js";

export default async function tiktokDl(url) {
  const r = await multiTiktok(url);
  return {
    title: r.title,
    author: { username: r.author },
    cover: r.thumbnail,
    downloads: r.media.map((m) => ({
      type: m.type,
      label: m.type,
      url: m.url,
    })),
    play: r.media.find((m) => m.type === "video")?.url,
    music: r.media.find((m) => m.type === "audio")?.url,
  };
}
