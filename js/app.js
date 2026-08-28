
/* Intro loading 5 detik */
(function () {
  const loader = document.getElementById("intro-loader");
  if (!loader) return;
  document.body.classList.add("is-loading");
  setTimeout(() => {
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    setTimeout(() => loader.remove(), 600);
  }, 5000);
})();

/**
 * Omstiff404 — Frontend
 * Klik icon platform → icon membesar + input muncul
 * API default: http://localhost:3000
 */

const API_BASE =
  window.OMSTIFF_API ||
  (typeof location !== "undefined" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1"
    ? "" // production Vercel → relative /api
    : "http://localhost:3000");

const cards = document.querySelectorAll(".platform-card");
const previewArea = document.getElementById("preview-area");
const previewThumb = document.getElementById("preview-thumb");
const previewTitle = document.getElementById("preview-title");
const previewAuthor = document.getElementById("preview-author");
const qualitySelect = document.getElementById("quality-select");
const btnDownload = document.getElementById("btn-download");

let activeCard = null;
let lastResult = null;
let lastUrl = "";

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.old = btn.innerHTML;
    btn.innerHTML = "Loading…";
  } else {
    btn.disabled = false;
    if (btn.dataset.old) btn.innerHTML = btn.dataset.old;
  }
}

function activateCard(card) {
  cards.forEach((c) => c.classList.remove("active"));
  card.classList.add("active");
  activeCard = card;

  previewArea.classList.add("hidden");
  lastResult = null;

  const input = card.querySelector(".platform-input");
  if (input) {
    setTimeout(() => input.focus(), 150);
  }

  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

cards.forEach((card) => {
  const btn = card.querySelector(".platform-btn");
  btn.addEventListener("click", () => {
    if (card.classList.contains("active")) {
      card.classList.remove("active");
      activeCard = null;
      previewArea.classList.add("hidden");
      return;
    }
    activateCard(card);
  });

  const reviewBtn = card.querySelector(".btn-review");
  const input = card.querySelector(".platform-input");

  reviewBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const url = (input.value || "").trim();
    if (!url) {
      alert("Masukkan link dulu.");
      input.focus();
      return;
    }
    if (!isValidUrl(url)) {
      alert("Link tidak valid. Pastikan mulai dengan https://");
      return;
    }

    lastUrl = url;
    setLoading(reviewBtn, true);

    try {
      const res = await fetch(
        `${API_BASE}/api/review?url=${encodeURIComponent(url)}`
      );
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "API tidak mengembalikan JSON (HTTP " +
            res.status +
            "). Redeploy project di Vercel setelah update api/review.js"
        );
      }
      if (!data.success) {
        throw new Error(data.error || "Gagal review");
      }
      showPreview(data);
    } catch (err) {
      console.error(err);
      alert("Gagal review: " + (err.message || "unknown"));
      previewArea.classList.add("hidden");
      lastResult = null;
    } finally {
      setLoading(reviewBtn, false);
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      reviewBtn.click();
    }
  });
});

function forceOpen(url) {
  if (!url) return false;
  // 1) <a> click — lebih reliable di mobile daripada window.open
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch (_) {}
  // 2) fallback
  try {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } catch (_) {}
  // 3) last resort
  try {
    location.href = url;
    return true;
  } catch (_) {}
  return false;
}

function showPreview(data) {
  lastResult = data;
  previewArea.classList.remove("hidden");

  const media = Array.isArray(data.media) ? data.media.filter((m) => m && m.url) : [];

  // Thumbnail / player
  const first = media[0];
  if (first && (first.type === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(first.url))) {
    previewThumb.innerHTML = `<video class="preview-player" src="${first.url}" controls playsinline poster="${data.thumbnail || ""}"></video>`;
  } else if (first && (first.type === "image" || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(first.url))) {
    previewThumb.innerHTML = `<img src="${first.url}" alt="preview" referrerpolicy="no-referrer">`;
  } else if (data.thumbnail) {
    previewThumb.innerHTML = `<img src="${data.thumbnail}" alt="thumb" referrerpolicy="no-referrer">`;
  } else {
    previewThumb.innerHTML = `<span class="preview-placeholder">${data.platform || "media"}</span>`;
  }

  previewTitle.textContent = data.title || "—";
  previewAuthor.textContent = data.author
    ? `@${data.author}`
    : data.platform || "—";

  // Quality select + list link unduhan
  qualitySelect.innerHTML = "";
  const linkBox = document.getElementById("media-links");
  if (linkBox) linkBox.innerHTML = "";

  if (media.length === 0) {
    qualitySelect.innerHTML = `<option value="best">Best</option>`;
  } else {
    const seen = new Set();
    media.forEach((m, i) => {
      const label = `${m.type || "media"}${m.quality ? " · " + m.quality : ""}`;
      const val = String(m.quality || m.type || i);
      if (!seen.has(val + m.url)) {
        seen.add(val + m.url);
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = label;
        opt.dataset.url = m.url;
        qualitySelect.appendChild(opt);
      }

      if (linkBox) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-accent media-dl-btn";
        btn.textContent = "⬇ " + label;
        btn.addEventListener("click", () => {
          if (!forceOpen(m.url)) {
            alert("Gagal membuka link. Copy manual:\n" + m.url);
          }
        });
        linkBox.appendChild(btn);
      }
    });
  }

  previewArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

