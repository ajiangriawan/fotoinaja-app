// themes.js — FotoinAja Theme & Layout System

const THEMES = {
  kawaii: {
    name: 'Kawaii Gemoy',
    bg: '#ffecf5',
    frameColor: '#ff6b9d',
    accentColor: '#ffb3d1',
    textColor: '#ff4d8f',
    borderStyle: 'solid',
    borderWidth: 8,
    cornerRadius: 14,
    overlayEmoji: ['🎀', '🌸', '💗', '⭐', '🍭', '🦋'],
    pattern: 'dots',
    patternColor: 'rgba(255,107,157,0.12)',
    gradient: ['#ffecf5', '#ffe0ef', '#ffd4e8'],
    fontFamily: 'Pacifico',
    labelText: '💗 kawaii 💗',
    labelBg: '#ff6b9d',
    labelTextColor: '#fff'
  },
  y2k: {
    name: 'Y2K Retro',
    bg: '#e8e8e8',
    frameColor: '#b8b8b8',
    accentColor: '#ffd700',
    textColor: '#333',
    borderStyle: 'double',
    borderWidth: 7,
    cornerRadius: 2,
    overlayEmoji: ['⭐', '💫', '🌟', '✨', '🦋', '💎'],
    pattern: 'grid',
    patternColor: 'rgba(180,180,180,0.3)',
    gradient: ['#e0e0e0', '#d0d0d0', '#c8c8c8'],
    fontFamily: 'Space Mono',
    labelText: '★ Y2K RETRO ★',
    labelBg: '#c0c0c0',
    labelTextColor: '#1a1a1a'
  },
  pastel: {
    name: 'Korean Pastel',
    bg: '#fff0f7',
    frameColor: '#b8e0f7',
    accentColor: '#ffd6e7',
    textColor: '#6b8dd6',
    borderStyle: 'solid',
    borderWidth: 6,
    cornerRadius: 12,
    overlayEmoji: ['🌸', '🌷', '💙', '☁️', '🌿', '🕊️'],
    pattern: 'stripes',
    patternColor: 'rgba(184,224,247,0.2)',
    gradient: ['#fff0f7', '#f0f8ff', '#f7f0ff'],
    fontFamily: 'DM Sans',
    labelText: '🌸 K-Aesthetic 🌸',
    labelBg: '#b8e0f7',
    labelTextColor: '#4a7fb5'
  },
  dark: {
    name: 'Dark Academia',
    bg: '#2c2415',
    frameColor: '#8b7355',
    accentColor: '#d4a853',
    textColor: '#e8d5b0',
    borderStyle: 'solid',
    borderWidth: 8,
    cornerRadius: 6,
    overlayEmoji: ['🌙', '📚', '🕯️', '🦉', '☕', '🍂'],
    pattern: 'vintage',
    patternColor: 'rgba(212,168,83,0.08)',
    gradient: ['#2c2415', '#1a1a0f', '#3d3020'],
    fontFamily: 'DM Sans',
    labelText: '📚 Dark Academia 📚',
    labelBg: '#8b7355',
    labelTextColor: '#f0e6c8'
  },
  gaming: {
    name: 'Gaming Neon',
    bg: '#0d0d1a',
    frameColor: '#39ff14',
    accentColor: '#ff00ff',
    textColor: '#39ff14',
    borderStyle: 'solid',
    borderWidth: 3,
    cornerRadius: 0,
    overlayEmoji: ['🎮', '⚡', '💀', '🕹️', '🔥', '👾'],
    pattern: 'circuit',
    patternColor: 'rgba(57,255,20,0.05)',
    gradient: ['#0d0d1a', '#0a0a15', '#001a00'],
    fontFamily: 'Space Mono',
    labelText: '⚡ GAMING MODE ⚡',
    labelBg: '#0d0d1a',
    labelTextColor: '#39ff14',
    neonGlow: '#39ff14'
  },
  flower: {
    name: 'Cottagecore',
    bg: '#f0f7e8',
    frameColor: '#a8d5a2',
    accentColor: '#f8c8d4',
    textColor: '#4a7c59',
    borderStyle: 'solid',
    borderWidth: 6,
    cornerRadius: 12,
    overlayEmoji: ['🌻', '🌿', '🍃', '🌼', '🌱', '🦋'],
    pattern: 'floral',
    patternColor: 'rgba(168,213,162,0.15)',
    gradient: ['#f0f7e8', '#e8f5e0', '#f7f0e8'],
    fontFamily: 'Pacifico',
    labelText: '🌿 Cottagecore 🌿',
    labelBg: '#a8d5a2',
    labelTextColor: '#2d5a37'
  },
  sunset: {
    name: 'Sunset Vibes',
    bg: '#1a0a2e',
    frameColor: '#ff6b35',
    accentColor: '#ff9f43',
    textColor: '#ffe066',
    borderStyle: 'solid',
    borderWidth: 5,
    cornerRadius: 10,
    overlayEmoji: ['🌅', '🔥', '✨', '🌙', '⭐', '🌴'],
    pattern: 'dots',
    patternColor: 'rgba(255,107,53,0.08)',
    gradient: ['#1a0a2e', '#2d1b4e', '#3d1a0a'],
    fontFamily: 'Pacifico',
    labelText: '🌅 Sunset Vibes 🌅',
    labelBg: '#ff6b35',
    labelTextColor: '#fff'
  },
  minimal: {
    name: 'Clean Minimal',
    bg: '#fafafa',
    frameColor: '#222222',
    accentColor: '#555555',
    textColor: '#111111',
    borderStyle: 'solid',
    borderWidth: 3,
    cornerRadius: 0,
    overlayEmoji: ['◆', '○', '△', '◇', '●', '□'],
    pattern: 'none',
    patternColor: 'rgba(0,0,0,0)',
    gradient: ['#fafafa', '#f0f0f0', '#ffffff'],
    fontFamily: 'DM Sans',
    labelText: 'FOTOINAJA',
    labelBg: '#222222',
    labelTextColor: '#ffffff'
  }
};

