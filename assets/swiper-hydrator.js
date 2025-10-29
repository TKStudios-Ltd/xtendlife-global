/* assets/swiper-hydrator.js */
(function () {
  'use strict';

  // Universal selector: new API = [data-swiper]; legacy = .tswiper; also supports .ts2-swiper
  const SWIPER_QS = '[data-swiper], .tswiper, .ts2-swiper';

  const toPx = (v, fallback) => {
    if (v == null) return fallback;
    const s = String(v).trim();
    if (s.endsWith('rem')) {
      const rem = parseFloat(s);
      const fs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return Math.round(rem * fs);
    }
    if (s.endsWith('px')) return Math.round(parseFloat(s));
    const n = parseFloat(s);
    return Number.isNaN(n) ? fallback : n;
  };

  const toInt  = (v, d = 0) => (Number.isNaN(parseInt(v, 10)) ? d : parseInt(v, 10));
  const toBool = (v) => String(v).toLowerCase() === 'true';

  // Optional fractional config string: "1.2|750:2.1|990:3.1"
  function parseSlides(str) {
    const cfg = { base: 1.2, bp: {} };
    if (!str) return cfg;
    for (const part of String(str).split('|')) {
      const [k, v] = part.split(':');
      if (v == null) cfg.base = parseFloat(k);
      else cfg.bp[parseInt(k, 10)] = { slidesPerView: parseFloat(v) };
    }
    return cfg;
  }

  function init(el) {
    if (!el || el.dataset.swiperReady === '1') return;
    if (!window.Swiper) { setTimeout(() => init(el), 60); return; }

    // Read per-instance options (with sensible defaults)
    const mode          = (el.dataset.mode || '').toLowerCase();   // "fixed" | "fractional" | ""
    const slidesCfg     = parseSlides(el.dataset.slides);           // optional
    const gap           = toPx(el.dataset.gap ?? 20, 20);
    const speed         = toInt(el.dataset.speed ?? 500, 500);
    const autoplay      = toBool(el.dataset.autoplay || false);
    const autoplayDelay = toInt(el.dataset.autoplayDelay ?? 4000, 4000);
    const dots          = toBool(el.dataset.dots || false);
    const pagSelector   = el.dataset.pagination || '.swiper-pagination';
    const prevSel       = el.dataset.navPrev || '.ts-prev';
    const nextSel       = el.dataset.navNext || '.ts-next';

    // Scope lookups to the nearest section-like root
    const scope = el.closest('[data-swiper-root]') ||
                  el.closest('[data-testimonial-slider]') ||
                  el.closest('[data-reviews-slider]') ||
                  el.closest('section') || document;

    /** @type {import('swiper').SwiperOptions} */
    const params = {
      speed,
      spaceBetween: gap,
      watchOverflow: true
    };

    // Navigation (only if both present)
    const prevEl = scope.querySelector(prevSel);
    const nextEl = scope.querySelector(nextSel);
    if (prevEl && nextEl) params.navigation = { prevEl, nextEl };

    // Pagination (dots)
    const pagEl = scope.querySelector(pagSelector);
    if (dots && pagEl) params.pagination = { el: pagEl, clickable: true };

    // Slides per view
    if (mode === 'fixed') {
      // CSS controls width via .swiper-slide { width: ... }
      params.slidesPerView = 'auto';
    } else {
      const cfg = slidesCfg;
      params.slidesPerView = cfg.base ?? 1.2;
      params.breakpoints = Object.keys(cfg.bp).length
        ? cfg.bp
        : { 750: { slidesPerView: 2.1 }, 990: { slidesPerView: 3.1 } };
    }

    if (autoplay) params.autoplay = { delay: autoplayDelay, disableOnInteraction: false };

    const sw = new Swiper(el, params);
    el.dataset.swiperReady = '1';

    const update = () => { try { sw.update(); } catch (_) {} };
    if (document.readyState === 'complete') setTimeout(update, 0);
    else window.addEventListener('load', update, { once: true });

    el.querySelectorAll('img').forEach(img => {
      if (!img.complete) img.addEventListener('load', update, { once: true });
    });
  }

  function scan(root) {
    (root || document).querySelectorAll(SWIPER_QS).forEach(init);
  }

  // Initial scan
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
  } else {
    scan();
  }

  // Watch dynamic inserts (Theme Editor, app blocks, etc.)
  if ('MutationObserver' in window) {
    const mo = new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches?.(SWIPER_QS) || n.querySelector?.(SWIPER_QS))) scan(n);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
