/**
 * storage.js — Capa de persistencia con localStorage
 * Gestiona ejercicios, sesiones y configuración
 */

const KEYS = {
  EXERCISES: 'gp_exercises',
  SESSIONS:  'gp_sessions',
  SETTINGS:  'gp_settings',
};

// ─── EJERCICIOS PRE-CARGADOS ─────────────────────────────
const DEFAULT_EXERCISES = [
  // PUSH
  { id: 'push-01', name: 'Press Banca',                 type: 'Push', category: 'Compuesto', muscle: 'Pecho' },
  { id: 'push-02', name: 'Press Inclinado Mancuernas',  type: 'Push', category: 'Compuesto', muscle: 'Pecho Superior' },
  { id: 'push-03', name: 'Press Hombro Barra',          type: 'Push', category: 'Compuesto', muscle: 'Hombro' },
  { id: 'push-04', name: 'Press Arnold',                type: 'Push', category: 'Compuesto', muscle: 'Hombro' },
  { id: 'push-05', name: 'Fondos',                      type: 'Push', category: 'Compuesto', muscle: 'Pecho/Tríceps' },
  { id: 'push-06', name: 'Extensión Tríceps Polea',     type: 'Push', category: 'Aislamiento', muscle: 'Tríceps' },
  { id: 'push-07', name: 'Press Francés',               type: 'Push', category: 'Aislamiento', muscle: 'Tríceps' },
  { id: 'push-08', name: 'Aperturas Cable',             type: 'Push', category: 'Aislamiento', muscle: 'Pecho' },
  { id: 'push-09', name: 'Elevaciones Laterales',       type: 'Push', category: 'Aislamiento', muscle: 'Hombro Lateral' },
  // PULL
  { id: 'pull-01', name: 'Dominadas',                   type: 'Pull', category: 'Compuesto', muscle: 'Dorsal/Bíceps' },
  { id: 'pull-02', name: 'Remo Barra',                  type: 'Pull', category: 'Compuesto', muscle: 'Dorsal/Romboides' },
  { id: 'pull-03', name: 'Remo Cable',                  type: 'Pull', category: 'Compuesto', muscle: 'Dorsal' },
  { id: 'pull-04', name: 'Jalón Polea',                 type: 'Pull', category: 'Compuesto', muscle: 'Dorsal' },
  { id: 'pull-05', name: 'Pullover',                    type: 'Pull', category: 'Aislamiento', muscle: 'Dorsal' },
  { id: 'pull-06', name: 'Curl Barra',                  type: 'Pull', category: 'Aislamiento', muscle: 'Bíceps' },
  { id: 'pull-07', name: 'Curl Mancuerna Alterno',      type: 'Pull', category: 'Aislamiento', muscle: 'Bíceps' },
  { id: 'pull-08', name: 'Curl Martillo',               type: 'Pull', category: 'Aislamiento', muscle: 'Bíceps/Braquial' },
  { id: 'pull-09', name: 'Face Pull',                   type: 'Pull', category: 'Aislamiento', muscle: 'Hombro Posterior' },
  { id: 'pull-10', name: 'Encogimientos Hombros',       type: 'Pull', category: 'Aislamiento', muscle: 'Trapecios' },
  // LEGS
  { id: 'legs-01', name: 'Sentadilla',                  type: 'Legs', category: 'Compuesto', muscle: 'Cuádriceps/Glúteo' },
  { id: 'legs-02', name: 'Prensa de Piernas',           type: 'Legs', category: 'Compuesto', muscle: 'Cuádriceps' },
  { id: 'legs-03', name: 'Peso Muerto Rumano',          type: 'Legs', category: 'Compuesto', muscle: 'Isquiotibiales/Glúteo' },
  { id: 'legs-04', name: 'Extensión Cuádriceps',        type: 'Legs', category: 'Aislamiento', muscle: 'Cuádriceps' },
  { id: 'legs-05', name: 'Curl Femoral Tumbado',        type: 'Legs', category: 'Aislamiento', muscle: 'Isquiotibiales' },
  { id: 'legs-06', name: 'Hip Thrust',                  type: 'Legs', category: 'Compuesto', muscle: 'Glúteo' },
  { id: 'legs-07', name: 'Elevación de Gemelos',        type: 'Legs', category: 'Aislamiento', muscle: 'Gemelos' },
  { id: 'legs-08', name: 'Zancadas',                    type: 'Legs', category: 'Compuesto', muscle: 'Cuádriceps/Glúteo' },
  { id: 'legs-09', name: 'Hack Squat',                  type: 'Legs', category: 'Compuesto', muscle: 'Cuádriceps' },
];

