/* sticky-add-to-cart.js */
(() => {
  const DEBUG = false;
  const log = (...a) => DEBUG && console.log('[StickyBar]', ...a);

  // Prevent double init
  if (window.__stickyBarInit) return;
  window.__stickyBarInit = true;

  const bars = document.querySelectorAll('.p-stickybar[data-section-id]');
  if (!bars.length) return log('no bars found');

  const pageY = () => window.pageYOffset || document.documentElement.scrollTop || 0;

  // Helper: smooth scroll to selector with optional offset
  const smoothScrollTo = (sel, offset = 80) => {
    const el = sel ? document.querySelector(sel) : null;
    if (!el) return false;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior: 'smooth' });
    return true;
  };

  // Helper: inject or remove selling_plan in a form
  const setSellingPlanOnForm = (form, planId) => {
    if (!form) return;
    let sp = form.querySelector('input[name="selling_plan"]');
    if (planId) {
      if (!sp) {
        sp = document.createElement('input');
        sp.type = 'hidden';
        sp.name = 'selling_plan';
        form.appendChild(sp);
      }
      sp.value = String(planId);
    } else if (sp) {
      sp.parentNode.removeChild(sp);
    }
  };

  // Try to populate Recharge plans into a <select>
  const populateRechargePlans = (selectEl) => {
    if (!selectEl) return;
    try {
      const plans = (window.SubscriptionWidgetConfig && window.SubscriptionWidgetConfig.shopifyPlans) || [];
      // If already populated (beyond the default one-time option), skip
      if (selectEl.options.length > 1) return;

      if (Array.isArray(plans) && plans.length) {
        for (const p of plans) {
          const opt = document.createElement('option');
          opt.value = String(p.id);
          opt.textContent = p.name;
          selectEl.appendChild(opt);
        }
        log('plans populated:', plans.length);
      } else {
        log('no recharge plans yet');
      }
    } catch (e) {
      log('populate error', e);
    }
  };

  bars.forEach((bar) => {
    if (bar.dataset.ready === '1') return;
    bar.dataset.ready = '1';

    // Remove HTML hidden attribute; we control with CSS class
    if (bar.hasAttribute('hidden')) bar.removeAttribute('hidden');

    // Move to <body> so parent sticky/overflow/transform doesn’t trap it
    if (bar.parentElement !== document.body) {
      document.body.appendChild(bar);
      log('moved to <body>');
    }

    // Read config
    const triggerSelector = bar.dataset.triggerSelector || '#product-tabs-accordion';
    const offset = parseInt(bar.dataset.triggerOffset || '0', 10);
    const minScroll = parseInt(bar.dataset.minScroll || '60', 10); // must scroll at least this much

    // Optional direct form id (preferred); fallback to first product form
    const formId = bar.dataset.productFormId;
    const productForm =
      (formId && document.getElementById(formId)) ||
      document.querySelector('form[id^="product-form-"]') ||
      document.querySelector('product-form form');

    // Links mapping (from schema)
    const mapLinkToken = (token) => {
      if (!token) return null;
      if (token === 'link1') return bar.dataset.link1Selector || null;
      if (token === 'link2') return bar.dataset.link2Selector || null;
      return token; // already a selector
    };

    // Ensure hidden on load (CSS handles the slide-in)
    bar.classList.remove('is-visible');

    // Attach link clicks (smooth scroll)
    bar.querySelectorAll('.p-stickybar__links .link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const sel = mapLinkToken(a.dataset.target);
        if (!smoothScrollTo(sel, 80)) log('link target not found for', a, '→', sel);
      });
    });

    // Qty controls (optional)
    const qtyInputSticky = bar.querySelector('.p-stickybar__qty-input');
    const qtyBtns = bar.querySelectorAll('.p-stickybar__qty-btn');
    const qtyInputMain = productForm ? productForm.querySelector('input[name="quantity"]') : null;

    const clampQty = (el, val) => {
      if (!el) return val;
      const min = Number(el.min || 1);
      const step = Number(el.step || 1);
      let v = Math.max(min, Math.round(Number(val || 0) / step) * step);
      if (el.max) v = Math.min(v, Number(el.max));
      return v;
    };

    qtyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!qtyInputSticky) return;
        const delta = Number(btn.dataset.delta || 0);
        qtyInputSticky.value = clampQty(qtyInputSticky, Number(qtyInputSticky.value || 0) + delta);
      });
    });

    // Selling plan select (optional)
    const planSelect = bar.querySelector('.p-stickybar__plan-select');
    if (planSelect) {
      // Try to populate immediately…
      populateRechargePlans(planSelect);
      // …and poll a bit in case Recharge loads late
      let tries = 0;
      const poll = () => {
        if (planSelect.options.length > 1) return;
        populateRechargePlans(planSelect);
        if (++tries < 20 && planSelect.options.length <= 1) setTimeout(poll, 300);
      };
      setTimeout(poll, 300);

      planSelect.addEventListener('change', () => {
        if (!productForm) return;
        const planId = planSelect.value.trim();
        setSellingPlanOnForm(productForm, planId || '');
      });
    }

    // Add to cart → submit the main product form (mirroring qty + plan)
    const addBtn = bar.querySelector('.p-stickybar__btn');
    if (addBtn && productForm) {
      addBtn.addEventListener('click', () => {
        if (qtyInputSticky && qtyInputMain) {
          qtyInputMain.value = clampQty(qtyInputSticky, Number(qtyInputSticky.value || qtyInputSticky.min || 1));
        }
        if (planSelect) {
          const planId = planSelect.value.trim();
          setSellingPlanOnForm(productForm, planId || '');
        }
        if (typeof productForm.requestSubmit === 'function') productForm.requestSubmit();
        else productForm.submit();
      });
    }

    // Visibility logic
    let triggerEl = document.querySelector(triggerSelector);
    let baselineY = pageY();

    const trigBottom = () =>
      triggerEl ? triggerEl.getBoundingClientRect().bottom + pageY() : Infinity;

    const onScroll = () => {
      const y = pageY();
      const viewBottom = y + window.innerHeight;
      const shouldShow =
        y > baselineY + minScroll &&
        !!triggerEl &&
        viewBottom >= (trigBottom() - offset);

      bar.classList.toggle('is-visible', !!shouldShow);
      log('update', { y, baselineY, minScroll, viewBottom, trigBtm: trigBottom(), offset, shouldShow });
    };

    // Wire up
    let rafId;
    const tick = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(onScroll); };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });

    // If trigger not found yet (apps/theme editor), retry a few times
    let tTries = 0;
    const findTriggerLoop = () => {
      triggerEl = document.querySelector(triggerSelector);
      if (!triggerEl && tTries < 30) { tTries++; setTimeout(findTriggerLoop, 200); return; }
      log(triggerEl ? 'trigger found after timeout' : 'trigger still not found');
      requestAnimationFrame(onScroll);
    };

    // Initial pass
    requestAnimationFrame(onScroll);
    if (!triggerEl) findTriggerLoop();
  });
})();