(function () {
  "use strict";

  var FLOW_BREAKPOINT = 900; // px viewport width below which we use the stacked mobile layout

  var journey = document.querySelector(".journey");
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section"));
  var waveNav = document.getElementById("waveNav");
  var mobileNav = document.getElementById("mobileNav");
  var root = document.documentElement;
  var body = document.body;

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
      var scale = Math.min(w / 6000, h / 3375);
      root.style.setProperty("--scale", scale);
    }
  }

  /* ---------------------------------------------------------------------
     3. Track which section is active as the user scrolls; drive nav state,
        section fade, body tone class, and mobile-nav underline/scroll.
     ------------------------------------------------------------------- */

  var currentKey = null;

  function updateActiveSection() {
    var viewportCenter = journey.scrollTop + journey.clientHeight / 2;
    var best = sections[0];
    var bestDist = Infinity;
    sections.forEach(function (sec) {
      var center = sec.offsetTop + sec.offsetHeight / 2;
      var dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) { bestDist = dist; best = sec; }
    });

    sections.forEach(function (sec) { sec.classList.toggle("is-active", sec === best); });

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

  /* ---------------------------------------------------------------------
     4. Navigation helpers
     ------------------------------------------------------------------- */

  function goToSection(key) {
    var target = sections.find(function (s) { return s.dataset.section === key; });
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }

  function goToRole(role) {
    var target = sections.find(function (s) { return s.dataset.role === role; });
    if (target) target.scrollIntoView({ behavior: "smooth" });
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
      next.scrollIntoView({ behavior: "smooth" });
    } else if (["ArrowUp", "PageUp"].includes(e.key)) {
      e.preventDefault();
      var prev = sections[Math.max(idx - 1, 0)];
      prev.scrollIntoView({ behavior: "smooth" });
    } else if (e.key === "Home") {
      e.preventDefault();
      sections[0].scrollIntoView({ behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      sections[sections.length - 1].scrollIntoView({ behavior: "smooth" });
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
