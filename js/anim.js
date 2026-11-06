/* =========================================================
   הכל להכל – Motion (https://motion.dev, vanilla build in js/vendor)
   - Hero entrance + floating product cards with scroll parallax
   - Sections and card grids reveal on scroll with stagger
   Respects prefers-reduced-motion; if Motion failed to load, the page stays fully visible.
   ========================================================= */
(function () {
  "use strict";
  var M = window.Motion;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!M || reduce) return;

  var animate = M.animate, inView = M.inView, scroll = M.scroll, stagger = M.stagger;
  var ease = [0.22, 1, 0.36, 1];
  // Motion leaves its final transform inline; clear it so CSS :hover transforms keep working
  function settle(ctrl, els) {
    var done = function () { els.forEach(function (el) { el.style.transform = ""; el.style.opacity = ""; el.removeAttribute("data-reveal"); }); };
    if (ctrl && ctrl.finished) ctrl.finished.then(done); else if (ctrl && ctrl.then) ctrl.then(done); else setTimeout(done, 1500);
  }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.documentElement.classList.add("js-motion");

  /* ---- Hero entrance ---- */
  var heroText = $$(".hero__text > *");
  heroText.forEach(function (el) { el.style.opacity = "0"; });
  settle(animate(heroText, { opacity: [0, 1], y: [24, 0] }, { delay: stagger(0.08, { startDelay: 0.1 }), duration: 0.7, ease: ease }), heroText);

  var floats = $$(".float");
  floats.forEach(function (el, i) { el.dataset.rot = ["-4", "5", "3", "-6"][i] || "0"; });
  animate(floats, { opacity: [0, 1] }, { delay: stagger(0.12, { startDelay: 0.35 }), duration: 0.8, ease: ease });
  var chips = $$(".hchip");
  animate(chips, { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.05, { startDelay: 0.8 }), duration: 0.5, ease: ease });

  /* gentle idle float + scroll parallax (transform only → GPU) */
  var hero = document.getElementById("hero");
  var progress = 0, t0 = performance.now();
  if (hero && floats.length) {
    scroll(function (p) { progress = p; }, { target: hero, offset: ["start start", "end start"] });
    (function loop(now) {
      var t = (now - t0) / 1000;
      floats.forEach(function (el, i) {
        var depth = parseFloat(el.dataset.depth || "1");
        var bob = Math.sin(t * 0.9 + i * 1.3) * 6;
        var y = bob - progress * 120 * depth;
        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) rotate(" + el.dataset.rot + "deg)";
      });
      requestAnimationFrame(loop);
    })(t0);
  }

  /* ---- Section headings reveal ---- */
  var heads = $$(".section__head, .about__text, .about__card, .contact__info, .form");
  heads.forEach(function (el) { el.setAttribute("data-reveal", ""); });
  inView(heads, function (entry) {
    settle(animate(entry.target, { opacity: [0, 1], y: [28, 0] }, { duration: 0.7, ease: ease }), [entry.target]);
  }, { margin: "0px 0px -12% 0px" });

  /* ---- Card grids: staggered reveal ---- */
  [["#cats", ".cat"], ["#prodGrid", ".prod"], [".features", ".feature"]].forEach(function (g) {
    var grid = document.querySelector(g[0]); if (!grid) return;
    var items = $$(g[1], grid);
    items.forEach(function (el) { el.setAttribute("data-reveal", ""); });
    inView(grid, function () {
      settle(animate(items, { opacity: [0, 1], y: [30, 0], scale: [0.97, 1] }, { delay: stagger(0.06), duration: 0.6, ease: ease }), items);
    }, { margin: "0px 0px -10% 0px" });
  });
})();
