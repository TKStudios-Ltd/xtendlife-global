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

  function getWrap(el) {
    return el.querySelector('.swiper-wrapper');
  }

  function getOriginalSlides(el) {
    const wrap = getWrap(el);
    if (!wrap) return [];
    return Array.from(wrap.children).filter(n =>
      n.nodeType === 1 &&
      n.classList.contains('swiper-slide') &&
      !n.classList.contains('swiper-slide-duplicate') &&
      !n.hasAttribute('data-manual-dup')
    );
  }

  function removeManualDups(el) {
    const wrap = getWrap(el);
    if (!wrap) return;
    wrap.querySelectorAll('.swiper-slide[data-manual-dup]').forEach(n => n.remove());
  }

  function ensureMinSlides(el, minNeeded) {
    const wrap = getWrap(el);
    if (!wrap) return 0;

    removeManualDups(el);
    const originals = getOriginalSlides(el);
    let count = originals.length;

    if (count === 0) return 0;
    if (count >= minNeeded) return count;

    let i = 0;
    while (count < minNeeded) {
      const src = originals[i % originals.length];
      const clone = src.cloneNode(true);
      clone.setAttribute('data-manual-dup', '1');
      wrap.appendChild(clone);
      count++;
      i++;
    }
    return count;
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
    const loopRequested = toBool(el.dataset.loop || false);
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

    if (mode === 'single' || isHero) {
      params.slidesPerView = 1;
      params.breakpoints = undefined;
    }
    else if (mode === 'fixed') {
      params.slidesPerView = 'auto';
    }
    else {
      const cfg = slidesCfg;
      params.slidesPerView = cfg.base ?? 1.2;
      params.breakpoints = Object.keys(cfg.bp).length
        ? cfg.bp
        : {
            750: { slidesPerView: 2.1 },
            990: { slidesPerView: 3.1 }
          };
    }

    let loop = loopRequested;
    if (loop) {
      const spv = params.slidesPerView === 'auto' ? 1 : Number(params.slidesPerView) || 1;
      const minNeeded = Math.max(3, spv + 2);
      const count = ensureMinSlides(el, minNeeded);
      loop = count >= Math.max(2, spv + 1);

      params.loop = loop;
      params.rewind = false;
      params.loopedSlides = count;
      params.loopAdditionalSlides = Math.max(2, Math.min(count, 4));
      params.loopPreventsSlide = false;
      params.centeredSlides = false;
    } else {
      params.loop = false;
      params.rewind = rewind;
    }

    const pagEl = scope.querySelector(pagSelector);
    if (dots && pagEl) params.pagination = { el: pagEl, clickable: true };

    const prevEl = scope.querySelector(prevSel);
    const nextEl = scope.querySelector(nextSel);
    if (prevEl && nextEl) params.navigation = { prevEl, nextEl };

    if (autoplay) params.autoplay = {
      delay: autoplayDelay,
      disableOnInteraction: false,
      stopOnLastSlide: false
    };

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

    sw.on('loopFix', () => console.log('[swiper-hydrator] loopFix'));
    sw.on('reachEnd', () => console.log('[swiper-hydrator] reachEnd'));
    sw.on('slideChange', () => console.log('[swiper-hydrator] slideChange', { index: sw.realIndex }));
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
