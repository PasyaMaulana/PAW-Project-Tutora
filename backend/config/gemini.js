const { GoogleGenAI } = require('@google/genai');
require('./index'); // Memastikan variabel .env sudah dimuat

// API Key HANYA dibaca dari .env di sisi server dan tidak pernah dikirim ke frontend
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY belum diset di file .env, fitur AI Tutor tidak akan berfungsi.');
}

// System Instruction hanya didukung di API versi v1beta (v1 menolak dengan error 400)
const ai = apiKey ? new GoogleGenAI({ apiKey, apiVersion: 'v1beta' }) : null;

const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
// Model cadangan dipakai otomatis jika model utama sibuk / timeout / tidak tersedia
const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';

module.exports = {
  ai,
  isConfigured: Boolean(apiKey),
  model,
  fallbackModel: fallbackModel !== model ? fallbackModel : null,
  generation: {
    temperature: 0.4,       // Rendah agar jawaban konsisten dan tidak "berimajinasi"
    maxOutputTokens: 2048,  // Membatasi panjang jawaban (cukup untuk penjelasan + JSON uji)
  },
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 15000, // Batas waktu per percobaan model

  // Batasan input (F-04: validasi)
  limits: {
    messageLength: 1000,       // Panjang maksimal pertanyaan
    historyItems: 10,          // Jumlah maksimal pesan riwayat yang dikirim sebagai context
    historyTextLength: 6000,   // Panjang maksimal satu pesan riwayat
    quizQuestionLength: 400,   // Panjang maksimal satu pertanyaan uji
    quizAnswerLength: 600,     // Panjang maksimal satu jawaban uji
  },

  // Rate limiter (F-04: melindungi kuota API)
  rateLimit: {
    windowMs: 60 * 1000,
    max: Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE) || 10,
  },
};
