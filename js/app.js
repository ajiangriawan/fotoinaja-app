// app.js — FotoinAja Main Application Controller

document.addEventListener("DOMContentLoaded", () => {
  initCanvases();
  loadStickerCategory("cute");
  updateOrderSummary();
  initDragDrop();
  setTheme("kawaii");
  setLayout("single");
  renderLayoutPreviews();

  // FIX UX: Auto-resize canvas saat ukuran layar berubah (misal HP di-rotate)
  window.addEventListener("resize", () => {
    if (currentStep === 2) updateMainCanvas();
    if (currentStep === 3) updateDecorCanvas();
    if (currentStep === 4) updateCheckoutCanvas();
  });
});

// ─── NAVIGATION ──────────────────────────────────────────────────────────
let currentStep = 1;

function goToStep(step) {
  if (step > 1 && AppState.uploadedImages.length === 0) {
    showToast("Upload foto dulu yuk! 📷");
    return;
  }

  // FIX: Hapus seleksi stiker/teks aktif saat pindah step
  if (typeof selectedSticker !== "undefined" && selectedSticker) {
    selectedSticker.classList.remove("selected");
    selectedSticker = null;
  }

  currentStep = step;
  document.querySelectorAll(".booth-step").forEach((el, i) => {
    el.classList.toggle("active", i === step - 1);
  });

  document.querySelectorAll(".progress-step").forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i + 1 === step) el.classList.add("active");
    else if (i + 1 < step) el.classList.add("done");
  });

  // FIX: Delay dinaikkan sedikit agar CSS Flexbox/Grid selesai membentuk ukuran
  // sebelum Canvas menghitung lebar layarnya
  setTimeout(() => {
    if (step === 2) updateMainCanvas();
    if (step === 3) updateDecorCanvas();
    if (step === 4) {
      updateOrderSummary();
      updateCheckoutCanvas();
    }
  }, 150);

  const booth = document.getElementById("booth");
  if (booth) booth.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── TOAST ────────────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  let t = document.getElementById("snapToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "snapToast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `snap-toast active ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("active"), 3000);
}

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────

// Fungsi baru agar tampilan UI selalu sinkron dengan memori array
function renderPreviewGrid() {
  const previewGrid = document.getElementById("previewGrid");
  if (!previewGrid) return;
  previewGrid.innerHTML = "";

  AppState.uploadedImages.forEach((img, idx) => {
    const thumb = document.createElement("div");
    thumb.className = "preview-thumb";
    thumb.innerHTML = `<img src="${img.src}" alt="Preview ${idx + 1}">
      <button class="remove-btn" onclick="removePhoto(${idx})" title="Hapus">×</button>`;
    previewGrid.appendChild(thumb);
  });
}

function handleFiles(files) {
  if (!files || files.length === 0) return;

  const maxPhotos = 9;
  const availableSlots = maxPhotos - AppState.uploadedImages.length;

  if (availableSlots <= 0) {
    showToast("Maksimal 9 foto ya! 📸", "warn");
    return;
  }

  // Hanya ambil foto sesuai slot yang tersisa
  const filesToProcess = Array.from(files).slice(0, availableSlots);
  let loaded = 0;

  filesToProcess.forEach((file) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast(`File ${file.name} terlalu besar (maks 15MB)`, "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Gunakan .push() untuk menambah foto
        AppState.uploadedFiles.push(file);
        AppState.uploadedImages.push(img);
        loaded++;

        // Jika semua file baru sudah selesai diproses, perbarui layar
        if (
          loaded ===
          filesToProcess.filter((f) => f.type.startsWith("image/")).length
        ) {
          renderPreviewGrid();
          document.getElementById("uploadArea").style.display = "none";
          document.getElementById("uploadedPreview").style.display = "block";
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto(idx) {
  AppState.uploadedFiles.splice(idx, 1);
  AppState.uploadedImages.splice(idx, 1);
  renderPreviewGrid();
  if (AppState.uploadedImages.length === 0) clearUploads();
}

function clearUploads() {
  AppState.uploadedFiles = [];
  AppState.uploadedImages = [];
  const fi = document.getElementById("fileInput");
  if (fi) fi.value = "";
  document.getElementById("uploadArea").style.display = "block";
  document.getElementById("uploadedPreview").style.display = "none";
  const pg = document.getElementById("previewGrid");
  if (pg) pg.innerHTML = "";
}

// ─── CAMERA ───────────────────────────────────────────────────────────────
let cameraStream = null;

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1080 },
        height: { ideal: 1080 },
      },
    });
    document.getElementById("cameraVideo").srcObject = cameraStream;

    document.getElementById("uploadArea").style.display = "none";
    document.getElementById("uploadedPreview").style.display = "none";
    document.getElementById("cameraContainer").style.display = "block";
  } catch (err) {
    console.error("Camera Error:", err);
    showToast(
      "Kamera tidak bisa diakses. Izinkan akses kamera terlebih dahulu! 📷",
      "error",
    );
  }
}


function capturePhoto() {
  const maxPhotos = 9;
  if (AppState.uploadedImages.length >= maxPhotos) {
    showToast("Maksimal 9 foto ya! 📸", "warn");
    return;
  }

  const video = document.getElementById("cameraVideo");
  if (!video || !cameraStream) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  // KODE BARU: Membalik (Mirror) canvas sebelum kamera digambar ke dalamnya
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(
    (blob) => {
      const img = new Image();
      img.onload = () => {
        AppState.uploadedImages.push(img);
        AppState.uploadedFiles.push(
          new File([blob], `cam-${Date.now()}.jpg`, { type: "image/jpeg" }),
        );

        renderPreviewGrid();

        document.getElementById("cameraContainer").style.display = "none";
        document.getElementById("uploadedPreview").style.display = "block";
      };
      img.src = URL.createObjectURL(blob);
    },
    "image/jpeg",
    0.92,
  );
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  document.getElementById("cameraContainer").style.display = "none";

  if (AppState.uploadedImages.length > 0) {
    document.getElementById("uploadedPreview").style.display = "block";
  } else {
    document.getElementById("uploadArea").style.display = "block";
  }
}

// ─── THEME & LAYOUT ───────────────────────────────────────────────────────
function setTheme(theme) {
  AppState.currentTheme = theme;
  document
    .querySelectorAll(".theme-opt")
    .forEach((el) => el.classList.toggle("active", el.dataset.theme === theme));
  updateMainCanvas();
  updateDecorCanvas();
  updateCheckoutCanvas();
}

function setLayout(layout) {
  AppState.currentLayout = layout;
  document
    .querySelectorAll(".layout-opt")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.layout === layout),
    );
  updateOrderSummary();
  updateMainCanvas();
  updateDecorCanvas();
  updateCheckoutCanvas();
}

// ─── LAYOUT PREVIEW ICONS ─────────────────────────────────────────────────
function renderLayoutPreviews() {
  document.querySelectorAll(".layout-opt").forEach((el) => {
    const key = el.dataset.layout;
    const layout = LAYOUTS[key];
    if (!layout) return;
    const icon = el.querySelector(".layout-icon");
    if (!icon) return;

    const svg = buildLayoutSVG(layout);
    icon.innerHTML = svg;
  });
}

function buildLayoutSVG(layout) {
  const W = 40,
    H = 52;
  const PAD = 3;
  const cols = layout.cols;
  const rows = layout.rows;
  const fw = (W - PAD * (cols + 1)) / cols;
  const fh = (H - PAD * (rows + 1) - 8) / rows;

  let rects = "";
  if (layout.special === "polaroid") {
    rects = `<rect x="4" y="3" width="32" height="36" rx="1" fill="white" opacity="0.9"/>
             <rect x="5" y="4" width="30" height="28" rx="1" fill="#ccc"/>`;
  } else if (layout.special === "collage5") {
    rects = `<rect x="3" y="3" width="16" height="18" rx="1" fill="white" opacity="0.8"/>
             <rect x="21" y="3" width="16" height="18" rx="1" fill="white" opacity="0.8"/>
             <rect x="3" y="23" width="34" height="10" rx="1" fill="white" opacity="0.8"/>
             <rect x="3" y="35" width="16" height="12" rx="1" fill="white" opacity="0.8"/>
             <rect x="21" y="35" width="16" height="12" rx="1" fill="white" opacity="0.8"/>`;
  } else {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = PAD + col * (fw + PAD);
        const y = PAD + row * (fh + PAD);
        rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="1.5" fill="white" opacity="0.85"/>`;
      }
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

