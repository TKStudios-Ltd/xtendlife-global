// Augment predictive search with Articles when Dawn doesn't return them
// Adds tag pills (Label:: or first uppercase tag) and caps at 3 results

(function () {
  const MAX_ARTICLES = 3;

  function debounce(fn, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // --- derive a pill label from tags ---
  function derivePillTag(tags) {
    if (!Array.isArray(tags)) return '';
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.includes('Label::')) {
        const parts = tag.split('::');
        if (parts[1]) return parts[1];
      }
    }
    for (const tag of tags) {
      if (typeof tag !== 'string' || !tag.length) continue;
      const first = tag.slice(0, 1);
      if (first === first.toUpperCase()) return tag;
    }
    return '';
  }

  function pillSpanHTML(text) {
    return `<span class="article-card__pill">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
  }

  function buildArticleLI(article, idx, alreadyPresent = 0) {
    const title = article.title || '';
    const url = article.url || '#';
    const pill = derivePillTag(article.tags);

    const li = document.createElement('li');
    li.id = `predictive-search-option-article-augment-${alreadyPresent + idx + 1}`;
    li.className = 'predictive-search__list-item';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');

    li.innerHTML = `
      <a href="${url}" class="predictive-search__item link link--text" tabindex="-1">
        <div class="predictive-search__item-content predictive-search__item-content--centered">
          ${pill ? pillSpanHTML(pill) : ''}
          <p class="predictive-search__item-heading h5">${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      </a>
    `;
    return li;
  }

  async function fetchArticles(term) {
    const res = await fetch(
      `/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=article&resources[limit]=${MAX_ARTICLES}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json && json.resources && json.resources.results && json.resources.results.articles) || [];
  }

  // Inject pills into existing <li> items if suggest.json has tags
  function normalizePath(u) {
    try {
      const a = document.createElement('a');
      a.href = u;
      return a.pathname.replace(/\/+$/, '');
    } catch {
      return u;
    }
  }

  function injectPillsIntoExisting(ul, articlesFromSuggest) {
    if (!ul || !articlesFromSuggest.length) return;
    const byPath = new Map(
      articlesFromSuggest.map(a => [normalizePath(a.url || ''), a])
    );

    ul.querySelectorAll('li').forEach(li => {
      if (li.querySelector('.article-card__pill')) return;
      const link = li.querySelector('a[href]');
      if (!link) return;
      const path = normalizePath(link.getAttribute('href') || '');
      const match = byPath.get(path);
      if (!match) return;
      const pillText = derivePillTag(match.tags);
      if (!pillText) return;

      const content = li.querySelector('.predictive-search__item-content');
      if (!content) return;
      const titleEl = content.querySelector('.predictive-search__item-heading');
      const pillEl = document.createElement('span');
      pillEl.className = 'article-card__pill';
      pillEl.textContent = pillText;
      if (titleEl) {
        content.insertBefore(pillEl, titleEl);
      } else {
        content.prepend(pillEl);
      }
    });
  }

  async function tryPopulateArticles(container) {
    if (!container) return;
    const root = container.closest('predictive-search');
    if (!root) return;
    const input = root.querySelector('input[type="search"]');
    const term = (input && input.value && input.value.trim()) || '';
    if (!term) return;

    const ul = container.querySelector('#predictive-search-results-articles-list');
    if (!ul) return;

    const existing = ul.children ? ul.children.length : 0;
    const allowed = Math.max(0, MAX_ARTICLES - existing);

    const key = `__articles_fetching_${term}`;
    if (root[key]) return;
    root[key] = true;

    try {
      const articles = await fetchArticles(term);

      // Enrich any Liquid-rendered items with pills
      injectPillsIntoExisting(ul, articles);

      // If not enough items, append more from suggest.json
      if (allowed > 0 && articles.length) {
        articles.slice(0, allowed).forEach((a, i) => {
          ul.appendChild(buildArticleLI(a, i, existing));
        });
      }
    } catch (e) {
      console.warn('Article augment error', e);
    } finally {
      setTimeout(() => { root[key] = false; }, 50);
    }
  }

  function attachObserver(psEl) {
    const resultsHost = psEl.querySelector('[data-predictive-search]');
    if (!resultsHost) return;
    const debouncedPopulate = debounce(() => tryPopulateArticles(resultsHost), 60);
    const mo = new MutationObserver(debouncedPopulate);
    mo.observe(resultsHost, { childList: true, subtree: true });
    debouncedPopulate();
  }

  function initAll() {
    document.querySelectorAll('predictive-search').forEach(attachObserver);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  document.addEventListener('shopify:section:load', () => setTimeout(initAll, 50));
})();
