// ============================================================================
// Tutora Quiz Card - kartu hasil Uji Pemahamanku (F-03)
// Dipakai halaman AI Tutor dan Riwayat Belajar. Membutuhkan /js/markdown.js.
// ============================================================================
(function () {
  const md = window.TutoraMarkdown;

  const STATUS_STYLE = {
    benar: { label: 'Benar', cls: 'bg-emerald-100 text-emerald-800', icon: 'lucide:check-circle-2', iconCls: 'text-emerald-600' },
    sebagian: { label: 'Sebagian', cls: 'bg-amber-100 text-amber-800', icon: 'lucide:circle-dot', iconCls: 'text-amber-500' },
    salah: { label: 'Perlu Dipelajari', cls: 'bg-rose-100 text-rose-800', icon: 'lucide:x-circle', iconCls: 'text-rose-500' },
  };

  /** Kartu hasil uji. Dipakai juga oleh halaman Riwayat (window.TutoraQuizCard). */
  function buildQuizResultCard(result) {
    const passed = result.score >= 2;
    const card = document.createElement('div');
    card.className = 'rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 space-y-3 text-sm';
    card.innerHTML =
      '<div class="flex items-center justify-between gap-3 flex-wrap">' +
        '<p class="font-bold text-slate-900 flex items-center gap-2"><iconify-icon icon="lucide:clipboard-check" width="16" height="16" class="text-brand-600"></iconify-icon>Hasil Uji Pemahamanku</p>' +
        '<span class="px-2.5 py-1 rounded-full text-xs font-bold ' + (passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' +
          result.score + '/' + result.total + ' benar</span>' +
      '</div>' +
      '<ol class="space-y-3"></ol>' +
      '<div class="quiz-summary rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 leading-relaxed"></div>';

    const list = card.querySelector('ol');
    result.results.forEach(function (r, i) {
      const s = STATUS_STYLE[r.status] || STATUS_STYLE.salah;
      const li = document.createElement('li');
      li.className = 'rounded-xl border border-slate-100 p-3';
      li.innerHTML =
        '<div class="flex items-start justify-between gap-2">' +
          '<p class="font-medium text-slate-800 flex gap-2"><span class="text-slate-400">' + (i + 1) + '.</span><span class="q"></span></p>' +
          '<span class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ' + s.cls + '">' +
            '<iconify-icon icon="' + s.icon + '" width="12" height="12"></iconify-icon>' + s.label + '</span>' +
        '</div>' +
        '<p class="mt-1.5 text-xs text-slate-500"><span class="font-semibold text-slate-600">Jawabanmu:</span> <span class="a"></span></p>' +
        '<div class="mt-2 text-xs text-slate-700 leading-relaxed flex gap-1.5"><iconify-icon icon="lucide:message-circle" width="13" height="13" class="mt-0.5 shrink-0 ' + s.iconCls + '"></iconify-icon><div class="f"></div></div>';
      li.querySelector('.q').textContent = r.question;
      li.querySelector('.a').textContent = r.answer;
      li.querySelector('.f').innerHTML = md.render(r.feedback);
      list.appendChild(li);
    });

    const summary = card.querySelector('.quiz-summary');
    if (result.summary) summary.innerHTML = '<strong class="text-slate-800">Ringkasan:</strong> ' + md.escapeHtml(result.summary);
    else summary.remove();
    return card;
  }

  window.TutoraQuizCard = buildQuizResultCard;
})();
