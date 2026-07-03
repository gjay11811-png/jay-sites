/* ============================================================
   JG STUDIO — WEBSITE-FOCUSED SCROLL SCENE ENGINE
   ------------------------------------------------------------
   Loads AFTER gsap.min.js, ScrollTrigger.min.js, lenis.min.js
   and assets/scroll.js (which boots Lenis + syncs ScrollTrigger).

   Every animation in this file exists to sell websites:
     · 'transform' — dated site rebuilds into a premium site (homepage)
     · 'web'       — camera zoom-through of a website mockup (reusable)
     · magnetic CTA buttons
     · before/after drag slider (works even without GSAP)

   HOW THE ENGINE WORKS
   - Any <section class="cine" data-cine="NAME"> gets picked up.
   - CINE.register('NAME', builderFn) supplies the animation.
   - Builders create a pinned, scrubbed GSAP timeline, so scrolling
     down plays the scene and scrolling up reverses it perfectly.
   - CSS defines the FINAL composed state; builders set the INITIAL
     states with gsap.set. If GSAP is missing or the user prefers
     reduced motion, html.cine-static is added and scenes render as
     clean static sections.

   RE-THEMING THE TRANSFORMATION FOR A BARBER / GYM / RESTAURANT
   - No JS changes needed. Copy the .cine-tf section in index.html,
     keep data-cine="transform", and edit only the text inside
     .tf-old (their dated site) and .tf-new (the premium rebuild).
     The timeline targets classes, not content.

   ADDING A BRAND-NEW SCENE TYPE
     CINE.register('myscene', function (el) {
       gsap.set(el.querySelector('.thing'), { autoAlpha: 0, y: 40 });
       var tl = pinTl(el, '+=250%');
       tl.to(el.querySelector('.thing'), { autoAlpha: 1, y: 0 });
     });
   then add <section class="cine" data-cine="myscene">…</section>.
   ============================================================ */

