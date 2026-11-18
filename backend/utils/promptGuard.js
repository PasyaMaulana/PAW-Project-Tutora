/**
 * Guardrail tambahan di sisi backend (tidak hanya mengandalkan System Prompt).
 * Mendeteksi pola umum prompt injection, yaitu input yang mencoba mengubah peran AI
 * atau meminta AI mengabaikan / membocorkan instruksi sistem.
 *
 * Catatan: pola dibuat spesifik agar pertanyaan materi yang sah tidak ikut terblokir,
 * misalnya "Apa itu system prompt?" pada topik Prompt Engineering.
 */
const INJECTION_PATTERNS = [
  /\b(abaikan|lupakan|acuhkan|hiraukan|langgar)\b.{0,40}\b(instruksi|aturan|perintah|prompt|batasan)/i,
  /\bignore\b.{0,40}\b(instruction|rule|prompt|previous|above)/i,
  /\b(forget|disregard|override|bypass)\b.{0,40}\b(instruction|rule|prompt|previous|guideline)/i,
  /\b(tampilkan|tunjukkan|bocorkan|sebutkan|ulangi|tuliskan|show|reveal|print|repeat|leak)\b.{0,40}\b(system\s*prompt|system\s*instruction|instruksi\s*sistem|prompt\s*sistem|instruksimu|aturanmu)/i,
  /\b(kamu|anda)\s+(sekarang|mulai\s+sekarang)\s+(adalah|menjadi|berperan)/i,
  /\b(you\s+are\s+now|act\s+as|pretend\s+(to\s+be|you\s+are)|roleplay\s+as)\b/i,
  /\b(berpura-pura|berperanlah|pura-pura\s+jadi)\b/i,
  /\b(jailbreak|developer\s+mode|mode\s+developer|DAN\s+mode|do\s+anything\s+now)\b/i,
];

const BLOCKED_REPLY =
  'Maaf, saya tidak dapat mengikuti permintaan untuk mengubah peran atau mengabaikan aturan saya. ' +
  'Saya adalah Tutora AI Tutor yang hanya membantu seputar topik pembelajaran yang tersedia di aplikasi Tutora. ' +
  'Silakan ajukan pertanyaan tentang topik-topik di katalog, misalnya "Topik apa saja yang tersedia?"';

// Tag pembatas yang dipakai di prompt; pengguna tidak boleh menyisipkannya sendiri
const RESERVED_TAGS = /<\/?\s*(pertanyaan_pengguna|konteks_aplikasi|jawaban_uji|aksi_sistem|system)[^>]*>/gi;

/**
 * @param {string} text
 * @returns {boolean} true jika teks terindikasi prompt injection
 */
function isPromptInjection(text) {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Membersihkan teks dari karakter kontrol dan tag pembatas yang dipakai di prompt,
 * supaya pengguna tidak bisa "menutup" blok data lalu menyisipkan instruksi baru.
 */
function sanitizeMessage(text) {
  return String(text)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(RESERVED_TAGS, '')
    .trim();
}

module.exports = { isPromptInjection, sanitizeMessage, BLOCKED_REPLY };
