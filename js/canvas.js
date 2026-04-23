// canvas.js — FotoinAja Canvas Rendering Engine

let mainCanvas, mainCtx, decorCanvas, decorCtx, checkoutCanvas, checkoutCtx;

function initCanvases() {
  mainCanvas = document.getElementById("mainCanvas");
  if (mainCanvas) mainCtx = mainCanvas.getContext("2d");
  decorCanvas = document.getElementById("decorCanvas");
  if (decorCanvas) decorCtx = decorCanvas.getContext("2d");
  checkoutCanvas = document.getElementById("checkoutCanvas");
  if (checkoutCanvas) checkoutCtx = checkoutCanvas.getContext("2d");
}

// ─── Master render function ────────────────────────────────────────────────
function renderCanvas(ctx, canvas, preview = true) {
  if (!ctx || !canvas) return;
  const theme = THEMES[AppState.currentTheme];
  const layout = LAYOUTS[AppState.currentLayout];
  const images = AppState.uploadedImages;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, theme, W, H);
  drawPattern(ctx, theme, W, H);

  if (layout.special === "polaroid") {
    drawPolaroidLayout(ctx, theme, images, W, H);
  } else if (layout.special === "collage5") {
    drawCollage5Layout(ctx, theme, images, W, H);
  } else {
    drawGridLayout(ctx, theme, layout, images, W, H);
  }

  drawLabel(ctx, theme, W, H);

  if (preview) drawWatermark(ctx, W, H);
}

function drawBackground(ctx, theme, W, H) {
  if (theme.gradient && theme.gradient.length >= 2) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    theme.gradient.forEach((c, i) =>
      grad.addColorStop(i / (theme.gradient.length - 1), c),
    );
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.bg;
  }
  ctx.fillRect(0, 0, W, H);
}

// ─── Grid / Strip layout ──────────────────────────────────────────────────
function drawGridLayout(ctx, theme, layout, images, W, H) {
  const PAD = Math.round(W * 0.035);
  const LABEL_H = Math.round(H * 0.07);
  const cols = layout.cols;
  const rows = layout.rows;
  const totalW = W - PAD * (cols + 1);
  const totalH = H - PAD * (rows + 1) - LABEL_H;
  const fw = Math.floor(totalW / cols);
  const fh = Math.floor(totalH / rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const x = PAD + col * (fw + PAD);
      const y = PAD + row * (fh + PAD);
      const img = images[idx % Math.max(images.length, 1)];
      drawPhotoFrame(ctx, theme, img, x, y, fw, fh);
    }
  }
}

// ─── Polaroid layout ──────────────────────────────────────────────────────
function drawPolaroidLayout(ctx, theme, images, W, H) {
  const PAD = Math.round(W * 0.07);
  const LABEL_H = Math.round(H * 0.15);
  const fw = W - PAD * 2;
  const fh = H - PAD - LABEL_H - Math.round(H * 0.07);

  // White polaroid card
  ctx.save();
  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, PAD - 8, PAD - 8, fw + 16, fh + LABEL_H + 16, 4);
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.restore();

  const img = images[0];
  drawPhotoFrame(ctx, theme, img, PAD, PAD, fw, fh, 2);

  // Polaroid caption area
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(PAD - 8, PAD + fh + 8, fw + 16, LABEL_H);

  ctx.fillStyle = theme.frameColor;
  ctx.font = `bold ${Math.round(W * 0.06)}px "${theme.fontFamily || "DM Sans"}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    theme.labelText || "📸 FotoinAja",
    W / 2,
    PAD + fh + 8 + LABEL_H / 2 - 6,
  );

  const now = new Date();
  ctx.font = `${Math.round(W * 0.03)}px "Space Mono", monospace`;
  ctx.fillStyle = "#999";
  ctx.fillText(
    `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
    W / 2,
    PAD + fh + 8 + LABEL_H / 2 + 18,
  );
}

