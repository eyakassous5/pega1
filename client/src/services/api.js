import axios from 'axios';

/**
 * API service for communicating with the LST Interpreter backend.
 * In development, Vite proxies /api to localhost:3001.
 */

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Translate text to sign language animation sequence
 * @param {string} text - The text to translate
 * @returns {Promise<{original, tokens, signs, unknownWords, totalDuration}>}
 */
export async function translateText(text) {
  const { data } = await api.post('/translate', { text });
  return data;
}

/**
 * Fetch the full sign language dictionary
 * @returns {Promise<{count, signs}>}
 */
export async function fetchDictionary() {
  const { data } = await api.get('/dictionary');
  return data;
}

/**
 * Fetch available categories
 * @returns {Promise<{categories: string[]}>}
 */
export async function fetchCategories() {
  const { data } = await api.get('/dictionary/categories');
  return data;
}

/**
 * Search the dictionary
 * @param {string} query
 * @returns {Promise<{query, results}>}
 */
export async function searchDictionary(query) {
  const { data } = await api.get('/dictionary/search', { params: { q: query } });
  return data;
}

/**
 * Health check
 */
export async function healthCheck() {
  const { data } = await api.get('/health');
  return data;
}

export default api;
