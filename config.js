<!-- config.js -->
<script>
  // GANTI ini dengan web app yg kamu deploy (punya /exec di ujung)
  const HC32_WEBAPP = "https://script.google.com/macros/s/AKfycbyvTzjW2iQ2qT0Y_Hz1E4I9njAo09FRhnOAnSjtC3zo2HwkgtXQftH_sCiKriqOVXuSOg/exec";

  // kalau mau balik ke web utama kalau token hilang
  const HC32_LOGIN_PAGE = "admin.html";   // boleh diganti ke sites kamu

  // helper: ambil token dari query atau localStorage
  function hc32_getToken() {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("token");
    if (t) {
      // simpan ke localStorage biar halaman lain tinggal pakai
      localStorage.setItem("hc32_admin_token", t);
      const n = url.searchParams.get("n");
      const u = url.searchParams.get("u");
      const r = url.searchParams.get("r");
      const tp= url.searchParams.get("t");
      if (n)  localStorage.setItem("hc32_admin_nama", n);
      if (u)  localStorage.setItem("hc32_admin_username", u);
      if (r)  localStorage.setItem("hc32_admin_role", r);
      if (tp) localStorage.setItem("hc32_admin_tipe", tp);
      return t;
    }
    return localStorage.getItem("hc32_admin_token");
  }

  function hc32_getProfile() {
    return {
      token: hc32_getToken(),
      nama:  localStorage.getItem("hc32_admin_nama") || "Pengurus",
      user:  localStorage.getItem("hc32_admin_username") || "",
      role:  localStorage.getItem("hc32_admin_role") || "pengurus",
      tipe:  localStorage.getItem("hc32_admin_tipe") || "siswa-aktif",
    };
  }

  // helper fetch POST JSON ke Apps Script
  async function hc32_post(action, payload={}) {
    const body = { action, ...payload };
    const res  = await fetch(HC32_WEBAPP, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return res.json();
  }

  function hc32_requireLogin() {
    const { token } = hc32_getProfile();
    if (!token) {
      window.location.href = HC32_LOGIN_PAGE;
    }
    return token;
  }

  function hc32_logout() {
    localStorage.removeItem("hc32_admin_token");
    localStorage.removeItem("hc32_admin_nama");
    localStorage.removeItem("hc32_admin_username");
    localStorage.removeItem("hc32_admin_role");
    localStorage.removeItem("hc32_admin_tipe");
    window.location.href = HC32_LOGIN_PAGE;
  }
</script>
