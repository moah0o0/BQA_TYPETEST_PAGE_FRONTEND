/*
 * 유형별 캐릭터
 * content.js 의 types[code].image 에 그림 경로가 있으면 그 그림을,
 * 없으면 아래의 임시 캐릭터(SVG)를 그립니다.
 */
(function () {
  const HAIR = {
    FPM: "#7B2CBF", IPM: "#222244", FCM: "#FF70A6", ICS: "#8AC926",
    FCS: "#00BBF9", IPS: "#9B5DE5", FPS: "#F15BB5", ICM: "#6A4C93",
  };
  const PROP = {
    FPM: "🚩", IPM: "📑", FCM: "🎨", ICS: "🏠", FCS: "📣", IPS: "⚖️", FPS: "🎤", ICM: "📷",
  };
  // 머리 모양: 0 단발 1 뾰족 2 둥근 3 묶음
  const STYLE = { FPM: 1, IPM: 0, FCM: 3, ICS: 2, FCS: 1, IPS: 0, FPS: 3, ICM: 2 };

  function hairPath(style) {
    switch (style) {
      case 1: return '<path d="M30 40 L34 18 L42 30 L50 12 L58 30 L66 18 L70 40 Z"/>';
      case 2: return '<circle cx="50" cy="34" r="22"/>';
      case 3: return '<circle cx="50" cy="34" r="20"/><circle cx="50" cy="10" r="8"/>';
      default: return '<path d="M28 44 Q28 14 50 14 Q72 14 72 44 L68 44 Q66 26 50 26 Q34 26 32 44 Z"/>';
    }
  }

  function placeholderSVG(code, { label = "" } = {}) {
    const t = (window.CONTENT.types || {})[code] || {};
    const shirt = t.color || "#888";
    const hair = HAIR[code] || "#333";
    return `
<svg class="char-svg" viewBox="0 0 100 120" role="img" aria-label="${label || t.name || "캐릭터"}">
  <ellipse cx="50" cy="114" rx="22" ry="4" fill="rgba(0,0,0,.18)"/>
  <g stroke="#1d1d4f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <rect x="38" y="92" width="9" height="18" rx="4" fill="#ffe14d"/>
    <rect x="53" y="92" width="9" height="18" rx="4" fill="#ffe14d"/>
    <path d="M30 62 Q22 74 24 84" fill="none"/>
    <path d="M70 62 Q80 70 80 80" fill="none"/>
    <circle cx="24" cy="86" r="5" fill="#ffe14d"/>
    <path d="M32 58 Q50 50 68 58 L70 96 Q50 100 30 96 Z" fill="${shirt}"/>
    <g fill="${hair}">${hairPath(STYLE[code] || 0)}</g>
    <circle cx="50" cy="40" r="17" fill="#ffe14d"/>
    <path d="M33 36 Q38 22 50 22 Q62 22 67 36 Q58 30 50 31 Q42 30 33 36 Z" fill="${hair}"/>
  </g>
  <circle cx="44" cy="41" r="2" fill="#1d1d4f"/><circle cx="56" cy="41" r="2" fill="#1d1d4f"/>
  <path d="M45 47 Q50 51 55 47" fill="none" stroke="#1d1d4f" stroke-width="2" stroke-linecap="round"/>
  <text x="82" y="82" font-size="18" text-anchor="middle">${PROP[code] || "🌈"}</text>
</svg>`;
  }

  window.renderCharacter = function (code, opts = {}) {
    const t = (window.CONTENT.types || {})[code];
    if (t && t.image) {
      return `<img class="char-img" src="${t.image}" alt="${t.name}" loading="lazy" decoding="async">`;
    }
    return placeholderSVG(code, opts);
  };
})();
