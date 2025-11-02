// ========================
// HC 32 • CONFIG GLOBAL
// ========================

// GANTI ke URL Web App kamu (yang /exec)
const HC32_WEBAPP = "https://script.google.com/macros/s/AKfycbyvTzjW2iQ2qT0Y_Hz1E4I9njAo09FRhnOAnSjtC3zo2HwkgtXQftH_sCiKriqOVXuSOg/exec";

// Halaman login (kalau token habis / tidak ada)
const HC32_LOGIN_PAGE = "admin.html";

// ambil token dari localStorage
function hc32_getToken() {
  return localStorage.getItem("hc32_admin_token") || "";
}

// simpan data login ke localStorage
function hc32_saveSession({ token, username, nama, role, tipe }) {
  if (token) localStorage.setItem("hc32_admin_token", token);
  if (username) localStorage.setItem("hc32_admin_username", username);
  if (nama) localStorage.setItem("hc32_admin_nama", nama);
  if (role) localStorage.setItem("hc32_admin_role", role);
  if (tipe) localStorage.setItem("hc32_admin_tipe", tipe);
}

// hapus session
function hc32_logout() {
  localStorage.removeItem("hc32_admin_token");
  localStorage.removeItem("hc32_admin_username");
  localStorage.removeItem("hc32_admin_nama");
  localStorage.removeItem("hc32_admin_role");
  localStorage.removeItem("hc32_admin_tipe");
  window.location.href = HC32_LOGIN_PAGE;
}

// helper POST JSON ke Apps Script
async function hc32_post(action, payload = {}) {
  const body = { action, ...payload };
  const res = await fetch(HC32_WEBAPP, {
    method: "POST",
    body: JSON.stringify(body),
  });
  // kalau Apps Script kadang balikin HTML error, cegah JSON error
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { status: "error", message: "Respon bukan JSON", raw: text };
  }
}

// format tanggal 2025-11-01 jadi 1 November 2025
function hc32_formatTanggal(t) {
  if (!t) return "-";
  const d = new Date(t);
  if (isNaN(d)) return t;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// warna role di dashboard
function hc32_roleColor(roleTag) {
  if (!roleTag) return "#E11D48";
  const r = roleTag.toLowerCase();
  if (r.includes("pembina")) return "#0F172A";
  if (r.includes("pelatih") || r.includes("pembimbing")) return "#F97316";
  if (r.includes("ketua")) return "#0F766E";
  if (r.includes("wakil")) return "#0EA5E9";
  return "#E11D48";
}
