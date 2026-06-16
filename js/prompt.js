/**
 * prompt.js — Constructor de prompts para la IA
 * Transforma el historial del usuario en un contexto estructurado para OpenAI
 */

/**
 * Genera el prompt completo para una recomendación de sobrecarga progresiva
 * @param {string} exerciseName - Nombre del ejercicio
 * @param {Array}  history - Historial de sesiones con ese ejercicio
 * @param {Object} exerciseInfo - Datos del ejercicio (categoría, músculo, tipo)
 * @returns {string} Prompt listo para enviar a OpenAI
 */
function buildProgressionPrompt(exerciseName, history, exerciseInfo = {}) {
  const { category = 'Compuesto', muscle = '', type = '' } = exerciseInfo;
  const isIsolation = category === 'Aislamiento';
  const weightIncrement = isIsolation ? '1–1.25 kg' : '2.5 kg';

  // Formatear el historial
  let historyText = '';
  if (history.length === 0) {
    historyText = 'Sin historial previo. Este es el primer registro del ejercicio.';
  } else {
    historyText = history.map((session, index) => {
      const date = formatDateShort(session.date);
      const setsText = session.sets.map(s =>
        `${s.weight}kg×${s.reps}`
      ).join(', ');
      const vol = session.totalVolume.toFixed(0);
      return `  - Sesión ${index + 1} (${date}): [${setsText}] | Volumen total: ${vol} kg`;
    }).join('\n');
  }

  // Calcular tendencia de volumen
  let trendText = '';
  if (history.length >= 2) {
    const volumes = history.map(h => h.totalVolume);
    const lastVol = volumes[volumes.length - 1];
    const prevVol = volumes[volumes.length - 2];
    const change = ((lastVol - prevVol) / prevVol * 100).toFixed(1);
    const trend = lastVol > prevVol ? '📈 creciente' : lastVol < prevVol ? '📉 decreciente' : '➡️ estable';
    trendText = `\nTendencia última sesión vs anterior: ${trend} (${change > 0 ? '+' : ''}${change}%)`;

    // Detectar estancamiento
    if (history.length >= 3) {
      const last3 = volumes.slice(-3);
      const maxDiff = Math.max(...last3) - Math.min(...last3);
      const avgVol = last3.reduce((a, b) => a + b, 0) / 3;
      if (maxDiff / avgVol < 0.03) {
        trendText += '\n⚠️ POSIBLE ESTANCAMIENTO: Volumen casi idéntico en las últimas 3 sesiones.';
      }
    }
  }

  // Última sesión para referencia rápida
  let lastSessionRef = '';
  if (history.length > 0) {
    const last = history[history.length - 1];
    const weights = [...new Set(last.sets.map(s => s.weight))];
    const reps = last.sets.map(s => s.reps);
    const minReps = Math.min(...reps);
    const maxReps = Math.max(...reps);
    lastSessionRef = `\nÚltima sesión: ${weights.join('/')  } kg, reps por serie: ${last.sets.map(s => s.reps).join('-')}`;
  }

  return `Eres un entrenador personal experto en hipertrofia muscular y sobrecarga progresiva basada en evidencia científica.

CONTEXTO DEL USUARIO:
- Objetivo: Hipertrofia muscular
- Nivel: Avanzado (más de 3 años de entrenamiento)
- Split: Push/Pull/Legs, 6 días por semana
- Rango de repeticiones objetivo: 8-12 reps
- Series habituales: 2-3 por ejercicio
- Unidad de peso: kg
- Método de progresión preferido: automático basado en rendimiento histórico

EJERCICIO: ${exerciseName}
- Tipo: ${type || 'N/A'} | Categoría: ${category} | Músculo principal: ${muscle || 'N/A'}
- Incremento de peso recomendado para este tipo: ${weightIncrement}

HISTORIAL COMPLETO (de más antigua a más reciente):
${historyText}
${trendText}
${lastSessionRef}

INSTRUCCIONES PARA TU RECOMENDACIÓN:
1. Analiza la TENDENCIA del volumen total (kg × reps × series), no solo si llegó a X reps.
2. Si el volumen lleva creciendo consistentemente → propón subir peso.
3. Si el volumen bajó en la última sesión → puede ser fatiga puntual, mantén peso pero anímale.
4. Si el volumen lleva 3+ sesiones estancado → considera técnica de intensidad (serie extra, deload parcial, variante).
5. Si es la primera sesión → da una recomendación general de inicio basada en el tipo de ejercicio.
6. Sé específico: di exactamente qué peso usar y cuántas reps apuntar en cada serie.
7. Responde en español, de forma directa y motivadora, sin tecnicismos innecesarios.
8. Máximo 200 palabras. Formato: primero la recomendación concreta, luego la justificación breve.

RESPONDE AHORA:`;
}

/**
 * Versión simplificada para el historial de ejercicio en la página de ejercicios
 */
function buildExerciseInsightPrompt(exerciseName, history, exerciseInfo = {}) {
  const { category = 'Compuesto', muscle = '', type = '' } = exerciseInfo;

  let historyText = '';
  if (history.length === 0) {
    return null; // No hay historial suficiente
  } else {
    historyText = history.map((session, i) => {
      const date = formatDateShort(session.date);
      const setsText = session.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ');
      const vol = session.totalVolume.toFixed(0);
      return `  ${i + 1}. ${date}: [${setsText}] Volumen: ${vol} kg`;
    }).join('\n');
  }

  return `Eres un entrenador experto en hipertrofia.

Analiza este historial de "${exerciseName}" (${category}, ${muscle}) de un usuario avanzado:

${historyText}

Dame un análisis breve (máx 150 palabras) en español:
1. ¿Cómo ha evolucionado su rendimiento? ¿Hay una tendencia clara?
2. ¿Hay algún patrón preocupante (estancamiento, regresión)?
3. Una recomendación concreta para las próximas 2-3 sesiones.

Sé directo y específico.`;
}
