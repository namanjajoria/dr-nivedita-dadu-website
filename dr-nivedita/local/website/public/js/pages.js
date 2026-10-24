// Inner pages: tabs, listings, gallery pages, clinic gallery and the Technologies video hotspots.
// Loaded after main.js (header, forms, press slider and video cards live there).
(function () {
  var d = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tabs (Experience / Education). Without JavaScript both panels simply show.
  d.querySelectorAll('[data-tabs]').forEach(function (tabs) {
    var list = tabs.querySelector('.tab-list');
    var buttons = tabs.querySelectorAll('.tab-btn');
    var panels = tabs.querySelectorAll('.tab-panel');
    function select(index, focus) {
      buttons.forEach(function (button, i) {
        var active = i === index;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
        if (active && focus) button.focus();
      });
    }
    buttons.forEach(function (button, i) {
      button.addEventListener('click', function () { select(i); });
      button.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          select((i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length, true);
        }
      });
    });
    select(0);
    list.classList.add('is-ready');
  });

  // Treatment listing: "View all" opens the rest of the cards (they are already in the page).
  d.querySelectorAll('.svc-more').forEach(function (button) {
    button.addEventListener('click', function () {
      var list = button.closest('.listing-main').querySelector('.svc-list');
      list.classList.remove('is-collapsed');
      var first = list.querySelector('.svc-item.is-more a, .lst-card.is-more a');
      if (first) first.focus({ preventScroll: true });
    });
  });

  // Conditions listing: the filter buttons show one group in place (no category pages exist).
  d.querySelectorAll('[data-filterable]').forEach(function (section) {
    var buttons = section.querySelectorAll('.filter-item[data-filter]');
    var list = section.querySelector('.svc-list');
    var cards = section.querySelectorAll('.svc-item[data-group]');
    var count = section.querySelector('[data-count]');
    function apply(group) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = group === 'all' || card.getAttribute('data-group') === group;
        card.hidden = !match;
        if (match) shown++;
      });
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-filter') === group;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      // a chosen group shows all its cards; "All" goes back to the short list
      list.classList.toggle('is-collapsed', group === 'all' && !section.classList.contains('is-expanded'));
      if (count) count.textContent = shown;
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.getAttribute('data-filter'));
        list.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
    section.querySelectorAll('.svc-more').forEach(function (m) {
      m.addEventListener('click', function () { section.classList.add('is-expanded'); });
    });
  });

  // Gallery pages (videos, results, video testimonials): show the first batch, "Load more"
  // adds the next one, and the category buttons filter in place. Without JavaScript
  // everything shows.
  d.querySelectorAll('[data-gallery]').forEach(function (section) {
    var items = Array.prototype.slice.call(section.querySelectorAll('[data-item]'));
    var step = parseInt(section.getAttribute('data-step'), 10) || 24;
    var more = section.querySelector('.gal-more');
    var count = section.querySelector('[data-count]');
    var buttons = section.querySelectorAll('button[data-filter]');
    var grid = items.length ? items[0].parentElement : null;
    var group = 'all';
    var limit = step;
    function matching() {
      return items.filter(function (item) { return group === 'all' || item.getAttribute('data-group') === group; });
    }
    function render() {
      var match = matching();
      items.forEach(function (item) { item.hidden = true; });
      match.forEach(function (item, i) { item.hidden = i >= limit; });
      if (more) more.hidden = match.length <= limit;
      if (count) count.textContent = match.length;
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        group = b.getAttribute('data-filter');
        limit = step;
        buttons.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-pressed', String(on));
        });
        render();
        if (grid) grid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
    if (more) {
      more.addEventListener('click', function () {
        var first = matching()[limit];
        limit += step;
        render();
        if (first) first.focus({ preventScroll: true });
      });
    }
    render();
    // /results/#acne etc. (links from the treatment pages' result cards) open that category
    var fromHash = location.hash.replace('#', '');
    if (fromHash) buttons.forEach(function (b) { if (b.getAttribute('data-filter') === fromHash) b.click(); });
  });

  // Blog-style lists (blog, health tips, press, testimonials): numbered pages (DMC). The page
  // number is kept in ?page= so Back returns to the same page. Without JavaScript every item
  // shows.
  d.querySelectorAll('[data-blog]').forEach(function (section) {
    var posts = Array.prototype.slice.call(section.querySelectorAll('[data-item]'));
    var per = parseInt(section.getAttribute('data-per-page'), 10) || 10;
    var total = Math.ceil(posts.length / per);
    var nav = section.querySelector('.blog-pagination');
    var grid = posts.length ? posts[0].parentElement : null;
    if (!nav || total < 2) return;
    var current = parseInt(new URLSearchParams(location.search).get('page'), 10) || 1;
    current = Math.min(Math.max(current, 1), total);

    function button(label, page, extra) {
      var b = d.createElement('button');
      b.type = 'button';
      b.className = 'blog-page' + (extra ? ' ' + extra : '');
      b.textContent = label;
      b.setAttribute('data-page', page);
      return b;
    }
    function gap() {
      var s = d.createElement('span');
      s.className = 'blog-page-gap';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = '…';
      return s;
    }
    function render() {
      posts.forEach(function (post, i) { post.hidden = Math.floor(i / per) !== current - 1; });
      nav.textContent = '';
      var prev = button('Previous', current - 1, 'blog-page--step');
      prev.disabled = current === 1;
      nav.appendChild(prev);
      var shown = [1, total, current - 1, current, current + 1];
      var last = 0;
      for (var p = 1; p <= total; p++) {
        if (shown.indexOf(p) === -1) continue;
        if (p - last > 1) nav.appendChild(gap());
        var b = button(String(p), p);
        b.setAttribute('aria-label', 'Page ' + p);
        if (p === current) b.setAttribute('aria-current', 'page');
        nav.appendChild(b);
        last = p;
      }
      var next = button('Next', current + 1, 'blog-page--step');
      next.disabled = current === total;
      nav.appendChild(next);
      section.dispatchEvent(new CustomEvent('pager:render', { bubbles: true }));
    }
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('.blog-page');
      if (!b || b.disabled) return;
      current = parseInt(b.getAttribute('data-page'), 10);
      render();
      var url = new URL(location.href);
      if (current === 1) url.searchParams.delete('page'); else url.searchParams.set('page', current);
      history.replaceState(null, '', url);
      grid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      var first = grid.querySelector('[data-item]:not([hidden])');
      var target = first && (first.querySelector('.blog-card-title a') || first);
      if (target) target.focus({ preventScroll: true });
    });
    nav.hidden = false;
    render();
  });

  // "Show More / Show Less" (health tips, testimonials). A button marked data-fit only shows
  // when its text is actually cut short; that is re-checked when a page of items is shown.
  var toggles = Array.prototype.slice.call(d.querySelectorAll('.tip-more'));
  function fit() {
    toggles.forEach(function (button) {
      if (!button.hasAttribute('data-fit')) return;
      var text = d.getElementById(button.getAttribute('aria-controls'));
      if (text.classList.contains('is-open')) return;
      button.hidden = text.scrollHeight <= text.clientHeight + 1;
      text.classList.toggle('is-cut', !button.hidden);
    });
  }
  toggles.forEach(function (button) {
    var text = d.getElementById(button.getAttribute('aria-controls'));
    button.hidden = false;
    button.addEventListener('click', function () {
      var open = text.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Show Less' : 'Show More';
    });
  });
  fit();
  d.addEventListener('pager:render', fit);
  window.addEventListener('resize', fit);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);

  // Results category pages: 9 cards per page with Previous / numbers / Next (as on the reference site).
  d.querySelectorAll('[data-rcd-grid]').forEach(function (grid) {
    var cards = Array.prototype.slice.call(grid.children);
    var nav = grid.parentElement.querySelector('.rcd-pagination');
    var per = 9, pages = Math.ceil(cards.length / per), page = 0;
    if (!nav || pages < 2) return;
    function btn(label, cls, go) {
      var b = d.createElement('button');
      b.type = 'button'; b.className = 'rcd-page-btn' + (cls ? ' ' + cls : ''); b.textContent = label;
      b.addEventListener('click', function () { render(go()); grid.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });
      return b;
    }
    function render(p) {
      page = Math.max(0, Math.min(pages - 1, p));
      cards.forEach(function (c, i) { c.hidden = Math.floor(i / per) !== page; });
      nav.textContent = '';
      var prev = btn('« Previous', 'rcd-page-prev', function () { return page - 1; }); prev.disabled = page === 0; nav.appendChild(prev);
      for (var i = 0; i < pages; i++) (function (n) {
        var b = btn(String(n + 1), n === page ? 'is-active' : '', function () { return n; });
        if (n === page) b.setAttribute('aria-current', 'page');
        nav.appendChild(b);
      })(i);
      var next = btn('Next »', 'rcd-page-next', function () { return page + 1; }); next.disabled = page === pages - 1; nav.appendChild(next);
    }
    nav.hidden = false;
    render(0);
  });

  // Old links like /results/#acne open the matching category page.
  if (/\/results\/?$/.test(location.pathname) && location.hash) {
    var oldGroups = { acne: 'acne-treatment', 'acne-scar': 'acne-scars', 'anti-ageing': 'anti-ageing-therapies', haircare: 'hair-fall', laser: 'laser-hair-removal', skin: 'pigmentation', mesotherapy: 'pigmentation', photofacial: 'premium-services' };
    var target = oldGroups[location.hash.slice(1)];
    if (target) location.replace(location.pathname.replace(/\/?$/, '/') + target + '/');
  }

  // Photo viewer for [data-lightbox] links (clinic gallery, results). Prev / next move
  // through the photos currently shown in the same grid; without JavaScript the link
  // simply opens the photo.
  var viewer = d.querySelector('.image-dialog');
  if (viewer && typeof viewer.showModal === 'function') {
    // one photo, or (results viewer) the same combined photo cropped to its before and after halves
    var photos = viewer.querySelectorAll('.image-dialog-frame img, .rcd-viewer-half img');
    var caption = viewer.querySelector('.video-dialog-title');
    var list = [];
    var index = 0;
    var from = null;
    function show(i) {
      index = (i + list.length) % list.length;
      var link = list[index];
      var thumbs = link.querySelectorAll('img');
      photos.forEach(function (p, i) {
        var thumb = thumbs[i] || thumbs[0];
        p.src = link.getAttribute('href');
        p.alt = thumb ? thumb.alt : '';
      });
      caption.textContent = link.getAttribute('data-caption') || '';
    }
    d.addEventListener('click', function (e) {
      var link = e.target.closest('[data-lightbox]');
      if (!link) return;
      e.preventDefault();
      from = link;
      list = Array.prototype.slice.call((link.closest('[data-lightbox-group]') || link.parentElement).querySelectorAll('[data-lightbox]'))
        .filter(function (x) { return !x.hidden && !x.closest('[hidden]'); });
      viewer.toggleAttribute('data-single', list.length < 2);
      show(list.indexOf(link));
      viewer.showModal();
    });
    viewer.querySelector('.image-dialog-prev').addEventListener('click', function () { show(index - 1); });
    viewer.querySelector('.image-dialog-next').addEventListener('click', function () { show(index + 1); });
    viewer.querySelector('.video-dialog-close').addEventListener('click', function () { viewer.close(); });
    viewer.addEventListener('click', function (e) { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
    viewer.addEventListener('close', function () {
      photos.forEach(function (p) { p.src = 'data:,'; });
      if (from) from.focus();
    });
  }

  // Clinic photo gallery.
  var gallery = d.querySelector('.gallery');
  if (gallery && window.Swiper) {
    new Swiper(gallery.querySelector('.gallery-swiper'), {
      loop: true,
      speed: 600,
      autoplay: reduceMotion ? false : { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
      navigation: { prevEl: gallery.querySelector('.gallery-prev'), nextEl: gallery.querySelector('.gallery-next') },
      pagination: { el: gallery.querySelector('.gallery-pagination'), clickable: true }
    });
    gallery.classList.add('is-ready');
  }

  // Technologies: hotspots and list items open the treatment video in a dialog.
  var dialog = d.querySelector('.video-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    var frameBox = dialog.querySelector('.video-dialog-frame');
    var title = dialog.querySelector('.video-dialog-title');
    var opener = null;
    function close() {
      frameBox.textContent = '';
      if (dialog.open) dialog.close();
    }
    d.querySelectorAll('[data-video-dialog]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        opener = trigger;
        var frame = d.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + trigger.getAttribute('data-video-dialog') + '?autoplay=1&rel=0';
        frame.title = trigger.getAttribute('data-title') || 'Video';
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.allowFullscreen = true;
        frameBox.textContent = '';
        frameBox.appendChild(frame);
        title.textContent = trigger.getAttribute('data-title') || '';
        dialog.showModal();
      });
    });
    dialog.querySelector('.video-dialog-close').addEventListener('click', close);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
    dialog.addEventListener('close', function () {
      frameBox.textContent = '';
      if (opener) opener.focus();
    });
  }
})();