// ─── DECOR TABS ───────────────────────────────────────────────────────────
function switchTab(tab) {
  document
    .querySelectorAll(".decor-tab")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  const btn = document.querySelector(`[onclick="switchTab('${tab}')"]`);
  const content = document.getElementById(`tab-${tab}`);
  if (btn) btn.classList.add("active");
  if (content) content.classList.add("active");
}

// ─── TEXT SYSTEM ──────────────────────────────────────────────────────────
let textDragState = { active: false, el: null, offsetX: 0, offsetY: 0 };

function updateTextStyle() {
  // Biarkan kosong untuk saat ini
}

function addText() {
  const input = document.getElementById("textInput");
  const fontSelect = document.getElementById("fontSelect");
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const textColor = document.getElementById("textColor");
  const textBgColor = document.getElementById("textBgColor");
  const textBgToggle = document.getElementById("textBgToggle");

  const text = input?.value?.trim();
  if (!text) {
    showToast("Tulis teks dulu ya! ✍️", "warn");
    return;
  }

  const layer = document.getElementById("textLayer");
  const container = document.getElementById("canvasContainer");
  if (!layer || !container) return;

  const canvasW = decorCanvas ? decorCanvas.offsetWidth : 500;
  const x = canvasW / 2;
  const y = 80 + AppState.textElements.length * 60;
  const fontSize = parseInt(fontSizeSlider?.value || 32);
  const font = fontSelect?.value || "DM Sans";
  const color = textColor?.value || "#ffffff";
  const hasBg = textBgToggle?.checked || false;
  const bgColor = textBgColor?.value || "#ff6b9d";
  const id = "text-" + Date.now();

  const el = document.createElement("div");
  el.className = "drag-text";
  el.id = id;
  el.style.cssText = `left:${x}px;top:${y}px;font-family:"${font}",sans-serif;
    font-size:${fontSize}px;color:${color};font-weight:bold;white-space:nowrap;
    display:inline-block; position:absolute;`;
  el.textContent = text;

  const delBtn = document.createElement("button");
  delBtn.className = "del-sticker";
  delBtn.textContent = "×";
  delBtn.onclick = (e) => {
    e.stopPropagation();
    removeTextEl(id);
  };
  el.appendChild(delBtn);

  layer.appendChild(el);

  setTimeout(() => {
    const realW = el.offsetWidth;
    const realH = el.offsetHeight;

    AppState.textElements.push({
      id,
      text,
      x: x + realW / 2,
      y: y + realH / 2,
      fontFamily: font,
      fontSize,
      color,
      hasBg,
      bgColor,
      fontWeight: "bold",
      el,
    });

    AppState.history.push({ type: "addText", id });
    updateTextList();
  }, 10);

  el.addEventListener("mousedown", (e) => startDragText(e, el));
  el.addEventListener("touchstart", (e) => startDragText(e, el), {
    passive: false,
  });
  el.addEventListener("dblclick", () => removeTextEl(id));
  el.title = "Drag untuk pindah. Klik 2× untuk hapus.";

  if (input) input.value = "";
}

