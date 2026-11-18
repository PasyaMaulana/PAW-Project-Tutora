const gemini = require('../config/gemini');
const { DEFAULT_LEVELS, parseId } = require('../utils/format');
const { isPromptInjection, sanitizeMessage, BLOCKED_REPLY } = require('../utils/promptGuard');

/**
 * Mode permintaan ke AI Tutor:
 * - ask      : tanya jawab biasa (F-02)
 * - simplify : jelaskan ulang jawaban terakhir dengan lebih sederhana (F-05)
 * - example  : beri contoh konkret dari jawaban terakhir (F-06)
 * - quiz     : buat tepat 3 pertanyaan Uji Pemahamanku (F-03)
 * - evaluate : evaluasi 3 jawaban uji mahasiswa (F-03)
 */
const MODES = ['ask', 'simplify', 'example', 'quiz', 'evaluate'];
const MODES_NEED_ANSWER = ['simplify', 'example', 'quiz'];
const QUIZ_SIZE = 3;

const fail = (res, message) => res.status(400).json({ success: false, message });
const isBlank = (v) => v === undefined || v === null || v === '';

/**
 * Validasi riwayat percakapan yang dikirim frontend sebagai context.
 * Format: [{ role: 'user' | 'model', text: string }]
 * @returns {{ error?: string, history?: Array, injected?: boolean }}
 */
function validateHistory(history) {
  if (isBlank(history)) return { history: [] };
  if (!Array.isArray(history)) return { error: 'history harus berupa array' };

  // Hanya beberapa pesan terakhir yang dipakai agar prompt tetap ringkas
  const recent = history.slice(-gemini.limits.historyItems);
  const clean = [];

  for (const item of recent) {
    if (!item || !['user', 'model'].includes(item.role) || typeof item.text !== 'string') {
      return { error: 'Format history tidak valid. Gunakan [{ role: "user" | "model", text: string }]' };
    }
    const text = sanitizeMessage(item.text).slice(0, gemini.limits.historyTextLength);
    if (!text) continue;
    if (item.role === 'user' && isPromptInjection(text)) return { injected: true };
    clean.push({ role: item.role, text });
  }

  // Percakapan untuk Gemini harus diawali pesan pengguna
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return { history: clean };
}

/**
 * Validasi data Uji Pemahamanku untuk mode evaluate.
 * Format: { questions: [3 string], answers: [3 string] }
 */
function validateQuiz(quiz) {
  if (!quiz || !Array.isArray(quiz.questions) || !Array.isArray(quiz.answers)) {
    return { error: 'quiz wajib berisi questions dan answers' };
  }
  if (quiz.questions.length !== QUIZ_SIZE || quiz.answers.length !== QUIZ_SIZE) {
    return { error: `Uji Pemahamanku harus berisi tepat ${QUIZ_SIZE} pertanyaan dan ${QUIZ_SIZE} jawaban` };
  }

  const questions = [];
  const answers = [];
  for (let i = 0; i < QUIZ_SIZE; i++) {
    const q = typeof quiz.questions[i] === 'string' ? sanitizeMessage(quiz.questions[i]) : '';
    const a = typeof quiz.answers[i] === 'string' ? sanitizeMessage(quiz.answers[i]) : '';
    if (!q) return { error: `Pertanyaan nomor ${i + 1} tidak valid` };
    if (!a) return { error: `Jawaban nomor ${i + 1} tidak boleh kosong` };
    if (q.length > gemini.limits.quizQuestionLength) return { error: `Pertanyaan nomor ${i + 1} terlalu panjang` };
    if (a.length > gemini.limits.quizAnswerLength) {
      return { error: `Jawaban nomor ${i + 1} terlalu panjang, maksimal ${gemini.limits.quizAnswerLength} karakter` };
    }
    if (isPromptInjection(q) || isPromptInjection(a)) return { injected: true };
    questions.push(q);
    answers.push(a);
  }
  return { quiz: { questions, answers } };
}

/**
 * Middleware validasi input AI Tutor (defense in depth, F-04).
 * Body: {
 *   mode?: 'ask' | 'simplify' | 'example' | 'quiz' | 'evaluate'  (default: 'ask'),
 *   message?: string            (wajib untuk mode ask),
 *   topicId?: number, level?: 'Pemula' | 'Menengah' | 'Lanjut',
 *   history?: [{ role, text }],  (wajib berisi jawaban tutor untuk simplify/example/quiz)
 *   quiz?: { questions, answers } (wajib untuk mode evaluate),
 *   sessionId?: string           (id sesi dari browser, untuk metrik)
 * }
 */
module.exports = (req, res, next) => {
  const body = req.body || {};
  const mode = isBlank(body.mode) ? 'ask' : body.mode;

  if (!MODES.includes(mode)) {
    return fail(res, `mode harus salah satu dari: ${MODES.join(', ')}`);
  }

  if (!isBlank(body.topicId) && !parseId(body.topicId)) {
    return fail(res, 'topicId harus berupa bilangan bulat positif');
  }

  if (!isBlank(body.level) && !DEFAULT_LEVELS.includes(body.level)) {
    return fail(res, `level harus salah satu dari: ${DEFAULT_LEVELS.join(', ')}`);
  }

  if (!isBlank(body.sessionId) && !/^[a-zA-Z0-9-]{8,64}$/.test(String(body.sessionId))) {
    return fail(res, 'sessionId tidak valid');
  }

  // Pertanyaan pengguna (wajib untuk mode ask)
  let message = null;
  if (mode === 'ask') {
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return fail(res, 'Pesan tidak boleh kosong');
    }
    if (body.message.length > gemini.limits.messageLength) {
      return fail(res, `Pesan terlalu panjang, maksimal ${gemini.limits.messageLength} karakter`);
    }
    message = sanitizeMessage(body.message);
    if (!message) return fail(res, 'Pesan tidak boleh kosong');
  }

  const historyCheck = validateHistory(body.history);
  if (historyCheck.error) return fail(res, historyCheck.error);

  let quiz = null;
  if (mode === 'evaluate') {
    const quizCheck = validateQuiz(body.quiz);
    if (quizCheck.error) return fail(res, quizCheck.error);
    if (quizCheck.injected) historyCheck.injected = true;
    quiz = quizCheck.quiz;
  }

  // Prompt injection ditolak di backend tanpa memanggil Gemini sama sekali
  if (historyCheck.injected || (message && isPromptInjection(message))) {
    return res.json({
      success: true,
      data: { mode, reply: BLOCKED_REPLY, blocked: true },
    });
  }

  // Aksi lanjutan butuh jawaban tutor sebelumnya (US-03, US-04, US-05)
  if (MODES_NEED_ANSWER.includes(mode) && !historyCheck.history.some((h) => h.role === 'model')) {
    return fail(res, 'Aksi ini membutuhkan jawaban tutor sebelumnya. Ajukan pertanyaan terlebih dahulu.');
  }

  req.chat = {
    mode,
    message,
    topicId: parseId(body.topicId) || null,
    level: body.level || null,
    history: historyCheck.history,
    quiz,
    sessionId: body.sessionId || null,
  };
  next();
};

module.exports.MODES = MODES;
module.exports.QUIZ_SIZE = QUIZ_SIZE;
