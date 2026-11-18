/**
 * Rate limiter sederhana berbasis memori (F-04).
 * Membatasi jumlah permintaan per alamat IP dalam satu jendela waktu
 * untuk melindungi kuota Gemini API dari penyalahgunaan.
 *
 * @param {{ windowMs: number, max: number, message?: string,
 *           handler?: (req, res, retryAfter: number) => void }} options
 *        handler opsional untuk respons kustom (misalnya render halaman, bukan JSON)
 */
module.exports = function rateLimiter({ windowMs, max, message, handler }) {
  const hits = new Map(); // ip -> array timestamp permintaan

  // Bersihkan data IP yang sudah tidak aktif agar memori tidak terus bertambah
  setInterval(() => {
    const batas = Date.now() - windowMs;
    for (const [ip, times] of hits) {
      const aktif = times.filter((t) => t > batas);
      if (aktif.length) hits.set(ip, aktif); else hits.delete(ip);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
    const times = (hits.get(ip) || []).filter((t) => t > now - windowMs);

    if (times.length >= max) {
      const retryAfter = Math.max(1, Math.ceil((times[0] + windowMs - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      if (handler) return handler(req, res.status(429), retryAfter);
      return res.status(429).json({
        success: false,
        message: message || `Terlalu banyak permintaan. Silakan coba lagi dalam ${retryAfter} detik.`,
        retryAfter,
      });
    }

    times.push(now);
    hits.set(ip, times);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(max - times.length));
    next();
  };
};
