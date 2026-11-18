const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Pencatatan metrik AI Tutor ke backend/logs/chat-metrics.jsonl (satu baris JSON per permintaan).
 * Dipakai untuk mengukur Success Metrics di PRD:
 * - M-01: waktu respons ≤ 10 detik pada minimal 90% permintaan
 * - M-02: tingkat keberhasilan respons AI ≥ 95%
 * - M-03: persentase sesi yang memakai mode Uji Pemahamanku ≥ 30%
 *
 * Tidak ada isi pertanyaan/jawaban yang dicatat (privasi pengguna).
 */
const METRICS_FILE = path.join(config.logDir, 'chat-metrics.jsonl');
const TARGET_RESPONSE_MS = 10000;

try {
  fs.mkdirSync(config.logDir, { recursive: true });
} catch (err) {
  console.error('Warning: Failed to initialize metrics directory:', err.message);
}

/**
 * @param {{ mode: string, success: boolean, statusCode: number, durationMs: number,
 *           model?: string|null, sessionId?: string|null }} entry
 */
function record(entry) {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    mode: entry.mode,
    success: entry.success,
    statusCode: entry.statusCode,
    durationMs: Math.round(entry.durationMs),
    model: entry.model || null,
    sessionId: entry.sessionId || null,
  });
  fs.appendFile(METRICS_FILE, line + '\n', (err) => {
    if (err) console.error('Failed to write chat metrics:', err.message);
  });
}

function readEntries() {
  try {
    return fs
      .readFileSync(METRICS_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch (_) { return null; }
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : null);

/**
 * Ringkasan metrik untuk endpoint GET /api/chat/metrics
 */
function getSummary() {
  const entries = readEntries();
  const total = entries.length;
  const successes = entries.filter((e) => e.success);
  const durations = successes.map((e) => e.durationMs);

  const byMode = {};
  entries.forEach((e) => { byMode[e.mode] = (byMode[e.mode] || 0) + 1; });

  const sessions = new Set(entries.filter((e) => e.sessionId).map((e) => e.sessionId));
  const quizSessions = new Set(
    entries.filter((e) => e.sessionId && e.mode === 'quiz' && e.success).map((e) => e.sessionId)
  );

  return {
    totalRequests: total,
    responseTime: {
      // M-01
      target: `≤ ${TARGET_RESPONSE_MS / 1000} detik pada minimal 90% permintaan`,
      p50Ms: percentile(durations, 50),
      p90Ms: percentile(durations, 90),
      withinTargetPercent: pct(durations.filter((d) => d <= TARGET_RESPONSE_MS).length, durations.length),
    },
    successRate: {
      // M-02
      target: '≥ 95% dari seluruh permintaan',
      success: successes.length,
      failed: total - successes.length,
      percent: pct(successes.length, total),
    },
    quizUsage: {
      // M-03
      target: '≥ 30% dari seluruh sesi',
      sessions: sessions.size,
      sessionsWithQuiz: quizSessions.size,
      percent: pct(quizSessions.size, sessions.size),
    },
    requestsByMode: byMode,
  };
}

module.exports = { record, getSummary };
