/**
 * Gemini AI Client
 * Calls Google Gemini API directly from the browser using the user's API key.
 * Key is stored in localStorage.
 */

const STORAGE_KEY = 'gemini_api_key';
const GEMINI_MODEL = 'gemini-2.0-flash';

export function getGeminiApiKey() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setGeminiApiKey(key) {
  if (key) localStorage.setItem(STORAGE_KEY, key);
  else localStorage.removeItem(STORAGE_KEY);
}

export function hasGeminiApiKey() {
  return !!getGeminiApiKey();
}

/**
 * Call Gemini API.
 * @param {string} prompt - The prompt to send.
 * @param {object|null} responseSchema - Optional JSON schema for structured output.
 * @returns {Promise<string|object>} - Returns parsed object if schema provided, else string.
 */
export async function callGemini(prompt, responseSchema = null) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('No Gemini API key set. Please add your key in Settings.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const generationConfig = responseSchema
    ? {
        responseMimeType: 'application/json',
        responseSchema,
      }
    : { responseMimeType: 'text/plain' };

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message || `Gemini API error: ${res.status}`;
    throw new Error(message);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (responseSchema) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}