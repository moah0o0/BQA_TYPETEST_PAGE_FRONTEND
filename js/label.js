/* 운영용: 참여 번호 → 라벨 2장 미리보기 → Niimbot B1 블루투스 출력 */
(function () {
  const C = window.CONTENT;
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(4, "0");
  const LS = { api: "bqa_admin_api", token: "bqa_admin_token", qr: "bqa_label_qr", density: "bqa_label_density", offset: "bqa_label_offset" };
  const ls = {
    get: (k) => { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* ignore */ } },
  };

  // Niimbot B1 (203dpi) + 50×90mm 라벨. 라이브러리 registry.json의 b1 모델에 크기만 새로 정의
  const MODEL = { label: "Niimbot B1", id: 4096, dpi: 203, protocol: "v4", task: "b1", density: 3, label_type: 1, speed: 1, name_prefixes: ["B1"] };
  const SIZE = { label: "50 × 90 mm (B1)", code: "T50*90", w_mm: 50, h_mm: 90, w_px: 384, h_px: 720, margin: 8, offset_y_px: 4, dpi: 203 };

  let current = null;      // 불러온 결과
  let rendered = null;     // { front, back }
  let busy = false;

  // ---------- 서버 ----------
  const api = () => (ls.get(LS.api) || window.APP_CONFIG.API_BASE || "").replace(/\/$/, "");
  async function call(path, opts = {}) {
    const res = await fetch(api() + path, { ...opts, headers: { "Content-Type": "application/json", "X-Admin-Token": ls.get(LS.token), ...(opts.headers || {}) } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error((body && body.detail) || `오류 ${res.status}`);
    return body;
  }
  function setConn(ok, text) { const el = $("conn"); el.textContent = text; el.className = "pill " + (ok ? "ok" : "bad"); }
  async function connectServer() {
    if (!api() || !ls.get(LS.token)) { setConn(false, "서버 설정 필요"); $("settings").open = true; return; }
    try { await call("/api/admin/ping"); setConn(true, "서버 연결됨"); loadRecent(); }
    catch (e) { setConn(false, e.message); $("settings").open = true; }
  }
  async function loadRecent() {
    try {
      const { items } = await call("/api/admin/results?limit=12");
      $("recent").innerHTML = items.map((r) =>
        `<button type="button" data-n="${r.number}" class="${r.print_count ? "printed" : ""}" title="${r.print_count ? "출력함" : ""}">${pad(r.number)} ${escapeHtml(r.nickname)}${r.print_count ? " ✔" : ""}</button>`).join("");
    } catch (_) { /* 다음에 */ }
  }
  const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- 상태 표시 ----------
  function status(text, kind = "") { const el = $("status"); el.textContent = text; el.className = "status " + kind; }
  function pstate(text, kind) { const el = $("pstate"); el.textContent = text; el.className = "pill " + kind; }
  function syncButtons() {
    $("print").disabled = busy || !rendered || !window.Niimbot || !Niimbot.isSupported();
    $("connect").disabled = busy || !window.Niimbot || !Niimbot.isSupported();
    $("dlFront").disabled = $("dlBack").disabled = !rendered;
  }

  // ---------- 미리보기 ----------
  const resultUrl = (n) => `${location.origin}${location.pathname.replace(/[^/]*$/, "")}#/result/${n}`;

  async function renderCurrent() {
    if (!current) return;
    status("라벨을 그리는 중…", "busy");
    try {
      rendered = await window.LabelRender.render(current, { withQR: $("withQR").checked, resultUrl: resultUrl(current.number) });
      [["front", rendered.front], ["back", rendered.back]].forEach(([id, cv]) => {
        const ctx = $(id).getContext("2d"); ctx.clearRect(0, 0, 384, 720); ctx.drawImage(cv, 0, 0);
      });
      const i = rendered.info;
      const notes = [];
      if (!i.hasImage) notes.push("캐릭터 그림을 불러오지 못해 대체 표시");
      if (i.level) notes.push("뒷면 공간이 모자라 일부 문장 생략");
      if (i.clamp) notes.push("뒷면 일부 말줄임(…)");
      if (i.overflow) notes.push("⚠ 뒷면이 넘쳐 잘림 — QR을 끄면 다 들어가요");
      status(`No.${pad(current.number)} ${current.nickname} · ${C.types[current.code].name} — 출력 준비 완료${notes.length ? " (" + notes.join(", ") + ")" : ""}`, "");
    } catch (e) {
      rendered = null;
      status("라벨을 그리지 못했어요: " + e.message, "bad");
    }
    syncButtons();
  }

  async function load(n) {
    n = String(n || "").replace(/\D/g, "");
    if (!n) return;
    status(`No.${pad(n)} 불러오는 중…`, "busy");
    try {
      current = await call(`/api/admin/results/${n}`);
      $("num").value = n;
      await renderCurrent();
    } catch (e) {
      current = null; rendered = null; syncButtons();
      status(`불러오지 못했어요: ${e.message}`, "bad");
    }
  }

  // ---------- 프린터 ----------
  // 연결 끊김을 화면에 보여 주려고 블루투스 기기 객체를 잡아 둠 (라이브러리 동작은 그대로)
  if (navigator.bluetooth && navigator.bluetooth.requestDevice) {
    const orig = navigator.bluetooth.requestDevice.bind(navigator.bluetooth);
    navigator.bluetooth.requestDevice = async (opts) => {
      const dev = await orig(opts);
      dev.addEventListener("gattserverdisconnected", () => pstate("끊김 — 출력하면 다시 연결", "bad"));
      return dev;
    };
  }

  function friendlyError(e) {
    const m = String((e && e.message) || e);
    if (/cancel/i.test(m)) return "기기 선택을 취소했어요.";
    if (/not found|No Bluetooth|adapter/i.test(m)) return "블루투스가 꺼져 있거나 프린터를 찾지 못했어요. 맥 블루투스와 프린터 전원을 확인하세요.";
    if (/dpi|task/i.test(m)) return "연결된 프린터가 B1이 아니에요: " + m;
    return m;
  }

  function showPrinter() {
    const p = Niimbot.printer;
    if (!p) return pstate("연결됨", "ok");
    const ok = p.modelId === MODEL.id;
    pstate(ok ? `연결됨 · ${p.label || "B1"}` : `다른 기종 (${p.label || p.modelId})`, ok ? "ok" : "bad");
  }

  async function connectPrinter() {
    busy = true; syncButtons(); pstate("연결 중…", "busy"); status("프린터 선택 창에서 B1을 고르세요.", "busy");
    try {
      await Niimbot.identify(MODEL);
      showPrinter();
      status("프린터가 연결됐어요." + (rendered ? " 출력할 수 있어요." : " 번호를 불러오세요."), "ok");
    } catch (e) {
      pstate("연결 안 됨", "gray"); status(friendlyError(e), "bad");
    } finally { busy = false; syncButtons(); }
  }

  async function print() {
    if (!rendered || busy) return;
    busy = true; syncButtons();
    const r = current;
    // 클릭 직후 바로 연결해야 브라우저가 기기 선택 창을 허용하므로 이미지 URL은 미리 동기적으로 만든다
    const urls = [rendered.back.toDataURL("image/png"), rendered.front.toDataURL("image/png")];   // 뒷면(2/2) 먼저
    const density = Number($("density").value) || 3;
    const offsetY = Number($("offsetY").value) || 0;
    status(`No.${pad(r.number)} 출력 중… (뒷면 → 앞면)`, "busy"); pstate("출력 중", "busy");
    try {
      await Niimbot.printBatch(urls, {
        model: MODEL, size: SIZE, density, offsetY,
        onProgress: (s) => { if (s && s !== "ok") status(`No.${pad(r.number)} 출력 중… ${s}`, "busy"); },
      });
      showPrinter();
      status(`✔ No.${pad(r.number)} ${r.nickname} — 2장 출력 완료`, "ok");
      call(`/api/admin/results/${r.number}/printed`, { method: "POST" }).then(loadRecent).catch(() => {});
    } catch (e) {
      showPrinterSafe();
      status(`✖ 출력 실패: ${friendlyError(e)} — 라벨이 일부 나왔을 수 있으니 용지를 확인하세요.`, "bad");
    } finally { busy = false; syncButtons(); }
  }
  function showPrinterSafe() { try { if (Niimbot.printer) showPrinter(); else pstate("연결 안 됨", "gray"); } catch (_) { /* ignore */ } }

  function download(which) {
    if (!rendered || !current) return;
    const cv = which === "front" ? rendered.front : rendered.back;
    cv.toBlob((b) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `label-${pad(current.number)}-${which === "front" ? "1-front" : "2-back"}.png`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  }

  // ---------- 이벤트 ----------
  $("api").value = ls.get(LS.api) || window.APP_CONFIG.API_BASE || "";
  $("token").value = ls.get(LS.token);
  if (ls.get(LS.qr)) $("withQR").checked = ls.get(LS.qr) === "1";
  if (ls.get(LS.density)) $("density").value = ls.get(LS.density);
  if (ls.get(LS.offset)) $("offsetY").value = ls.get(LS.offset);

  $("save").onclick = () => { ls.set(LS.api, $("api").value.trim()); ls.set(LS.token, $("token").value.trim()); connectServer(); };
  $("lookup").onsubmit = (e) => { e.preventDefault(); load($("num").value); };
  $("recent").onclick = (e) => { const b = e.target.closest("button[data-n]"); if (b) load(b.dataset.n); };
  $("withQR").onchange = () => { ls.set(LS.qr, $("withQR").checked ? "1" : "0"); renderCurrent(); };
  $("density").onchange = () => ls.set(LS.density, $("density").value);
  $("offsetY").onchange = () => ls.set(LS.offset, $("offsetY").value);
  $("connect").onclick = connectPrinter;
  $("print").onclick = print;
  $("dlFront").onclick = () => download("front");
  $("dlBack").onclick = () => download("back");
  document.addEventListener("keydown", (e) => {   // 번호 칸 밖에서 Ctrl/Cmd+Enter = 출력
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !$("print").disabled) print();
  });

  if (!window.Niimbot || !Niimbot.isSupported()) $("unsupported").hidden = false;
  syncButtons();
  connectServer();
  setInterval(() => { if ($("conn").classList.contains("ok") && !busy) loadRecent(); }, 15000);
})();
