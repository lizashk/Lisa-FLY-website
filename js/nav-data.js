/* ==========================================================================
   Persistent waveform-nav data — extracted exactly from Figma.
   Canvas space: nav sits at (3042, 110) in a 6000x3375 section, 2808x268.
   ========================================================================== */

// The 7 section keys in journey order.
const SECTION_KEYS = ["intro", "build", "drop", "break", "peak", "release", "outro"];

const SECTION_LABELS = {
  intro: "INTRO",
  build: "BUILD-UP",
  drop: "DROP",
  break: "BREAK",
  peak: "PEAK",
  release: "RELEASE",
  outro: "OUTRO",
};

// Per-bar heights (px, at native 6000x3375 canvas scale), left-to-right as drawn.
// "release" and "outro" groups are mirrored (flip-x) in the Figma source, so
// their arrays are stored already reversed to match the rendered silhouette.
const WAVEFORM_BARS = {
  intro:   [20, 33, 36, 42, 50, 44, 57, 45, 60, 57, 77, 57, 62, 88, 64],
  build:   [86, 128, 107, 88, 108, 144, 114, 122, 102, 81, 111, 146, 111, 151, 109, 87, 153, 120, 94],
  drop:    [153, 140, 165, 129, 146, 125, 142, 165, 128, 154, 169, 125, 167, 121, 168, 140, 177, 147, 126],
  break:   [72, 94, 78, 94, 88, 70, 90, 70, 60, 60, 85, 70, 60, 75, 67],
  peak:    [126, 166, 149, 175, 136, 162, 181, 164, 169, 159, 181, 142, 170, 144, 161, 181, 157],
  release: [95, 114, 102, 80, 104, 116, 106, 122, 100, 96, 111, 133, 112, 139, 122].reverse(),
  outro:   [14, 17, 21, 26, 29, 39, 29, 37, 48, 56, 48, 60, 67].reverse(),
};

// Label + divider-line offsets, relative to the nav container's own top-left.
const NAV_LABEL_OFFSETS = {
  intro:   98,
  build:   478,
  drop:    1006,
  break:   1409,
  peak:    1827,
  release: 2174,
  outro:   2566,
};

const NAV_LINE_OFFSETS = [
  { left: 365, top: 122, height: 146 },
  { left: 839, top: 137, height: 131 },
  { left: 1315, top: 128, height: 140 },
  { left: 1690, top: 123, height: 145 },
  { left: 2115, top: 151, height: 117 },
  { left: 2490, top: 123, height: 145 },
];

// Per-section background tone -> waveform/label colour ("light" bg = dark bars).
const SECTION_TONE = {
  intro: "dark",
  build: "light",
  drop: "dark",
  break: "light",
  peak: "dark",
  release: "light",
  outro: "dark",
};

if (typeof module !== "undefined") {
  module.exports = { SECTION_KEYS, SECTION_LABELS, WAVEFORM_BARS, NAV_LABEL_OFFSETS, NAV_LINE_OFFSETS, SECTION_TONE };
}