(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- before/after slider (no GSAP needed) ---------- */
  document.querySelectorAll('.ba-wrap').forEach(function (wrap) {
    function setPos(clientX) {
      var r = wrap.getBoundingClientRect();
      var pct = Math.max(4, Math.min(96, (clientX - r.left) / r.width * 100));
      wrap.style.setProperty('--ba', pct + '%');
    }
    var dragging = false;
    wrap.addEventListener('pointerdown', function (e) { dragging = true; wrap.setPointerCapture(e.pointerId); setPos(e.clientX); });
    wrap.addEventListener('pointermove', function (e) { if (dragging) setPos(e.clientX); });
    wrap.addEventListener('pointerup', function () { dragging = false; });
    wrap.addEventListener('pointercancel', function () { dragging = false; });
  });

  if (!hasGSAP || reduce) {
    document.documentElement.classList.add('cine-static');
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* ---------- shared presets (tune everything here) ---------- */
  var PRESETS = {
    ease: 'power2.inOut',
    pop: 'back.out(1.6)',
    scrub: 1,                        // 1s catch-up = weighty, premium
    len: { transform: '+=280%', web: '+=300%' }
  };

  function pinTl(el, end) {
    return gsap.timeline({
      defaults: { ease: PRESETS.ease },
      scrollTrigger: {
        trigger: el, start: 'top top', end: end,
        scrub: PRESETS.scrub, pin: true, anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  }

  var CINE = { scenes: {}, presets: PRESETS,
    register: function (name, fn) { this.scenes[name] = fn; } };
  window.CINE = CINE;

  /* =================================================
     'transform' — THE sales scene.
     A dated local-business site rebuilds itself into a
     premium site, piece by piece, driven by scroll.
     ================================================= */
  CINE.register('transform', function (el) {
    var q = function (s) { return el.querySelector(s); };
    var qa = function (s) { return el.querySelectorAll(s); };
    var head = q('.cine-head'), rig = q('.tf-rig');
    var old = q('.tf-old'), oldBits = old ? old.children : [];
    var hero = q('.tf-hero'), line = q('.tf-hero .tf-line'), ncta = q('.tf-hero .tf-ncta');
    var cards = qa('.tf-card'), trust = qa('.tf-trust span');
    var phone = q('.tf-phone');
    var lblOld = q('.tf-label-old'), lblNew = q('.tf-label-new');

    /* initial states — CSS holds the final (premium) look */
    gsap.set(head, { autoAlpha: 0, y: 20 });
    gsap.set(rig, { autoAlpha: 0, y: 46, scale: 0.96 });
    gsap.set(old, { autoAlpha: 1 });                       // BEFORE shown first
    gsap.set([hero, line, ncta], { autoAlpha: 0 });
    gsap.set(hero, { y: 26 });
    gsap.set(line, { scaleX: 0, transformOrigin: '0 50%' });
    gsap.set(ncta, { scale: 0.6 });
    gsap.set(cards, { autoAlpha: 0, y: 30 });
    gsap.set(trust, { autoAlpha: 0, scale: 0.7 });
    gsap.set(phone, { autoAlpha: 0, x: 90, y: 20 });
    gsap.set(lblNew, { autoAlpha: 0 });

    var tl = pinTl(el, PRESETS.len.transform);
    /* 1. settle on the dated site */
    tl.to(head, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
      .to(rig, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9 }, 0.1)
      /* 2. the old site falls away, piece by piece */
      .to(oldBits, { autoAlpha: 0, y: -14, duration: 0.5, stagger: 0.14 }, 1.4)
      .to(old, { autoAlpha: 0, duration: 0.5 }, 2.1)
      .to(lblOld, { autoAlpha: 0.25, duration: 0.4 }, 2.1)
      .to(lblNew, { autoAlpha: 1, duration: 0.4 }, 2.3)
      /* 3. the premium site snaps into place */
      .to(hero, { autoAlpha: 1, y: 0, duration: 0.7 }, 2.4)
      .to(line, { autoAlpha: 1, scaleX: 1, duration: 0.5 }, 2.8)
      .to(ncta, { autoAlpha: 1, scale: 1, duration: 0.5, ease: PRESETS.pop }, 3.0)
      .to(cards, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.18 }, 3.2)
      .to(trust, { autoAlpha: 1, scale: 1, duration: 0.45, stagger: 0.15, ease: PRESETS.pop }, 3.8)
      /* 4. mobile preview slides in — mobile-first, proven */
      .to(phone, { autoAlpha: 1, x: 0, y: 0, duration: 0.8 }, 4.2);
    return tl;
  });

  /* =================================================
     'web' — website camera zoom-through (reusable).
     Flies INTO a website mockup: full page → hero →
     services → portfolio → contact → CTA. Camera maths
     come from live layout, so it survives resizes.
     Add its section markup to any page to activate.
     ================================================= */
  CINE.register('web', function (el) {
    var view = el.querySelector('.wz-viewport');
    var site = el.querySelector('.wz-site');
    var head = el.querySelector('.cine-head');
    var stops = el.querySelectorAll('[data-wz-stop]');
    if (!site || !stops.length) return;

    gsap.set(view, { autoAlpha: 0, y: 40, scale: 0.94 });
    gsap.set(head, { autoAlpha: 0, y: 20 });

    function camTo(stop, zoom) {
      return function () {
        var sr = site.getBoundingClientRect();
        var tr = stop.getBoundingClientRect();
        var curScale = gsap.getProperty(site, 'scaleX') || 1;
        var cx = (tr.left - sr.left) / curScale + tr.width / curScale / 2;
        var cy = (tr.top - sr.top) / curScale + tr.height / curScale / 2;
        var vw = view.clientWidth, vh = el.clientHeight * 0.62;
        return { x: vw / 2 - cx * zoom, y: vh / 2 - cy * zoom, scale: zoom };
      };
    }

    var tl = pinTl(el, PRESETS.len.web);
    tl.to(head, { autoAlpha: 1, y: 0, duration: 0.4 }, 0)
      .to(view, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8 }, 0);
    var t = 1.0;
    stops.forEach(function (stop) {
      var zoom = parseFloat(stop.getAttribute('data-wz-zoom')) || 1.8;
      tl.to(site, {
        duration: 1.0,
        x: function () { return camTo(stop, zoom)().x; },
        y: function () { return camTo(stop, zoom)().y; },
        scale: zoom
      }, t);
      t += 1.15;
    });
    tl.to(site, { x: 0, y: 0, scale: 1, duration: 1.0 }, t);
    return tl;
  });

  /* =================================================
     heroBuild — the homepage hero mockup assembles as
     you scroll (pinned + scrubbed; reverses on scroll up).
     Desktop only: on mobile / reduced motion the CSS final
     state renders as a clean static composition, because
     initial states are only ever set inside this
     matchMedia context.
     Order: frame → glow → title → content bars → gold CTA
     → service cards → review bar → glass chips → settle.
     ================================================= */
  (function heroBuild() {
    var hm = document.getElementById('heroMock');
    var hero = document.querySelector('.hero');
    if (!hm || !hero) return;

    gsap.matchMedia().add('(min-width: 981px)', function () {
      var q = function (s) { return hm.querySelector(s); };
      var browser = q('.hm-browser'), glow = q('.hm-glow');
      var title = q('.hm-hero b'), lines = hm.querySelectorAll('.hm-hero .l');
      var nav = q('.hm-nav'), btn = q('.hm-btn');
      var cards = hm.querySelectorAll('.hm-card'), rev = q('.hm-rev');
      var chipR = q('.gchip.g2'), chipL = q('.gchip.g3'), chipB = q('.gchip.g4');

      /* initial states — CSS holds the finished composition */
      gsap.set(browser, { autoAlpha: 0, y: 34, scale: 0.9 });
      gsap.set(glow, { autoAlpha: 0, scale: 0.55, transformOrigin: '50% 50%' });
      gsap.set(nav, { autoAlpha: 0, y: -10 });
      gsap.set(title, { autoAlpha: 0, x: -22 });
      gsap.set(lines, { scaleX: 0, transformOrigin: '0 50%' });
      gsap.set(btn, { autoAlpha: 0, scale: 0.55, transformOrigin: '0 50%' });
      gsap.set(cards, { autoAlpha: 0, y: 24 });
      gsap.set(rev, { autoAlpha: 0, y: 22 });
      gsap.set(chipR, { autoAlpha: 0, y: -26, x: 14 });
      gsap.set(chipL, { autoAlpha: 0, x: -30 });
      gsap.set(chipB, { autoAlpha: 0, y: 26, x: 10 });

      var tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: hero, start: 'top top', end: '+=120%',
          scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      tl.to(browser, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.inOut' }, 0)
        .to(glow, { autoAlpha: 1, scale: 1, duration: 1.1 }, 0.1)
        .to(nav, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.7)
        .to(title, { autoAlpha: 1, x: 0, duration: 0.5 }, 0.9)
        .to(lines, { scaleX: 1, duration: 0.45, stagger: 0.15 }, 1.1)
        .to(btn, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }, 1.5)
        .to(cards, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.18 }, 1.8)
        .to(rev, { autoAlpha: 1, y: 0, duration: 0.55 }, 2.4)
        .to(chipR, { autoAlpha: 1, y: 0, x: 0, duration: 0.5 }, 2.8)
        .to(chipL, { autoAlpha: 1, x: 0, duration: 0.5 }, 3.0)
        .to(chipB, { autoAlpha: 1, y: 0, x: 0, duration: 0.5 }, 3.2);
      return function () { /* matchMedia cleanup handled by GSAP */ };
    });
  })();

  /* ---------- boot: wire every [data-cine] section ---------- */
  document.querySelectorAll('[data-cine]').forEach(function (el) {
    var name = el.getAttribute('data-cine');
    if (CINE.scenes[name]) CINE.scenes[name](el);
  });

  /* ---------- magnetic CTA buttons ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = parseFloat(btn.getAttribute('data-magnetic')) || 0.3;
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * strength, y: dy * strength, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  ST.refresh();
})();