// ─── INICIALIZACIÓN ──────────────────────────────────────
function initStorage() {
  if (!localStorage.getItem(KEYS.EXERCISES)) {
    localStorage.setItem(KEYS.EXERCISES, JSON.stringify(DEFAULT_EXERCISES));
  }
  if (!localStorage.getItem(KEYS.SESSIONS)) {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify({
      nvidiaApiKey: '',
      unit: 'kg',
      repRangeMin: 8,
      repRangeMax: 12,
    }));
  }
}

// ─── EJERCICIOS ──────────────────────────────────────────
function getExercises() {
  return JSON.parse(localStorage.getItem(KEYS.EXERCISES) || '[]');
}

function getExerciseById(id) {
  return getExercises().find(e => e.id === id) || null;
}

function getExerciseByName(name) {
  return getExercises().find(e => e.name.toLowerCase() === name.toLowerCase()) || null;
}

function addExercise(exercise) {
  const exercises = getExercises();
  const newEx = {
    id: 'custom-' + Date.now(),
    name: exercise.name,
    type: exercise.type || 'Custom',
    category: exercise.category || 'Compuesto',
    muscle: exercise.muscle || '',
    custom: true,
  };
  exercises.push(newEx);
  localStorage.setItem(KEYS.EXERCISES, JSON.stringify(exercises));
  return newEx;
}

function deleteExercise(id) {
  const exercises = getExercises().filter(e => e.id !== id);
  localStorage.setItem(KEYS.EXERCISES, JSON.stringify(exercises));
}

// ─── SESIONES ────────────────────────────────────────────
function getSessions() {
  return JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]');
}

function getSessionById(id) {
  return getSessions().find(s => s.id === id) || null;
}

function saveSession(session) {
  const sessions = getSessions();
  const newSession = {
    id: 'session-' + Date.now(),
    date: new Date().toISOString(),
    type: session.type,
    exercises: session.exercises, // [{exerciseId, name, sets: [{weight, reps}]}]
    notes: session.notes || '',
  };
  sessions.unshift(newSession); // newest first
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  return newSession;
}

function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

/**
 * Obtiene el historial de un ejercicio específico
 * Devuelve sesiones con ese ejercicio, ordenadas de más antigua a más reciente
 */
function getExerciseHistory(exerciseName, limit = 10) {
  const sessions = getSessions();
  const history = [];

  for (const session of sessions) {
    const match = session.exercises.find(
      e => e.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (match) {
      history.push({
        date: session.date,
        sessionId: session.id,
        sessionType: session.type,
        sets: match.sets,
        totalVolume: calculateVolume(match.sets),
      });
    }
  }

  // De más antigua a más reciente para el algoritmo
  history.reverse();
  return history.slice(-limit);
}

// ─── CONFIGURACIÓN ───────────────────────────────────────
function getSettings() {
  return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
}

function saveSettings(settings) {
  const current = getSettings();
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

function getApiKey() {
  return getSettings().nvidiaApiKey || '';
}

// ─── ESTADÍSTICAS ────────────────────────────────────────
function getWeekStats() {
  const sessions = getSessions();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // lunes
  startOfWeek.setHours(0, 0, 0, 0);

  const weekSessions = sessions.filter(s => new Date(s.date) >= startOfWeek);
  const pushCount = weekSessions.filter(s => s.type === 'Push').length;
  const pullCount = weekSessions.filter(s => s.type === 'Pull').length;
  const legsCount = weekSessions.filter(s => s.type === 'Legs').length;

  return {
    total: weekSessions.length,
    push: pushCount,
    pull: pullCount,
    legs: legsCount,
    days: [...new Set(weekSessions.map(s => s.date.split('T')[0]))].length,
  };
}

function getTotalStats() {
  const sessions = getSessions();
  let totalVolume = 0;
  let totalSets = 0;
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalVolume += (set.weight || 0) * (set.reps || 0);
        totalSets++;
      });
    });
  });
  return {
    sessions: sessions.length,
    totalVolume,
    totalSets,
  };
}

// ─── UTILIDADES ──────────────────────────────────────────
function calculateVolume(sets) {
  return sets.reduce((acc, s) => acc + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateShort(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// ─── EXPORT / IMPORT ─────────────────────────────────────
function exportData() {
  const data = {
    exercises: getExercises(),
    sessions: getSessions(),
    settings: { ...getSettings(), nvidiaApiKey: '***' }, // no exportar la API key
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gym-progression-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    if (data.exercises) localStorage.setItem(KEYS.EXERCISES, JSON.stringify(data.exercises));
    if (data.sessions)  localStorage.setItem(KEYS.SESSIONS,  JSON.stringify(data.sessions));
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

function clearAllData() {
  localStorage.removeItem(KEYS.SESSIONS);
  localStorage.removeItem(KEYS.EXERCISES);
  localStorage.removeItem(KEYS.SETTINGS);
  initStorage();
}

// Init on load
initStorage();
