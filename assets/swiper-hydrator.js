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

  function getOriginalSlides(el) {
    const wrap = el.querySelector('.swiper-wrapper');
    if (!wrap) return { wrap: null, originals: [], total: 0 };
    const originals = Array.from(wrap.children).filter(n =>
      n.nodeType === 1 &&
      n.classList.contains('swiper-slide') &&
      !n.classList.contains('swiper-slide-duplicate')
    );
    return { wrap, originals, total: originals.length };
  }

  function ensureLoopable(el, minOriginals) {
    const { wrap, originals, total } = getOriginalSlides(el);
    if (!wrap) return 0;
    if (total >= minOriginals) return total;

    console.warn('[swiper-hydrator] Duplicating slides to satisfy loop:', { have: total, need: minOriginals });
    let i = 0;
    while (wrap.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length < minOriginals) {
      const src = originals[i % originals.length];
      const clone = src.cloneNode(true);
      clone.removeAttribute('data-swiper-slide-index');
      wrap.appendChild(clone);
      i++;
    }
    const newCount = wrap.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)').length;
    return newCount;
  }

  function init(el) {
    if (!el || el.dataset.swiperReady === '1') return;
    if (!window.Swiper) { setTimeout(() => init(el), 60); return; }

    const mode          = (el.dataset.mode || '').toLowerCase();
    const slidesCfg     = parseSlides(el.dataset.slides);
    const gap           = toPx(el.dataset.gap ?? 20, 20);
    const speed         = toInt(el.dataset.speed ?? 500, 500);
    const autoplay      = toBool(el.dataset.autoplay || false);
    const autoplayDelay = toInt(el.dataset.autoplayDelay ?? 4000, 4000);
    const dots          = toBool(el.dataset.dots || false);
    const pagSelector   = el.dataset.pagination || '.swiper-pagination';
    const prevSel       = el.dataset.navPrev || '.ts-prev';
    const nextSel       = el.dataset.navNext || '.ts-next';
    const loop          = toBool(el.dataset.loop || false);
    const rewind        = toBool(el.dataset.rewind || false);
    const allowTouch    = el.dataset.allowTouchMove != null ? toBool(el.dataset.allowTouchMove) : undefined;

    const scope = el.closest('[data-swiper-root]') ||
                  el.closest('[data-testimonial-slider]') ||
                  el.closest('[data-reviews-slider]') ||
                  el.closest('section') || document;

    const isHero = el.classList.contains('hero-swiper');

    const params = {
      effect: 'slide',
      speed,
      spaceBetween: gap,
      watchOverflow: false,
      slidesPerGroup: 1
    };

    const prevEl = scope.querySelector(prevSel);
    const nextEl = scope.querySelector(nextSel);
    if (prevEl && nextEl) params.navigation = { prevEl, nextEl };

    const pagEl = scope.querySelector(pagSelector);
    if (dots && pagEl) params.pagination = { el: pagEl, clickable: true };

    if (mode === 'fixed') {
      params.slidesPerView = isHero ? 1 : 'auto';
    } else {
      const cfg = slidesCfg;
      params.slidesPerView = isHero ? 1 : (cfg.base ?? 1.2);
      params.breakpoints = isHero
        ? undefined
        : (Object.keys(cfg.bp).length
            ? cfg.bp
            : { 750: { slidesPerView: 2.1 }, 990: { slidesPerView: 3.1 } });
    }

    if (autoplay) params.autoplay = { delay: autoplayDelay, disableOnInteraction: false, stopOnLastSlide: false };
    if (allowTouch != null) params.allowTouchMove = allowTouch;

    params.loop = loop;
    params.rewind = rewind;

    if (loop) {
      params.rewind = false;

      const spv = params.slidesPerView === 'auto' ? 1 : Number(params.slidesPerView) || 1;
      const minOriginals = Math.max(2, spv + 1);
      const originalCount = ensureLoopable(el, minOriginals);

      params.loopedSlides = Math.max(originalCount, minOriginals);
      params.loopedSlidesLimit = false;
      params.loopAdditionalSlides = Math.max(2, originalCount);
      params.loopFillGroupWithBlank = true;
      params.loopPreventsSlide = false;
      params.centeredSlides = false;

      console.groupCollapsed('[swiper-hydrator] loop config');
      console.log({ originalCount, spv, minOriginals, params });
      console.groupEnd();
    } else {
      console.groupCollapsed('[swiper-hydrator] non-loop config');
      console.log({ params });
      console.groupEnd();
    }

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

    sw.on('loopFix', () => {
      console.log('[swiper-hydrator] loopFix fired');
    });
    sw.on('reachEnd', () => {
      console.log('[swiper-hydrator] reachEnd');
    });
    sw.on('fromEdge', () => {
      console.log('[swiper-hydrator] fromEdge');
    });
    sw.on('slideChange', () => {
      console.log('[swiper-hydrator] slideChange', { index: sw.realIndex });
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
