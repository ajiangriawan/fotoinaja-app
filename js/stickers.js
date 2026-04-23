// stickers.js — Drag & Drop Sticker System

const STICKER_PACKS = {
  cute: [
    "🎀",
    "🌸",
    "💗",
    "🐱",
    "🐻",
    "🦋",
    "🌟",
    "💫",
    "🍭",
    "🎠",
    "🌈",
    "🦄",
    "🐼",
    "🐰",
    "🍓",
    "🌷",
  ],
  food: [
    "🍰",
    "🧁",
    "🍩",
    "🍪",
    "🍫",
    "🍦",
    "🧃",
    "🍑",
    "🍇",
    "🍓",
    "🥞",
    "🍮",
    "🧇",
    "🫶",
    "🍋",
    "🍬",
  ],
  nature: [
    "🌸",
    "🌺",
    "🌻",
    "🌿",
    "🍃",
    "🍂",
    "🌙",
    "⭐",
    "☁️",
    "🌊",
    "🔥",
    "❄️",
    "🌱",
    "🌾",
    "🍄",
    "🌴",
  ],
  emoji: [
    "😍",
    "🥰",
    "😊",
    "🤩",
    "😎",
    "🥳",
    "😇",
    "🤭",
    "😜",
    "🫣",
    "🥺",
    "😮",
    "🫧",
    "✨",
    "💯",
    "🔥",
  ],
  shape: [
    "❤️",
    "💖",
    "💝",
    "💘",
    "💕",
    "💞",
    "💟",
    "💋",
    "👑",
    "💎",
    "🏆",
    "🎯",
    "⚡",
    "🌀",
    "🎪",
    "🎭",
  ],
};

let dragState = {
  active: false,
  stickerEl: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
};

let selectedSticker = null;
let stickerResizing = false;

function loadStickers(category) {
  document
    .querySelectorAll(".sticker-cat")
    .forEach((b) => b.classList.remove("active"));
  event.target.classList.add("active");

  const grid = document.getElementById("stickerGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const stickers = STICKER_PACKS[category] || STICKER_PACKS.cute;
  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "sticker-btn";
    btn.textContent = emoji;
    btn.title = "Klik untuk tambah stiker";
    btn.onclick = () => addStickerToCanvas(emoji);
    grid.appendChild(btn);
  });
}

function addStickerToCanvas(emoji) {
  const layer = document.getElementById("stickerLayer");
  const container = document.getElementById("canvasContainer");
  if (!layer || !container) return;

  const containerRect = container.getBoundingClientRect();
  const canvasW = decorCanvas ? decorCanvas.offsetWidth : 500;
  const canvasH = decorCanvas ? decorCanvas.offsetHeight : 500;

  // Random position in center area
  const x = 30 + Math.random() * (canvasW - 100);
  const y = 30 + Math.random() * (canvasH - 100);
  const size = 40;

  const id = "sticker-" + Date.now();

  const el = document.createElement("div");
  el.className = "drag-sticker";
  el.id = id;
  el.textContent = emoji;
  el.style.left = x + "px";
  el.style.top = y + "px";
  el.style.fontSize = size + "px";

  // Delete button
  const delBtn = document.createElement("button");
  delBtn.className = "del-sticker";
  delBtn.textContent = "×";
  delBtn.onclick = (e) => {
    e.stopPropagation();
    removeSticker(id);
  };
  el.appendChild(delBtn);

  // Resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";
  resizeHandle.addEventListener("mousedown", (e) => startResizeSticker(e, el));
  resizeHandle.addEventListener(
    "touchstart",
    (e) => startResizeSticker(e, el),
    { passive: false },
  );
  el.appendChild(resizeHandle);

  // Drag events
  el.addEventListener("mousedown", (e) => {
    if (e.target === el) startDragSticker(e, el);
  });
  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.target === el) startDragSticker(e, el);
    },
    { passive: false },
  );
  el.addEventListener("click", () => selectSticker(el));

  layer.appendChild(el);

  // Track sticker state
  const stickerData = {
    id,
    emoji,
    x: x + size / 2,
    y: y + size / 2,
    size,
    el,
  };
  AppState.stickers.push(stickerData);
  AppState.history.push({ type: "addSticker", id });

  selectSticker(el);
}

function selectSticker(el) {
  if (selectedSticker) selectedSticker.classList.remove("selected");
  selectedSticker = el;
  el.classList.add("selected");
}