function updateTextList() {
  const list = document.getElementById("textList");
  if (!list) return;
  list.innerHTML = "";
  AppState.textElements.forEach((t) => {
    const item = document.createElement("div");
    item.className = "text-item";
    item.innerHTML = `<span style="font-family:${t.fontFamily}">${t.text.substring(0, 20)}${t.text.length > 20 ? "…" : ""}</span>
      <button onclick="removeTextEl('${t.id}')">🗑</button>`;
    list.appendChild(item);
  });
}

function removeTextEl(id) {
  const idx = AppState.textElements.findIndex((t) => t.id === id);
  if (idx !== -1) AppState.textElements.splice(idx, 1);
  const el = document.getElementById(id);
  if (el) el.remove();
  updateTextList();
}

function startDragText(e, el) {
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  const rect = el.getBoundingClientRect();
  textDragState = {
    active: true,
    el,
    offsetX: touch.clientX - rect.left,
    offsetY: touch.clientY - rect.top,
  };
  document.addEventListener("mousemove", onTextDragMove);
  document.addEventListener("mouseup", onTextDragEnd);
  document.addEventListener("touchmove", onTextDragMove, { passive: false });
  document.addEventListener("touchend", onTextDragEnd);
}

function onTextDragMove(e) {
  if (!textDragState.active) return;
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  const container = document.getElementById("canvasContainer");
  const cRect = container.getBoundingClientRect();

  let x = touch.clientX - cRect.left - textDragState.offsetX;
  let y = touch.clientY - cRect.top - textDragState.offsetY;

  const elW = textDragState.el.offsetWidth || 0;
  const elH = textDragState.el.offsetHeight || 0;

  x = Math.max(0, Math.min(cRect.width - elW, x));
  y = Math.max(0, Math.min(cRect.height - elH, y));

  textDragState.el.style.left = x + "px";
  textDragState.el.style.top = y + "px";

  const textData = AppState.textElements.find(
    (t) => t.id === textDragState.el.id,
  );
  if (textData) {
    textData.x = x + elW / 2;
    textData.y = y + elH / 2;
  }
}

