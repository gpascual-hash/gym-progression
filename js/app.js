const STORAGE_KEY = 'gymagotchi_data';

// Definition of stages based on user feedback
const STAGES = [
  { id: 1, name: 'Egg', threshold: 0, image: 'img/tamagotchi/stage_1.png', isImage: true, skull: '🥚' },
  { id: 2, name: 'Baby Orc', threshold: 20, image: 'img/tamagotchi/stage_2.png', isImage: true, skull: '💀' },
  { id: 3, name: 'Teen Orc', threshold: 50, image: '🧌', isImage: false, skull: '☠️' },
  { id: 4, name: 'Orc Warrior', threshold: 100, image: '🦍', isImage: false, skull: '🦴' },
  { id: 5, name: 'Super Saiyan Orc', threshold: 200, image: '👹', isImage: false, skull: '👿' }
];

// Initialize or load state
let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
  volume: 0, // in tons
  trophies: [] // { month: '2026-06', skull: '☠️', name: 'Teen Orc', volume: 50 }
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Check if a new month has started automatically
function checkMonth() {
  const actualMonth = new Date().toISOString().slice(0, 7);
  if (state.currentMonth !== actualMonth) {
    endMonth(actualMonth);
  }
}

function endMonth(newMonth = new Date().toISOString().slice(0, 7)) {
  const currentStage = getStage(state.volume);
  
  // Award trophy if they lifted anything
  if (state.volume > 0) {
    state.trophies.push({
      month: state.currentMonth,
      skull: currentStage.skull,
      name: currentStage.name,
      volume: state.volume
    });
  }

  // Reset for new month
  state.currentMonth = newMonth;
  state.volume = 0;
  saveState();
  updateUI();
}

function getStage(volumeTons) {
  let current = STAGES[0];
  for (let i = 1; i < STAGES.length; i++) {
    if (volumeTons >= STAGES[i].threshold) {
      current = STAGES[i];
    }
  }
  return current;
}

function getNextStage(volumeTons) {
  for (let i = 1; i < STAGES.length; i++) {
    if (volumeTons < STAGES[i].threshold) {
      return STAGES[i];
    }
  }
  return null; // Max level reached
}

// UI Updates
function updateUI() {
  const stage = getStage(state.volume);
  const nextStage = getNextStage(state.volume);

  // Update image/emoji
  const monsterContainer = document.getElementById('monster-container');
  if (stage.isImage) {
    monsterContainer.innerHTML = `<img src="${stage.image}" class="monster-img" alt="${stage.name}">`;
  } else {
    monsterContainer.innerHTML = `<div class="monster-emoji">${stage.image}</div>`;
  }

  // Update labels
  document.getElementById('level-name').innerText = stage.name;
  document.getElementById('current-volume').innerText = `Mensual: ${state.volume.toFixed(1)} t`;

  // Update progress bar
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  if (nextStage) {
    const prevThreshold = stage.threshold;
    const range = nextStage.threshold - prevThreshold;
    const progress = state.volume - prevThreshold;
    const percent = Math.min(100, Math.max(0, (progress / range) * 100));
    
    progressBar.style.width = `${percent}%`;
    progressText.innerText = `${state.volume.toFixed(1)}t / ${nextStage.threshold}t para el siguiente nivel`;
  } else {
    progressBar.style.width = `100%`;
    progressText.innerText = `¡Nivel máximo alcanzado!`;
  }

  renderTrophies();
}

function renderTrophies() {
  const container = document.getElementById('trophy-grid');
  if (state.trophies.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;text-align:center;">Aún no tienes trofeos. ¡Termina tu primer mes!</div>';
    return;
  }

  container.innerHTML = state.trophies.map(t => `
    <div class="trophy-card">
      <div class="skull-emoji">${t.skull}</div>
      <div style="font-size:0.8rem;font-weight:bold;">${t.name}</div>
      <div class="trophy-month">${t.month}</div>
      <div class="trophy-month">${t.volume.toFixed(1)}t</div>
    </div>
  `).join('');
}

// Event Listeners
document.getElementById('feed-btn').addEventListener('click', () => {
  const input = document.getElementById('volume-input');
  const amount = parseFloat(input.value);
  if (!isNaN(amount) && amount > 0) {
    state.volume += amount;
    saveState();
    updateUI();
    input.value = '';
    
    // Add small animation feedback
    const monster = document.getElementById('monster-container');
    monster.style.transform = 'scale(1.2)';
    setTimeout(() => monster.style.transform = 'scale(1)', 200);
  }
});

document.getElementById('end-month-btn').addEventListener('click', () => {
  // Simulate end of month by advancing current month for testing
  const parts = state.currentMonth.split('-');
  let y = parseInt(parts[0]);
  let m = parseInt(parts[1]) + 1;
  if (m > 12) { m = 1; y++; }
  const newMonth = `${y}-${m.toString().padStart(2, '0')}`;
  endMonth(newMonth);
});

// Init
checkMonth();
updateUI();
