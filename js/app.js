/**
 * app.js — Lógica global, navegación y utilidades de UI
 */

// ─── NAVEGACIÓN ACTIVA ───────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) item.classList.add('active');
  });
}

// ─── TOASTS ──────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ─── MODAL ───────────────────────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ─── FORMATEAR FECHA LEGIBLE ─────────────────────────────
function formatDateReadable(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7)  return `Hace ${diff} días`;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
}

// ─── TIPO DE SESIÓN → COLOR / BADGE ─────────────────────
function getTypeBadge(type) {
  const map = {
    Push:   '<span class="badge badge-push">Push</span>',
    Pull:   '<span class="badge badge-pull">Pull</span>',
    Legs:   '<span class="badge badge-legs">Legs</span>',
    Custom: '<span class="badge badge-custom">Custom</span>',
  };
  return map[type] || `<span class="badge">${type}</span>`;
}

function getTypeColor(type) {
  const map = { Push: '#f97316', Pull: '#8b5cf6', Legs: '#06b6d4', Custom: '#22c55e' };
  return map[type] || '#f97316';
}

// ─── ANIMATE IN ──────────────────────────────────────────
function animateIn(elements) {
  (elements || document.querySelectorAll('.animate-in')).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 60);
  });
}

// ─── CONFIRMAR BORRADO ───────────────────────────────────
function confirmDelete(message, onConfirm) {
  const overlay = document.getElementById('confirm-modal');
  if (!overlay) return onConfirm(); // fallback si no hay modal
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-btn').onclick = () => {
    closeModal('confirm-modal');
    onConfirm();
  };
  openModal('confirm-modal');
}

// ─── INIT GLOBAL ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  animateIn();
});