// ─── Collage 5 (2+1+2) layout ────────────────────────────────────────────
function drawCollage5Layout(ctx, theme, images, W, H) {
  const PAD = Math.round(W * 0.025);
  const LABEL_H = Math.round(H * 0.07);
  const availH = H - PAD * 4 - LABEL_H;
  const row1H = Math.floor(availH * 0.4);
  const row2H = Math.floor(availH * 0.25);
  const row3H = availH - row1H - row2H;
  const halfW = Math.floor((W - PAD * 3) / 2);
  const fullW = W - PAD * 2;

  // Row 1: 2 frames side by side
  drawPhotoFrame(
    ctx,
    theme,
    images[0 % Math.max(images.length, 1)],
    PAD,
    PAD,
    halfW,
    row1H,
  );
  drawPhotoFrame(
    ctx,
    theme,
    images[1 % Math.max(images.length, 1)],
    PAD * 2 + halfW,
    PAD,
    halfW,
    row1H,
  );
  // Row 2: 1 wide frame
  drawPhotoFrame(
    ctx,
    theme,
    images[2 % Math.max(images.length, 1)],
    PAD,
    PAD * 2 + row1H,
    fullW,
    row2H,
  );
  // Row 3: 2 frames side by side
  drawPhotoFrame(
    ctx,
    theme,
    images[3 % Math.max(images.length, 1)],
    PAD,
    PAD * 3 + row1H + row2H,
    halfW,
    row3H,
  );
  drawPhotoFrame(
    ctx,
    theme,
    images[4 % Math.max(images.length, 1)],
    PAD * 2 + halfW,
    PAD * 3 + row1H + row2H,
    halfW,
    row3H,
  );
}

// ─── Draw single photo frame ──────────────────────────────────────────────
function drawPhotoFrame(ctx, theme, img, x, y, w, h, overrideRadius) {
  ctx.save();
  const r =
    overrideRadius !== undefined ? overrideRadius : theme.cornerRadius || 0;
  const bw = theme.borderWidth || 4;

  // Neon glow
  if (theme.neonGlow) {
    ctx.shadowBlur = 18;
    ctx.shadowColor = theme.neonGlow;
  }

  // Frame border
  ctx.fillStyle = theme.frameColor;
  roundRectPath(
    ctx,
    x - bw,
    y - bw,
    w + bw * 2,
    h + bw * 2,
    Math.max(0, r + bw),
  );
  ctx.fill();
  ctx.shadowBlur = 0;

  // Clip to photo area
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();

  if (img) {
    applyFilterToContext(
      ctx,
      AppState.appliedFilter,
      AppState.brightnessSetting,
      AppState.saturationSetting,
      AppState.beautySetting,
    );

    const iA = img.naturalWidth / img.naturalHeight;
    const fA = w / h;
    let sx, sy, sw, sh;
    if (iA > fA) {
      sh = img.naturalHeight;
      sw = sh * fA;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / fA;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `${Math.min(w, h) * 0.25}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("📷", x + w / 2, y + h / 2);
  }

  // Corner emoji
  if (theme.overlayEmoji && theme.overlayEmoji.length >= 4) {
    ctx.filter = "none";
    const fs = Math.max(14, Math.min(w, h) * 0.07);
    ctx.font = `${fs}px sans-serif`;
    const pad = fs * 0.35;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(theme.overlayEmoji[0], x + pad, y + pad);
    ctx.textAlign = "right";
    ctx.fillText(theme.overlayEmoji[1], x + w - pad, y + pad);
    ctx.textBaseline = "bottom";
    ctx.fillText(theme.overlayEmoji[2], x + w - pad, y + h - pad);
    ctx.textAlign = "left";
    ctx.fillText(theme.overlayEmoji[3], x + pad, y + h - pad);
  }

  ctx.restore();
}

// ─── Label bar ────────────────────────────────────────────────────────────
function drawLabel(ctx, theme, W, H) {
  const LABEL_H = Math.round(H * 0.07);
  const y = H - LABEL_H - Math.round(H * 0.01);
  const PAD = Math.round(W * 0.025);

  ctx.save();
  ctx.fillStyle = theme.labelBg || theme.frameColor;
  roundRectPath(ctx, PAD, y, W - PAD * 2, LABEL_H, 8);
  ctx.fill();

  const mid = y + LABEL_H / 2;
  ctx.fillStyle = theme.labelTextColor || "#fff";
  ctx.font = `bold ${Math.round(LABEL_H * 0.42)}px "${theme.fontFamily || "DM Sans"}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(theme.labelText || "📸 FotoinAja", W / 2, mid - LABEL_H * 0.1);

  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} • FotoinAja.id`;
  ctx.font = `${Math.round(LABEL_H * 0.25)}px "Space Mono", monospace`;
  ctx.fillStyle = (theme.labelTextColor || "#fff") + "aa";
  ctx.fillText(dateStr, W / 2, mid + LABEL_H * 0.28);
  ctx.restore();
}

// ─── Pattern overlay ──────────────────────────────────────────────────────
function drawPattern(ctx, theme, W, H) {
  if (!theme.pattern || theme.pattern === "none") return;
  ctx.save();
  ctx.globalAlpha = 0.5;

  if (theme.pattern === "dots") {
    ctx.fillStyle = theme.patternColor;
    for (let px = 0; px < W; px += 22) {
      for (let py = 0; py < H; py += 22) {
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (theme.pattern === "grid") {
    ctx.strokeStyle = theme.patternColor;
    ctx.lineWidth = 0.6;
    for (let px = 0; px < W; px += 30) {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
    }
    for (let py = 0; py < H; py += 30) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      ctx.stroke();
    }
  } else if (theme.pattern === "stripes") {
    ctx.strokeStyle = theme.patternColor;
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += 22) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
      ctx.stroke();
    }
  } else if (
    theme.pattern === "circuit" ||
    theme.pattern === "vintage" ||
    theme.pattern === "floral"
  ) {
    ctx.fillStyle = theme.patternColor;
    for (let px = 0; px < W; px += 28) {
      for (let py = 0; py < H; py += 28) {
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

// ─── Watermark ────────────────────────────────────────────────────────────
function drawWatermark(ctx, W, H) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 5);
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font = `bold ${Math.max(18, W * 0.04)}px "Space Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let r = -H; r < H; r += 90) {
    ctx.fillText("PREVIEW — FotoinAja", 0, r);
  }
  ctx.restore();
}

