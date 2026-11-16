/* 백엔드 API 래퍼. API_BASE가 비어 있으면 localStorage 기반 체험 모드 */
(function () {
  const BASE = (window.APP_CONFIG.API_BASE || "").replace(/\/$/, "");
  const DEMO = !BASE;
  const DEMO_KEY = "bqa_demo_results";

  async function request(path, opts = {}) {
    const res = await fetch(BASE + path, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    if (res.status === 204) return null;
    let body = null;
    try { body = await res.json(); } catch (_) { /* empty */ }
    if (!res.ok) {
      let msg = "서버와 연결하지 못했어요.";
      if (body && typeof body.detail === "string") msg = body.detail;
      else if (body && Array.isArray(body.detail) && body.detail[0]) msg = String(body.detail[0].msg || msg).replace(/^Value error, /, "");
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  // ---------- 체험 모드 ----------
  const demoLoad = () => { try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || []; } catch (_) { return []; } };
  const demoSave = (rows) => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); } catch (_) { /* ignore */ } };
  function demoCompute(answers) {
    const axes = [["A", "F", "I"], ["B", "P", "C"], ["C", "M", "S"]];
    const counts = {};
    let code = "";
    for (const [ax, a, b] of axes) {
      counts[ax] = { [a]: 0, [b]: 0 };
      answers.forEach((p) => { if (p in counts[ax]) counts[ax][p]++; });
      code += counts[ax][a] >= counts[ax][b] ? a : b;
    }
    return { code, counts };
  }

  window.API = {
    demo: DEMO,

    async submit({ nickname, message, answers }) {
      if (!DEMO) return request("/api/results", { method: "POST", body: JSON.stringify({ nickname, message, answers }) });
      const rows = demoLoad();
      const { code, counts } = demoCompute(answers);
      const row = { number: rows.length + 1, nickname, message, code, axis_counts: counts, created_at: new Date().toISOString(), token: "demo" };
      rows.push(row); demoSave(rows);
      return row;
    },

    async get(number) {
      if (!DEMO) return request(`/api/results/${number}`);
      const row = demoLoad().find((r) => r.number === Number(number));
      if (!row) { const e = new Error("결과를 찾을 수 없어요."); e.status = 404; throw e; }
      return row;
    },

    async remove(number, token) {
      if (!DEMO) return request(`/api/results/${number}`, { method: "DELETE", headers: { "X-Owner-Token": token } });
      demoSave(demoLoad().filter((r) => r.number !== Number(number)));
      return null;
    },

    async parade(limit = 60, before) {
      if (!DEMO) return request(`/api/parade?limit=${limit}${before ? `&before=${before}` : ""}`);
      const rows = demoLoad().slice().reverse();
      const items = rows.filter((r) => !before || r.number < before).slice(0, limit);
      return { items, total: rows.length };
    },

    async stats() {
      if (!DEMO) return request("/api/stats");
      const rows = demoLoad();
      const by_code = {};
      for (const a of "FI") for (const b of "PC") for (const c of "MS") by_code[a + b + c] = 0;
      const axes = { A: ["F", "I"], B: ["P", "C"], C: ["M", "S"] };
      const out = {};
      for (const [ax, [p, q]] of Object.entries(axes)) out[ax] = { people: { [p]: 0, [q]: 0 }, answers: { [p]: 0, [q]: 0 } };
      rows.forEach((r) => {
        by_code[r.code] = (by_code[r.code] || 0) + 1;
        for (const [ax, [p, q]] of Object.entries(axes)) {
          const c = r.axis_counts[ax];
          out[ax].answers[p] += c[p]; out[ax].answers[q] += c[q];
          out[ax].people[c[p] >= c[q] ? p : q] += 1;
        }
      });
      return { total: rows.length, by_code, axes: out };
    },
  };
})();