// js/themes.js (Bagian Bawah)

const LAYOUTS = {
  single:   { name: 'Single',      frames: 1, cols: 1, rows: 1,  price: 2000,  aspect: 1 },
  polaroid: { name: 'Polaroid',    frames: 1, cols: 1, rows: 1,  price: 3000,  aspect: 0.85, special: 'polaroid' },
  strip2:   { name: 'Strip 2',     frames: 2, cols: 1, rows: 2,  price: 4000,  aspect: 0.45 },
  strip3:   { name: 'Strip 3',     frames: 3, cols: 1, rows: 3,  price: 5000,  aspect: 0.32 },
  strip4:   { name: 'Strip 4',     frames: 4, cols: 1, rows: 4,  price: 6000,  aspect: 0.28 },
  strip6:   { name: 'Strip 6',     frames: 6, cols: 1, rows: 6,  price: 8000,  aspect: 0.2  },
  grid4:    { name: 'Grid 2×2',    frames: 4, cols: 2, rows: 2,  price: 6000,  aspect: 1    },
  grid6:    { name: 'Grid 2×3',    frames: 6, cols: 2, rows: 3,  price: 8000,  aspect: 0.7  },
  grid9:    { name: 'Grid 3×3',    frames: 9, cols: 3, rows: 3,  price: 10000, aspect: 1    },
  triptych: { name: 'Triptych',    frames: 3, cols: 3, rows: 1,  price: 7000,  aspect: 2.8  },
  collage5: { name: 'Collage 5',   frames: 5, cols: 2, rows: 3,  price: 9000,  aspect: 0.75, special: 'collage5' },
};

// Catatan: Kode HEMAT5K saya ubah jadi HEMAT1K agar tidak rugi/minus saat beli paket 2000
const PROMO_CODES = {
  // 'SNAPGRATIS':  { discount: 1.0,   type: 'percent', label: 'Gratis 100%! 🎉' },
  // 'DISKON50':    { discount: 0.5,   type: 'percent', label: '50% Diskon!' },
  // 'DISKON20':    { discount: 0.2,   type: 'percent', label: '20% Diskon!' },
  // 'HEMAT1K':     { discount: 1000,  type: 'fixed',   label: 'Hemat Rp 1.000!' }, 
  // 'TEMAN10':     { discount: 0.1,   type: 'percent', label: '10% Diskon Teman!' },
  // 'INFLUENCER':  { discount: 1.0,   type: 'percent', label: 'Influencer Free! ✨' },
  // 'SNAPLAUNCH':  { discount: 0.3,   type: 'percent', label: '30% Launch Promo!' }
};

// Global AppState
window.AppState = {
  uploadedFiles:      [],
  uploadedImages:     [],
  currentTheme:       'kawaii',
  currentLayout:      'single',
  appliedFilter:      'none',
  beautySetting:      0,
  brightnessSetting:  0,
  saturationSetting:  100,
  stickers:           [],
  textElements:       [],
  promoCode:          null,
  basePrice:          2000, // <--- Ubah default jadi 2000
  finalPrice:         2000, // <--- Ubah default jadi 2000
  paymentToken:       null,
  history:            [],
  selectedPhotoIndex: 0
};

function selectThemeAndGo(theme) {
  AppState.currentTheme = theme;
  scrollToSection('booth');
  setTimeout(() => goToStep(2), 300);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