// ─── Round rect path helper ───────────────────────────────────────────────
function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
// legacy alias
function roundRect(ctx, x, y, w, h, r) {
  roundRectPath(ctx, x, y, w, h, r);
}

// ─── CSS filter string ────────────────────────────────────────────────────
function applyFilterToContext(ctx, filter, brightness, saturation, beauty) {
  const b = brightness / 100;
  const s = saturation;
  switch (filter) {
    case "none":
      ctx.filter = `brightness(${1 + b}) saturate(${s}%)`;
      break;
    case "beauty":
      ctx.filter = `brightness(${1.1 + b}) saturate(${s * 1.1}%) contrast(0.95) blur(${beauty * 0.003}px)`;
      break;
    case "warm":
      ctx.filter = `brightness(${1.05 + b}) saturate(${s * 1.2}%) sepia(0.2) hue-rotate(-10deg)`;
      break;
    case "cool":
      ctx.filter = `brightness(${1 + b}) saturate(${s * 0.9}%) hue-rotate(30deg)`;
      break;
    case "vintage":
      ctx.filter = `brightness(${0.95 + b}) saturate(${s * 0.7}%) sepia(0.4) contrast(1.1)`;
      break;
    case "vivid":
      ctx.filter = `brightness(${1.05 + b}) saturate(${s * 1.5}%) contrast(1.1)`;
      break;
    case "mono":
      ctx.filter = `brightness(${1 + b}) saturate(0%) contrast(1.2)`;
      break;
    case "soft":
      ctx.filter = `brightness(${1.05 + b}) saturate(${s * 0.9}%) blur(0.5px)`;
      break;
    default:
      ctx.filter = "none";
  }
}

// ─── HD canvas for download ───────────────────────────────────────────────
function generateHDCanvas() {
  const layout = LAYOUTS[AppState.currentLayout];

  // Base size per cell
  const CELL = 1000;
  let hdW, hdH;

  if (layout.special === "polaroid") {
    hdW = CELL;
    hdH = Math.round(CELL / 0.85);
  } else if (layout.special === "collage5") {
    hdW = CELL * 2 + 60;
    hdH = Math.round((CELL * 2 + 60) / 0.75);
  } else {
    hdW = CELL * layout.cols + 40 * (layout.cols + 1);
    hdH = Math.round(hdW / layout.aspect);
  }

  const hdCanvas = document.createElement("canvas");
  hdCanvas.width = hdW;
  hdCanvas.height = hdH;
  const hdCtx = hdCanvas.getContext("2d");

  // Render everything except watermark
  const theme = THEMES[AppState.currentTheme];
  const images = AppState.uploadedImages;

  drawBackground(hdCtx, theme, hdW, hdH);
  drawPattern(hdCtx, theme, hdW, hdH);

  if (layout.special === "polaroid") {
    drawPolaroidLayout(hdCtx, theme, images, hdW, hdH);
  } else if (layout.special === "collage5") {
    drawCollage5Layout(hdCtx, theme, images, hdW, hdH);
  } else {
    drawGridLayout(hdCtx, theme, layout, images, hdW, hdH);
  }

  drawLabel(hdCtx, theme, hdW, hdH);

  // Overlay stickers & text scaled to HD
  // FIX: Gunakan offsetWidth/offsetHeight (ukuran CSS layar), bukan ukuran internal
  // KODE BARU (Mengambil angka pasti dari inline-style CSS)
  const previewW = decorCanvas
    ? parseFloat(decorCanvas.style.width) || 600
    : 600;
  const previewH = decorCanvas
    ? parseFloat(decorCanvas.style.height) || 600
    : 600;
  const scaleX = hdW / previewW;
  const scaleY = hdH / previewH;
  const scaleS = Math.min(scaleX, scaleY);

  renderStickersToCanvas(hdCtx, scaleX, scaleY, scaleS);
  renderTextToCanvas(hdCtx, scaleX, scaleY, scaleS);

  return hdCanvas;
}

