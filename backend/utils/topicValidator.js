const { DEFAULT_LEVELS, parseLevels } = require('./format');

/**
 * Validasi data topik yang dipakai bersama oleh form Admin dan REST API (F-11).
 * Menjaga kualitas katalog karena katalog menjadi context AI Tutor (Dependensi 3 PRD).
 */
const LIMITS = { nama: 150, kategori: 60, deskripsi: 1000, icon: 60 };
const ICON_PATTERN = /^[a-z0-9-]+:[a-z0-9-]+$/i;

const clean = (v) => (typeof v === 'string' ? v.trim() : v);

/**
 * @param {object} body       Data dari form / JSON
 * @param {{ partial?: boolean }} options  partial = true untuk update sebagian (PUT API)
 * @returns {{ errors: string[], data: object }}
 */
function validateTopic(body, options = {}) {
  const partial = Boolean(options.partial);
  const errors = [];
  const data = {};

  const nama = clean(body.nama ?? body.title ?? body.name);
  const kategori = clean(body.kategori ?? body.category);
  const deskripsi = clean(body.deskripsi ?? body.description);
  const icon = clean(body.icon);

  // Field wajib: nama & deskripsi (pada update sebagian hanya dicek jika dikirim)
  if (nama !== undefined || !partial) {
    if (!nama) errors.push('Nama topik wajib diisi');
    else if (nama.length > LIMITS.nama) errors.push(`Nama topik maksimal ${LIMITS.nama} karakter`);
    else data.nama = nama;
  }

  if (deskripsi !== undefined || !partial) {
    if (!deskripsi) errors.push('Deskripsi wajib diisi');
    else if (deskripsi.length > LIMITS.deskripsi) errors.push(`Deskripsi maksimal ${LIMITS.deskripsi} karakter`);
    else data.deskripsi = deskripsi;
  }

  if (kategori !== undefined && kategori !== '') {
    if (kategori.length > LIMITS.kategori) errors.push(`Kategori maksimal ${LIMITS.kategori} karakter`);
    else data.kategori = kategori;
  } else if (!partial) {
    data.kategori = 'Umum';
  }

  if (icon !== undefined && icon !== '') {
    if (icon.length > LIMITS.icon || !ICON_PATTERN.test(icon)) errors.push('Format ikon tidak valid, gunakan format lucide:nama-ikon');
    else data.icon = icon;
  } else if (!partial) {
    data.icon = 'lucide:book-open';
  }

  // Tingkat pemahaman: hanya Pemula / Menengah / Lanjut, minimal satu
  const levels = parseLevels(body.levels);
  if (levels !== undefined || !partial) {
    const list = levels || [];
    const invalid = list.filter((l) => !DEFAULT_LEVELS.includes(l));
    if (invalid.length) {
      errors.push(`Tingkat pemahaman tidak dikenal: ${invalid.join(', ')}. Pilihan: ${DEFAULT_LEVELS.join(', ')}`);
    } else if (!list.length) {
      errors.push('Pilih minimal satu tingkat pemahaman');
    } else {
      data.levels = DEFAULT_LEVELS.filter((l) => list.includes(l)); // Urut & tanpa duplikat
    }
  }

  return { errors, data };
}

module.exports = { validateTopic, LIMITS };
