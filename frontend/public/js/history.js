// ============================================================================
// Tutora Riwayat Belajar - menampilkan & menghapus riwayat dari localStorage
// F-07 Riwayat Chat (US-07), F-08 Hapus Riwayat (US-08)
// ============================================================================
(function () {
  const store = window.TutoraHistory;
  const md = window.TutoraMarkdown;
  const buildQuizCard = window.TutoraQuizCard;
  const confirmDialog = window.TutoraModal.confirm;

  const listEl = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');
  const statsEl = document.getElementById('history-stats');
  const clearAllBtn = document.getElementById('btn-clear-all');

  const ACTION_LABEL = {
    simplify: { label: 'Jelaskan Lebih Sederhana', icon: 'lucide:wand-2' },
    example: { label: 'Beri Contoh', icon: 'lucide:shapes' },
  };

  function formatTime(iso, withDate) {
    try {
      return new Date(iso).toLocaleString('id-ID', withDate === false
        ? { timeStyle: 'short' }
        : { dateStyle: 'medium', timeStyle: 'short' });
    } catch (_) {
      return '';
    }
  }

  function statCard(icon, value, label) {
    return (
      '<div class="bg-white rounded-2xl border border-slate-200 p-4">' +
        '<iconify-icon icon="' + icon + '" width="18" height="18" class="text-brand-600"></iconify-icon>' +
        '<p class="mt-2 text-xl font-extrabold text-slate-900">' + value + '</p>' +
        '<p class="text-[11px] text-slate-500">' + label + '</p>' +
      '</div>'
    );
  }

  /** Isi detail sesi: item diurutkan berdasarkan waktu (US-07). */
  function renderItems(container, session) {
    const items = session.items.slice().sort(function (a, b) { return a.at.localeCompare(b.at); });

    items.forEach(function (item) {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-2';

      if (item.type === 'qa') {
        const action = ACTION_LABEL[item.mode];
        const question = document.createElement('div');
        question.className = 'flex justify-end';
        question.innerHTML =
          '<div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 text-white px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words"></div>';
        if (action) {
          question.firstChild.innerHTML = '<span class="inline-flex items-center gap-1.5 font-medium"><iconify-icon icon="' + action.icon + '" width="14" height="14"></iconify-icon><span></span></span>';
          question.querySelector('span span').textContent = action.label;
        } else {
          question.firstChild.textContent = item.question;
        }

        const answer = document.createElement('div');
        answer.className = 'max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-100 text-slate-800 px-4 py-3 text-sm leading-relaxed break-words space-y-2';
        answer.innerHTML = md.render(item.answer);

        const meta = document.createElement('p');
        meta.className = 'text-[10px] text-slate-400';
        meta.textContent = formatTime(item.at, false) + ' • Level ' + (item.level || session.level);

        wrap.appendChild(question);
        wrap.appendChild(answer);
        wrap.appendChild(meta);
      } else if (item.type === 'quiz') {
        const card = buildQuizCard(item);
        card.classList.add('max-w-[95%]');
        const meta = document.createElement('p');
        meta.className = 'text-[10px] text-slate-400';
        meta.textContent = formatTime(item.at, false) + ' • Uji Pemahamanku • Level ' + (item.level || session.level);
        wrap.appendChild(card);
        wrap.appendChild(meta);
      }
      container.appendChild(wrap);
    });
  }

  function renderSession(session) {
    const qaCount = session.items.filter(function (i) { return i.type === 'qa'; }).length;
    const quizzes = session.items.filter(function (i) { return i.type === 'quiz'; });
    const lastQuiz = quizzes[quizzes.length - 1];
    const firstQuestion = (session.items.find(function (i) { return i.type === 'qa' && i.mode === 'ask'; }) || {}).question || '';

    const card = document.createElement('article');
    card.className = 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden';
    card.innerHTML =
      '<button type="button" class="session-toggle w-full text-left px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition" aria-expanded="false">' +
        '<span class="h-10 w-10 shrink-0 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><iconify-icon icon="lucide:book-open" width="18" height="18"></iconify-icon></span>' +
        '<span class="min-w-0 flex-1">' +
          '<span class="block font-bold text-slate-900 text-sm truncate s-topic"></span>' +
          '<span class="block text-xs text-slate-500 truncate mt-0.5 s-first"></span>' +
          '<span class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">' +
            '<span class="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold s-level"></span>' +
            '<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">' + qaCount + ' tanya jawab</span>' +
            (lastQuiz
              ? '<span class="px-2 py-0.5 rounded-full ' + (lastQuiz.score >= 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + ' font-semibold">Uji: ' + lastQuiz.score + '/' + lastQuiz.total + '</span>'
              : '') +
            '<span class="text-slate-400 s-time"></span>' +
          '</span>' +
        '</span>' +
        '<iconify-icon icon="lucide:chevron-down" width="18" height="18" class="chevron shrink-0 text-slate-400 transition-transform duration-200 mt-2"></iconify-icon>' +
      '</button>' +
      '<div class="session-body hidden border-t border-slate-100">' +
        '<div class="session-items px-4 sm:px-5 py-4 space-y-4 bg-slate-50/50"></div>' +
        '<div class="px-4 sm:px-5 py-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">' +
          '<button type="button" class="btn-delete px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition flex items-center gap-1.5">' +
            '<iconify-icon icon="lucide:trash-2" width="14" height="14"></iconify-icon><span>Hapus Sesi</span></button>' +
          '<a class="btn-continue px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5">' +
            '<iconify-icon icon="lucide:play" width="14" height="14"></iconify-icon><span>Lanjutkan Sesi</span></a>' +
        '</div>' +
      '</div>';

    card.querySelector('.s-topic').textContent = session.topicName || 'Semua Topik';
    card.querySelector('.s-first').textContent = firstQuestion ? '“' + firstQuestion + '”' : 'Sesi belajar';
    card.querySelector('.s-level').textContent = session.level;
    card.querySelector('.s-time').textContent = formatTime(session.updatedAt);
    card.querySelector('.btn-continue').href = '/assistant?session=' + encodeURIComponent(session.id);

    const toggle = card.querySelector('.session-toggle');
    const body = card.querySelector('.session-body');
    let rendered = false;
    toggle.addEventListener('click', function () {
      const open = body.classList.contains('hidden');
      if (open && !rendered) {
        renderItems(card.querySelector('.session-items'), session);
        rendered = true;
      }
      body.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      card.querySelector('.chevron').classList.toggle('rotate-180', open);
    });

    card.querySelector('.btn-delete').addEventListener('click', async function () {
      const ok = await confirmDialog({
        title: 'Hapus sesi ini?',
        message: 'Riwayat sesi "' + (session.topicName || 'Semua Topik') + '" akan dihapus dari browser ini dan tidak dapat dikembalikan.',
        confirmText: 'Hapus Sesi',
        variant: 'danger',
      });
      if (ok) {
        store.deleteSession(session.id);
        render();
      }
    });

    return card;
  }

  function render() {
    const sessions = store.list();
    listEl.innerHTML = '';

    const isEmpty = sessions.length === 0;
    emptyEl.classList.toggle('hidden', !isEmpty);
    statsEl.classList.toggle('hidden', isEmpty);
    clearAllBtn.classList.toggle('hidden', isEmpty);
    clearAllBtn.classList.toggle('inline-flex', !isEmpty);
    if (isEmpty) return;

    let qa = 0;
    let quiz = 0;
    sessions.forEach(function (s) {
      s.items.forEach(function (i) { if (i.type === 'qa') qa++; else if (i.type === 'quiz') quiz++; });
    });
    statsEl.innerHTML =
      statCard('lucide:layers', sessions.length, 'Sesi belajar') +
      statCard('lucide:messages-square', qa, 'Tanya jawab') +
      statCard('lucide:clipboard-check', quiz, 'Uji pemahaman');

    // Sesi terbaru di atas; isi sesi berurutan berdasarkan waktu
    sessions.forEach(function (s) { listEl.appendChild(renderSession(s)); });
  }

  // US-08: Hapus seluruh riwayat lalu halaman tampil kosong
  clearAllBtn.addEventListener('click', async function () {
    const ok = await confirmDialog({
      title: 'Hapus semua riwayat?',
      message: 'Seluruh riwayat chat dan hasil uji di browser ini akan dihapus permanen dan tidak dapat dikembalikan.',
      confirmText: 'Hapus Semua',
      variant: 'danger',
    });
    if (ok) {
      store.clearAll();
      render();
    }
  });

  render();
})();
