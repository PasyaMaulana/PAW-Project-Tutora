const crypto = require('crypto');
const adminConfig = require('../config/admin');

/**
 * Autentikasi Admin tanpa akun (F-11, US-10).
 * - Halaman web: cookie sesi bertanda tangan HMAC (HttpOnly, SameSite=Lax, berlaku 2 jam)
 * - REST API  : header "X-Admin-Key: <ADMIN_PASSWORD>" (untuk pengujian Postman) atau cookie sesi
 */

const sha256 = (text) => crypto.createHash('sha256').update(String(text)).digest();
const sign = (value) => crypto.createHmac('sha256', adminConfig.sessionSecret).update(value).digest('hex');

/** Perbandingan kata sandi yang aman dari timing attack. */
function isValidPassword(input) {
  if (!adminConfig.isConfigured || typeof input !== 'string' || !input) return false;
  return crypto.timingSafeEqual(sha256(input), sha256(adminConfig.password));
}

/** Token sesi: "<waktu kedaluwarsa>.<tanda tangan HMAC>" */
function createSessionToken() {
  const expires = String(Date.now() + adminConfig.sessionMaxAgeMs);
  return `${expires}.${sign(expires)}`;
}

function isValidSessionToken(token) {
  if (!adminConfig.isConfigured || typeof token !== 'string') return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires), 'hex');
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Membaca cookie dari header tanpa library tambahan. */
function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try { return decodeURIComponent(part.slice(idx + 1).trim()); } catch (_) { return null; }
    }
  }
  return null;
}

function cookieOptions(req) {
  return {
    httpOnly: true,                 // Tidak bisa dibaca JavaScript di browser
    sameSite: 'lax',                // Cookie tidak ikut pada POST lintas situs (mitigasi CSRF)
    secure: req.secure,             // Otomatis aktif saat aplikasi berjalan di HTTPS
    path: '/',
    maxAge: adminConfig.sessionMaxAgeMs,
  };
}

function startSession(req, res) {
  res.cookie(adminConfig.cookieName, createSessionToken(), cookieOptions(req));
}

function endSession(req, res) {
  const { maxAge, ...opts } = cookieOptions(req);
  res.clearCookie(adminConfig.cookieName, opts);
}

function hasAdminSession(req) {
  return isValidSessionToken(readCookie(req, adminConfig.cookieName));
}

/** Middleware global: menandai apakah pengunjung adalah admin (dipakai navbar & view). */
function loadAdmin(req, res, next) {
  res.locals.isAdmin = hasAdminSession(req);
  next();
}

/** Proteksi halaman web admin: belum login -> diarahkan ke halaman login. */
function requireAdmin(req, res, next) {
  if (hasAdminSession(req)) return next();
  const nextUrl = req.method === 'GET' ? req.originalUrl : '/admin/topics';
  return res.redirect('/admin/login?next=' + encodeURIComponent(nextUrl));
}

/** Proteksi REST API: wajib header X-Admin-Key yang benar atau sesi admin aktif. */
function requireAdminApi(req, res, next) {
  if (hasAdminSession(req) || isValidPassword(req.get('X-Admin-Key'))) return next();
  return res.status(401).json({
    success: false,
    message: 'Akses ditolak. Endpoint ini khusus admin, sertakan header X-Admin-Key yang valid.',
  });
}

module.exports = { isValidPassword, startSession, endSession, loadAdmin, requireAdmin, requireAdminApi };
