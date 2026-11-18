// ============================================================================
// Tutora AI Tutor - Frontend Chat (Fetch API ke backend POST /api/chat)
// Frontend TIDAK berkomunikasi langsung dengan Gemini API.
//
// Fitur PRD yang ditangani file ini:
// F-01 Pemilihan topik & tingkat pemahaman   F-02 Chat tanya jawab
// F-03 Uji Pemahamanku (3 pertanyaan + evaluasi) F-04 Pesan error & validasi input
// F-05 Jelaskan Lebih Sederhana               F-06 Beri Contoh
// F-07 Simpan riwayat ke localStorage (via storage.js)
// ============================================================================
(function () {
  const MAX_LENGTH = 1000;
  const QUIZ_SIZE = 3;

  const md = window.TutoraMarkdown;
  const store = window.TutoraHistory;
  const confirmDialog = window.TutoraModal ? window.TutoraModal.confirm : function () { return Promise.resolve(true); };

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');
  const charCount = document.getElementById('char-count');
  const inputWarning = document.getElementById('input-warning');
  const topicSelect = document.getElementById('topic-select');
  const contextTopic = document.getElementById('context-topic');
  const contextLevel = document.getElementById('context-level');

  const initialWelcomeHtml = messages.innerHTML;

  // Label tombol aksi yang juga dipakai sebagai "pesan pengguna" pada riwayat & context AI
  const ACTIONS = {
    simplify: { label: 'Jelaskan Lebih Sederhana', icon: 'lucide:wand-2', prompt: 'Tolong jelaskan lebih sederhana.' },
    example: { label: 'Beri Contoh', icon: 'lucide:shapes', prompt: 'Tolong beri contoh konkret.' },
    quiz: { label: 'Uji Pemahamanku', icon: 'lucide:clipboard-check', prompt: 'Uji pemahamanku.' },
  };

  const LOADING_TEXT = {
    ask: 'Tutora sedang berpikir...',
    simplify: 'Menyederhanakan penjelasan...',
    example: 'Menyiapkan contoh...',
    quiz: 'Menyusun 3 pertanyaan uji...',
    evaluate: 'Memeriksa jawabanmu...',
  };

  let isLoading = false;
  let session = null; // Sesi belajar aktif (dibuat saat jawaban pertama berhasil)

  // ==========================================================================
  // Helper konteks sesi
  // ==========================================================================
  function currentLevel() {
    const checked = document.querySelector('input[name="level"]:checked');
    return checked ? checked.value : 'Pemula';
  }

  function currentTopic() {
    return {
      id: topicSelect.value ? Number(topicSelect.value) : null,
      name: contextTopic ? contextTopic.textContent.trim() : 'Semua Topik',
    };
  }

  function ensureSession() {
    if (!session) {
      const topic = currentTopic();
      session = store.createSession({ topicId: topic.id, topicName: topic.name, level: currentLevel() });
    }
    return session;
  }

  function hasConversation() {
    return Boolean(session && store.toConversation(session).length);
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (_) {
      return '';
    }
  }

  // ==========================================================================
  // Render pesan
  // ==========================================================================
  const LOGO_AVATAR =
    '<div class="h-8 w-8 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center">' +
      '<img src="/images/tutora-owl.png" alt="Tutora" class="h-5 w-auto">' +
    '</div>';

  const ERROR_AVATAR =
    '<div class="h-8 w-8 shrink-0 rounded-full bg-rose-500 text-white flex items-center justify-center">' +
      '<iconify-icon icon="lucide:alert-triangle" width="16" height="16"></iconify-icon>' +
    '</div>';

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function appendRow(row) {
    messages.appendChild(row);
    scrollToBottom();
    return row;
  }

  /** Pesan pengguna; aksi tombol ditampilkan sebagai chip dengan ikon. */
  function addUserBubble(text, actionMode) {
    const row = document.createElement('div');
    row.className = 'flex justify-end';
    if (actionMode) {
      const action = ACTIONS[actionMode];
      row.innerHTML =
        '<div class="inline-flex items-center gap-1.5 rounded-2xl rounded-tr-sm bg-brand-600 text-white px-3.5 py-2 text-sm font-medium">' +
          '<iconify-icon icon="' + action.icon + '" width="15" height="15"></iconify-icon>' +
          '<span></span>' +
        '</div>';
      row.querySelector('span').textContent = action.label;
    } else {
      row.innerHTML = '<div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 text-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"></div>';
      row.firstChild.textContent = text;
    }
    return appendRow(row);
  }

  function addAiBubble(text, options) {
    options = options || {};
    const bubbleClass = options.blocked
      ? 'bg-amber-50 border border-amber-200 text-amber-900'
      : 'bg-slate-100 text-slate-800';
    const row = document.createElement('div');
    row.className = 'flex gap-3';
    row.innerHTML =
      LOGO_AVATAR +
      '<div class="min-w-0 max-w-[85%]">' +
        '<div class="ai-answer rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed break-words space-y-2 ' + bubbleClass + '">' +
          md.render(text) +
        '</div>' +
      '</div>';
    return appendRow(row);
  }

  /**
   * Pesan error (US-09): tidak disimpan ke riwayat; opsional tombol "Coba lagi".
   */
  function addErrorBubble(text, retry) {
    const row = document.createElement('div');
    row.className = 'flex gap-3';
    row.innerHTML =
      ERROR_AVATAR +
      '<div class="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm leading-relaxed">' +
        '<p class="error-text"></p>' +
      '</div>';
    row.querySelector('.error-text').textContent = text;

    if (retry) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition';
      btn.innerHTML = '<iconify-icon icon="lucide:refresh-cw" width="13" height="13"></iconify-icon><span>Coba lagi</span>';
      btn.addEventListener('click', function () {
        if (isLoading) return;
        row.remove();
        retry();
      });
      row.lastChild.appendChild(btn);
    }
    return appendRow(row);
  }

  function addNotice(text, icon) {
    const row = document.createElement('div');
    row.className = 'flex justify-center';
    row.innerHTML =
      '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] text-slate-500 text-center">' +
        '<iconify-icon icon="' + (icon || 'lucide:info') + '" width="12" height="12" class="shrink-0"></iconify-icon>' +
        '<span></span>' +
      '</span>';
    row.querySelector('span span').textContent = text;
    return appendRow(row);
  }

  /** Tombol aksi lanjutan hanya ditampilkan di bawah jawaban tutor terakhir. */
  function attachActionBar(row) {
    messages.querySelectorAll('.action-bar').forEach(function (bar) { bar.remove(); });

    const bar = document.createElement('div');
    bar.className = 'action-bar mt-2 flex flex-wrap gap-1.5';
    Object.keys(ACTIONS).forEach(function (mode) {
      const action = ACTIONS[mode];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.action = mode;
      btn.className = mode === 'quiz'
        ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed'
        : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 hover:text-brand-800 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
      btn.innerHTML = '<iconify-icon icon="' + action.icon + '" width="14" height="14"></iconify-icon><span></span>';
      btn.querySelector('span').textContent = action.label;
      btn.disabled = isLoading;
      btn.addEventListener('click', function () {
        if (mode === 'quiz') startQuiz(); else runAction(mode);
      });
      bar.appendChild(btn);
    });

    row.querySelector('.ai-answer').parentNode.appendChild(bar);
  }

  function showLoading(mode) {
    hideLoading();
    const row = document.createElement('div');
    row.className = 'flex gap-3';
    row.id = 'chat-loading';
    row.innerHTML =
      LOGO_AVATAR +
      '<div class="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-500 flex items-center gap-2">' +
        '<span class="flex gap-1">' +
          '<span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce"></span>' +
          '<span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]"></span>' +
          '<span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]"></span>' +
        '</span>' +
        '<span class="text-xs"></span>' +
      '</div>';
    row.querySelector('.text-xs').textContent = LOADING_TEXT[mode] || LOADING_TEXT.ask;
    appendRow(row);
  }

  function hideLoading() {
    const row = document.getElementById('chat-loading');
    if (row) row.remove();
  }

  function setLoading(state, mode) {
    isLoading = state;
    sendBtn.disabled = state;
    input.disabled = state;
    messages.querySelectorAll('[data-action]').forEach(function (btn) {
      if (!btn.dataset.locked) btn.disabled = state;
    });
    if (state) showLoading(mode); else hideLoading();
  }

  // ==========================================================================
  // Uji Pemahamanku (F-03): hasil uji ditampilkan di chat setelah selesai
  // ==========================================================================
  const buildQuizResultCard = window.TutoraQuizCard; // dari /js/quiz-card.js

  function addQuizResult(result) {
    const row = document.createElement('div');
    row.className = 'flex gap-3';
    row.innerHTML = LOGO_AVATAR + '<div class="min-w-0 w-full max-w-[90%]"></div>';
    row.lastChild.appendChild(buildQuizResultCard(result));
    return appendRow(row);
  }

  // ==========================================================================
  // Komunikasi backend
  // ==========================================================================
  async function callApi(payload) {
    const topic = currentTopic();
    const body = Object.assign({ level: currentLevel(), sessionId: ensureSession().id }, payload);
    if (topic.id) body.topicId = topic.id;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let json = null;
      try { json = await res.json(); } catch (_) { json = null; }

      if (!res.ok || !json || !json.success) {
        return { ok: false, message: (json && json.message) || 'Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.' };
      }
      return { ok: true, data: json.data };
    } catch (_) {
      return { ok: false, message: 'Gagal terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.' };
    }
  }

  // ==========================================================================
  // Alur utama
  // ==========================================================================
  function showInputWarning(text) {
    inputWarning.innerHTML = '<iconify-icon icon="lucide:alert-circle" width="13" height="13"></iconify-icon><span></span>';
    inputWarning.querySelector('span').textContent = text;
    inputWarning.classList.remove('hidden');
    input.classList.add('border-rose-300');
    input.focus();
  }

  function clearInputWarning() {
    inputWarning.classList.add('hidden');
    input.classList.remove('border-rose-300');
  }

  /** F-02: tanya jawab. Pertanyaan kosong tidak dikirim ke AI (US-02). */
  async function ask(text, opts) {
    opts = opts || {};
    const message = (text || '').trim();
    if (isLoading) return;
    if (!message) return showInputWarning('Tulis pertanyaan terlebih dahulu sebelum mengirim.');
    if (message.length > MAX_LENGTH) return showInputWarning('Pertanyaan terlalu panjang, maksimal ' + MAX_LENGTH + ' karakter.');
    clearInputWarning();

    if (!opts.retry) addUserBubble(message);
    input.value = '';
    updateCounter();

    setLoading(true, 'ask');
    const history = store.toConversation(session);
    const res = await callApi({ mode: 'ask', message: message, history: history });
    setLoading(false);

    if (!res.ok) {
      addErrorBubble(res.message, function () { ask(message, { retry: true }); });
      return finishTurn();
    }

    if (res.data.blocked) {
      addAiBubble(res.data.reply, { blocked: true }); // Penolakan guardrail tidak disimpan ke riwayat
      return finishTurn();
    }

    const row = addAiBubble(res.data.reply);
    attachActionBar(row);
    saveToHistory(ensureSession(), { type: 'qa', mode: 'ask', question: message, answer: res.data.reply, level: currentLevel() });
    finishTurn();
  }

  /** F-05 & F-06: Jelaskan Lebih Sederhana / Beri Contoh (butuh jawaban sebelumnya). */
  async function runAction(mode, opts) {
    opts = opts || {};
    if (isLoading || !hasConversation()) return;
    const action = ACTIONS[mode];

    if (!opts.retry) addUserBubble(action.label, mode);
    setLoading(true, mode);
    const res = await callApi({ mode: mode, history: store.toConversation(session) });
    setLoading(false);

    if (!res.ok) {
      addErrorBubble(res.message, function () { runAction(mode, { retry: true }); });
      return finishTurn();
    }

    const row = addAiBubble(res.data.reply, { blocked: res.data.blocked });
    if (!res.data.blocked) {
      attachActionBar(row);
      saveToHistory(session, { type: 'qa', mode: mode, question: action.prompt, answer: res.data.reply, level: currentLevel() });
    }
    finishTurn();
  }

  // ==========================================================================
  // Mode Fokus Uji Pemahamanku (F-03, US-05, US-06)
  // Layar penuh menutupi percakapan agar mahasiswa tidak menyalin jawaban dari chat.
  // Soal tampil satu per satu; hasil baru ditambahkan ke chat & riwayat setelah dinilai.
  // ==========================================================================
  const quizEl = {
    modal: document.getElementById('quiz-modal'),
    subtitle: document.getElementById('quiz-subtitle'),
    progress: document.getElementById('quiz-progress'),
    close: document.getElementById('quiz-close'),
    loadingText: document.getElementById('quiz-loading-text'),
    errorText: document.getElementById('quiz-error-text'),
    errorBack: document.getElementById('quiz-error-back'),
    retry: document.getElementById('quiz-retry'),
    step: document.getElementById('quiz-step'),
    dots: document.getElementById('quiz-dots'),
    question: document.getElementById('quiz-question'),
    answer: document.getElementById('quiz-answer'),
    warning: document.getElementById('quiz-warning'),
    count: document.getElementById('quiz-count'),
    prev: document.getElementById('quiz-prev'),
    next: document.getElementById('quiz-next'),
    result: document.getElementById('quiz-result'),
    done: document.getElementById('quiz-done'),
  };

  const quiz = { open: false, busy: false, phase: 'idle', questions: [], answers: [], step: 0, retryFn: null, lastFocus: null };

  function quizShow(view) {
    quiz.phase = view;
    quizEl.modal.querySelectorAll('[data-quiz-view]').forEach(function (s) {
      s.classList.toggle('hidden', s.dataset.quizView !== view);
    });
  }

  function quizProgress(percent) {
    quizEl.progress.style.width = Math.max(0, Math.min(100, percent)) + '%';
  }

  function openQuizModal() {
    quiz.open = true;
    quiz.lastFocus = document.activeElement;
    quizEl.subtitle.textContent = currentTopic().name + ' • Level ' + currentLevel();
    quizEl.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { quizEl.modal.classList.remove('opacity-0'); });
    document.addEventListener('keydown', onQuizKeydown);
  }

  function closeQuizModal() {
    quiz.open = false;
    quiz.busy = false;
    quizEl.modal.classList.add('opacity-0');
    document.removeEventListener('keydown', onQuizKeydown);
    setTimeout(function () {
      quizEl.modal.classList.add('hidden');
      document.body.style.overflow = '';
      if (quiz.lastFocus && document.contains(quiz.lastFocus)) quiz.lastFocus.focus(); else input.focus();
    }, 200);
  }

  /** Menutup di tengah uji meminta konfirmasi agar jawaban tidak hilang tanpa sengaja. */
  async function requestCloseQuiz() {
    if (quiz.phase === 'result' || quiz.phase === 'error') return closeQuizModal();
    if (quiz.phase === 'question') saveCurrentAnswer(); // Ikutkan jawaban yang sedang diketik
    const sudahMenjawab = quiz.answers.some(function (a) { return a && a.trim(); });
    if (quiz.phase === 'question' && !sudahMenjawab) {
      closeQuizModal();
      return addNotice('Uji pemahaman dibatalkan.', 'lucide:clipboard-x');
    }
    const ok = await confirmDialog({
      title: 'Akhiri uji pemahaman?',
      message: 'Jawabanmu belum dinilai dan tidak akan disimpan ke riwayat.',
      confirmText: 'Akhiri Uji',
      icon: 'lucide:clipboard-x',
      variant: 'danger',
    });
    if (ok) {
      closeQuizModal();
      addNotice('Uji pemahaman dibatalkan sebelum dinilai.', 'lucide:clipboard-x');
    }
  }

  function quizError(message, retryFn, canGoBack) {
    quiz.busy = false;
    quiz.retryFn = retryFn;
    quizEl.errorText.textContent = message;
    quizEl.retry.classList.toggle('hidden', !retryFn);
    quizEl.errorBack.classList.toggle('hidden', !canGoBack);
    quizShow('error');
    (retryFn ? quizEl.retry : quizEl.close).focus();
  }

  function quizLoading(text) {
    quizEl.loadingText.textContent = text;
    quizShow('loading');
  }

  /** US-05: buka mode fokus lalu minta tepat 3 pertanyaan ke backend. */
  function startQuiz() {
    if (isLoading || quiz.open || !hasConversation()) return;
    quiz.questions = [];
    quiz.answers = [];
    quiz.step = 0;
    openQuizModal();
    loadQuizQuestions();
  }

  async function loadQuizQuestions() {
    if (quiz.busy) return;
    quiz.busy = true;
    quizProgress(0);
    quizLoading('Menyusun ' + QUIZ_SIZE + ' pertanyaan dari materi yang baru kamu pelajari...');

    const res = await callApi({ mode: 'quiz', history: store.toConversation(session) });
    if (!quiz.open) return; // Dibatalkan saat menunggu
    quiz.busy = false;

    if (!res.ok) return quizError(res.message, loadQuizQuestions, false);
    if (res.data.blocked || !Array.isArray(res.data.questions) || res.data.questions.length < QUIZ_SIZE) {
      return quizError(res.data.reply || 'Pertanyaan uji tidak dapat dibuat. Silakan coba lagi.', loadQuizQuestions, false);
    }

    quiz.questions = res.data.questions.slice(0, QUIZ_SIZE);
    quiz.answers = quiz.questions.map(function () { return ''; });
    quiz.step = 0;
    renderQuizStep();
  }

  function renderQuizStep() {
    const i = quiz.step;
    const last = i === quiz.questions.length - 1;
    quizShow('question');
    quizEl.step.textContent = 'Pertanyaan ' + (i + 1) + ' dari ' + quiz.questions.length;
    quizEl.question.textContent = quiz.questions[i];
    quizEl.answer.value = quiz.answers[i] || '';
    quizEl.count.textContent = quizEl.answer.value.length;
    quizEl.warning.classList.add('hidden');
    quizEl.answer.classList.remove('border-rose-300');
    quizEl.prev.disabled = i === 0;
    quizEl.next.innerHTML = last
      ? '<iconify-icon icon="lucide:send" width="15" height="15"></iconify-icon><span>Kirim Jawaban</span>'
      : '<span>Berikutnya</span><iconify-icon icon="lucide:arrow-right" width="15" height="15"></iconify-icon>';

    quizEl.dots.innerHTML = '';
    quiz.questions.forEach(function (_, idx) {
      const dot = document.createElement('span');
      const terisi = Boolean(quiz.answers[idx] && quiz.answers[idx].trim());
      dot.className = 'h-2 rounded-full transition-all ' + (idx === i ? 'w-6 bg-brand-600' : terisi ? 'w-2 bg-brand-300' : 'w-2 bg-slate-200');
      quizEl.dots.appendChild(dot);
    });

    quizProgress((i / (quiz.questions.length + 1)) * 100);
    quizEl.answer.focus();
  }

  function saveCurrentAnswer() {
    quiz.answers[quiz.step] = quizEl.answer.value.trim();
  }

  function quizNext() {
    if (quiz.busy) return;
    saveCurrentAnswer();
    if (!quiz.answers[quiz.step]) {
      quizEl.warning.textContent = 'Tulis jawabanmu terlebih dahulu, walaupun singkat.';
      quizEl.warning.classList.remove('hidden');
      quizEl.answer.classList.add('border-rose-300');
      return quizEl.answer.focus();
    }
    if (quiz.step < quiz.questions.length - 1) {
      quiz.step++;
      return renderQuizStep();
    }
    submitQuizAnswers();
  }

  function quizPrev() {
    if (quiz.busy || quiz.step === 0) return;
    saveCurrentAnswer();
    quiz.step--;
    renderQuizStep();
  }

  /** US-06: kirim jawaban, tampilkan feedback, lalu simpan ke chat & riwayat. */
  async function submitQuizAnswers() {
    if (quiz.busy) return;
    const kosong = quiz.answers.findIndex(function (a) { return !a; });
    if (kosong !== -1) {
      quiz.step = kosong;
      renderQuizStep();
      quizEl.warning.textContent = 'Pertanyaan ini belum dijawab.';
      return quizEl.warning.classList.remove('hidden');
    }

    quiz.busy = true;
    quizProgress((quiz.questions.length / (quiz.questions.length + 1)) * 100);
    quizLoading('Memeriksa jawabanmu...');

    const payload = { questions: quiz.questions.slice(), answers: quiz.answers.slice() };
    const res = await callApi({ mode: 'evaluate', quiz: payload, history: store.toConversation(session) });
    if (!quiz.open) return;
    quiz.busy = false;

    if (!res.ok || res.data.blocked) {
      // Jawaban tetap tersimpan di pop-up sehingga bisa dikirim ulang atau diubah (US-09)
      return quizError(res.ok ? res.data.reply : res.message, submitQuizAnswers, true);
    }

    quizProgress(100);
    quizEl.result.innerHTML = '';
    const passed = res.data.score >= 2;
    const head = document.createElement('div');
    head.className = 'mb-5 text-center';
    head.innerHTML =
      '<div class="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-3 ' + (passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') + '">' +
        '<iconify-icon icon="' + (passed ? 'lucide:party-popper' : 'lucide:book-open-check') + '" width="30" height="30"></iconify-icon>' +
      '</div>' +
      '<p class="text-3xl font-extrabold text-slate-900">' + res.data.score + '/' + res.data.total + '</p>' +
      '<p class="text-sm text-slate-500 mt-1">' + (passed ? 'Mantap, pemahamanmu sudah baik!' : 'Tidak apa-apa, pelajari lagi bagian yang ditandai ya.') + '</p>';
    quizEl.result.appendChild(head);
    quizEl.result.appendChild(buildQuizResultCard(res.data));
    quizShow('result');
    quizEl.done.focus();

    // Hasil baru masuk ke percakapan & riwayat setelah dinilai
    addUserBubble(null, 'quiz');
    addQuizResult(res.data);
    saveToHistory(session, {
      type: 'quiz',
      questions: payload.questions,
      answers: payload.answers,
      results: res.data.results,
      score: res.data.score,
      total: res.data.total,
      summary: res.data.summary,
      level: currentLevel(),
    });
  }

  function onQuizKeydown(e) {
    // Abaikan jika modal konfirmasi sedang terbuka di atas pop-up uji
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal && !confirmModal.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      requestCloseQuiz();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && quiz.phase === 'question') {
      e.preventDefault();
      quizNext();
    } else if (e.key === 'Tab') {
      // Jaga fokus tetap di dalam pop-up
      const focusables = Array.prototype.slice.call(
        quizEl.modal.querySelectorAll('button, textarea, [href]')
      ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!focusables.length) return;
      const first = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  }

  quizEl.close.addEventListener('click', requestCloseQuiz);
  quizEl.done.addEventListener('click', closeQuizModal);
  quizEl.next.addEventListener('click', quizNext);
  quizEl.prev.addEventListener('click', quizPrev);
  quizEl.retry.addEventListener('click', function () { if (quiz.retryFn) quiz.retryFn(); });
  quizEl.errorBack.addEventListener('click', function () {
    quiz.step = quiz.questions.length - 1;
    renderQuizStep();
  });
  quizEl.answer.addEventListener('input', function () {
    quizEl.count.textContent = quizEl.answer.value.length;
    if (quizEl.answer.value.trim()) {
      quizEl.warning.classList.add('hidden');
      quizEl.answer.classList.remove('border-rose-300');
    }
  });

  /**
   * Menyimpan item ke riwayat browser dan memberi tahu pengguna bila sesi lama
   * terpaksa dihapus karena penyimpanan penuh (PRD Constraint 2 & Risiko riwayat penuh).
   */
  function saveToHistory(targetSession, item) {
    const result = store.addItem(targetSession, item);
    if (!result.ok) {
      addNotice('Riwayat tidak dapat disimpan karena penyimpanan browser penuh. Hapus sebagian riwayat di halaman Riwayat.', 'lucide:hard-drive');
    } else if (result.dropped > 0) {
      addNotice(result.dropped + ' sesi riwayat terlama dihapus otomatis karena penyimpanan browser penuh.', 'lucide:hard-drive');
    }
  }

  function finishTurn() {
    if (!input.disabled) input.focus();
  }

  // Tinggi maksimal kolom chat; scrollbar hanya muncul jika teks melebihi batas ini
  const INPUT_MAX_HEIGHT = 144;

  function updateCounter() {
    charCount.textContent = input.value.length;
    input.style.height = 'auto';
    const tinggiIsi = input.scrollHeight;
    input.style.height = Math.min(tinggiIsi, INPUT_MAX_HEIGHT) + 'px';
    input.style.overflowY = tinggiIsi > INPUT_MAX_HEIGHT ? 'auto' : 'hidden';
    if (input.value.trim()) clearInputWarning();
  }

  // ==========================================================================
  // Sesi belajar: ganti topik, ganti level, sesi baru, lanjutkan sesi
  // ==========================================================================
  function resetChat() {
    messages.innerHTML = initialWelcomeHtml;
    session = null;
    clearInputWarning();
  }

  async function confirmNewSession(message) {
    if (!session || !session.items.length) return true;
    return confirmDialog({
      title: 'Mulai sesi belajar baru?',
      message: message + ' Percakapan saat ini tetap tersimpan di Riwayat Belajar.',
      confirmText: 'Mulai Sesi Baru',
      icon: 'lucide:plus-square',
    });
  }

  document.querySelectorAll('input[name="level"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (contextLevel) contextLevel.textContent = radio.value;
      if (session) {
        session.level = radio.value;
        store.updateSession(session);
      }
      addNotice('Tingkat pemahaman diubah ke ' + radio.value + '. Penjelasan berikutnya akan menyesuaikan.', 'lucide:gauge');
    });
  });

  /**
   * F-01: tingkat pemahaman mengikuti level yang tersedia pada topik terpilih.
   * Level yang tidak tersedia dinonaktifkan; jika level aktif tidak tersedia, dipindah ke level pertama yang ada.
   */
  function applyTopicLevels(option) {
    let available;
    try { available = JSON.parse(option.dataset.levels || '[]'); } catch (_) { available = []; }
    const radios = Array.prototype.slice.call(document.querySelectorAll('input[name="level"]'));
    if (!available.length) available = radios.map(function (r) { return r.value; });

    radios.forEach(function (r) {
      const ok = available.indexOf(r.value) !== -1;
      r.disabled = !ok;
      r.parentNode.title = ok ? '' : 'Tidak tersedia untuk topik ini';
    });

    const checked = radios.find(function (r) { return r.checked; });
    if (!checked || checked.disabled) {
      const pengganti = radios.find(function (r) { return !r.disabled; });
      if (!pengganti) return;
      pengganti.checked = true;
      if (contextLevel) contextLevel.textContent = pengganti.value;
      if (session) {
        session.level = pengganti.value;
        store.updateSession(session);
      }
      if (checked) addNotice('Level ' + checked.value + ' tidak tersedia untuk topik ini, diganti ke ' + pengganti.value + '.', 'lucide:gauge');
    }
  }

  const newSessionBtn = document.getElementById('btn-new-session');
  newSessionBtn.addEventListener('click', async function () {
    if (isLoading) return;
    if (!session || !session.items.length) {
      resetChat();
      return input.focus();
    }
    if (await confirmNewSession('Chat akan dikosongkan dan topik yang sama bisa dipelajari dari awal.')) {
      resetChat();
      addNotice('Sesi baru dimulai: ' + currentTopic().name + ' (' + currentLevel() + ')', 'lucide:sparkles');
      input.focus();
    }
  });

  // ==========================================================================
  // Dropdown custom topik: klik, pencarian, dan navigasi keyboard (↑ ↓ Enter Esc)
  // ==========================================================================
  const topicDropdown = (function initTopicDropdown() {
    const root = document.getElementById('topic-dropdown');
    const trigger = document.getElementById('topic-trigger');
    const panel = document.getElementById('topic-panel');
    const search = document.getElementById('topic-search');
    const listbox = document.getElementById('topic-listbox');
    const emptyState = document.getElementById('topic-empty');
    const divider = listbox.querySelector('.topic-divider');
    const triggerText = document.getElementById('topic-trigger-text');
    const triggerSub = document.getElementById('topic-trigger-sub');
    const triggerIcon = document.getElementById('topic-trigger-icon');
    const options = Array.prototype.slice.call(listbox.querySelectorAll('.topic-option'));
    let activeIndex = -1;

    function visibleOptions() {
      return options.filter(function (o) { return !o.classList.contains('hidden'); });
    }

    function setActive(option, fromMouse) {
      options.forEach(function (o) { o.removeAttribute('data-active'); });
      activeIndex = option ? visibleOptions().indexOf(option) : -1;
      if (option) {
        option.setAttribute('data-active', 'true');
        // Scroll otomatis hanya untuk navigasi keyboard, supaya hover mouse tidak membuat daftar "melompat"
        if (!fromMouse) option.scrollIntoView({ block: 'nearest' });
      }
    }

    function open() {
      panel.classList.remove('hidden');
      trigger.setAttribute('aria-expanded', 'true');
      search.value = '';
      filter('');
      const selected = options.find(function (o) { return o.getAttribute('aria-selected') === 'true'; });
      setActive(selected || options[0]);
      search.focus();
    }

    function close(returnFocus) {
      panel.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      setActive(null);
      if (returnFocus) trigger.focus();
    }

    function filter(query) {
      const q = query.trim().toLowerCase();
      let count = 0;
      options.forEach(function (o) {
        const text = (o.dataset.name + ' ' + o.dataset.sub).toLowerCase();
        const match = !q || text.indexOf(q) !== -1;
        o.classList.toggle('hidden', !match);
        if (match) count++;
      });
      if (divider) divider.classList.toggle('hidden', Boolean(q));
      emptyState.classList.toggle('hidden', count > 0);
      setActive(visibleOptions()[0] || null);
    }

    /** Menerapkan pilihan ke UI tanpa konfirmasi (dipakai juga saat melanjutkan sesi). */
    function apply(option) {
      options.forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      option.setAttribute('aria-selected', 'true');
      topicSelect.value = option.dataset.value;
      triggerText.textContent = option.dataset.name;
      triggerSub.textContent = option.dataset.sub;
      triggerIcon.setAttribute('icon', option.dataset.icon);
      if (contextTopic) contextTopic.textContent = option.dataset.name;
      applyTopicLevels(option);
    }

    async function select(option) {
      if (!option) return;
      close(true);
      if (topicSelect.value === option.dataset.value) return;

      // Satu sesi = satu topik (PRD Asumsi 3): ganti topik memulai sesi baru
      const hadSession = Boolean(session && session.items.length);
      if (!(await confirmNewSession('Mengganti topik ke "' + option.dataset.name + '" akan memulai sesi baru.'))) return;

      apply(option);
      if (hadSession) resetChat(); else session = null;
      addNotice((hadSession ? 'Sesi baru dimulai: ' : 'Topik diubah ke ') + option.dataset.name, 'lucide:book-open');
    }

    trigger.addEventListener('click', function () {
      if (panel.classList.contains('hidden')) open(); else close(true);
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        open();
      }
    });

    search.addEventListener('input', function () { filter(search.value); });

    search.addEventListener('keydown', function (e) {
      const visible = visibleOptions();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(visible[Math.min(activeIndex + 1, visible.length - 1)]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(visible[Math.max(activeIndex - 1, 0)]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        select(visible[activeIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
      } else if (e.key === 'Tab') {
        close(false);
      }
    });

    options.forEach(function (o) {
      o.addEventListener('click', function () { select(o); });
      o.addEventListener('mousemove', function () {
        if (o.getAttribute('data-active') !== 'true') setActive(o, true);
      });
    });

    // Tutup dropdown saat klik di luar komponen
    document.addEventListener('click', function (e) {
      if (!root.contains(e.target) && !panel.classList.contains('hidden')) close(false);
    });

    // Terapkan level topik yang terpilih saat halaman pertama kali dibuka
    const awal = options.find(function (o) { return o.getAttribute('aria-selected') === 'true'; });
    if (awal) applyTopicLevels(awal);

    return {
      /** @returns {boolean} true jika topik ditemukan di katalog */
      setValue: function (value) {
        const option = options.find(function (o) { return o.dataset.value === String(value || ''); });
        if (option) apply(option);
        return Boolean(option);
      },
    };
  })();

  /** Melanjutkan sesi dari halaman Riwayat: /assistant?session=<id> */
  function resumeSessionFromUrl() {
    const id = new URLSearchParams(window.location.search).get('session');
    if (!id) return;

    const saved = store.getSession(id);
    if (!saved) {
      addNotice('Sesi tidak ditemukan di riwayat browser ini. Memulai sesi baru.', 'lucide:alert-circle');
      return;
    }

    if (!topicDropdown.setValue(saved.topicId)) {
      topicDropdown.setValue('');
      if (saved.topicId) addNotice('Topik "' + saved.topicName + '" sudah tidak ada di katalog.', 'lucide:alert-circle');
    }
    const radio = document.querySelector('input[name="level"][value="' + saved.level + '"]');
    if (radio) {
      radio.checked = true;
      if (contextLevel) contextLevel.textContent = saved.level;
    }

    session = saved;
    addNotice('Melanjutkan sesi dari ' + formatTime(saved.createdAt), 'lucide:history');

    let lastAnswerRow = null;
    saved.items.forEach(function (item) {
      if (item.type === 'qa') {
        if (item.mode === 'ask') addUserBubble(item.question); else addUserBubble(null, item.mode);
        lastAnswerRow = addAiBubble(item.answer);
      } else if (item.type === 'quiz') {
        addUserBubble(null, 'quiz');
        addQuizResult(item);
      }
    });
    if (lastAnswerRow) attachActionBar(lastAnswerRow);

    // Hapus parameter dari URL agar refresh tidak memuat ulang sesi lama secara tidak sengaja
    window.history.replaceState(null, '', '/assistant');
  }

  // ==========================================================================
  // Event input
  // ==========================================================================
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input.value);
    }
  });

  input.addEventListener('input', updateCounter);

  document.querySelectorAll('.suggestion').forEach(function (btn) {
    btn.addEventListener('click', function () { ask(btn.textContent.trim()); });
  });

  resumeSessionFromUrl();
  updateCounter(); // Samakan tinggi awal kolom chat agar tidak "melompat" saat mulai mengetik
  input.focus();
})();
