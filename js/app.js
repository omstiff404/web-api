
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

function showPreview(data) {
  lastResult = data;
  previewArea.classList.remove("hidden");

  if (data.thumbnail) {
    previewThumb.innerHTML = `<img src="${data.thumbnail}" alt="thumb" referrerpolicy="no-referrer">`;
  } else {
    previewThumb.innerHTML = `<span class="preview-placeholder">${data.platform || "media"}</span>`;
  }

  previewTitle.textContent = data.title || "—";
  previewAuthor.textContent = data.author
    ? `@${data.author}`
    : data.platform || "—";

  qualitySelect.innerHTML = "";
  const media = data.media || [];
  if (media.length === 0) {
    qualitySelect.innerHTML = `<option value="best">Best</option>`;
  } else {
    const seen = new Set();
    media.forEach((m, i) => {
      const label = `${m.type || "media"}${m.quality ? " · " + m.quality : ""}`;
      const val = m.quality || m.type || String(i);
      if (seen.has(val)) return;
      seen.add(val);
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      opt.dataset.url = m.url;
      qualitySelect.appendChild(opt);
    });
    if (media.some((m) => m.type === "audio") && !seen.has("audio")) {
      const opt = document.createElement("option");
      opt.value = "audio";
      opt.textContent = "audio only";
      qualitySelect.appendChild(opt);
    }
  }

  previewArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

btnDownload.addEventListener("click", async () => {
  if (!lastUrl && !lastResult) {
    alert("Review dulu sebelum download.");
    return;
  }

  const selectedOpt = qualitySelect.selectedOptions[0];
  if (selectedOpt?.dataset?.url) {
    window.open(selectedOpt.dataset.url, "_blank");
    return;
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
    window.open(data.downloadUrl, "_blank");
  } catch (err) {
    console.error(err);
    alert("Gagal download: " + (err.message || "unknown"));
  } finally {
    setLoading(btnDownload, false);
  }
});

document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const id = link.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
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