btnDownload.addEventListener("click", async () => {
  if (!lastUrl && !lastResult) {
    alert("Review dulu sebelum download.");
    return;
  }

  // Ambil URL dari quality select dulu
  const selectedOpt = qualitySelect.selectedOptions[0];
  if (selectedOpt?.dataset?.url) {
    if (!forceOpen(selectedOpt.dataset.url)) {
      alert("Browser memblokir popup. Coba tombol unduhan di bawah preview.");
    }
    return;
  }

  // Dari lastResult media
  if (lastResult?.media?.length) {
    const q = qualitySelect.value || "best";
    let m = lastResult.media[0];
    if (q === "audio") {
      m = lastResult.media.find((x) => x.type === "audio") || m;
    } else {
      m =
        lastResult.media.find((x) => String(x.quality || "").includes(q)) ||
        lastResult.media.find((x) => x.type === "video") ||
        m;
    }
    if (m?.url) {
      forceOpen(m.url);
      return;
    }
  }

  setLoading(btnDownload, true);
  try {
    const quality = qualitySelect.value || "best";
    const res = await fetch(
      `${API_BASE}/api/download?url=${encodeURIComponent(lastUrl)}&quality=${encodeURIComponent(quality)}`
    );
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("API download error (HTTP " + res.status + ")");
    }
    if (!data.success || !data.downloadUrl) {
      throw new Error(data.error || "Tidak ada URL download");
    }
    if (!forceOpen(data.downloadUrl)) {
      alert("Link unduhan:\n" + data.downloadUrl);
    }
  } catch (err) {
    console.error(err);
    alert("Gagal download: " + (err.message || "unknown"));
  } finally {
    setLoading(btnDownload, false);
  }
});

/* ========== Live TikTok profile sync ========== */
const TT_USER = "omstiff404";
const TT_POLL_MS = 1000; // 1 detik — hanya update angka, tanpa reload halaman

function formatCount(n) {
  n = Number(n) || 0;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function animateNumber(el, toValue, duration = 600) {
  const from = Number(el.dataset.value || 0);
  const to = Number(toValue) || 0;
  if (from === to) {
    el.textContent = formatCount(to);
    el.dataset.value = to;
    return;
  }
  el.classList.add("bump");
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    // easeOutCubic
    const e = 1 - Math.pow(1 - t, 3);
    const cur = Math.round(from + (to - from) * e);
    el.textContent = formatCount(cur);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = formatCount(to);
      el.dataset.value = to;
      setTimeout(() => el.classList.remove("bump"), 300);
    }
  }
  requestAnimationFrame(frame);
}

async function syncTikTokProfile() {
  const elF = document.getElementById("stat-followers");
  const elG = document.getElementById("stat-following");
  const elL = document.getElementById("stat-likes");
  const elBio = document.getElementById("tt-bio");
  const elAvatar = document.querySelector(".avatar-img");
  const badge = document.getElementById("live-badge");
  if (!elF) return;

  const CACHE_KEY = "omstiff_tt_" + TT_USER;

  try {
    const res = await fetch(
      `${API_BASE}/api/profile/tiktok?user=${encodeURIComponent(TT_USER)}`
    );
    const data = await res.json();
    if (!data || data.success === false) throw new Error(data?.error || "fail");

    animateNumber(elF, data.followers);
    animateNumber(elG, data.following);
    animateNumber(elL, data.likes);

    if (elBio && data.bio) elBio.textContent = data.bio;
    if (elAvatar && data.avatar) {
      if (elAvatar.dataset.ttSrc !== data.avatar) {
        elAvatar.dataset.ttSrc = data.avatar;
        elAvatar.src = data.avatar;
      }
    }

    // Simpan di browser (tanpa Neon) supaya angka terakhir tetap ada
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          followers: data.followers,
          following: data.following,
          likes: data.likes,
          bio: data.bio,
          avatar: data.avatar,
          at: Date.now(),
        })
      );
    } catch (_) {}

    if (badge) {
      badge.textContent =
        `Live · 1s · ${data.source || "ok"} · ${new Date().toLocaleTimeString("id-ID")}`;
    }
  } catch (err) {
    console.warn("TikTok sync:", err.message);
    // Coba localStorage dulu, baru seed
    let used = false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (elF.dataset.value === "0" || elF.dataset.value === "") {
          animateNumber(elF, c.followers);
          animateNumber(elG, c.following);
          animateNumber(elL, c.likes);
        }
        used = true;
      }
    } catch (_) {}
    if (!used && (elF.dataset.value === "0" || !elF.dataset.value)) {
      animateNumber(elF, 13900);
      animateNumber(elG, 138);
      animateNumber(elL, 578400);
    }
    if (badge) badge.textContent = "Live · offline / cache browser";
  }
}

// First load + interval (hanya angka, tanpa reload halaman)
syncTikTokProfile();
setInterval(syncTikTokProfile, TT_POLL_MS);
