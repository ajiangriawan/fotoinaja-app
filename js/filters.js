// filters.js — AI Filter & Image Processing System (Optimized)

function applyFilter(filterName) {
  AppState.appliedFilter = filterName;
  document.querySelectorAll('.filter-item').forEach(el => {
    el.classList.toggle('active', el.dataset.filter === filterName);
  });
  // Menggunakan requestAnimationFrame agar rendering lebih mulus
  requestAnimationFrame(updateDecorCanvas);
}

function updateBeauty(val) {
  AppState.beautySetting = parseInt(val);
  document.getElementById('beautyVal').textContent = val;
  requestAnimationFrame(updateDecorCanvas);
}

function updateBrightness(val) {
  AppState.brightnessSetting = parseInt(val);
  document.getElementById('brightVal').textContent = val;
  requestAnimationFrame(updateDecorCanvas);
}

function updateSaturation(val) {
  AppState.saturationSetting = parseInt(val);
  document.getElementById('satVal').textContent = val;
  requestAnimationFrame(updateDecorCanvas);
}
// AI Beauty Filter using CSS + Canvas manipulation
// (In production, you'd call a real AI API like Clarifai or AWS Rekognition)
function applyAIBeautyFilter(imageData, strength) {
  const data = imageData.data;
  const s = strength / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];

    // Skin tone detection (simplified)
    const isSkin = r > 95 && g > 40 && b > 20 &&
                   (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
                   Math.abs(r - g) > 15 && r > g && r > b;

    if (isSkin) {
      // Smooth & brighten skin tones
      data[i]   = Math.min(255, r + 10 * s);
      data[i+1] = Math.min(255, g + 6 * s);
      data[i+2] = Math.min(255, b + 3 * s);
    }
  }
  return imageData;
}

// Gaussian blur simulation for soft filter
function applyGaussianBlur(imageData, radius) {
  // Simplified box blur
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const r = Math.ceil(radius);

  const copy = new Uint8ClampedArray(data);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = Math.min(w-1, Math.max(0, x + dx));
          const ny = Math.min(h-1, Math.max(0, y + dy));
          const idx = (ny * w + nx) * 4;
          rSum += copy[idx]; gSum += copy[idx+1]; bSum += copy[idx+2];
          count++;
        }
      }
      const i = (y * w + x) * 4;
      data[i] = rSum / count;
      data[i+1] = gSum / count;
      data[i+2] = bSum / count;
    }
  }
  return imageData;
}

// Vintage effect
function applyVintageEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // Add warm sepia-like tint
    data[i]   = Math.min(255, r * 0.9 + g * 0.15 + b * 0.05 + 20);
    data[i+1] = Math.min(255, r * 0.1 + g * 0.85 + b * 0.05 + 5);
    data[i+2] = Math.min(255, r * 0.05 + g * 0.1 + b * 0.7);
  }
  return imageData;
}

// B&W effect
function applyBWEffect(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    data[i] = data[i+1] = data[i+2] = avg;
  }
  return imageData;
}

// Get CSS filter string for preview
function getCSSFilter(filterName, brightness, saturation, beauty) {
  switch (filterName) {
    case 'none':
      return `brightness(${1 + brightness/100}) saturate(${saturation}%)`;
    case 'beauty':
      return `brightness(${1.1 + brightness/100}) saturate(${saturation * 1.1}%) contrast(0.95)`;
    case 'warm':
      return `brightness(${1.05 + brightness/100}) saturate(${saturation * 1.2}%) sepia(0.2) hue-rotate(-10deg)`;
    case 'cool':
      return `brightness(${1 + brightness/100}) saturate(${saturation * 0.9}%) hue-rotate(30deg)`;
    case 'vintage':
      return `brightness(${0.95 + brightness/100}) saturate(${saturation * 0.7}%) sepia(0.4) contrast(1.1)`;
    case 'vivid':
      return `brightness(${1.05 + brightness/100}) saturate(${saturation * 1.5}%) contrast(1.1)`;
    case 'mono':
      return `brightness(${1 + brightness/100}) saturate(0%) contrast(1.2)`;
    case 'soft':
      return `brightness(${1.05 + brightness/100}) saturate(${saturation * 0.9}%) blur(0.5px)`;
    default:
      return '';
  }
}
