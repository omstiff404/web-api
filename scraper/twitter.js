import { multiTwitter } from "./multiDl.js";

export default async function x2twitterDl(url) {
  try {
    const r = await multiTwitter(url);
    return {
      code: 200,
      status: "success",
      metadata: { thumbnail: r.thumbnail, text: r.title },
      videos: r.media.map((m) => ({ url: m.url, quality: m.type })),
      audio: null,
    };
  } catch (e) {
    return { error: true, message: e.message };
  }
}