function onTextDragEnd() {
  textDragState.active = false;
  document.removeEventListener("mousemove", onTextDragMove);
  document.removeEventListener("mouseup", onTextDragEnd);
  document.removeEventListener("touchmove", onTextDragMove);
  document.removeEventListener("touchend", onTextDragEnd);
}

// ─── UNDO / RESET ─────────────────────────────────────────────────────────
function undoLast() {
  const last = AppState.history.pop();
  if (!last) return;
  if (last.type === "addSticker") removeSticker(last.id);
  else if (last.type === "addText") removeTextEl(last.id);
}

function clearDecorations() {
  if (!confirm("Hapus semua dekorasi?")) return;
  AppState.stickers.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) el.remove();
  });
  AppState.stickers = [];
  AppState.textElements.forEach((t) => {
    const el = document.getElementById(t.id);
    if (el) el.remove();
  });
  AppState.textElements = [];
  AppState.history = [];
  updateTextList();

  AppState.appliedFilter = "none";
  AppState.beautySetting = 0;
  AppState.brightnessSetting = 0;
  AppState.saturationSetting = 100;

  document
    .querySelectorAll(".filter-item")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.filter === "none"),
    );
  ["beautySlider", "brightSlider", "satSlider"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = id === "satSlider" ? 100 : 0;
  });
  ["beautyVal", "brightVal", "satVal"].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = [0, 0, 100][i];
  });

  updateDecorCanvas();
}

// ─── RESTART ──────────────────────────────────────────────────────────────
function startOver() {
  Object.assign(AppState, {
    uploadedFiles: [],
    uploadedImages: [],
    stickers: [],
    textElements: [],
    history: [],
    paymentToken: null,
    promoCode: null,
    appliedFilter: "none",
  });
  clearUploads();
  ["stickerLayer", "textLayer"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  goToStep(1);
}

// ─── DRAG & DROP FILE ─────────────────────────────────────────────────────
function initDragDrop() {
  const area = document.getElementById("uploadArea");
  if (!area) return;
  area.addEventListener("dragover", (e) => {
    e.preventDefault();
    area.classList.add("drag-over");
  });
  area.addEventListener("dragleave", () => area.classList.remove("drag-over"));
  area.addEventListener("drop", (e) => {
    e.preventDefault();
    area.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });
}

// ─── FAQ ──────────────────────────────────────────────────────────────────
function toggleFaq(btn) {
  const ans = btn.nextElementSibling;
  const isOpen = ans.classList.contains("open");
  document
    .querySelectorAll(".faq-a")
    .forEach((a) => a.classList.remove("open"));
  document
    .querySelectorAll(".faq-q")
    .forEach((q) => q.classList.remove("open"));
  if (!isOpen) {
    ans.classList.add("open");
    btn.classList.add("open");
  }
}

// ─── MOBILE MENU ─────────────────────────────────────────────────────────
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("open");
}

// ─── FONT SIZE DISPLAY ────────────────────────────────────────────────────
document.addEventListener("input", (e) => {
  if (e.target.id === "fontSizeSlider") {
    const el = document.getElementById("fontSizeVal");
    if (el) el.textContent = e.target.value + "px";
  }
});

// ─── CANVAS PROTECTION ───────────────────────────────────────────────────
document.addEventListener("contextmenu", (e) => {
  if (
    e.target.tagName === "CANVAS" ||
    e.target.closest(".canvas-wrapper,.checkout-canvas-wrap")
  ) {
    e.preventDefault();
  }
});

console.log(
  "%c📸 FotoinAja v2.0",
  "font-size:20px;color:#ff6b9d;font-weight:bold",
);
console.log(
  "%cFoto tidak disimpan di server. Privasi kamu terjaga! 🔒",
  "color:#4ecdc4",
);
