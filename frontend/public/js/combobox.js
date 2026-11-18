// ============================================================================
// Tutora Combobox - dropdown custom yang tetap bisa diketik (dipakai untuk Kategori di form admin)
// Fitur: pilih dari daftar, saring sambil mengetik, buat kategori baru, navigasi keyboard (↑ ↓ Enter Esc)
// ============================================================================
(function () {
  function initCombobox(root) {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';

    const input = root.querySelector('input[role="combobox"]');
    const toggle = root.querySelector('[data-combobox-toggle]');
    const chevron = root.querySelector('[data-combobox-chevron]');
    const panel = root.querySelector('[data-combobox-panel]');
    const icon = root.querySelector('[data-combobox-icon]');
    const divider = root.querySelector('[data-combobox-divider]');
    const createItem = root.querySelector('[data-combobox-create]');
    const createText = root.querySelector('[data-combobox-create-text]');
    const emptyItem = root.querySelector('[data-combobox-empty]');
    const options = Array.prototype.slice.call(root.querySelectorAll('[data-combobox-option]'));
    let activeIndex = -1;

    const isOpen = function () { return !panel.classList.contains('hidden'); };

    function visibleItems() {
      return options.concat(createItem).filter(function (o) { return !o.classList.contains('hidden'); });
    }

    function setActive(item, fromMouse) {
      visibleItems().concat(options).forEach(function (o) { o.removeAttribute('data-active'); });
      createItem.removeAttribute('data-active');
      activeIndex = item ? visibleItems().indexOf(item) : -1;
      if (item) {
        item.setAttribute('data-active', 'true');
        if (!fromMouse) item.scrollIntoView({ block: 'nearest' });
      }
    }

    function syncSelected() {
      const v = input.value.trim().toLowerCase();
      let match = null;
      options.forEach(function (o) {
        const selected = o.dataset.value.toLowerCase() === v;
        o.setAttribute('aria-selected', selected ? 'true' : 'false');
        if (selected) match = o;
      });
      if (icon) icon.setAttribute('icon', match ? match.dataset.icon : 'lucide:tag');
      return match;
    }

    /** Menyaring pilihan; showAll = true saat dropdown dibuka lewat tombol/klik (tampilkan semua). */
    function filter(showAll) {
      const q = showAll ? '' : input.value.trim().toLowerCase();
      let count = 0;
      options.forEach(function (o) {
        const match = !q || o.dataset.value.toLowerCase().indexOf(q) !== -1;
        o.classList.toggle('hidden', !match);
        if (match) count++;
      });

      const typed = input.value.trim();
      const exact = options.some(function (o) { return o.dataset.value.toLowerCase() === typed.toLowerCase(); });
      const showCreate = Boolean(typed) && !exact && !showAll;
      createItem.classList.toggle('hidden', !showCreate);
      if (showCreate) createText.textContent = typed;

      if (divider) divider.classList.toggle('hidden', count === 0);
      emptyItem.classList.toggle('hidden', count > 0 || showCreate);

      const selected = options.find(function (o) { return o.getAttribute('aria-selected') === 'true' && !o.classList.contains('hidden'); });
      setActive(selected || visibleItems()[0] || null);
    }

    function open(showAll) {
      panel.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      if (chevron) chevron.classList.add('rotate-180');
      filter(showAll);
    }

    function close() {
      panel.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      if (chevron) chevron.classList.remove('rotate-180');
      setActive(null);
    }

    function choose(item) {
      if (!item) return;
      input.value = item === createItem ? input.value.trim() : item.dataset.value;
      syncSelected();
      close();
      input.focus();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    input.addEventListener('focus', function () { if (!isOpen()) open(true); });
    input.addEventListener('click', function () { if (!isOpen()) open(true); });
    input.addEventListener('input', function () {
      syncSelected();
      if (!isOpen()) open(false); else filter(false);
    });

    input.addEventListener('keydown', function (e) {
      const items = visibleItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen()) return open(true);
        setActive(items[Math.min(activeIndex + 1, items.length - 1)]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen()) return open(true);
        setActive(items[Math.max(activeIndex - 1, 0)]);
      } else if (e.key === 'Enter' && isOpen()) {
        e.preventDefault(); // Jangan kirim form saat memilih kategori
        choose(items[activeIndex]);
      } else if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        close();
      }
    });

    toggle.addEventListener('mousedown', function (e) { e.preventDefault(); }); // Jaga fokus tetap di input
    toggle.addEventListener('click', function () {
      if (isOpen()) close(); else { input.focus(); open(true); }
    });

    options.concat(createItem).forEach(function (item) {
      item.addEventListener('mousedown', function (e) { e.preventDefault(); });
      item.addEventListener('click', function () { choose(item); });
      item.addEventListener('mousemove', function () {
        if (item.getAttribute('data-active') !== 'true') setActive(item, true);
      });
    });

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target) && isOpen()) close();
    });

    syncSelected();
  }

  document.querySelectorAll('[data-combobox]').forEach(initCombobox);
})();
