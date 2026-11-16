/* 퀴어 활동 캐해 — 화면 로직 (해시 라우팅, 빌드 없음) */
(function () {
  const C = window.CONTENT;
  const CFG = window.APP_CONFIG;
  const TYPES = C.types;
  const CODES = Object.keys(TYPES);
  const $app = document.getElementById("app");

  // ---------- 유틸 ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(4, "0");
  const ch = (code, cls = "char") => `<div class="${cls}">${window.renderCharacter(code)}</div>`;

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = msg; el.setAttribute("role", "status");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // ---------- 쿠키 ----------
  const Me = {
    get() {
      const m = document.cookie.split("; ").find((c) => c.startsWith(CFG.COOKIE_NAME + "="));
      if (!m) return null;
      try { return JSON.parse(decodeURIComponent(m.slice(CFG.COOKIE_NAME.length + 1))); } catch (_) { return null; }
    },
    set(data) {
      const v = encodeURIComponent(JSON.stringify(data));
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${CFG.COOKIE_NAME}=${v}; Max-Age=${CFG.COOKIE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
    },
    clear() { document.cookie = `${CFG.COOKIE_NAME}=; Max-Age=0; Path=/`; },
  };
  // 쿠키에는 결과 표시와 본인 삭제에 필요한 최소 정보만 저장
  const slim = (r) => ({ n: r.number, c: r.code, nk: r.nickname, m: r.message, ax: r.axis_counts, t: r.token || null, at: r.created_at });
  const unslim = (s) => s && ({ number: s.n, code: s.c, nickname: s.nk, message: s.m, axis_counts: s.ax, token: s.t, created_at: s.at });

  // ---------- 공통 틀 ----------
  function shell(inner, current = "") {
    const nav = [["#/parade", "행진", "parade"], ["#/stats", "통계", "stats"]]
      .map(([h, t, k]) => `<a class="chip-link" href="${h}" ${current === k ? 'aria-current="page"' : ""}>${t}</a>`).join("");
    const demo = window.API.demo ? `<p class="demo-banner">체험 모드예요. 결과가 서버에 저장되지 않고 이 기기에만 남아요.</p>` : "";
    $app.innerHTML = `
      <header class="topbar"><a class="brand" href="#/">${esc(C.meta.org)} · ${esc(C.meta.title)}</a><nav>${nav}</nav></header>
      ${demo}
      <main class="screen">${inner}</main>
      <footer class="footer">${esc(C.meta.org)}<br>이름·연락처는 받지 않아요. 닉네임, 한마디, 유형 결과만 저장돼요.</footer>`;
    window.scrollTo(0, 0);
  }

  // ---------- 홈 ----------
  async function viewHome() {
    const me = unslim(Me.get());
    shell(`
      <section class="hero">
        <div class="eyebrow">${esc(C.meta.org)} 부스 프로그램</div>
        <h1>퀴어 활동<br>캐해</h1>
        <p class="sub">${esc(C.meta.subtitle)}</p>
        <div class="counter" aria-live="polite"><span class="dot"></span><span id="count">함께 행진할 준비 중…</span></div>
      </section>
      <button class="flag-btn" id="go"><span class="flag">참여하기</span></button>
      <div class="home-actions">
        ${me ? `<a class="btn yellow wide" href="#/result">내 해설지 다시 보기 (No.${pad(me.number)})</a>` : ""}
        <a class="btn ghost" href="#/parade">행진 보기</a>
        <a class="btn ghost" href="#/stats">통계 보기</a>
      </div>
      <div class="parade" id="preview" aria-label="최근 참여자"></div>`);
    document.getElementById("go").onclick = () => { location.hash = "#/test"; };
    try {
      const { items, total } = await window.API.parade(6);
      document.getElementById("count").textContent = `${total.toLocaleString()}명이 함께하고 있어요.`;
      document.getElementById("preview").innerHTML = items.map((r) => walker(r, me)).join("");
    } catch (_) {
      document.getElementById("count").textContent = "지금 바로 행진에 함께해요!";
    }
  }

  // ---------- 테스트 ----------
  const state = { nickname: "", answers: [], message: "" };

  function viewTest() {
    state.answers = []; state.message = "";
    stepNickname();
  }

  function stepNickname() {
    shell(`
      <section class="panel">
        <p class="kicker">Get ready with me</p>
        <h2>오늘은 퀴퍼 가는 날<br>우리 같이 준비해요!</h2>
        <label class="field-label" for="nick">뭐라고 불러 드릴까요?</label>
        <input class="input" id="nick" maxlength="12" autocomplete="off" placeholder="닉네임 *" value="${esc(state.nickname)}">
        <p class="hint"><span>행진 대열에 이 이름으로 보여요. 실명은 쓰지 마세요!</span><span id="nc">0/12</span></p>
        <p class="error" id="err"></p>
        <button class="btn primary" id="next" style="margin-top:12px">같이 준비하러 가기 👉</button>
      </section>`);
    const inp = document.getElementById("nick"), btn = document.getElementById("next"), nc = document.getElementById("nc");
    const sync = () => { nc.textContent = `${inp.value.length}/12`; btn.disabled = !inp.value.trim(); };
    inp.oninput = sync; sync();
    inp.onkeydown = (e) => { if (e.key === "Enter" && !btn.disabled) btn.click(); };
    btn.onclick = () => { state.nickname = inp.value.trim(); stepQuestion(0); };
    setTimeout(() => inp.focus(), 50);
  }

  function stepQuestion(i) {
    const q = C.questions[i], total = C.questions.length;
    shell(`
      <div class="progress" aria-label="진행도"><span>${i + 1}/${total}</span><div class="bar"><i style="width:${(i / total) * 100}%"></i></div></div>
      <section class="q-card">
        <div class="q-num">Q${i + 1}</div>
        <p class="q-text">${esc(q.text)}</p>
        <div class="options">
          ${q.options.map((o, k) => `<button class="option" data-k="${k}" aria-pressed="${state.answers[i] === o.pole}">${esc(o.text)}</button>`).join("")}
        </div>
      </section>
      <div class="q-nav">
        <button class="text-btn" id="back">← ${i === 0 ? "닉네임 바꾸기" : "이전 문항"}</button>
      </div>`);
    $app.querySelectorAll(".option").forEach((b) => {
      b.onclick = () => {
        state.answers[i] = q.options[Number(b.dataset.k)].pole;
        b.setAttribute("aria-pressed", "true");
        setTimeout(() => (i + 1 < total ? stepQuestion(i + 1) : stepMessage()), 140);
      };
    });
    document.getElementById("back").onclick = () => (i === 0 ? stepNickname() : stepQuestion(i - 1));
  }

  function stepMessage() {
    shell(`
      <div class="progress"><span>마지막!</span><div class="bar"><i style="width:100%"></i></div></div>
      <section class="panel">
        <p class="kicker">${esc(state.nickname)} 님, 거의 다 왔어요</p>
        <h2>행진하면서 외치고 싶은<br>한마디를 남겨 주세요</h2>
        <label class="sr-only" for="msg">한마디</label>
        <textarea class="input" id="msg" maxlength="60" placeholder="예) 우리는 여기 있다!">${esc(state.message)}</textarea>
        <p class="hint"><span>행진 대열에 말풍선으로 보여요 (선택)</span><span id="mc">0/60</span></p>
        <div class="suggest">${C.messageSuggestions.map((s) => `<button type="button">${esc(s)}</button>`).join("")}</div>
        <p class="error" id="err"></p>
        <button class="btn primary" id="submit" style="margin-top:12px">결과 보고 행진 합류하기 🏳️‍🌈</button>
      </section>
      <div class="q-nav"><button class="text-btn" id="back">← 이전 문항</button></div>`);
    const ta = document.getElementById("msg"), mc = document.getElementById("mc");
    const sync = () => { mc.textContent = `${ta.value.length}/60`; };
    ta.oninput = sync; sync();
    $app.querySelectorAll(".suggest button").forEach((b) => { b.onclick = () => { ta.value = b.textContent; sync(); }; });
    document.getElementById("back").onclick = () => { state.message = ta.value; stepQuestion(C.questions.length - 1); };
    document.getElementById("submit").onclick = async (e) => {
      const btn = e.currentTarget, err = document.getElementById("err");
      state.message = ta.value.trim();
      btn.disabled = true; btn.textContent = "행진에 합류하는 중…"; err.textContent = "";
      try {
        const row = await window.API.submit({ nickname: state.nickname, message: state.message, answers: state.answers });
        Me.set(slim(row));
        location.hash = "#/result";
      } catch (ex) {
        err.textContent = ex.message || "저장하지 못했어요. 다시 시도해 주세요.";
        btn.disabled = false; btn.textContent = "다시 시도하기";
      }
    };
  }

  // ---------- 결과(해설지) ----------
  function axisBars(counts) {
    return `<div class="axes">${C.axes.map((ax) => {
      const [p, q] = Object.keys(ax.poles);
      const a = (counts && counts[ax.id]) || { [p]: 0, [q]: 0 };
      const tot = (a[p] || 0) + (a[q] || 0) || 1;
      const pa = Math.round(((a[p] || 0) / tot) * 100), pb = 100 - pa;
      return `<div class="axis">
        <div class="row"><span>${esc(ax.poles[p])} ${pa}%</span><span class="dim">${esc(ax.label)}</span><span>${pb}% ${esc(ax.poles[q])}</span></div>
        <div class="split" role="img" aria-label="${esc(ax.label)}: ${esc(ax.poles[p])} ${pa}%, ${esc(ax.poles[q])} ${pb}%">
          <i class="${pa >= pb ? "win" : ""}" style="flex:${pa}"></i><i class="${pb > pa ? "win" : ""}" style="flex:${pb}"></i>
        </div></div>`;
    }).join("")}</div>`;
  }

  function typeArticle(code, { result = null } = {}) {
    const t = TYPES[code];
    const best = TYPES[t.bestWith.code], clash = TYPES[t.clashWith.code];
    return `
      <article class="card result-card">
        <div class="cover" style="background:${t.color}22">
          ${result ? `<span class="number-tag">No. ${pad(result.number)}</span>` : ""}
          ${ch(code)}
          <h2 class="type-name">${esc(t.name)}</h2>
          <p class="type-tagline">${esc(t.tagline)}</p>
          <div class="keywords">${t.keywords.map((k) => `<span>#${esc(k)}</span>`).join("")}</div>
          ${result ? axisBars(result.axis_counts) : ""}
        </div>
        <div class="result-body">
          ${t.sections.map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>`).join("")}
          <h3>이런 활동이 잘 맞아요</h3>
          <ul>${t.goodAt.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
          <div class="callout">
            <h4>사회운동의 네 가지 역할로 보면</h4>
            <p><b>${esc(t.role.name)}</b>에 가까워요. ${esc(t.role.note)}</p>
          </div>
          <h3>🍀 함께하면 좋은 동료</h3>
          <div class="pair">
            <a href="#/type/${t.bestWith.code}"><div class="label">찰떡 궁합</div>${ch(t.bestWith.code, "char mini")}<div class="nm">${esc(best.name)}</div><div class="why">${esc(t.bestWith.why)}</div></a>
            <a href="#/type/${t.clashWith.code}"><div class="label">부딪히며 성장</div>${ch(t.clashWith.code, "char mini")}<div class="nm">${esc(clash.name)}</div><div class="why">${esc(t.clashWith.why)}</div></a>
          </div>
          <div class="callout">
            <h4>${esc(C.closing.title)}</h4>
            <p>${esc(C.closing.body)}</p>
          </div>
          <p class="cheer">${esc(t.cheer)}</p>
        </div>
      </article>`;
  }

  async function viewResult(number) {
    let r = null, own = false;
    const me = unslim(Me.get());
    if (!number || (me && me.number === Number(number))) { r = me; own = !!me; }
    if (!r && number) {
      shell(`<p class="loading">해설지를 불러오는 중…</p>`);
      try { r = await window.API.get(number); } catch (_) { r = null; }
    }
    if (!r || !TYPES[r.code]) {
      shell(`<div class="card" style="text-align:center"><h3>해설지를 찾을 수 없어요</h3><p class="desc">아직 테스트를 하지 않았거나 기록이 지워졌어요.</p><a class="btn primary" href="#/test">테스트 하러 가기</a></div>`);
      return;
    }
    const t = TYPES[r.code];
    shell(`
      <div class="result-head"><div class="who">${esc(r.nickname)} 님의 퀴어 활동 유형은</div></div>
      ${typeArticle(r.code, { result: r })}
      ${own ? `<div class="booth"><div class="big">No. ${pad(r.number)}</div><p>${esc(C.meta.boothNotice)}</p></div>` : ""}
      <div class="result-actions">
        <a class="btn primary" href="#/parade">${own ? "행진에 합류한 내 모습 보기" : "행진 보기"}</a>
        <a class="btn yellow" href="#/stats">다른 사람들은? 통계 보기</a>
        ${own ? `<button class="btn" id="share">해설지 링크 복사</button>` : ""}
        <a class="btn ghost" href="#/test">${own ? "다시 하기" : "나도 해 보기"}</a>
      </div>
      ${own ? `<button class="danger-link" id="del">내 기록 지우기</button>` : ""}`);
    document.title = `${t.name} · ${C.meta.title}`;
    const share = document.getElementById("share");
    if (share) share.onclick = async () => {
      const url = `${location.origin}${location.pathname}#/result/${r.number}`;
      try { if (navigator.share) await navigator.share({ title: C.meta.title, text: `나의 퀴어 활동 유형은 '${t.name}'!`, url }); else { await navigator.clipboard.writeText(url); toast("링크를 복사했어요"); } }
      catch (_) { /* 취소 */ }
    };
    const del = document.getElementById("del");
    if (del) del.onclick = async () => {
      if (!confirm("행진 대열과 통계에서 내 기록을 지울까요? 되돌릴 수 없어요.")) return;
      try { if (r.token) await window.API.remove(r.number, r.token); } catch (_) { /* 이미 없음 */ }
      Me.clear(); toast("기록을 지웠어요"); location.hash = "#/";
    };
  }

  function viewType(code) {
    if (!TYPES[code]) return viewHome();
    shell(`<div class="result-head"><div class="who">퀴어 활동 유형 살펴보기</div></div>
      ${typeArticle(code)}
      <div class="result-actions"><a class="btn primary" href="#/test">나도 테스트 해 보기</a><a class="btn ghost" href="#/stats">유형 전체 보기</a></div>`);
  }

  // ---------- 행진 ----------
  function walker(r, me) {
    const mine = me && me.number === r.number;
    return `<button class="walker ${mine ? "me" : ""}" data-n="${r.number}" aria-label="${esc(r.nickname)}, ${esc(TYPES[r.code]?.name || "")}${r.message ? ": " + esc(r.message) : ""}">
      ${r.message ? `<span class="bubble"><span>${esc(r.message)}</span></span>` : ""}
      ${ch(r.code)}
      <span class="nick">${esc(r.nickname)}</span>
    </button>`;
  }

  async function viewParade() {
    const me = unslim(Me.get());
    shell(`
      <section class="parade-head"><h2>우리의 행진</h2><p id="ptotal">행진 대열을 불러오는 중…</p></section>
      <div class="parade" id="parade"></div>
      <button class="btn ghost" id="more" hidden>더 보기</button>
      ${me ? "" : `<a class="btn primary" href="#/test" style="margin-top:12px">나도 행진에 합류하기</a>`}`);
    const $p = document.getElementById("parade"), $more = document.getElementById("more");
    let last = null, shown = new Set();
    if (me) { $p.insertAdjacentHTML("beforeend", walker(me, me)); shown.add(me.number); }
    async function load() {
      try {
        const { items, total } = await window.API.parade(45, last || undefined);
        document.getElementById("ptotal").textContent = `${total.toLocaleString()}명이 함께 행진하고 있어요`;
        items.filter((r) => !shown.has(r.number)).forEach((r) => { shown.add(r.number); $p.insertAdjacentHTML("beforeend", walker(r, me)); });
        if (items.length) last = items[items.length - 1].number;
        $more.hidden = items.length < 45;
        if (!shown.size) $p.outerHTML = `<p class="empty">아직 아무도 없어요. 첫 번째로 행진을 시작해 주세요!</p>`;
      } catch (_) {
        document.getElementById("ptotal").textContent = "행진 대열을 불러오지 못했어요.";
      }
    }
    $p.addEventListener("click", (e) => {
      const w = e.target.closest(".walker"); if (!w) return;
      w.classList.toggle("open");
    });
    $more.onclick = load;
    await load();
  }

  // ---------- 통계 ----------
  async function viewStats() {
    const me = unslim(Me.get());
    shell(`<p class="loading">통계를 불러오는 중…</p>`, "stats");
    let s;
    try { s = await window.API.stats(); }
    catch (_) { shell(`<div class="card"><h3>통계를 불러오지 못했어요</h3><p class="desc">잠시 후 다시 시도해 주세요.</p></div>`, "stats"); return; }
    const total = s.total || 0;
    const max = Math.max(1, ...CODES.map((c) => s.by_code[c] || 0));
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    const rows = CODES.map((c) => {
      const n = s.by_code[c] || 0;
      return `<a class="bar-row ${me && me.code === c ? "mine" : ""}" href="#/type/${c}" data-tip="${esc(TYPES[c].name)} · ${n}명 (${pct(n)}%)">
        ${ch(c, "char mini")}
        <div><div class="top"><span class="nm">${esc(TYPES[c].name)}</span><span class="val">${n}명 · ${pct(n)}%</span></div>
        <div class="track"><i style="width:${(n / max) * 100}%"></i></div></div></a>`;
    }).join("");
    const axisRows = C.axes.map((ax) => {
      const [p, q] = Object.keys(ax.poles);
      const pp = s.axes[ax.id].people;
      const t = (pp[p] + pp[q]) || 1;
      const a = Math.round((pp[p] / t) * 100), b = 100 - a;
      const mine = me ? (me.code.includes(p) ? ax.poles[p] : ax.poles[q]) : null;
      return `<div class="axis" data-tip="${esc(ax.poles[p])} ${pp[p]}명 · ${esc(ax.poles[q])} ${pp[q]}명">
        <div class="row"><span>${esc(ax.poles[p])} ${a}%</span><span class="dim">${esc(ax.label)}${mine ? ` · 나는 ${esc(mine)}` : ""}</span><span>${b}% ${esc(ax.poles[q])}</span></div>
        <div class="split" role="img" aria-label="${esc(ax.label)}: ${esc(ax.poles[p])} ${a}%, ${esc(ax.poles[q])} ${b}%"><i style="flex:${a || 0.0001}"></i><i style="flex:${b || 0.0001}"></i></div></div>`;
    }).join("");
    const table = CODES.map((c) => `<tr><td>${esc(TYPES[c].name)}</td><td>${s.by_code[c] || 0}명</td></tr>`).join("");
    shell(`
      <section class="stats-total"><div class="big">${total.toLocaleString()}</div><div>명이 테스트에 참여했어요</div></section>
      <section class="card">
        <h3>유형별 분포</h3>
        <p class="desc">유형을 누르면 해설을 볼 수 있어요.${me ? " 내 유형은 분홍색이에요." : ""}</p>
        <div class="bars">${rows}</div>
        <details class="table-toggle"><summary>표로 보기</summary><table><thead><tr><th>유형</th><th>인원</th></tr></thead><tbody>${table}</tbody></table></details>
      </section>
      <section class="card">
        <h3>축별 성향</h3>
        <p class="desc">참여자들이 세 가지 축에서 어느 쪽으로 기울었는지 보여 줘요.</p>
        <div class="axes" style="margin-top:0">${axisRows}</div>
      </section>
      <div class="result-actions">${me ? `<a class="btn yellow" href="#/result">내 해설지 보기</a>` : `<a class="btn primary" href="#/test">나도 참여하기</a>`}</div>`, "stats");
    bindTips();
  }

  function bindTips() {
    let tip = null;
    const show = (el, x, y) => {
      if (!tip) { tip = document.createElement("div"); tip.className = "tooltip"; document.body.appendChild(tip); }
      tip.textContent = el.dataset.tip; tip.style.left = x + "px"; tip.style.top = y + "px";
    };
    const hide = () => { if (tip) { tip.remove(); tip = null; } };
    $app.querySelectorAll("[data-tip]").forEach((el) => {
      el.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") show(el, e.clientX, e.clientY); });
      el.addEventListener("pointerleave", hide);
    });
    window.addEventListener("hashchange", hide, { once: true });
  }

  // ---------- 라우터 ----------
  function route() {
    document.title = `${C.meta.title} · ${C.meta.org}`;
    const [, view, arg] = (location.hash || "#/").split("/");
    switch (view) {
      case "test": return viewTest();
      case "result": return viewResult(arg ? Number(arg) : null);
      case "type": return viewType(arg);
      case "parade": return viewParade();
      case "stats": return viewStats();
      default: return viewHome();
    }
  }
  window.addEventListener("hashchange", route);
  route();
})();
