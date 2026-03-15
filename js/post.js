/* ── Strip frontmatter, return body only ───────────────────────────── */
function stripFrontmatter(text) {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[1] : text;
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

  // Fetch posts.json (metadata) and .md (body) in parallel
  let meta = {}, bodyText = '';
  try {
    const [postsRes, mdRes] = await Promise.all([
      fetch('data/posts.json'),
      fetch(`posts/${slug}.md`)
    ]);
    if (!mdRes.ok) throw new Error('md_not_found');
    const posts = postsRes.ok ? await postsRes.json() : [];
    // posts.json is the single source of truth for title/date/tags/subtitle
    meta = posts.find(p => p.slug === slug) || {};
    bodyText = await mdRes.text();
  } catch (e) {
    if (e.message === 'md_not_found') {
      main.innerHTML = `<div class="post-message">Post <code>${slug}</code> not found.</div>`;
    } else {
      main.innerHTML = `<div class="post-message">Failed to load post.</div>`;
    }
    return;
  }

  const title = meta.title || slug;
  const tags  = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);

  // Page & nav title
  document.getElementById('page-title').textContent = `${title} — Xiayin Lou`;
  document.getElementById('nav-title').textContent  = title;

  // Strip frontmatter from .md — body only
  const content  = stripFrontmatter(bodyText);
  marked.setOptions({ breaks: true, gfm: true });
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
