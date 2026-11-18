// ============================================================================
// Tutora Modal - pengganti confirm() bawaan browser
// Pemakaian JS : const ok = await TutoraModal.confirm({ title, message, confirmText, variant, icon });
// Pemakaian form: <form data-confirm="Pesan" data-confirm-title="Judul" data-confirm-variant="danger">
// ============================================================================
(function () {
  const modal = document.getElementById('confirm-modal');
  if (!modal) return;

  const backdrop = modal.querySelector('[data-modal-backdrop]');
  const panel = modal.querySelector('[data-modal-panel]');
  const iconWrap = modal.querySelector('[data-modal-icon-wrap]');
  const btnConfirm = modal.querySelector('[data-modal-confirm]');
  const btnCancel = modal.querySelector('[data-modal-cancel]');
  const title = document.getElementById('confirm-title');
  const desc = document.getElementById('confirm-desc');
  const icon = document.getElementById('confirm-icon');

  const VARIANTS = {
    default: {
      icon: 'lucide:help-circle',
      iconWrap: 'bg-amber-50 text-amber-600 ring-amber-50/60',
      button: 'bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500/50',
    },
    danger: {
      icon: 'lucide:trash-2',
      iconWrap: 'bg-rose-50 text-rose-600 ring-rose-50/60',
      button: 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500/50',
    },
  };
  const BASE_ICON_WRAP = 'h-11 w-11 shrink-0 rounded-full ring-4 flex items-center justify-center ';
  const BASE_BUTTON = 'px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ';

  let resolver = null;
  let lastFocus = null;

  function setVisible(show) {
    backdrop.classList.toggle('opacity-0', !show);
    panel.classList.toggle('opacity-0', !show);
    panel.classList.toggle('translate-y-4', !show);
    panel.classList.toggle('sm:scale-95', !show);
  }

  function finish(result) {
    if (!resolver) return;
    const resolve = resolver;
    resolver = null;
    setVisible(false);
    document.removeEventListener('keydown', onKeydown);
    setTimeout(function () {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }, 200);
    resolve(result);
  }

  // Esc untuk batal + jaga fokus tetap di dalam modal (focus trap)
  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      finish(false);
    } else if (e.key === 'Tab') {
      const focusables = [btnCancel, btnConfirm];
      const idx = focusables.indexOf(document.activeElement);
      e.preventDefault();
      focusables[(idx + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length].focus();
    }
  }

  btnConfirm.addEventListener('click', function () { finish(true); });
  btnCancel.addEventListener('click', function () { finish(false); });
  backdrop.addEventListener('click', function () { finish(false); });

  /**
   * @param {{ title?: string, message?: string, confirmText?: string, cancelText?: string,
   *           variant?: 'default' | 'danger', icon?: string }} options
   * @returns {Promise<boolean>}
   */
  function confirm(options) {
    options = options || {};
    if (resolver) finish(false); // Tutup dialog sebelumnya jika masih terbuka

    const variant = VARIANTS[options.variant] || VARIANTS.default;
    title.textContent = options.title || 'Konfirmasi';
    desc.textContent = options.message || '';
    icon.setAttribute('icon', options.icon || variant.icon);
    iconWrap.className = BASE_ICON_WRAP + variant.iconWrap;
    btnConfirm.className = BASE_BUTTON + variant.button;
    btnConfirm.textContent = options.confirmText || 'Ya, Lanjutkan';
    btnCancel.textContent = options.cancelText || 'Batal';

    lastFocus = document.activeElement;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { setVisible(true); });
    document.addEventListener('keydown', onKeydown);
    btnCancel.focus(); // Fokus default ke "Batal" agar aksi tidak sengaja terkonfirmasi

    return new Promise(function (resolve) { resolver = resolve; });
  }

  // Form dengan atribut data-confirm otomatis memakai modal sebelum dikirim
  document.addEventListener('submit', async function (e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || !form.dataset.confirm || form.dataset.confirmed === 'true') return;
    e.preventDefault();
    const ok = await confirm({
      title: form.dataset.confirmTitle,
      message: form.dataset.confirm,
      confirmText: form.dataset.confirmText,
      variant: form.dataset.confirmVariant,
    });
    if (ok) {
      form.dataset.confirmed = 'true';
      form.submit();
    }
  });

  window.TutoraModal = { confirm: confirm };
})();
