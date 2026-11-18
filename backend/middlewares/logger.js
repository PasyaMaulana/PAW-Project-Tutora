const fs = require('fs');
const path = require('path');
const config = require('../config');

const logPath = path.join(config.logDir, config.logFile);

// Siapkan folder logs dan header tabel Markdown sekali saat server menyala
try {
  fs.mkdirSync(config.logDir, { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(
      logPath,
      '# Request Logs - Tutora\n\n' +
        '| Timestamp (WIB) | Method | Endpoint / URL | Status | Duration | IP Address |\n' +
        '|---|---|---|---|---|---|\n'
    );
  }
} catch (err) {
  console.error('Warning: Failed to initialize log file:', err.message);
}

// Karakter "|" harus di-escape agar tabel Markdown tidak rusak
const escapeMarkdown = (teks) => String(teks || '').replace(/\|/g, '%7C');

module.exports = (req, res, next) => {
  const waktuMulai = process.hrtime.bigint();
  const timestamp = new Date();

  // Catat setelah respons selesai supaya status code dan durasi sudah diketahui
  res.on('finish', () => {
    const durasiMs = Number(process.hrtime.bigint() - waktuMulai) / 1e6;
    const waktuWIB = timestamp.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'short',
      timeStyle: 'medium',
    });

    let clientIp = '127.0.0.1';
    try {
      clientIp = req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
    } catch (_) {
      clientIp = '127.0.0.1';
    }

    // 1. Tampilkan log di console/terminal (Wajib sesuai Poin 3 Penugasan)
    console.log(
      `📝 [${waktuWIB}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${durasiMs.toFixed(1)} ms | IP: ${clientIp}`
    );

    // 2. Simpan juga ke logs/logger.md (Sesuai contoh referensi repository)
    const barisLog =
      `| ${waktuWIB} | ${req.method} | ${escapeMarkdown(req.originalUrl)} ` +
      `| ${res.statusCode} | ${durasiMs.toFixed(1)} ms | ${escapeMarkdown(clientIp)} |\n`;

    fs.appendFile(logPath, barisLog, (err) => {
      if (err) console.error('Failed to write to log file:', err.message);
    });
  });

  next();
};
