// Homepage (rh-*): hero cross-fade, the section sliders, and videos that play in place.
(function () {
  var d = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero: clinic photos cross-fade every 6s; dots jump to a photo.
  var slides = d.querySelectorAll('.rh-slide');
  var dots = d.querySelectorAll('.rh-dot');
  var current = 0, timer = null;
  function show(i) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    dots[current].setAttribute('aria-pressed', 'false');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-pressed', 'true');
  }
  function start() {
    clearInterval(timer);
    if (!reduceMotion && slides.length > 1) timer = setInterval(function () { show(current + 1); }, 6000);
  }
  dots.forEach(function (dot, i) { dot.addEventListener('click', function () { show(i); start(); }); });
  start();

  if (window.Swiper) {
    var make = function (sel, opts) { var el = d.querySelector(sel); if (el) new Swiper(el, opts); };
    make('.rh-et-swiper', {
      loop: true, speed: 400, slidesPerView: 1, spaceBetween: 24,
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } },
      navigation: { prevEl: '.rh-et-prev', nextEl: '.rh-et-next' }
    });
    make('.rh-rv-swiper', {
      slidesPerView: 1, spaceBetween: 30, loop: true, centeredSlides: true,
      autoplay: reduceMotion ? false : { delay: 6000, disableOnInteraction: true },
      breakpoints: { 1024: { slidesPerView: 2.35, spaceBetween: 40 } },
      pagination: { el: '.rh-rv .swiper-pagination', clickable: true }
    });
    make('.rh-vid-swiper', {
      slidesPerView: 1, spaceBetween: 24, watchOverflow: true,
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
      navigation: { prevEl: '.rh-vid-prev', nextEl: '.rh-vid-next' },
      pagination: { el: '.rh-drn-bottom .swiper-pagination', clickable: true }
    });
    make('.rh-fp-swiper', {
      slidesPerView: 2, spaceBetween: 20, watchOverflow: true,
      breakpoints: { 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4, spaceBetween: 28 } },
      navigation: { prevEl: '.rh-fp-prev', nextEl: '.rh-fp-next' }
    });
    make('.rh-res-swiper', {
      slidesPerView: 1, spaceBetween: 20, watchOverflow: true,
      breakpoints: { 768: { slidesPerView: 2, spaceBetween: 30 }, 1024: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } },
      navigation: { prevEl: '.rh-res-prev', nextEl: '.rh-res-next' }
    });
  }

  // Videos play in place (the link still opens YouTube without JavaScript).
  d.querySelectorAll('[data-rh-video]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var frame = d.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + el.getAttribute('data-rh-video') + '?autoplay=1&rel=0';
      frame.title = el.getAttribute('aria-label') || 'Video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      el.textContent = '';
      el.appendChild(frame);
    }, { once: true });
  });
})();
