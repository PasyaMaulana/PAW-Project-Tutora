// ============================================================================
// Tutora Nav Spy - penanda menu aktif di beranda mengikuti posisi scroll
// "Beranda" aktif di bagian atas, "Katalog" aktif saat bagian #katalog terlihat.
// ============================================================================
(function () {
  const section = document.getElementById('katalog');
  const links = {
    home: document.querySelector('[data-nav="home"]'),
    katalog: document.querySelector('[data-nav="katalog"]'),
  };
  if (!section || !links.home || !links.katalog) return;

  // Kelas harus sama dengan yang dipakai partials/navbar.ejs
  const ACTIVE = ['bg-brand-50', 'text-brand-700', 'font-semibold'];
  const INACTIVE = ['text-slate-600', 'hover:text-brand-700', 'hover:bg-slate-50'];
  let current = null;

  function setActive(id) {
    if (id === current) return;
    current = id;
    Object.keys(links).forEach(function (key) {
      const link = links[key];
      const aktif = key === id;
      ACTIVE.forEach(function (c) { link.classList.toggle(c, aktif); });
      INACTIVE.forEach(function (c) { link.classList.toggle(c, !aktif); });
      if (aktif) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }

  // Katalog dianggap aktif saat bagian atasnya sudah melewati ~40% tinggi layar,
  // atau saat halaman sudah di-scroll sampai bawah (katalog adalah bagian terakhir).
  function update() {
    const top = section.getBoundingClientRect().top;
    const sampaiBawah = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    setActive(top <= window.innerHeight * 0.4 || sampaiBawah ? 'katalog' : 'home');
  }

  let ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('hashchange', update);

  // Di beranda, klik "Beranda" cukup scroll halus ke atas (tanpa memuat ulang halaman)
  links.home.addEventListener('click', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.hash) window.history.replaceState(null, '', '/');
  });

  // Klik "Katalog" langsung menandai Katalog aktif (scroll halus menyusul)
  links.katalog.addEventListener('click', function () { setActive('katalog'); });

  update();
})();
