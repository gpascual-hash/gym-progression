/**
 * charts.js — Gráficas de progresión con Canvas nativo
 * Sin dependencias externas
 */

/**
 * Dibuja una gráfica de línea del volumen total por sesión
 * @param {HTMLCanvasElement} canvas
 * @param {Array} history - Array de {date, totalVolume}
 * @param {string} color - Color de la línea (hex o rgb)
 */
function drawVolumeChart(canvas, history, color = '#f97316') {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  const PAD = { top: 20, right: 20, bottom: 40, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  ctx.clearRect(0, 0, W, H);

  if (!history || history.length === 0) {
    ctx.fillStyle = 'rgba(148,163,184,0.3)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos suficientes', W / 2, H / 2);
    return;
  }

  const volumes = history.map(h => h.totalVolume);
  const dates   = history.map(h => formatDateShort(h.date));
  const maxVol  = Math.max(...volumes) * 1.15 || 100;
  const minVol  = Math.max(0, Math.min(...volumes) * 0.85);

  const toX = i => PAD.left + (i / (history.length - 1 || 1)) * plotW;
  const toY = v => PAD.top + plotH - ((v - minVol) / (maxVol - minVol)) * plotH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = PAD.top + (i / gridLines) * plotH;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + plotW, y);
    ctx.stroke();

    // Y labels
    const val = maxVol - (i / gridLines) * (maxVol - minVol);
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(0), PAD.left - 8, y + 4);
  }

  if (history.length === 1) {
    // Solo un punto
    const x = toX(0);
    const y = toY(volumes[0]);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dates[0], x, H - PAD.bottom + 16);
    return;
  }

  // Gradient fill under the line
  const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
  gradient.addColorStop(0, hexToRgba(color, 0.35));
  gradient.addColorStop(1, hexToRgba(color, 0.0));

  ctx.beginPath();
  ctx.moveTo(toX(0), toY(volumes[0]));
  for (let i = 1; i < history.length; i++) {
    const x0 = toX(i - 1), y0 = toY(volumes[i - 1]);
    const x1 = toX(i),     y1 = toY(volumes[i]);
    const cpX = (x0 + x1) / 2;
    ctx.bezierCurveTo(cpX, y0, cpX, y1, x1, y1);
  }
  ctx.lineTo(toX(history.length - 1), PAD.top + plotH);
  ctx.lineTo(toX(0), PAD.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(toX(0), toY(volumes[0]));
  for (let i = 1; i < history.length; i++) {
    const x0 = toX(i - 1), y0 = toY(volumes[i - 1]);
    const x1 = toX(i),     y1 = toY(volumes[i]);
    const cpX = (x0 + x1) / 2;
    ctx.bezierCurveTo(cpX, y0, cpX, y1, x1, y1);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Points and X labels
  history.forEach((h, i) => {
    const x = toX(i);
    const y = toY(volumes[i]);

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, 0.2);
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // X label (show every N labels to avoid crowding)
    const step = Math.ceil(history.length / 6);
    if (i % step === 0 || i === history.length - 1) {
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dates[i], x, H - PAD.bottom + 16);
    }
  });
}

/**
 * Mini gráfica de barras para el dashboard (sesiones por tipo)
 */
function drawWeekBarChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const colors = {
    Push: '#f97316',
    Pull: '#8b5cf6',
    Legs: '#06b6d4',
    Custom: '#22c55e',
  };

  const barW = (W - 20) / days.length;
  const maxH = H - 30;

  days.forEach((day, i) => {
    const x = 10 + i * barW;
    const sessions = data[i] || [];

    if (sessions.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(x + 4, H - 24, barW - 8, 4, 2);
      ctx.fill();
    } else {
      const barH = Math.min(maxH, sessions.length * 28);
      const color = colors[sessions[0].type] || '#f97316';
      ctx.fillStyle = hexToRgba(color, 0.7);
      ctx.beginPath();
      ctx.roundRect(x + 4, H - 24 - barH, barW - 8, barH, 4);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(day, x + barW / 2, H - 6);
  });
}

// ─── UTILIDADES ──────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Inicializa un tooltip hover en la gráfica de volumen
 */
function addChartTooltip(canvas, history, color = '#f97316') {
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(17,17,24,0.95);
    border: 1px solid rgba(249,115,22,0.3);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    color: #f8fafc;
    pointer-events: none;
    display: none;
    z-index: 10;
    font-family: Inter, sans-serif;
    white-space: nowrap;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  canvas.parentElement.style.position = 'relative';
  canvas.parentElement.appendChild(tooltip);

  canvas.addEventListener('mousemove', (e) => {
    if (!history || history.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const PAD = { left: 55, right: 20, top: 20, bottom: 40 };
    const plotW = rect.width - PAD.left - PAD.right;
    const mouseX = e.clientX - rect.left - PAD.left;
    const i = Math.round((mouseX / plotW) * (history.length - 1));

    if (i >= 0 && i < history.length) {
      const h = history[i];
      tooltip.style.display = 'block';
      tooltip.style.left = `${e.clientX - rect.left + 12}px`;
      tooltip.style.top  = `${e.clientY - rect.top  - 30}px`;
      tooltip.innerHTML = `
        <strong>${formatDateShort(h.date)}</strong><br>
        Volumen: <span style="color:${color}">${h.totalVolume.toFixed(0)} kg</span><br>
        Series: ${h.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}
      `;
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });
}
