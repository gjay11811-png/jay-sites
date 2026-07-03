/* ============================================================
   JG STUDIO — CINEMATIC SCENES ENGINE
   ------------------------------------------------------------
   Loads AFTER gsap.min.js, ScrollTrigger.min.js, lenis.min.js
   and assets/scroll.js (which boots Lenis + syncs ScrollTrigger).

   HOW THE ENGINE WORKS
   - Any <section class="cine" data-cine="NAME"> gets picked up.
   - CINE.register('NAME', builderFn) supplies the animation.
   - Builders create a pinned, scrubbed GSAP timeline, so
     scrolling down plays the scene and scrolling up reverses it
     perfectly — that's native ScrollTrigger scrub behaviour.
   - CSS defines the FINAL composed state; builders set the
     INITIAL states with gsap.set. If GSAP is missing or the
     user prefers reduced motion, nothing is set/pinned and the
     scene renders as a premium static section (html.cine-static).

   ADDING A NEW SCENE (trainer / watch / phone / outfit...)
   ------------------------------------------------------------
   1. Markup:
        <section class="cine cine-car" data-cine="trainer">
          ...copy the car scene markup, swap assets/car.png
             for assets/trainer.png (transparent PNG, ~2000px wide)
        </section>
   2. Register (anywhere after this file loads, or add below):
        CINE.register('trainer', CINE.builders.productReveal({
          zoomFrom: 1.25,     // camera start scale
          separate: 22,       // px the slices drift apart
          scanColor: null     // uses CSS defaults
        }));
   The generic productReveal preset powers ANY transparent-PNG
   product: cars, trainers, watches, phones, bottles...

   TUNING PRESETS — change CINE.presets values below to retune
   every scene at once (lengths are "scroll distance" percents).
   ============================================================ */

