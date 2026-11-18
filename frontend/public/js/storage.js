// ============================================================================
// Tutora History Store - Riwayat belajar di localStorage browser (F-07, F-08)
// Sesuai PRD: tanpa akun & tanpa penyimpanan di server, riwayat hanya di browser ini.
//
// Struktur data:
// { version: 1, sessions: [{
//     id, topicId, topicName, level, createdAt, updatedAt,
//     items: [
//       { type: 'qa',   mode: 'ask'|'simplify'|'example', question, answer, level, at },
//       { type: 'quiz', questions, answers, results, score, total, summary, level, at }
//     ]
// }]}
// ============================================================================
(function () {
  const KEY = 'tutora.history.v1';
  const MAX_SESSIONS = 50;

  function emptyData() {
    return { version: 1, sessions: [] };
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && Array.isArray(data.sessions) ? data : emptyData();
    } catch (_) {
      return emptyData();
    }
  }

  /**
   * Menyimpan data; jika jumlah sesi melebihi batas atau kapasitas localStorage (~5 MB) penuh,
   * sesi terlama dihapus lalu dicoba lagi.
   * @returns {{ ok: boolean, dropped: number }} dropped = jumlah sesi lama yang terhapus
   */
  function save(data) {
    data.sessions.sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
    let dropped = Math.max(0, data.sessions.length - MAX_SESSIONS);
    data.sessions = data.sessions.slice(0, MAX_SESSIONS);

    while (true) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
        return { ok: true, dropped: dropped };
      } catch (_) {
        if (data.sessions.length <= 1) return { ok: false, dropped: dropped };
        data.sessions.pop();
        dropped++;
      }
    }
  }

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /** Membuat objek sesi baru (belum disimpan sampai ada item pertama). */
  function createSession(opts) {
    const now = new Date().toISOString();
    return {
      id: newId(),
      topicId: opts.topicId || null,
      topicName: opts.topicName || 'Semua Topik',
      level: opts.level || 'Pemula',
      createdAt: now,
      updatedAt: now,
      items: [],
    };
  }

  /**
   * Menambah item ke sesi dan menyimpannya ke localStorage.
   * @returns {{ ok: boolean, dropped: number }}
   */
  function addItem(session, item) {
    item.at = item.at || new Date().toISOString();
    session.items.push(item);
    session.updatedAt = item.at;

    const data = load();
    const idx = data.sessions.findIndex(function (s) { return s.id === session.id; });
    if (idx === -1) data.sessions.push(session); else data.sessions[idx] = session;
    return save(data);
  }

  /** Memperbarui metadata sesi (misalnya level) bila sesi sudah tersimpan. */
  function updateSession(session) {
    const data = load();
    const idx = data.sessions.findIndex(function (s) { return s.id === session.id; });
    if (idx === -1) return false;
    data.sessions[idx] = session;
    return save(data);
  }

  function list() {
    return load().sessions.slice().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
  }

  function getSession(id) {
    return load().sessions.find(function (s) { return s.id === id; }) || null;
  }

  function deleteSession(id) {
    const data = load();
    data.sessions = data.sessions.filter(function (s) { return s.id !== id; });
    return save(data);
  }

  function clearAll() {
    try {
      window.localStorage.removeItem(KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Mengubah item sesi menjadi riwayat percakapan untuk context AI.
   * @returns {Array<{role: 'user'|'model', text: string}>}
   */
  function toConversation(session) {
    const out = [];
    (session ? session.items : []).forEach(function (item) {
      if (item.type !== 'qa') return;
      out.push({ role: 'user', text: item.question });
      out.push({ role: 'model', text: item.answer });
    });
    return out;
  }

  window.TutoraHistory = {
    createSession: createSession,
    addItem: addItem,
    updateSession: updateSession,
    list: list,
    getSession: getSession,
    deleteSession: deleteSession,
    clearAll: clearAll,
    toConversation: toConversation,
  };
})();