function renderStickersToCanvas(ctx, scaleX, scaleY, scaleS) {
  AppState.stickers.forEach((s) => {
    ctx.save();
    ctx.font = `${s.size * scaleS}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.emoji, s.x * scaleX, s.y * scaleY);
    ctx.restore();
  });
}

function renderTextToCanvas(ctx, scaleX, scaleY, scaleS) {
  AppState.textElements.forEach((t) => {
    ctx.save();
    const fs = t.fontSize * scaleS;
    ctx.font = `${t.fontWeight || "bold"} ${fs}px "${t.fontFamily}", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (t.hasBg) {
      const m = ctx.measureText(t.text);
      const tw = m.width + 20 * scaleX;
      const th = fs + 16 * scaleY;
      ctx.fillStyle = t.bgColor;
      roundRectPath(
        ctx,
        t.x * scaleX - tw / 2,
        t.y * scaleY - th / 2,
        tw,
        th,
        8 * scaleX,
      );
      ctx.fill();
    }

    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x * scaleX, t.y * scaleY);
    ctx.restore();
  });
}

// ─── Update helpers ────────────────────────────────────────────────────────
function updateMainCanvas() {
  if (!mainCtx) return;
  syncCanvasSize(mainCanvas);
  renderCanvas(mainCtx, mainCanvas, true);
}

function updateDecorCanvas() {
  if (!decorCtx) return;
  syncCanvasSize(decorCanvas);
  renderCanvas(decorCtx, decorCanvas, true);
}

// js/canvas.js

function updateCheckoutCanvas() {
  if (!checkoutCtx) return;

  // 1. Sinkronisasi ukuran kanvas
  syncCanvasSize(checkoutCanvas);

  // 2. Gambar base (foto, bingkai, watermark)
  renderCanvas(checkoutCtx, checkoutCanvas, true);

  // 3. KODE BARU: Gambar stiker dan teks ke preview checkout
  // Kita hitung skala agar posisi stiker pas dengan ukuran kanvas preview
  const previewW = parseFloat(checkoutCanvas.style.width) || 600;
  const previewH = parseFloat(checkoutCanvas.style.height) || 600;

  // Internal resolution kita di syncCanvasSize adalah 800
  const internalW = 800;
  const scale = internalW / previewW;

  // Panggil fungsi render yang sudah kamu buat sebelumnya
  renderStickersToCanvas(checkoutCtx, scale, scale, scale);
  renderTextToCanvas(checkoutCtx, scale, scale, scale);
}

// ─── UX FIX: Cerdas & Responsif (PC & Mobile) ──────────────────────────────
// Resize canvas to match CSS display size × DPR for sharp rendering
// Resize canvas to match CSS display size × DPR for sharp rendering
function syncCanvasSize(canvas) {
  if (!canvas) return;
  const layout = LAYOUTS[AppState.currentLayout];
  const aspect = layout.aspect || 1;

  // FIX: Jangan ukur pembungkus langsung (.canvas-wrapper) karena dia pakai fit-content.
  // Ukur elemen luarnya (seperti .step-preview) yang lebarnya stabil dipaksa oleh Grid CSS.
  let safeContainer = canvas.parentElement;
  if (safeContainer.classList.contains('canvas-wrapper') || 
      safeContainer.classList.contains('canvas-container') || 
      safeContainer.classList.contains('checkout-canvas-wrap')) {
    safeContainer = safeContainer.parentElement; 
  }
  
  let maxW = safeContainer.clientWidth || 800;
  
  // Kurangi padding agar tidak terlalu mepet
  maxW = maxW - 20; 

  if (maxW > 800) maxW = 800; 
  const safeMobileW = window.innerWidth - 48;
  if (maxW > safeMobileW) maxW = safeMobileW;

  const maxH = window.innerHeight * 0.65; 
  let displayW = maxW;
  let displayH = displayW / aspect;

  if (displayH > maxH) {
    displayH = maxH;
    displayW = displayH * aspect;
  }

  displayW = Math.round(displayW);
  displayH = Math.round(displayH);

  // Set Ukuran Tampilan Fisik (CSS)
  canvas.style.width  = displayW + 'px';
  canvas.style.height = displayH + 'px';

  // Set Resolusi Internal selalu HD
  const internalW = 800;
  const internalH = Math.round(800 / aspect);
  
  canvas.width  = internalW;
  canvas.height = internalH;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0); 
}