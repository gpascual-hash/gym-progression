/**
 * gemini.js — Integración con Google Gemini API
 * Gestiona las llamadas a la API y el manejo de errores
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL    = 'gemini-1.5-flash-latest';

/**
 * Llama a la API de Gemini con un prompt
 * @param {string} prompt - El prompt a enviar
 * @param {string} apiKey - La clave de API de Google Gemini
 * @returns {Promise<string>} La respuesta de la IA
 */
async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;

    if (response.status === 400) throw new Error(`API_BAD_REQUEST: ${errorMsg}`);
    if (response.status === 401 || response.status === 403) throw new Error('API_INVALID_KEY');
    if (response.status === 429) throw new Error('API_RATE_LIMIT');
    if (response.status >= 500) throw new Error('API_SERVER_ERROR');

    throw new Error(`API_ERROR: ${errorMsg}`);
  }

  const data = await response.json();

  // Extraer el texto de la respuesta
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('API_EMPTY_RESPONSE');
  }

  return text.trim();
}

/**
 * Genera una recomendación de sobrecarga progresiva para un ejercicio
 * @param {string} exerciseName - Nombre del ejercicio
 * @param {Array}  history - Historial de sesiones
 * @param {Object} exerciseInfo - Datos adicionales del ejercicio
 * @returns {Promise<string>} Recomendación de la IA
 */
async function getProgressionRecommendation(exerciseName, history, exerciseInfo = {}) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null; // Sin API key → retorna null para mostrar el aviso en la UI
  }

  const prompt = buildProgressionPrompt(exerciseName, history, exerciseInfo);
  return await callGemini(prompt, apiKey);
}

/**
 * Genera un análisis del historial de un ejercicio
 */
async function getExerciseInsight(exerciseName, history, exerciseInfo = {}) {
  const apiKey = getApiKey();
  if (!apiKey || history.length < 2) return null;

  const prompt = buildExerciseInsightPrompt(exerciseName, history, exerciseInfo);
  if (!prompt) return null;

  return await callGemini(prompt, apiKey);
}

/**
 * Test de conexión con la API
 * @param {string} apiKey - Clave a probar
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function testApiConnection(apiKey) {
  try {
    const result = await callGemini(
      'Responde solo con "OK" si estás funcionando correctamente.',
      apiKey
    );
    return { ok: true, message: 'Conexión exitosa con Gemini ✓' };
  } catch (err) {
    let message = 'Error de conexión desconocido';
    if (err.message === 'API_INVALID_KEY') {
      message = 'API Key inválida. Verifica que sea correcta.';
    } else if (err.message === 'API_RATE_LIMIT') {
      message = 'Límite de peticiones alcanzado. Intenta en unos minutos.';
    } else if (err.message === 'API_SERVER_ERROR') {
      message = 'Error en los servidores de Google. Intenta más tarde.';
    } else if (err.message.includes('fetch')) {
      message = 'Sin conexión a internet.';
    } else {
      message = err.message;
    }
    return { ok: false, message };
  }
}

/**
 * Traduce códigos de error a mensajes amigables en español
 */
function getErrorMessage(errorCode) {
  const messages = {
    'NO_API_KEY':         'No tienes configurada una API Key. Ve a Configuración para añadirla.',
    'API_INVALID_KEY':    'Tu API Key no es válida. Verifica en la configuración.',
    'API_RATE_LIMIT':     'Has superado el límite de peticiones. Espera unos minutos.',
    'API_SERVER_ERROR':   'Error en los servidores de Google. Intenta de nuevo.',
    'API_EMPTY_RESPONSE': 'La IA no generó respuesta. Intenta de nuevo.',
    'API_BAD_REQUEST':    'Error en la solicitud. El historial puede estar vacío.',
  };
  for (const [key, msg] of Object.entries(messages)) {
    if (errorCode.includes(key)) return msg;
  }
  return 'Error al contactar con la IA. Intenta de nuevo.';
}