// Treatment detail layout (sd-*): image gallery with thumbnails.
(function () {
  var d = document;

  // FAQs: smooth open/close, only one answer open at a time (like the treatment pages on dadumedicalcentre.com).
  var sdReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.querySelectorAll('.sd-faq').forEach(function (faq) {
    var items = Array.prototype.slice.call(faq.querySelectorAll('details'));
    function setOpen(item, open) {
      var answer = item.querySelector('.sd-faq-a');
      item.classList.toggle('is-active', open);
      if (sdReduce || !answer) { item.open = open; return; }
      if (open) {
        item.open = true;
        answer.style.height = '0px';
        answer.offsetHeight;
        answer.style.height = answer.scrollHeight + 'px';
      } else {
        answer.style.height = answer.scrollHeight + 'px';
        answer.offsetHeight;
        answer.style.height = '0px';
      }
      answer.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'height') return;
        answer.removeEventListener('transitionend', done);
        if (!item.classList.contains('is-active')) item.open = false;
        answer.style.height = '';
      });
    }
    items.forEach(function (item) {
      if (item.open) item.classList.add('is-active');
      item.querySelector('summary').addEventListener('click', function (e) {
        e.preventDefault();
        var opening = !item.classList.contains('is-active');
        items.forEach(function (other) { if (other !== item && other.classList.contains('is-active')) setOpen(other, false); });
        setOpen(item, opening);
      });
    });
  });

  // Before & After results slider (reference settings): 4 cards per view, 30px apart, centred when there are fewer.
  if (window.Swiper) d.querySelectorAll('[data-sd-results]').forEach(function (box) {
    new Swiper(box.querySelector('.sd-results-swiper'), {
      slidesPerView: 1, spaceBetween: 30, watchOverflow: true, centerInsufficientSlides: true,
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } },
      navigation: { prevEl: box.querySelector('.sd-results-arrow.prev'), nextEl: box.querySelector('.sd-results-arrow.next') }
    });
  });

  d.querySelectorAll('[data-sd-gallery]').forEach(function (gallery) {
    var main = gallery.querySelector('.sd-gallery-main img');
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.sd-thumb'));
    if (!main || thumbs.length < 2) return;
    var current = 0;
    function show(index) {
      current = (index + thumbs.length) % thumbs.length;
      var img = thumbs[current].querySelector('img');
      main.classList.add('is-fading');
      setTimeout(function () {
        main.src = img.getAttribute('src');
        main.alt = img.getAttribute('alt');
        main.classList.remove('is-fading');
      }, 160);
      thumbs.forEach(function (t, i) {
        t.classList.toggle('is-active', i === current);
        t.setAttribute('aria-pressed', String(i === current));
      });
    }
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    var prev = gallery.querySelector('.sd-gallery-arrow.prev');
    var next = gallery.querySelector('.sd-gallery-arrow.next');
    if (prev) prev.addEventListener('click', function () { show(current - 1); });
    if (next) next.addEventListener('click', function () { show(current + 1); });
  });
})();