(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- non-GSAP features first (always run) ---------- */

  // Before/After slider — pure pointer events, no GSAP needed.
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
    // static premium fallback — scenes show final composed state
    document.documentElement.classList.add('cine-static');
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* ---------- shared presets ---------- */
  var PRESETS = {
    ease: 'power2.inOut',
    easeOut: 'power3.out',
    scrub: 1,                 // 1s catch-up = cinematic weight
    len: { car: '+=230%', burger: '+=200%', house: '+=340%', web: '+=300%' }
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

  /* ---------- registry ---------- */
  var CINE = { scenes: {}, builders: {}, presets: PRESETS,
    register: function (name, fn) { this.scenes[name] = fn; } };
  window.CINE = CINE;

  /* =================================================
     GENERIC PRESET — productReveal
     Works for any scene using the .cine-car markup
     pattern (rig + slices + scan + callouts + glass).
     ================================================= */
  CINE.builders.productReveal = function (opts) {
    opts = opts || {};
    var zoomFrom = opts.zoomFrom || 1.22;
    var separate = opts.separate || 16;
    return function (el) {
      var rig = el.querySelector('.car-rig');
      var scan = el.querySelector('.car-scan');
      var sliceT = el.querySelector('.car-slice-top');
      var sliceB = el.querySelector('.car-slice-bot');
      var callouts = el.querySelectorAll('.cine-callout');
      var glass = el.querySelectorAll('.cine-glass');
      var head = el.querySelector('.cine-head');

      // initial states (CSS holds the final look)
      gsap.set(rig, { scale: zoomFrom, y: 40, autoAlpha: 0 });
      gsap.set(scan, { left: '0%', autoAlpha: 0 });
      gsap.set(callouts, { autoAlpha: 0, x: function (i, t) { return t.classList.contains('flip') || /right/.test(getComputedStyle(t).textAlign) ? 24 : -24; } });
      gsap.set(glass, { autoAlpha: 0, y: 26 });
      gsap.set(head, { autoAlpha: 0, y: 20 });

      var tl = pinTl(el, PRESETS.len.car);
      // 1. camera settles on the product
      tl.to(head, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
        .to(rig, { autoAlpha: 1, duration: 0.5 }, 0)
        .to(rig, { scale: 1, y: 0, duration: 1.6 }, 0)
        // 2. hologram scan sweep
        .to(scan, { autoAlpha: 1, duration: 0.15 }, 1.0)
        .to(scan, { left: '100%', duration: 1.0, ease: 'none' }, 1.05)
        .to(scan, { autoAlpha: 0, duration: 0.15 }, 2.0)
        // 3. subtle magnetic part separation (no explosions)
        .to(sliceT, { y: -separate, duration: 0.9 }, 1.4)
        .to(sliceB, { y: separate * 0.7, duration: 0.9 }, 1.4)
        // 4. callouts draw in, staggered
        .to(callouts, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.25 }, 1.7)
        // 5. glass panels float up
        .to(glass, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.3 }, 2.2)
        // 6. parts settle back together — ends clean, premium
        .to([sliceT, sliceB], { y: 0, duration: 0.8 }, 3.1);
      return tl;
    };
  };

  /* scene 01 — the car (uses the generic product preset) */
  CINE.register('car', CINE.builders.productReveal({ zoomFrom: 1.22, separate: 16 }));

  /* =================================================
     scene 02 — burger layer reveal
     starts assembled → layers lift apart → labels →
     scroll up reassembles it (scrub reverse).
     ================================================= */
  CINE.register('burger', function (el) {
    var q = function (s) { return el.querySelector(s); };
    var callouts = el.querySelectorAll('.cine-callout');
    var head = el.querySelector('.cine-head');
    gsap.set(callouts, { autoAlpha: 0, y: 14 });
    gsap.set(head, { autoAlpha: 0, y: 20 });

    var tl = pinTl(el, PRESETS.len.burger);
    tl.to(head, { autoAlpha: 1, y: 0, duration: 0.5 }, 0)
      // gentle settle-in
      .from('.bg-rig', { scale: 1.12, y: 30, autoAlpha: 0, duration: 1.0 }, 0)
      // layers separate — subtle, food-brand premium, not cartoon
      .to(q('.bg-bun-top'), { y: -78, rotate: -2, duration: 1.2 }, 1.0)
      .to(q('.bg-lettuce'), { y: -44, duration: 1.2 }, 1.05)
      .to(q('.bg-cheese'), { y: -20, rotate: -4, duration: 1.2 }, 1.1)
      .to(q('.bg-patty'), { y: 10, duration: 1.2 }, 1.15)
      .to(q('.bg-bun-bot'), { y: 34, duration: 1.2 }, 1.2)
      .to(q('.bg-shadow'), { scaleX: 1.15, opacity: 0.6, duration: 1.2 }, 1.2)
      // labels
      .to(callouts, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.25 }, 1.6)
      // hold, then rebuild before release
      .to([q('.bg-bun-top'), q('.bg-lettuce'), q('.bg-cheese'), q('.bg-patty'), q('.bg-bun-bot')],
          { y: 0, rotate: 0, duration: 1.0 }, 3.0)
      .to(q('.bg-shadow'), { scaleX: 1, opacity: 1, duration: 1.0 }, 3.0);
    return tl;
  });

  /* =================================================
     scene 03 — house walkthrough camera journey
     camera "flies" from room to room: each frame scales
     up past the lens while the next fades in from depth.
     Swap the CSS-art frames for client photos and it
     becomes a real property walkthrough.
     ================================================= */
  CINE.register('house', function (el) {
    var rooms = el.querySelectorAll('.hw-room');
    var head = el.querySelector('.cine-head');
    if (!rooms.length) return;
    gsap.set(rooms, { autoAlpha: 0, scale: 0.72, filter: 'blur(6px)' });
    gsap.set(rooms[0], { autoAlpha: 1, scale: 1, filter: 'blur(0px)' });
    gsap.set(head, { autoAlpha: 0, y: 20 });

    var tl = pinTl(el, PRESETS.len.house);
    tl.to(head, { autoAlpha: 1, y: 0, duration: 0.4 }, 0);
    var t = 0.5, STEP = 1.0;
    for (var i = 0; i < rooms.length - 1; i++) {
      // current room flies past the camera...
      tl.to(rooms[i], { scale: 1.7, autoAlpha: 0, filter: 'blur(8px)', duration: STEP }, t);
      // ...next room arrives from depth
      tl.to(rooms[i + 1], { scale: 1, autoAlpha: 1, filter: 'blur(0px)', duration: STEP }, t + STEP * 0.35);
      t += STEP;
    }
    return tl;
  });

  /* =================================================
     scene 04 — website camera zoom-through
     flies INTO a website mockup: full page → hero →
     services → portfolio → contact → CTA. Camera maths
     are computed from live layout, so it stays correct
     on resize (invalidateOnRefresh).
     ================================================= */
  CINE.register('web', function (el) {
    var view = el.querySelector('.wz-viewport');
    var site = el.querySelector('.wz-site');
    var head = el.querySelector('.cine-head');
    var stops = el.querySelectorAll('[data-wz-stop]');
    if (!site || !stops.length) return;

    gsap.set(view, { autoAlpha: 0, y: 40, scale: 0.94 });
    gsap.set(head, { autoAlpha: 0, y: 20 });

    // camera transform to centre a stop element at a given zoom
    function camTo(stop, zoom) {
      return function () {
        var sr = site.getBoundingClientRect();
        var tr = stop.getBoundingClientRect();
        // element centre in the site's untransformed space
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
    stops.forEach(function (stop, i) {
      var zoom = parseFloat(stop.getAttribute('data-wz-zoom')) || 1.8;
      tl.to(site, {
        duration: 1.0,
        x: function () { return camTo(stop, zoom)().x; },
        y: function () { return camTo(stop, zoom)().y; },
        scale: zoom
      }, t);
      tl.to(stop, { '--hl': 1, duration: 0.1 }, t + 0.5);
      t += 1.15;
    });
    // pull back out to the full page at the end
    tl.to(site, { x: 0, y: 0, scale: 1, duration: 1.0 }, t);
    return tl;
  });

  /* ---------- boot: wire every [data-cine] section ---------- */
  document.querySelectorAll('[data-cine]').forEach(function (el) {
    var name = el.getAttribute('data-cine');
    if (CINE.scenes[name]) CINE.scenes[name](el);
  });

  /* ---------- premium feature: magnetic buttons ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = parseFloat(btn.getAttribute('data-magnetic')) || 0.35;
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
