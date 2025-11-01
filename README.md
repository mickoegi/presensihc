<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Presensi Kegiatan HC 32</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <!-- library scanner -->
  <script src="https://unpkg.com/html5-qrcode"></script>
  <style>
    :root {
      --hc-blue: #005A9C;
      --bg: #e2e8f0;
    }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      background: var(--bg);
      margin: 0;
      padding: 16px;
    }
    h1 {
      text-align: center;
      font-size: 30px;
      font-weight: 700;
      margin-bottom: 18px;
      color: #0f172a;
    }
    #qr-box {
      max-width: 520px;
      margin: 0 auto;
    }
    #qr-reader {
      border: 4px dashed var(--hc-blue);
      border-radius: 14px;
      min-height: 120px;
      background: #f8fafc;
      overflow: hidden;
    }
    #manual-box {
      background: #fff;
      max-width: 520px;
      margin: 20px auto 0 auto;
      padding: 16px;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(15,23,42,.08);
    }
    #manual-box input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 16px;
      margin-bottom: 12px;
    }
    #manual-box button {
      background: var(--hc-blue);
      color: #fff;
      border: 0;
      padding: 10px 12px;
      border-radius: 10px;
      font-weight: 600;
      width: 100%;
      cursor: pointer;
    }
    #status-layer {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .bubble {
      width: 150px;
      height: 150px;
      border-radius: 999px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: white;
      opacity: 0;
      transform: scale(.4);
      transition: all .2s ease-out;
    }
    .bubble.show {
      opacity: 1;
      transform: scale(1);
    }
    .success { background: #22c55e; }
    .error { background: #ef4444; }
    .bubble span { font-size: 46px; line-height: 1; }
    #last-log {
      text-align: center;
      margin-top: 16px;
      color: #64748b;
      font-size: 14px;
    }
    #upload-box {
      margin-top: 12px;
      text-align: center;
    }
    #upload-box input { margin-top: 6px; }
  </style>
</head>
<body>
  <h1>Presensi Kegiatan HC 32</h1>

  <div id="qr-box">
    <div id="qr-reader">Memeriksa kamera...</div>
    <!-- fallback kalau kamera diblokir -->
    <div id="upload-box" style="display:none;">
      <p>Tidak bisa akses kamera? Upload foto QR/barcode:</p>
      <input type="file" id="qr-file" accept="image/*">
    </div>
  </div>

  <div id="manual-box">
    <p style="margin:0 0 6px 0;font-weight:600;">Input NIS manual</p>
    <input type="text" id="nis-input" placeholder="mis. 321005">
    <button id="nis-submit">Kirim Presensi</button>
    <p style="font-size:12px;color:#94a3b8;margin-top:8px;">Gunakan ini jika barcode tidak terbaca.</p>
  </div>

  <div id="last-log"></div>

  <div id="status-layer">
    <div id="bubble-success" class="bubble success">
      <span>✓</span>
      <div>Presensi OK</div>
    </div>
    <div id="bubble-error" class="bubble error">
      <span>✕</span>
      <div>Gagal</div>
    </div>
  </div>

  <script>
    // pakai URL kamu
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyvTzjW2iQ2qT0Y_Hz1E4I9njAo09FRhnOAnSjtC3zo2HwkgtXQftH_sCiKriqOVXuSOg/exec";

    async function kirimPresensi(nis) {
      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({ action: "presensi", nis })
      });
      return res.json();
    }

    function showSuccess(msg) {
      const b = document.getElementById("bubble-success");
      b.querySelector("div").textContent = msg || "Berhasil";
      b.classList.add("show");
      setTimeout(() => b.classList.remove("show"), 1200);
    }
    function showError(msg) {
      const b = document.getElementById("bubble-error");
      b.querySelector("div").textContent = msg || "Gagal";
      b.classList.add("show");
      setTimeout(() => b.classList.remove("show"), 1400);
    }
    function setLastLog(text) {
      document.getElementById("last-log").textContent = text;
    }

    // handle respons dari Apps Script
    function handlePresensiResponse(out) {
      if (out.status === "ok") {
        showSuccess("Presensi OK");
        setLastLog("OK: " + (out.nama || "N/A") + " (" + out.nis + ") • " + (out.pertemuan || ""));
      } else if (out.status === "not-registered") {
        showError("NIS belum terdaftar");
        setLastLog("Gagal: NIS belum terdaftar");
      } else if (out.status === "duplicate") {
        showError("Sudah presensi hari ini");
        setLastLog("Gagal: sudah presensi hari ini");
      } else {
        showError(out.message || "Gagal");
        setLastLog("Gagal: " + (out.message || "error"));
      }
    }

    // manual input
    document.getElementById("nis-submit").addEventListener("click", async () => {
      const el = document.getElementById("nis-input");
      const nis = el.value.trim();
      if (!nis) return;
      try {
        const out = await kirimPresensi(nis);
        handlePresensiResponse(out);
      } catch (e) {
        showError("Network");
        setLastLog("Network error");
      } finally {
        el.value = "";
      }
    });

    // ==== SCANNER ====
    const qrReaderDiv = document.getElementById("qr-reader");
    const uploadBox = document.getElementById("upload-box");

    // 1. cek kamera
    Html5Qrcode.getCameras().then(devices => {
      if (!devices || devices.length === 0) {
        qrReaderDiv.innerHTML = "Kamera tidak tersedia.";
        uploadBox.style.display = "block";
        return;
      }
      // 2. pilih kamera belakang kalau ada
      const cameraId = devices.find(d => d.label.toLowerCase().includes("back"))?.id || devices[0].id;
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // pause biar gak dobel
          html5QrCode.pause();
          try {
            const out = await kirimPresensi(decodedText.trim());
            handlePresensiResponse(out);
          } catch (e) {
            showError("Network");
          } finally {
            // lanjut orang berikutnya
            setTimeout(() => html5QrCode.resume(), 1400);
          }
        }
      ).catch(err => {
        // misal karena iframe / permission
        qrReaderDiv.innerHTML = "Kamera tidak dapat digunakan di lingkungan ini.";
        uploadBox.style.display = "block";
      });

      // 3. fallback: upload gambar
      document.getElementById("qr-file").addEventListener("change", e => {
        if (e.target.files.length === 0) return;
        html5QrCode.scanFile(e.target.files[0], true)
          .then(async decodedText => {
            try {
              const out = await kirimPresensi(decodedText.trim());
              handlePresensiResponse(out);
            } catch (e) { showError("Network"); }
          })
          .catch(err => {
            showError("Tidak bisa baca gambar");
          });
      });
    }).catch(err => {
      // benar-benar gak bisa cek kamera
      qrReaderDiv.innerHTML = "Kamera tidak tersedia.";
      uploadBox.style.display = "block";
    });
  </script>
</body>
</html>
