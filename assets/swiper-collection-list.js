document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.collection-list-mobile');

  if (!container || typeof Swiper === 'undefined') {
    console.warn('[Swiper] Not initialized.');
    return;
  }

  if (window.innerWidth < 750) {
    console.log('[Swiper Init] Starting...');
    new Swiper(container, {
      slidesPerView: 1.5,
      spaceBetween: 0,
      loop: false
    });
  }
});
