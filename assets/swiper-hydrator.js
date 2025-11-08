/* assets/swiper-hydrator.js */
(function () {
  'use strict';

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

  function wrap(el) { return el.querySelector('.swiper-wrapper'); }

  function getOriginalSlides(el) {
    const w = wrap(el);
    if (!w) return [];
    return Array.from(w.children).filter(n =>
      n.nodeType === 1 &&
      n.classList.contains('swiper-slide') &&
      !n.classList.contains('swiper-slide-duplicate') &&
      !n.hasAttribute('data-manual-dup')
    );
  }

  function clearManualDups(el) {
    const w = wrap(el);
    if (!w) return;
    w.querySelectorAll('.swiper-slide[data-manual-dup]').forEach(n => n.remove());
  }

  function prepareForLoop(el, spv) {
    const w = wrap(el);
    if (!w) return 0;

    clearManualDups(el);
    const base = getOriginalSlides(el);
    let count = base.length;

    // If only one slide, loop cannot work — leave as is.
    if (count <= 1) return count;

    // For exactly two slides, duplicate BOTH (A,B → A,B,A’,B’) to avoid Swiper disabling loop.
    if (count === 2) {
      for (let i = 0; i < 2; i++) {
        const clone = base[i].cloneNode(true);
        clone.setAttribute('data-manual-dup', '1');
        w.appendChild(clone);
      }
      count = 4;
      return count;
    }

    // For 3+ slides, leave as-is.
    return count;
  }

  function init(el) {
    if (!el || el.dataset.swiperReady === '1') return;
    if (el.swiper) return;
    if (!window.Swiper) { setTimeout(() => init(el), 60); return; }

    const mode          = (el.dataset.mode || '').toLowerCase();
    const slidesCfg     = parseSlides(el.dataset.slides);
    const gap           = toPx(el.dataset.gap ?? 20, 20);
    const speed         = toInt(el.dataset.speed ?? 500, 500);
    const autoplayAttr  = toBool(el.dataset.autoplay || false);
    const autoplayDelay = toInt(el.dataset.autoplayDelay ?? 4000, 4000);
    const dots          = toBool(el.dataset.dots || false);
    const pagSelector   = el.dataset.pagination || '.swiper-pagination';
    const prevSel       = el.dataset.navPrev || '.ts-prev';
    const nextSel       = el.dataset.navNext || '.ts-next';
    const loopAttr      = toBool(el.dataset.loop || false);
    const rewindAttr    = toBool(el.dataset.rewind || false);
    const allowTouch    = el.dataset.allowTouchMove != null ? toBool(el.dataset.allowTouchMove) : undefined;

    const scope = el.closest('[data-swiper-root]') ||
                  el.closest('[data-testimonial-slider]') ||
                  el.closest('[data-reviews-slider]') ||
                  el.closest('section') || document;

    const isHero = el.classList.contains('hero-swiper');

    /** @type {import('swiper').SwiperOptions} */
    const params = {
      effect: 'slide',
      speed,
      spaceBetween: gap,
      watchOverflow: false,
      slidesPerGroup: 1,
      centeredSlides: false
    };

    // Force heroes/single to 1-up everywhere to keep loop stable
    if (mode === 'single' || isHero) {
      params.slidesPerView = 1;
      params.breakpoints = {}; // <-- REQUIRED so loop doesn't break
    }
    else if (mode === 'fixed') {
      params.slidesPerView = 'auto';
    }
    else {
      const cfg = slidesCfg;
      params.slidesPerView = cfg.base ?? 1.2;
      params.breakpoints = Object.keys(cfg.bp).length
        ? cfg.bp
        : { 750: { slidesPerView: 2.1 }, 990: { slidesPerView: 3.1 } };
    }

    // Loop / rewind
    params.loop = loopAttr;
    params.rewind = loopAttr ? false : rewindAttr;

    // Prepare DOM for loop edge-cases BEFORE init
    let slideCount = getOriginalSlides(el).length;
    if (params.loop) {
      const spv = Number(params.slidesPerView) || 1;
      slideCount = prepareForLoop(el, spv);
      // If still < 2, disable loop (nothing to loop)
      if (slideCount <= 1) params.loop = false;
      params.loopedSlides = slideCount;
      params.loopAdditionalSlides = Math.min(Math.max(2, slideCount), 6);
      params.loopPreventsSlide = false;
      params.loopFillGroupWithBlank = false;
    }

    // Pagination
    const pagEl = scope.querySelector(pagSelector);
    if (dots && pagEl) params.pagination = { el: pagEl, clickable: true };

    // Nav
    const prevEl = scope.querySelector(prevSel);
    const nextEl = scope.querySelector(nextSel);
    if (prevEl && nextEl) params.navigation = { prevEl, nextEl };

    // Autoplay
    if (autoplayAttr) {
      params.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false,
        stopOnLastSlide: false
      };
    }

    if (allowTouch != null) params.allowTouchMove = allowTouch;

    const sw = new Swiper(el, params);
    el.dataset.swiperReady = '1';

    const update = () => { try { sw.update(); } catch (_) {} };
    if (document.readyState === 'complete') setTimeout(update, 0);
    else window.addEventListener('load', update, { once: true });

    el.querySelectorAll('img, source, video').forEach(node => {
      if (node.tagName === 'IMG') {
        if (!node.complete) node.addEventListener('load', update, { once: true });
      } else {
        node.addEventListener('loadeddata', update, { once: true });
        node.addEventListener('load', update, { once: true });
      }
    });
  }

  function scan(root) {
    (root || document).querySelectorAll(SWIPER_QS).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
  } else {
    scan();
  }

  if ('MutationObserver' in window) {
    const mo = new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches?.(SWIPER_QS) || n.querySelector?.(SWIPER_QS))) scan(n);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
