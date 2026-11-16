/* 운영용: 번호로 결과를 불러와 영수증 해설지 출력 */
(function () {
  const C = window.CONTENT;
  const LS = { api: "bqa_admin_api", token: "bqa_admin_token", paper: "bqa_admin_paper" };
  const ls = {
    get: (k) => { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* ignore */ } },
  };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(4, "0");

  let current = null;
  const api = () => (ls.get(LS.api) || window.APP_CONFIG.API_BASE || "").replace(/\/$/, "");

  async function call(path, opts = {}) {
    const res = await fetch(api() + path, { ...opts, headers: { "Content-Type": "application/json", "X-Admin-Token": ls.get(LS.token), ...(opts.headers || {}) } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error((body && body.detail) || `오류 ${res.status}`);
    return body;
  }

  function setConn(ok, text) { const el = $("conn"); el.textContent = text; el.className = "pill " + (ok ? "ok" : "bad"); }

  async function connect() {
    if (!api() || !ls.get(LS.token)) { setConn(false, "연결 설정 필요"); $("settings").open = true; return; }
    try { await call("/api/admin/ping"); setConn(true, "연결됨"); refresh(); }
    catch (e) { setConn(false, e.message); $("settings").open = true; }
  }

  async function refresh() {
    try {
      const q = $("q").value.trim();
      const { items } = await call(`/api/admin/results?limit=40${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      $("rows").innerHTML = items.length ? items.map((r) => `
        <tr data-n="${r.number}" class="${r.hidden ? "hidden" : ""}">
          <td><b>${pad(r.number)}</b></td>
          <td>${esc(r.nickname)}<span class="msg">${esc(r.message)}</span></td>
          <td>${esc(C.types[r.code]?.name || r.code)}</td>
          <td>${r.print_count ? `✔ ${r.print_count}` : ""}</td>
          <td><button data-hide="${r.number}" data-v="${r.hidden ? 0 : 1}">${r.hidden ? "보이기" : "숨기기"}</button></td>
        </tr>`).join("") : `<tr><td colspan="5" class="muted">결과가 없어요.</td></tr>`;
    } catch (_) { /* 다음 갱신에서 재시도 */ }
  }

  function render() {
    const el = $("receipt");
    el.className = `receipt w${$("paper").value}`;
    if (!current) return;
    el.innerHTML = window.renderReceiptHTML(current, { withChar: $("withChar").checked, withMsg: $("withMsg").checked });
    ["print", "png", "txt", "done"].forEach((id) => { $(id).disabled = false; });
    // 인쇄 용지 폭
    let st = document.getElementById("page-size");
    if (!st) { st = document.createElement("style"); st.id = "page-size"; document.head.appendChild(st); }
    st.textContent = `@media print { @page { size: ${$("paper").value}mm auto; margin: 0; } }`;
  }

  async function load(n) {
    if (!n) return;
    try { current = await call(`/api/admin/results/${n}`); $("num").value = n; render(); }
    catch (e) { current = null; $("receipt").innerHTML = `<p class="placeholder">${esc(e.message)}</p>`; ["print", "png", "txt", "done"].forEach((id) => { $(id).disabled = true; }); }
  }

  async function markPrinted() {
    if (!current) return;
    try { current = await call(`/api/admin/results/${current.number}/printed`, { method: "POST" }); refresh(); } catch (_) { /* ignore */ }
  }

  function download(name, blob) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- 이벤트 ----------
  $("api").value = ls.get(LS.api) || window.APP_CONFIG.API_BASE || "";
  $("token").value = ls.get(LS.token);
  $("paper").value = ls.get(LS.paper) || "58";
  $("save").onclick = () => { ls.set(LS.api, $("api").value.trim()); ls.set(LS.token, $("token").value.trim()); connect(); };
  $("lookup").onsubmit = (e) => { e.preventDefault(); load($("num").value.replace(/\D/g, "")); };
  ["paper", "withChar", "withMsg"].forEach((id) => { $(id).onchange = () => { ls.set(LS.paper, $("paper").value); render(); }; });
  $("rows").onclick = async (e) => {
    const hb = e.target.closest("button[data-hide]");
    if (hb) { e.stopPropagation(); await call(`/api/admin/results/${hb.dataset.hide}`, { method: "PATCH", body: JSON.stringify({ hidden: hb.dataset.v === "1" }) }); refresh(); return; }
    const tr = e.target.closest("tr[data-n]"); if (tr) load(tr.dataset.n);
  };
  let qt; $("q").oninput = () => { clearTimeout(qt); qt = setTimeout(refresh, 250); };
  $("print").onclick = () => window.print();
  window.addEventListener("afterprint", markPrinted);
  $("done").onclick = markPrinted;
  $("txt").onclick = () => current && download(`receipt-${pad(current.number)}.txt`, new Blob([window.renderReceiptText(current, { withMsg: $("withMsg").checked, width: $("paper").value === "80" ? 48 : 32 })], { type: "text/plain;charset=utf-8" }));
  $("png").onclick = async () => {
    if (!current || !window.html2canvas) return;
    const canvas = await window.html2canvas($("receipt"), { scale: 3, backgroundColor: "#ffffff" });
    canvas.toBlob((b) => download(`receipt-${pad(current.number)}.png`, b), "image/png");
  };

  connect();
  setInterval(() => { if ($("conn").classList.contains("ok")) refresh(); }, 10000);
})();
