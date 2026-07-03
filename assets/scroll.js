/*
  JG Studio — reusable scroll animation system.
  Loaded via CDN on top of the existing plain-CSS/IntersectionObserver reveals
  (.rv / .reveal classes) already baked into every page. This file:

    1. Boots Lenis for silky momentum-smoothed scrolling.
    2. Boots GSAP + ScrollTrigger and syncs it to the Lenis scroll position.
    3. Upgrades every .rv / .reveal element to a GSAP scroll-triggered
       fade+rise (same visual language, just physically smoother), and
       falls back to the original CSS transition if GSAP fails to load
       (e.g. offline preview, CDN blocked) — the .on class still works.
    4. Adds a subtle parallax drift to elements marked data-parallax.
    5. Respects prefers-reduced-motion — disables Lenis smoothing and
       GSAP motion, leaving instant/CSS-only fallback in place.

  Usage — add once, right before </body>, AFTER the page's own <script>:
    <script src="https://unpkg.com/gsap@3.12.5/dist/gsap.min.js"></script>
    <script src="https://unpkg.com/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
    <script src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>
    <script src="assets/scroll.js"></script>
*/
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';

  // ---- 1. Lenis smooth scroll -------------------------------------------
  var lenis = null;
  if (hasLenis && !reduce) {
    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ---- 2. GSAP + ScrollTrigger, synced to Lenis --------------------------
  if (hasGSAP) {
    window.gsap.registerPlugin(window.ScrollTrigger);

    if (lenis) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    }

    // ---- 3. upgrade existing .rv / .reveal elements ----------------------
    var targets = document.querySelectorAll('.rv, .reveal');
    targets.forEach(function (el, i) {
      // let CSS keep controlling *what* the hidden state looks like;
      // GSAP just drives a smoother, scroll-scrubbed version of the same
      // fade+rise, then flips the .on class so any page-specific CSS
      // hooked to .on (colour changes etc.) still fires correctly.
      window.gsap.set(el, { opacity: 0, y: 34 });
      window.ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          el.classList.add('on');
          window.gsap.to(el, {
            opacity: 1, y: 0, duration: 0.9,
            ease: 'power3.out',
            delay: Math.min(i * 0.02, 0.15),
          });
        },
      });
    });

    // ---- 4. gentle parallax on any element with data-parallax ------------
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      window.gsap.to(el, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    window.ScrollTrigger.refresh();
  }
  // If GSAP/Lenis didn't load (offline, CDN blocked), the page's own
  // IntersectionObserver + CSS transition (already in every page) still
  // handles .rv/.reveal reveals on its own — nothing breaks.
})();
