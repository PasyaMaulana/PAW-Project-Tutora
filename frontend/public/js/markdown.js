// ============================================================================
// Tutora Markdown - renderer Markdown sederhana dan aman (escape HTML dulu, cegah XSS)
// Dipakai halaman AI Tutor dan Riwayat Belajar.
// ============================================================================
(function () {
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Mendukung: blok kode, kode inline, tebal, miring, judul, daftar, paragraf
  function render(text) {
    const codeBlocks = [];
    let html = escapeHtml(text).replace(/```[\w-]*\n?([\s\S]*?)```/g, function (_, code) {
      codeBlocks.push('<pre class="my-2 p-3 rounded-lg bg-tutoraDark text-slate-100 text-xs font-mono overflow-x-auto"><code>' + code.trim() + '</code></pre>');
      return '\u0000' + (codeBlocks.length - 1) + '\u0000';
    });

    html = html
      .replace(/`([^`\n]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-200/70 text-[0.85em] font-mono">$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/^#{1,6}\s+(.+)$/gm, '<strong class="block text-slate-900">$1</strong>');

    const LIST_ITEM = /^\s*([-*]|\d+\.)\s+/;

    // Dalam satu blok, baris daftar yang berurutan dikelompokkan menjadi <ul>/<ol>,
    // sehingga "Berikut daftarnya:\n1. A\n2. B" tetap tampil sebagai paragraf + daftar.
    const blocks = html.split(/\n{2,}/).map(function (block) {
      if (/^\u0000\d+\u0000$/.test(block.trim())) return block.trim();

      const out = [];
      let paragraph = [];
      let list = null;

      function flushParagraph() {
        if (paragraph.length) out.push('<p>' + paragraph.join('<br>') + '</p>');
        paragraph = [];
      }
      function flushList() {
        if (!list) return;
        const tag = list.ordered ? 'ol' : 'ul';
        const cls = list.ordered ? 'list-decimal' : 'list-disc';
        out.push('<' + tag + ' class="' + cls + ' pl-5 space-y-1">' + list.items.join('') + '</' + tag + '>');
        list = null;
      }

      block.split('\n').forEach(function (line) {
        if (LIST_ITEM.test(line)) {
          flushParagraph();
          const ordered = /^\s*\d+\./.test(line);
          if (list && list.ordered !== ordered) flushList();
          if (!list) list = { ordered: ordered, items: [] };
          list.items.push('<li>' + line.replace(LIST_ITEM, '') + '</li>');
        } else if (list && /^\s{2,}\S/.test(line)) {
          // Baris lanjutan (menjorok) milik item daftar sebelumnya
          list.items[list.items.length - 1] = list.items[list.items.length - 1].replace(/<\/li>$/, '<br>' + line.trim() + '</li>');
        } else if (line.trim()) {
          flushList();
          paragraph.push(line);
        }
      });
      flushParagraph();
      flushList();
      return out.join('');
    });

    return blocks.join('').replace(/\u0000(\d+)\u0000/g, function (_, i) { return codeBlocks[Number(i)]; });
  }

  window.TutoraMarkdown = { render: render, escapeHtml: escapeHtml };
})();