function removeSticker(id) {
  const idx = AppState.stickers.findIndex((s) => s.id === id);
  if (idx !== -1) {
    AppState.stickers.splice(idx, 1);
  }
  const el = document.getElementById(id);
  if (el) el.remove();
  selectedSticker = null;
}

function startDragSticker(e, el) {
  e.preventDefault();
  selectSticker(el);

  const touch = e.touches ? e.touches[0] : e;
  const rect = el.getBoundingClientRect();
  const container = document.getElementById("canvasContainer");
  const containerRect = container.getBoundingClientRect();

  dragState.active = true;
  dragState.stickerEl = el;
  dragState.offsetX = touch.clientX - rect.left;
  dragState.offsetY = touch.clientY - rect.top;

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("touchend", onDragEnd);
}

function onDragMove(e) {
  if (!dragState.active) return;
  e.preventDefault();

  const touch = e.touches ? e.touches[0] : e;
  const container = document.getElementById("canvasContainer");
  const containerRect = container.getBoundingClientRect();

  let x = touch.clientX - containerRect.left - dragState.offsetX;
  let y = touch.clientY - containerRect.top - dragState.offsetY;

  // Clamp to container
  // KODE BARU (Batas menyesuaikan ukuran stiker)
  // Clamp to container
  const size = parseInt(dragState.stickerEl.style.fontSize) || 40;
  x = Math.max(0, Math.min(containerRect.width - size, x));
  y = Math.max(0, Math.min(containerRect.height - size, y));

  dragState.stickerEl.style.left = x + "px";
  dragState.stickerEl.style.top = y + "px";

  // Update state
  const id = dragState.stickerEl.id;
  const sticker = AppState.stickers.find((s) => s.id === id);
  if (sticker) {
    const size = parseInt(dragState.stickerEl.style.fontSize) || 40;
    sticker.x = x + size / 2;
    sticker.y = y + size / 2;
  }
}

function onDragEnd() {
  dragState.active = false;
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("touchmove", onDragMove);
  document.removeEventListener("touchend", onDragEnd);
}

// Resize sticker
let resizeStart = { size: 40, x: 0, y: 0, el: null };

function startResizeSticker(e, el) {
  e.preventDefault();
  e.stopPropagation();
  stickerResizing = true;
  resizeStart.size = parseInt(el.style.fontSize) || 40;
  const touch = e.touches ? e.touches[0] : e;
  resizeStart.x = touch.clientX;
  resizeStart.y = touch.clientY;
  resizeStart.el = el;

  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
  document.addEventListener("touchmove", onResizeMove, { passive: false });
  document.addEventListener("touchend", onResizeEnd);
}

function onResizeMove(e) {
  if (!stickerResizing || !resizeStart.el) return;
  e.preventDefault();
  const touch = e.touches ? e.touches[0] : e;
  const dx = touch.clientX - resizeStart.x;
  const dy = touch.clientY - resizeStart.y;
  const delta = Math.max(dx, dy);
  const newSize = Math.max(20, Math.min(120, resizeStart.size + delta));
  resizeStart.el.style.fontSize = newSize + "px";

  const id = resizeStart.el.id;
  const sticker = AppState.stickers.find((s) => s.id === id);
  if (sticker) sticker.size = newSize;
}

function onResizeEnd() {
  stickerResizing = false;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
  document.removeEventListener("touchmove", onResizeMove);
  document.removeEventListener("touchend", onResizeEnd);
}

// Click outside to deselect
document.addEventListener("click", (e) => {
  if (selectedSticker && !selectedSticker.contains(e.target)) {
    selectedSticker.classList.remove("selected");
    selectedSticker = null;
  }
});

// Keyboard delete
document.addEventListener("keydown", (e) => {
  if ((e.key === "Delete" || e.key === "Backspace") && selectedSticker) {
    const id = selectedSticker.id;
    if (id.startsWith("sticker-")) removeSticker(id);
  }
});

// Init default stickers
function initStickerTab() {
  loadStickerCategory("cute");
}

function loadStickerCategory(cat) {
  const grid = document.getElementById("stickerGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const stickers = STICKER_PACKS[cat] || STICKER_PACKS.cute;
  stickers.forEach((emoji) => {
    const btn = document.createElement("button");
    btn.className = "sticker-btn";
    btn.textContent = emoji;
    btn.onclick = () => addStickerToCanvas(emoji);
    grid.appendChild(btn);
  });
}
