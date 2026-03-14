/* ── Frontmatter parser ─────────────────────────────────────────────── */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: text };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) return;
    const key = line.slice(0, colonIdx).trim();
    let val  = line.slice(colonIdx + 1).trim();
    // Array: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
    meta[key] = val;
  });

  return { meta, content: match[2] };
}

/* ── Main ───────────────────────────────────────────────────────────── */
async function loadPost() {
  const params = new URLSearchParams(location.search);
  const slug   = params.get('slug');
  const main   = document.getElementById('post-main');

  if (!slug) {
    main.innerHTML = '<div class="post-message">No post specified. Use <code>?slug=your-post</code>.</div>';
    return;
  }

  let raw;
  try {
    const res = await fetch(`posts/${slug}.md`);
    if (!res.ok) throw new Error(res.status);
    raw = await res.text();
  } catch (e) {
    main.innerHTML = `<div class="post-message">Post <code>${slug}</code> not found.</div>`;
    return;
  }

  const { meta, content } = parseFrontmatter(raw);
  const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);

  // Page & nav title
  const title = meta.title || slug;
  document.getElementById('page-title').textContent = `${title} — Xiayin Lou`;
  document.getElementById('nav-title').textContent  = title;

  // Configure marked
  marked.setOptions({ breaks: true, gfm: true });

  // Render markdown → HTML
  const bodyHtml = marked.parse(content);

  main.innerHTML = `
    <article class="post-article">
      <header class="post-header">
        <div class="post-meta-row">
          ${meta.date ? `<span class="post-date">${meta.date}</span>` : ''}
          ${tags.map(t => `<span class="post-tag">${t}</span>`).join('')}
        </div>
        <h1 class="post-title">${title}</h1>
        ${meta.subtitle ? `<p class="post-subtitle">${meta.subtitle}</p>` : ''}
      </header>
      <div class="post-content">${bodyHtml}</div>
    </article>
  `;

  // Syntax highlighting
  document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

  // KaTeX math rendering
  if (window.renderMathInElement) {
    renderMathInElement(document.querySelector('.post-content'), {
      delimiters: [
        { left: '$$', right: '$$', display: true  },
        { left: '$',  right: '$',  display: false },
        { left: '\\[', right: '\\]', display: true  },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }
}

loadPost();
