(function () {
  var d = document;
  d.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero: DMC home slider - clinic photos cross-fade every 6s, dots jump to a photo.
  var slides = d.querySelectorAll('.hero-slide');
  var dots = d.querySelectorAll('.hero-dot');
  var current = 0, heroTimer = null;
  function showSlide(i) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    dots[current].setAttribute('aria-pressed', 'false');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    dots[current].setAttribute('aria-pressed', 'true');
  }
  function startHero() {
    clearInterval(heroTimer);
    if (!reduceMotion && slides.length > 1) heroTimer = setInterval(function () { showSlide(current + 1); }, 6000);
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { showSlide(i); startHero(); });
  });
  startHero();

  if (window.Swiper) {
    // Popular Treatments: same settings as the DMC service slider.
    var svc = d.querySelector('.svc-swiper');
    if (svc) {
      new Swiper(svc, {
        loop: true,
        speed: 300,
        slidesPerView: 1,
        spaceBetween: 25,
        breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } },
        navigation: { prevEl: '.svc-prev', nextEl: '.svc-next' }
      });
      svc.parentNode.classList.add('is-ready');
    }

    // As Featured In: DMC press logos - one row, continuous linear rotation.
    var press = d.querySelector('.press-swiper');
    if (press) {
      new Swiper(press, {
        loop: true,
        slidesPerView: 'auto',
        spaceBetween: 12,
        speed: 4000,
        allowTouchMove: false,
        autoplay: reduceMotion ? false : { delay: 0, disableOnInteraction: false },
        breakpoints: { 768: { spaceBetween: 30 } }
      });
    }

    // Real Results: DMC results slider (arrows hide when every card already fits).
    var results = d.querySelector('.results-swiper');
    if (results) {
      new Swiper(results, {
        slidesPerView: 1,
        spaceBetween: 20,
        watchOverflow: true,
        breakpoints: { 768: { slidesPerView: 2, spaceBetween: 30 } },
        navigation: { prevEl: '.results-prev', nextEl: '.results-next' }
      });
      results.parentNode.classList.add('is-ready');
    }
  }

  // Video cards play in place, like DMC's video cards (link still opens YouTube without JS).
  d.querySelectorAll('.vcard[data-video]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      var frame = d.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + card.getAttribute('data-video') + '?autoplay=1&rel=0';
      frame.title = card.getAttribute('aria-label') || 'Video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      var box = d.createElement('div');
      box.className = 'vcard is-playing';
      box.appendChild(frame);
      card.replaceWith(box);
    });
  });

  // Header pins once the hero scrolls away, hides while scrolling down and slides
  // back in on scroll up (DMC header-sticky / header-hidden); back-to-top appears later.
  var header = d.querySelector('.header');
  var toTop = d.querySelector('.to-top');
  var navToggle = d.getElementById('nav-toggle');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-fixed', y > 160);
    header.classList.toggle('is-hidden', y > 400 && y > lastY && !navToggle.checked);
    toTop.classList.toggle('is-visible', y > 600);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Back-to-top scrolls up without adding "#top" to the URL (the href is only a no-JS fallback).
  toTop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (location.hash === '#top') history.replaceState(null, '', location.pathname + location.search);
  });

  // A link to the page you are already on (Home / logo on the homepage) just scrolls to the top.
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (a.origin === location.origin && a.pathname === location.pathname && !a.hash && !a.search) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    }
  });

  // Footer columns collapse into an accordion on phones (DMC mobile footer).
  var phoneQuery = window.matchMedia('(max-width:767px)');
  d.querySelectorAll('.footer-col-toggle').forEach(function (button) {
    button.addEventListener('click', function () {
      if (!phoneQuery.matches) return;
      var open = button.closest('.footer-col').classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  // Mobile drawer: real buttons drive the CSS checkbox state and keep ARIA in sync.
  var menuButton = d.querySelector('.mobile-toggle');
  var closeButton = d.querySelector('.mobile-menu-close');
  function setMenu(open, returnFocus) {
    navToggle.checked = open;
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) closeButton.focus();
    else if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', function () { setMenu(true); });
  closeButton.addEventListener('click', function () { setMenu(false, true); });
  navToggle.addEventListener('change', function () {
    menuButton.setAttribute('aria-expanded', String(navToggle.checked));
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navToggle.checked) setMenu(false, true);
  });

  // Close the mobile drawer after choosing a link.
  d.querySelectorAll('.mobile-menu a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  // Forms post to the backend (/api/...) and show the server's reply in place.
  // Without JavaScript they still submit normally and the server answers with a page.
  d.querySelectorAll('form[data-form]').forEach(function (form) {
    var statusId = form.getAttribute('data-status');
    var status = statusId ? d.getElementById(statusId) : form.querySelector('.form-status');
    var submit = form.querySelector('[type="submit"]');

    function showStatus(message, isError) {
      status.hidden = false;
      status.classList.toggle('is-error', isError);
      status.textContent = message;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = {};
      new FormData(form).forEach(function (value, key) { payload[key] = value; });
      submit.disabled = true;

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (result) {
            var ok = response.ok && result.ok !== false;
            showStatus(result.message || (ok ? 'Thank you.' : 'Something went wrong. Please try again.'), !ok);
            if (ok) form.reset();
          });
        })
        .catch(function () {
          showStatus('We could not send your request. Please check your connection and try again.', true);
        })
        .then(function () { submit.disabled = false; });
    });
  });
})();
