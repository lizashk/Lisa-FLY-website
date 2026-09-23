(function () {
  "use strict";

  var FLOW_BREAKPOINT = 900; // px viewport width below which we use the stacked mobile layout

  var journey = document.querySelector(".journey");
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));
  var waveNav = document.getElementById("waveNav");
  var mobileNav = document.getElementById("mobileNav");
  var root = document.documentElement;
  var body = document.body;

  /* Flags an explicit nav jump (wave-nav click, logo click, keyboard) so the
     section-transition CSS can swap to a plain crossfade instead of the
     richer scroll animation. Also immediately marks the DESTINATION section
     active and freezes updateActiveSection() until the jump settles — a fast
     multi-section scrollIntoView otherwise sweeps past every section in
     between, each briefly claiming "is-active" and flickering its own fade
     in and out. This makes an intro→outro jump read as a single crossfade
     to the destination, exactly like a one-section hop. */
  var navJumpTimer = null;
  function markNavJump(targetSection) {
    body.classList.add("nav-jump");
    if (targetSection) applyActiveState(targetSection);
    clearTimeout(navJumpTimer);
    navJumpTimer = setTimeout(function () {
      settleActiveSection();
      body.classList.remove("nav-jump");
      updateActiveSection();
    }, 1300);
  }

  /* ---------------------------------------------------------------------
     1. Build the persistent waveform nav (desktop) + compact nav (mobile)
     ------------------------------------------------------------------- */

  function buildWaveNav() {
    var barsRow = document.createElement("div");
    barsRow.className = "wave-nav__bars";

    var labelsLayer = document.createElement("div");
    labelsLayer.className = "wave-nav__labels";

    NAV_LINE_OFFSETS.forEach(function (d) {
      var line = document.createElement("span");
      line.className = "wave-nav__line";
      line.style.left = d.left + "px";
      line.style.top = d.top + "px";
      line.style.height = d.height + "px";
      labelsLayer.appendChild(line);
    });

    SECTION_KEYS.forEach(function (key) {
      // bar group
      var group = document.createElement("button");
      group.type = "button";
      group.className = "wave-nav__group";
      group.dataset.section = key;
      group.setAttribute("aria-label", "Go to " + SECTION_LABELS[key]);
      WAVEFORM_BARS[key].forEach(function (h) {
        var bar = document.createElement("span");
        bar.className = "wave-nav__bar";
        bar.style.height = h + "px";
        group.appendChild(bar);
      });
      barsRow.appendChild(group);

      // label
      var label = document.createElement("button");
      label.type = "button";
      label.className = "wave-nav__label";
      label.dataset.section = key;
      label.style.left = NAV_LABEL_OFFSETS[key] + "px";
      label.textContent = SECTION_LABELS[key];
      labelsLayer.appendChild(label);
    });

    waveNav.appendChild(barsRow);
    waveNav.appendChild(labelsLayer);

    // hover + click behaviour (desktop)
    waveNav.addEventListener("mouseover", function (e) {
      var el = e.target.closest("[data-section]");
      if (!el) return;
      setHover(el.dataset.section, true);
    });
    waveNav.addEventListener("mouseout", function (e) {
      var el = e.target.closest("[data-section]");
      if (!el) return;
      setHover(el.dataset.section, false);
    });
    waveNav.addEventListener("click", function (e) {
      var el = e.target.closest("[data-section]");
      if (!el) return;
      goToSection(el.dataset.section);
    });
  }

  function setHover(key, on) {
    waveNav.querySelectorAll('[data-section="' + key + '"]').forEach(function (el) {
      el.classList.toggle("is-hover", on);
    });
  }

  function buildMobileNav() {
    SECTION_KEYS.forEach(function (key) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "mobile-nav__item";
      item.dataset.section = key;
      item.textContent = SECTION_LABELS[key];
      item.addEventListener("click", function () { goToSection(key); });
      mobileNav.appendChild(item);
    });
  }

  /* ---------------------------------------------------------------------
     2. Responsive mode: fixed-canvas "stage" (desktop/tablet) vs stacked
        "flow" (mobile) — recomputed on resize.
     ------------------------------------------------------------------- */

  function applyResponsiveMode() {
    var w = window.innerWidth;
    // Use the scroll container's real visible height rather than
    // window.innerHeight — in some browsers (e.g. Safari with a visible
    // tab bar) the two differ, and using the wrong one lets the scaled
    // 16:9 stage overflow the viewport so its top/bottom get clipped.
    var h = (journey && journey.clientHeight) ? journey.clientHeight : window.innerHeight;
    var flow = w < FLOW_BREAKPOINT;
    body.classList.toggle("flow-mode", flow);
    body.classList.toggle("stage-mode", !flow);
    if (!flow) {
      // Contain-fit: the whole 6000x3375 stage always fits inside the
      // viewport, so real content (waveform, labels, headings, photos)
      // NEVER gets cropped, on any aspect ratio. Any leftover space is
      // absorbed by the two edge elements handled separately below
      // (intro's bottom photo, outro's corner sticker), not by cropping.
      var scale = Math.min(w / 6000, h / 3375);
      root.style.setProperty("--scale", scale);
    }
  }

  /* ---------------------------------------------------------------------
     3. Track which section is active as the user scrolls; drive nav state,
        section fade, body tone class, and mobile-nav underline/scroll.
     ------------------------------------------------------------------- */

  var currentKey = null;

  /* A page reached through the menu has already faded in; mark it so the
     per-element fade-in never restarts when the nav-jump flag is cleared
     (that restart was the "blink"). The mark is dropped as soon as the page
     stops being active, so a later visit animates normally again. */
  function settleActiveSection() {
    sections.forEach(function (sec) {
      if (sec.classList.contains("is-active")) sec.classList.add("no-rise");
    });
  }

  function applyActiveState(best) {
    sections.forEach(function (sec) {
      sec.classList.toggle("is-active", sec === best);
      if (sec !== best) sec.classList.remove("no-rise");
    });

    var key = best.dataset.section || null; // "cover" / "outro-hero" have no key -> nav shows resting state
    if (key === currentKey) return;
    currentKey = key;

    body.classList.toggle("on-cover", best.dataset.role === "cover");

    var tone = best.dataset.tone || "dark";
    waveNav.setAttribute("data-tone", tone);

    waveNav.querySelectorAll(".wave-nav__group, .wave-nav__label").forEach(function (el) {
      el.classList.toggle("is-active", key && el.dataset.section === key);
    });

    mobileNav.querySelectorAll(".mobile-nav__item").forEach(function (el) {
      var active = key && el.dataset.section === key;
      el.classList.toggle("is-active", active);
      if (active) el.scrollIntoView({ inline: "center", block: "nearest" });
    });
  }

  function updateActiveSection() {
    // While an explicit nav jump is in flight, the destination was already
    // applied instantly by markNavJump() — skip re-scanning scroll position
    // so a fast multi-section scroll doesn't flicker is-active across every
    // section it sweeps past on the way.
    if (body.classList.contains("nav-jump")) return;

    var viewportCenter = journey.scrollTop + journey.clientHeight / 2;
    var best = sections[0];
    var bestDist = Infinity;
    sections.forEach(function (sec) {
      var center = sec.offsetTop + sec.offsetHeight / 2;
      var dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) { bestDist = dist; best = sec; }
    });

    applyActiveState(best);
  }

  /* ---------------------------------------------------------------------
     4. Navigation helpers
     ------------------------------------------------------------------- */

  function goToSection(key) {
    var target = sections.find(function (s) { return s.dataset.section === key; });
    if (target) navigateTo(target);
  }

  function goToRole(role) {
    var target = sections.find(function (s) { return s.dataset.role === role; });
    if (target) navigateTo(target);
  }

  /* All menu navigation — adjacent or far — uses the same crossfade: the
     current view fades into the destination's background, the scroll jumps
     instantly while hidden, then the content fades in. No native smooth
     scroll (its easing read as abrupt on a one-section hop), and never a
     scroll through the sections in between. Mobile flow-mode keeps the
     simple smooth scroll. */
  /* DROP connector: keep the hairline joining the poster's top-right corner
     to the playlist thumbnail's bottom-left corner while either image grows
     on hover. Each image scales about its own centre by the same factor the
     CSS uses (1 + 12 / (canvasWidth * scale)), so each corner moves to
     centre + (corner - centre) * factor. The line is drawn in page canvas
     coordinates and tweened over the same 220ms as the image. */
  (function () {
    var svg = document.getElementById("dropConnector");
    var poster = document.getElementById("dropPoster");
    var shot = document.getElementById("dropShot");
    if (!svg || !poster || !shot) return;
    var line = svg.querySelector("line");
    var P = { x: 1150, y: 1850 }, PC = { x: 200 + 475, y: 1850 + 475 };       // poster corner / centre
    var T = { x: 1564, y: 1578 }, TC = { x: 1550 + 640.5, y: 1227 + 887 };    // thumb corner / shot centre
    var fp = 1, fs = 1, raf = null;

    function grow(w) {
      var s = parseFloat(getComputedStyle(root).getPropertyValue("--scale")) || 1;
      return 1 + 12 / (w * s);
    }
    function draw() {
      line.setAttribute("x1", PC.x + (P.x - PC.x) * fp);
      line.setAttribute("y1", PC.y + (P.y - PC.y) * fp);
      line.setAttribute("x2", TC.x + (T.x - TC.x) * fs);
      line.setAttribute("y2", TC.y + (T.y - TC.y) * fs);
    }
    function tween(toP, toS) {
      cancelAnimationFrame(raf);
      var fromP = fp, fromS = fs, t0 = performance.now(), D = 220;
      (function step(now) {
        var k = Math.min(1, (now - t0) / D);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // ease-in-out
        fp = fromP + (toP - fromP) * e;
        fs = fromS + (toS - fromS) * e;
        draw();
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    function on(el, which, w) {
      el.addEventListener("mouseenter", function () {
        if (!body.classList.contains("stage-mode")) return;
        which === "p" ? tween(grow(w), fs) : tween(fp, grow(w));
      });
      el.addEventListener("mouseleave", function () {
        which === "p" ? tween(1, fs) : tween(fp, 1);
      });
    }
    on(poster, "p", 950);
    on(shot, "s", 1281);
  })();

  var jumpOverlay = document.createElement("div");
  jumpOverlay.className = "jump-overlay";
  document.body.appendChild(jumpOverlay);
  var JUMP_FADE_MS = 230;
  var jumping = false;

  function navigateTo(target) {
    var cur = sections.findIndex(function (s) { return s.classList.contains("is-active"); });
    var ti = sections.indexOf(target);
    if (ti === cur || jumping) return;

    if (body.classList.contains("flow-mode")) {
      markNavJump(target);
      target.scrollIntoView({ behavior: "smooth" });
      return;
    }

    jumping = true;
    body.classList.add("nav-jump");
    clearTimeout(navJumpTimer);
    jumpOverlay.style.backgroundImage = getComputedStyle(target, "::before").backgroundImage;
    jumpOverlay.classList.add("is-on");

    setTimeout(function () {
      journey.style.scrollSnapType = "none";
      journey.style.scrollBehavior = "auto";
      journey.scrollTop = target.offsetTop;
      applyActiveState(target);
      requestAnimationFrame(function () {
        journey.style.scrollSnapType = "";
        journey.style.scrollBehavior = "";
        jumpOverlay.classList.remove("is-on");
        navJumpTimer = setTimeout(function () {
          jumping = false;
          settleActiveSection();
          body.classList.remove("nav-jump");
          updateActiveSection();
        }, JUMP_FADE_MS + 350);
      });
    }, JUMP_FADE_MS);
  }

  document.querySelectorAll("[data-goto-cover]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); goToRole("cover"); });
  });

  /* ---------------------------------------------------------------------
     5. Keyboard support (Arrow/Page/Home/End)
     ------------------------------------------------------------------- */

  document.addEventListener("keydown", function (e) {
    var idx = sections.findIndex(function (s) { return s.classList.contains("is-active"); });
    if (idx === -1) return;
    if (["ArrowDown", "PageDown"].includes(e.key)) {
      e.preventDefault();
      var next = sections[Math.min(idx + 1, sections.length - 1)];
      navigateTo(next);
    } else if (["ArrowUp", "PageUp"].includes(e.key)) {
      e.preventDefault();
      var prev = sections[Math.max(idx - 1, 0)];
      navigateTo(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      navigateTo(sections[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      navigateTo(sections[sections.length - 1]);
    }
  });

  /* ---------------------------------------------------------------------
     Init
     ------------------------------------------------------------------- */

  buildWaveNav();
  buildMobileNav();
  applyResponsiveMode();
  updateActiveSection();

  window.addEventListener("resize", function () {
    applyResponsiveMode();
    updateActiveSection();
  });

  var ticking = false;
  journey.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateActiveSection(); ticking = false; });
  });
})();
