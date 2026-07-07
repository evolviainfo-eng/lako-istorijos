/* Lako istorijos — motion: ramus ir svarus */
(function () {
  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 820px)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ── Lenis smooth scroll (desktop wheel; native touch; off kai reduced) ── */
  var lenis = null;
  if (!reduced && typeof Lenis !== 'undefined' && hasGsap) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* anchor scroll su header offset */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -64 });
      else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ── header state ── */
  var head = document.querySelector('.site-head');
  function onScrollHead() {
    head.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  onScrollHead();
  window.addEventListener('scroll', onScrollHead, { passive: true });

  /* ── hero įėjimas ── */
  if (hasGsap && !reduced) {
    gsap.fromTo('.hero-title .line > span',
      { yPercent: 108 },
      { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.15, force3D: false, clearProps: 'transform' });
    gsap.fromTo(['.hero-lead', '.hero-cta', '.hero-proof'],
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.55, clearProps: 'all' });
    gsap.fromTo('.hero-meta', { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.9, clearProps: 'all' });

    /* švelnus hero parallax */
    gsap.to('.hero-media img', {
      yPercent: -9,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
  }

  /* ── reveal on scroll (clearProps trap: is-in prieš clear) ── */
  var revealTargets = [
    '.sec-head', '.svc-row', '.story-head', '.story-quote', '.story-media',
    '.istorijos-more', '.meistras-photo', '.meistras-body', '.kontaktai-body',
    '.kontaktai-map', '.faq-item', '.braukis-head', '.braukis-cap'
  ];
  revealTargets.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { el.setAttribute('data-reveal', ''); });
  });

  if (hasGsap && !reduced) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 26 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', force3D: false,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          onComplete: function () {
            el.classList.add('is-in');
            gsap.set(el, { clearProps: 'all' });
          }
        });
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── BRAUKIS: prieš/po ── */
  var ba = document.getElementById('ba');
  if (ba) {
    var after = ba.querySelector('.ba-after');
    var divider = ba.querySelector('.ba-divider');
    var range = ba.querySelector('.ba-range');
    var current = 18;

    function setSplit(p) {
      current = Math.max(0, Math.min(100, p));
      after.style.clipPath = 'inset(0 0 0 ' + current + '%)';
      divider.style.left = current + '%';
      if (range) range.value = current;
    }
    setSplit(current);

    if (!isMobile && hasGsap && !reduced) {
      /* desktop: scroll-scrub — poliravimo braukis per visą pinned sekciją */
      ScrollTrigger.create({
        trigger: '.braukis-track',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: function (self) {
          setSplit(8 + self.progress * 88);
        }
      });
      /* drag vis tiek veikia virš scrub — po scroll grąžina */
      range.addEventListener('input', function () { setSplit(parseFloat(range.value)); });
    } else {
      /* mobile / reduced: natyvus drag slankiklis */
      setSplit(50);
      if (range) range.addEventListener('input', function () { setSplit(parseFloat(range.value)); });
      var dragging = false;
      function posFromEvent(e) {
        var rect = ba.getBoundingClientRect();
        var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        setSplit((x / rect.width) * 100);
      }
      ba.addEventListener('pointerdown', function (e) { dragging = true; posFromEvent(e); });
      window.addEventListener('pointermove', function (e) { if (dragging) posFromEvent(e); });
      window.addEventListener('pointerup', function () { dragging = false; });
    }
  }

  /* ── PASLAUGOS hover-preview (desktop, pointer: fine) ── */
  if (finePointer && !isMobile && !reduced) {
    var preview = document.querySelector('.svc-preview');
    var pImg = preview.querySelector('img');
    var px = 0, py = 0, tx = 0, ty = 0, visible = false, raf = null;

    function loop() {
      px += (tx - px) * 0.14;
      py += (ty - py) * 0.14;
      preview.style.transform = 'translate(' + (px + 26) + 'px,' + (py - 120) + 'px) scale(' + (visible ? 1 : 0.92) + ')';
      raf = requestAnimationFrame(loop);
    }

    document.querySelectorAll('.svc-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var src = row.getAttribute('data-img');
        if (pImg.getAttribute('src') !== src) pImg.setAttribute('src', src);
        visible = true;
        preview.style.opacity = '1';
        if (!raf) loop();
      });
      row.addEventListener('mouseleave', function () {
        visible = false;
        preview.style.opacity = '0';
      });
      row.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    });
    preview.style.transition = 'opacity 0.3s cubic-bezier(0.16,1,0.3,1)';
  }

  /* ── PASLAUGOS mobile: inline miniatiūros ── */
  if (isMobile) {
    document.querySelectorAll('.svc-row').forEach(function (row) {
      var src = row.getAttribute('data-img');
      if (!src) return;
      var img = document.createElement('img');
      img.className = 'svc-thumb';
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.width = 128; img.height = 128;
      row.querySelector('a').prepend(img);
    });
  }

  /* ── ISTORIJOS mobile rail: skaitliukas + progresas ── */
  if (isMobile) {
    document.querySelectorAll('.story-media').forEach(function (rail) {
      var figs = rail.querySelectorAll('figure');
      if (figs.length < 2) return;
      var ui = document.createElement('div');
      ui.className = 'rail-ui';
      ui.innerHTML = '<span class="rail-count">1 / ' + figs.length + '</span><span class="rail-bar"><i></i></span>';
      rail.after(ui);
      var count = ui.querySelector('.rail-count');
      var bar = ui.querySelector('.rail-bar i');
      bar.style.width = (100 / figs.length) + '%';
      rail.addEventListener('scroll', function () {
        var max = rail.scrollWidth - rail.clientWidth;
        var p = max > 0 ? rail.scrollLeft / max : 0;
        var idx = Math.round(p * (figs.length - 1));
        count.textContent = (idx + 1) + ' / ' + figs.length;
        bar.style.transform = 'translateX(' + (p * (figs.length - 1) * 100) + '%)';
      }, { passive: true });
    });
  }

  /* ── sticky call bar: po hero, slepiasi prie kontaktų ── */
  var callBar = document.querySelector('.call-bar');
  if (callBar && isMobile) {
    var hero = document.querySelector('.hero');
    var kontaktai = document.getElementById('kontaktai');
    function onScrollBar() {
      var pastHero = window.scrollY > hero.offsetHeight * 0.7;
      var nearContact = kontaktai.getBoundingClientRect().top < window.innerHeight * 0.85;
      callBar.classList.toggle('is-visible', pastHero && !nearContact);
    }
    window.addEventListener('scroll', onScrollBar, { passive: true });
    onScrollBar();
  }
})();
