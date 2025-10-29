/* Dawn — WAAPI animations for Mega Menu + Search Modal
   - Desktop: Mega menus hover + click; Search stays open while hovering summary OR panel
   - Mobile/tablet (no fine pointer): Search is click-only
*/
(() => {
  const DURATION = 350;
  const EASING = 'cubic-bezier(.2,.7,.3,1)';
  const isDesktop = () => matchMedia('(hover: hover) and (pointer:fine)').matches;

  // ----------------- MEGA MENU -----------------
  function closeSiblingMegaMenus(current) {
    document.querySelectorAll('details.mega-menu[open]').forEach((d) => {
      if (d !== current) d.__api?.close({ force: true });
    });
  }

  function bindMegaMenus(root = document) {
    root.querySelectorAll('details.mega-menu').forEach((details) => {
      if (details.__megaBound) return;
      details.__megaBound = true;

      const summary = details.querySelector('summary');
      const panel = details.querySelector('.mega-menu__content');
      if (!summary || !panel) return;

      let anim = null;
      let openState = details.hasAttribute('open');

      if (openState) {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
        panel.style.pointerEvents = 'auto';
        panel.removeAttribute('hidden');
      } else {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-16px)';
        panel.style.pointerEvents = 'none';
        panel.setAttribute('hidden', '');
      }

      const kill = () => { if (anim) { anim.cancel(); anim = null; } };

      function show() {
        if (openState) return;
        closeSiblingMegaMenus(details);
        kill();
        panel.removeAttribute('hidden');
        details.setAttribute('open', '');
        panel.style.pointerEvents = 'auto';
        anim = panel.animate(
          [{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: DURATION, easing: EASING, fill: 'forwards' }
        );
        anim.onfinish = anim.oncancel = () => { anim = null; };
        openState = true;
      }

      function hide({ force = false } = {}) {
        if (!openState && !force) return;
        kill();
        anim = panel.animate(
          [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-16px)' }],
          { duration: DURATION, easing: EASING, fill: 'forwards' }
        );
        const finish = () => {
          details.removeAttribute('open');
          panel.setAttribute('hidden', '');
          panel.style.pointerEvents = 'none';
          anim = null; openState = false;
        };
        anim.onfinish = anim.oncancel = finish;
        setTimeout(() => { if (anim) { try { anim.finish(); } catch {} } }, DURATION + 50);
      }

      details.__api = { open: show, close: hide };

      summary.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openState ? hide() : show(); });
      details.addEventListener('mouseenter', () => { if (isDesktop()) show(); });
      details.addEventListener('mouseleave', () => { if (isDesktop()) hide(); });

      details.addEventListener('keyup', (e) => { if (e.key === 'Escape' && openState) { hide(); summary.focus(); } });
      document.addEventListener('click', (evt) => { if (openState && !details.contains(evt.target)) hide(); });

      details.addEventListener('toggle', () => {
        if (details.open && !openState) { details.removeAttribute('open'); show(); }
        if (!details.open && openState) { details.setAttribute('open', ''); hide(); }
      });
    });
  }

  // ----------------- SEARCH MODAL (hover stays open, leaves close) -----------------
  function bindSearchModal(root = document) {
    const container = root.querySelector('details-modal.header__search, .header__search details-modal');
    if (!container) return;

    const details  = container.querySelector('details');
    const summary  = container.querySelector('summary');
    const panel    = container.querySelector('.search-modal.modal__content');
    const overlay  = container.querySelector('.modal-overlay');
    const closeBtn = container.querySelector('.search-modal__close-button');
    if (!details || !summary || !panel) return;
    if (details.__searchBound) return;
    details.__searchBound = true;

    const DURATION = 350;
    const EASING = 'cubic-bezier(.2,.7,.3,1)';
    const isDesktop = () => matchMedia('(hover: hover) and (pointer:fine)').matches;

    let anim = null;
    let openState = details.hasAttribute('open');

    // initial state
    if (openState) {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
      panel.style.pointerEvents = 'auto';
      panel.removeAttribute('hidden');
    } else {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-16px)';
      panel.style.pointerEvents = 'none';
      panel.setAttribute('hidden', '');
    }

    const kill = () => { if (anim) { anim.cancel(); anim = null; } };

    function openSearch() {
      if (openState) return;
      kill();
      panel.removeAttribute('hidden');
      details.setAttribute('open', '');
      panel.style.pointerEvents = 'auto';
      anim = panel.animate(
        [{ opacity: 0, transform: 'translateY(-16px)' },
        { opacity: 1, transform: 'translateY(0)' }],
        { duration: DURATION, easing: EASING, fill: 'forwards' }
      );
      anim.onfinish = anim.oncancel = () => { anim = null; };
      openState = true;
      setTimeout(() => {
        const input = panel.querySelector('input[type="search"]');
        input && input.focus({ preventScroll: true });
      }, 120);
    }

    function closeSearch({ force = false } = {}) {
      if (!openState && !force) return;
      kill();
      anim = panel.animate(
        [{ opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-16px)' }],
        { duration: DURATION, easing: EASING, fill: 'forwards' }
      );
      const finish = () => {
        details.removeAttribute('open');
        panel.setAttribute('hidden', '');
        panel.style.pointerEvents = 'none';
        anim = null; openState = false;
      };
      anim.onfinish = anim.oncancel = finish;
      setTimeout(() => { if (anim) { try { anim.finish(); } catch {} } }, DURATION + 50);
    }

    details.__api = { open: openSearch, close: closeSearch };

    summary.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      openState ? closeSearch() : openSearch();
    });

    overlay && overlay.addEventListener('click', () => closeSearch());
    closeBtn && closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeSearch(); });
    details.addEventListener('keyup', (e) => { if (e.key === 'Escape' && openState) closeSearch(); });
    document.addEventListener('click', (evt) => { if (openState && !container.contains(evt.target)) closeSearch(); });

    if (isDesktop()) {
      let inside = 0;
      let closeTO;

      const enter = () => { inside++; clearTimeout(closeTO); openSearch(); };
      const scheduleClose = () => {
        clearTimeout(closeTO);
        closeTO = setTimeout(() => { if (inside <= 0) closeSearch(); }, 120);
      };

      const leave = (ev) => {
        const to = ev.relatedTarget;
        if (to && container.contains(to)) return;
        inside = Math.max(0, inside - 1);
        scheduleClose();
      };

      summary.addEventListener('mouseenter', enter);
      panel.addEventListener('mouseenter', enter);

      summary.addEventListener('mouseleave', leave);
      panel.addEventListener('mouseleave', leave);

      container.addEventListener('mouseleave', leave);

      overlay && overlay.addEventListener('mouseenter', () => {
        inside = 0;
        closeSearch();
      });
    }
  }


  // ----------------- INIT -----------------
  const init = (root) => { bindMegaMenus(root); bindSearchModal(root); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(document));
  else init(document);
  document.addEventListener('shopify:section:load', (e) => init(e.target));
})();
