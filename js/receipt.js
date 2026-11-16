/* 영수증 해설지 렌더링 (HTML 미리보기 + 텍스트 버전) */
(function () {
  const C = window.CONTENT;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(4, "0");
  const today = () => new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  function axes(counts) {
    return C.axes.map((ax) => {
      const [p, q] = Object.keys(ax.poles);
      const a = counts?.[ax.id] || {};
      const tot = (a[p] || 0) + (a[q] || 0) || 1;
      const pa = Math.round(((a[p] || 0) / tot) * 100);
      return { label: ax.label, left: ax.poles[p], right: ax.poles[q], pa, pb: 100 - pa };
    });
  }

  window.renderReceiptHTML = function (r, { withChar = true, withMsg = true } = {}) {
    const t = C.types[r.code];
    const best = C.types[t.bestWith.code], clash = C.types[t.clashWith.code];
    return `
      <div class="c t-org">${esc(C.meta.org)}</div>
      <div class="c t-title">${esc(C.meta.title)}</div>
      <hr class="solid">
      <div class="c">결과 번호</div>
      <div class="c t-no">No. ${pad(r.number)}</div>
      <div class="c">${esc(r.nickname)} 님의 퀴어 활동 유형은</div>
      ${withChar ? `<div class="char">${window.renderCharacter(r.code)}</div>` : ""}
      <div class="c t-name">${esc(t.name)}</div>
      <div class="c t-tag">"${esc(t.tagline)}"</div>
      <div class="c">${t.keywords.map((k) => "#" + esc(k)).join(" ")}</div>
      <hr>
      ${axes(r.axis_counts).map((a) => `<div class="ax"><span>${esc(a.left)}</span><span class="meter"><i style="width:${a.pa}%"></i></span><span>${esc(a.right)}</span></div>`).join("")}
      <hr>
      <h4>${esc(t.sections[0].title)}</h4>
      <p>${esc(t.sections[0].body)}</p>
      <h4>나의 강점</h4><p>${esc(t.receipt.strength)}</p>
      <h4>조심할 점</h4><p>${esc(t.receipt.caution)}</p>
      <h4>이런 활동이 잘 맞아요</h4>
      <ul>${t.goodAt.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
      <h4>네 가지 역할로 보면</h4><p>${esc(t.role.name)}</p>
      <h4>찰떡 궁합</h4><p>${esc(best.name)} — ${esc(t.bestWith.why)}</p>
      <h4>부딪히면 성장</h4><p>${esc(clash.name)}</p>
      ${withMsg && r.message ? `<hr><div class="c">내가 외친 한마디</div><div class="msg">"${esc(r.message)}"</div>` : ""}
      <hr>
      <p class="c" style="font-weight:900">${esc(t.cheer)}</p>
      <hr>
      <p class="c foot">${esc(C.closing.title)}<br>스티커를 판넬의 내 유형 칸에 붙여 주세요!<br>${today()} · ${esc(C.meta.org)}</p>`;
  };

  /* 텍스트 버전 (나중에 ESC/POS 직접 출력에 재사용) */
  window.renderReceiptText = function (r, { withMsg = true, width = 32 } = {}) {
    const t = C.types[r.code];
    const line = "-".repeat(width);
    const center = (s) => { const w = [...s].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2fff ? 2 : 1), 0); return " ".repeat(Math.max(0, Math.floor((width - w) / 2))) + s; };
    const bar = (pa) => { const n = Math.round((pa / 100) * 10); return "#".repeat(n) + ".".repeat(10 - n); };
    const out = [
      center(C.meta.org), center(C.meta.title), line,
      center(`No. ${pad(r.number)}`), center(`${r.nickname} 님의 유형은`), "",
      center(`[ ${t.name} ]`), center(`"${t.tagline}"`), center(t.keywords.map((k) => "#" + k).join(" ")), line,
      ...axes(r.axis_counts).map((a) => `${a.left} ${bar(a.pa)} ${a.right}`), line,
      `* ${t.sections[0].title}`, t.sections[0].body, "",
      `* 나의 강점: ${t.receipt.strength}`, `* 조심할 점: ${t.receipt.caution}`, "",
      "* 이런 활동이 잘 맞아요", ...t.goodAt.map((g) => ` - ${g}`), "",
      `* 네 가지 역할로 보면: ${t.role.name}`,
      `* 찰떡 궁합: ${C.types[t.bestWith.code].name}`,
      `* 부딪히면 성장: ${C.types[t.clashWith.code].name}`,
    ];
    if (withMsg && r.message) out.push(line, "내가 외친 한마디", `"${r.message}"`);
    out.push(line, t.cheer, "", center(today()), "", "", "");
    return out.join("\n");
  };
})();
