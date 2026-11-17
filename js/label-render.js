/*
 * Niimbot B1 라벨(50×90mm) 그리기
 * ------------------------------------------------------------
 * 384×720px 캔버스(203dpi, 8px/mm)에 앞면·뒷면을 그린 뒤 순수 흑백(1비트)으로 바꿉니다.
 * - 글자: 검정으로 그린 뒤 임계값 처리 (회색 없음)
 * - 캐릭터: 사이트와 같은 유형별 그림을 불러와 Floyd–Steinberg 디더링
 *   → assets/characters 그림만 바꾸면 라벨에도 반영
 * - 선 두께는 최소 2px (감열 프린터에서 1px은 흐림)
 * 문구는 js/content.js 의 유형 데이터를 그대로 씁니다.
 */
(function () {
  const W = 384, H = 720, M = 20;                // 가장자리 여백 20px ≈ 2.5mm
  const FAMILY = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';
  const MIN_PX = 22;                             // 최소 글자 크기 ≈ 8pt
  // 감열 출력에서 글자가 흐리지 않도록: 본문도 굵게(700 이상) 쓰고,
  // 흑백 변환 기준을 128보다 높여 글자 가장자리의 회색 픽셀까지 검정으로 → 획이 약 1px 두꺼워짐
  const TEXT_CUTOFF = 170;
  const IMAGE_GAMMA = 0.45;                      // <1 이면 캐릭터 중간톤을 밝게 (어두운 비둘기 몸통이 새까맣게 뭉개지지 않도록)
  const LINE_LUM = 0.22;                         // 이보다 어두운 픽셀(그림 외곽선)은 디더링하지 않고 진한 검정으로 → 눈·부리·윤곽 유지

  const C = () => window.CONTENT;
  const pad = (n) => String(n).padStart(4, "0");
  const f = (weight, px) => `${weight} ${px}px ${FAMILY}`;

  // ---------- 폰트 ----------
  // Pretendard dynamic-subset은 글자 범위별로 따로 내려받으므로, 실제로 쓸 글자를 지정해 미리 로드해야
  // 캔버스에서 □□□로 깨지지 않습니다.
  async function ensureFonts(texts) {
    const sample = Array.from(new Set(texts.join("").split(""))).join("");
    await Promise.all([500, 700, 800, 900].map((w) => document.fonts.load(f(w, 24), sample).catch(() => null)));
    await document.fonts.ready;
  }

  // ---------- 글자 배치 ----------
  function wrap(ctx, text, maxW) {
    const lines = [];
    String(text).split("\n").forEach((para) => {
      let cur = "";
      para.split(" ").forEach((word) => {
        const test = cur ? cur + " " + word : word;
        if (ctx.measureText(test).width <= maxW) { cur = test; return; }
        if (cur) lines.push(cur);
        if (ctx.measureText(word).width <= maxW) { cur = word; return; }
        let part = "";                                  // 한 단어가 한 줄보다 길면 글자 단위로 자름
        for (const ch of word) {
          if (ctx.measureText(part + ch).width > maxW) { lines.push(part); part = ch; } else part += ch;
        }
        cur = part;
      });
      lines.push(cur);
    });
    return lines;
  }

  function clampLines(ctx, lines, maxLines, maxW) {
    if (lines.length <= maxLines) return lines;
    const out = lines.slice(0, maxLines);
    let last = out[maxLines - 1];
    while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    out[maxLines - 1] = last + "…";
    return out;
  }

  // 한 줄에 들어가도록 글자 크기를 줄임 (최소 크기에서도 넘치면 말줄임)
  function fitOneLine(ctx, text, weight, sizes, maxW) {
    for (const s of sizes) { ctx.font = f(weight, s); if (ctx.measureText(text).width <= maxW) return { size: s, text }; }
    const s = sizes[sizes.length - 1]; ctx.font = f(weight, s);
    return { size: s, text: clampLines(ctx, wrap(ctx, text, maxW), 1, maxW)[0] };
  }

  function drawText(ctx, text, x, y, { weight = 700, size = 24, align = "left" } = {}) {
    ctx.font = f(weight, size); ctx.textAlign = align; ctx.textBaseline = "top"; ctx.fillStyle = "#000";
    ctx.fillText(text, x, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---------- 이미지 ----------
  async function loadImage(src) {
    // 캐시를 확인해 최신 그림을 받음 (그림 교체가 바로 라벨에 반영되도록)
    const blob = await fetch(src, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(src); return r.blob(); });
    return createImageBitmap(blob);
  }

  function dither(img, box) {
    const cv = document.createElement("canvas"); cv.width = box; cv.height = box;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, box, box);
    const s = Math.min(box / img.width, box / img.height);
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, Math.round((box - w) / 2), Math.round((box - h) / 2), w, h);
    const id = ctx.getImageData(0, 0, box, box), d = id.data;
    const g = new Float32Array(box * box), line = new Uint8Array(box * box);
    for (let i = 0; i < g.length; i++) {
      const lum = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
      if (lum < LINE_LUM) { line[i] = 1; g[i] = 0; } else g[i] = 255 * Math.pow(lum, IMAGE_GAMMA);
    }
    for (let y = 0; y < box; y++) {
      for (let x = 0; x < box; x++) {
        const i = y * box + x;
        if (line[i]) { g[i] = 0; continue; }          // 외곽선은 오차를 퍼뜨리지 않음
        const old = g[i], nv = old < 128 ? 0 : 255, err = old - nv;
        g[i] = nv;
        if (x + 1 < box) g[i + 1] += err * 7 / 16;
        if (y + 1 < box) {
          if (x > 0) g[i + box - 1] += err * 3 / 16;
          g[i + box] += err * 5 / 16;
          if (x + 1 < box) g[i + box + 1] += err * 1 / 16;
        }
      }
    }
    for (let i = 0; i < g.length; i++) { const v = g[i] < 128 ? 0 : 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  function placeholderMark(ctx, x, y, box, code) {
    ctx.lineWidth = 3; ctx.strokeStyle = "#000"; roundRect(ctx, x + 2, y + 2, box - 4, box - 4, 24); ctx.stroke();
    drawText(ctx, code, x + box / 2, y + box / 2 - 20, { weight: 900, size: 40, align: "center" });
  }

  // ---------- 1비트 변환 ----------
  function binarize(cv) {
    const ctx = cv.getContext("2d"), id = ctx.getImageData(0, 0, W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = lum < TEXT_CUTOFF ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  function newCanvas() {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    return cv;
  }

  // ---------- 공통 요소 (영수증 해설지와 같은 모양) ----------
  function solidRule(ctx, y) { ctx.fillRect(M, y, W - 2 * M, 3); }
  function dashedRule(ctx, y) { for (let x = M; x < W - M; x += 12) ctx.fillRect(x, y, 7, 2); }
  function pageMark(ctx, text) { drawText(ctx, text, W - M, H - M - 22, { weight: 900, size: 22, align: "right" }); }

  function axesRows(r) {
    return C().axes.map((ax) => {
      const [p, q] = Object.keys(ax.poles);
      const a = (r.axis_counts && r.axis_counts[ax.id]) || {};
      const tot = (a[p] || 0) + (a[q] || 0);
      const pa = tot ? (a[p] || 0) / tot : (r.code.includes(p) ? 1 : 0);
      return { left: ax.poles[p], right: ax.poles[q], pa };
    });
  }
  // 현장 ■■■□□ 제도 — 막대(테두리 2px, 채움 검정)
  function drawAxes(ctx, r, y) {
    const rows = axesRows(r), size = 22, rowH = 32;
    ctx.font = f(800, size);
    const lw = Math.max(...rows.map((x) => ctx.measureText(x.left).width));
    const rw = Math.max(...rows.map((x) => ctx.measureText(x.right).width));
    const bx = M + lw + 10, bw = W - M - rw - 10 - bx;
    rows.forEach((row, i) => {
      const yy = y + i * rowH;
      drawText(ctx, row.left, M, yy + 2, { weight: 800, size });
      drawText(ctx, row.right, W - M, yy + 2, { weight: 800, size, align: "right" });
      ctx.lineWidth = 2; ctx.strokeStyle = "#000"; ctx.strokeRect(bx + 1, yy + 6, bw - 2, 16);
      ctx.fillRect(bx + 1, yy + 6, Math.round((bw - 2) * row.pa), 16);
    });
    return y + rows.length * rowH;
  }

  function drawQR(ctx, url, x, y, maxSize) {
    // 오류 정정 L: 같은 주소를 더 작은 QR(29칸)로 담음
    const qr = window.qrcode(0, "L"); qr.addData(url); qr.make();
    const n = qr.getModuleCount(), mod = Math.max(3, Math.floor(maxSize / n));
    for (let rr = 0; rr < n; rr++) for (let c = 0; c < n; c++) if (qr.isDark(rr, c)) ctx.fillRect(x + c * mod, y + rr * mod, mod, mod);
    return n * mod;
  }
  const QR = 116;                                   // QR 한 칸 4px(0.5mm) × 29칸 ≈ 14.5mm

  // ---------- 앞면 (1/2) ----------
  // 부산퀴어행동 / 퀴어 활동 캐해 / ── / 결과 번호 No.0001 (+QR) / ○○ 님의 퀴어 활동 유형은 /
  // 캐릭터 / 유형 이름 / “한 줄 설명” / #키워드
  function drawFront(ctx, r, charImg, imgBox, { withQR, url, extra = 0 }) {
    const t = C().types[r.code], inner = W - 2 * M;
    let y = M;
    drawText(ctx, C().meta.org, W / 2, y, { weight: 800, size: 22, align: "center" }); y += 30;
    drawText(ctx, C().meta.title, W / 2, y, { weight: 900, size: 36, align: "center" }); y += 46;
    solidRule(ctx, y); y += 3 + 12 + extra;

    if (withQR) {                                  // 왼쪽: 결과 번호 / 오른쪽: QR
      drawText(ctx, "결과 번호", M, y + 4, { weight: 700, size: 22 });
      const no = fitOneLine(ctx, `No.${pad(r.number)}`, 900, [44, 40, 36], inner - QR - 12);
      drawText(ctx, no.text, M, y + 32, { weight: 900, size: no.size });
      drawText(ctx, "QR로 결과 다시 보기 →", M, y + 88, { weight: 700, size: 22 });
      drawQR(ctx, url, W - M - QR, y, QR);
      y += QR + 10;
    } else {
      drawText(ctx, "결과 번호", W / 2, y, { weight: 700, size: 22, align: "center" }); y += 28;
      drawText(ctx, `No.${pad(r.number)}`, W / 2, y, { weight: 900, size: 48, align: "center" }); y += 58;
    }

    const who = fitOneLine(ctx, `${r.nickname} 님의 퀴어 활동 유형은`, 700, [24, 22], inner);
    drawText(ctx, who.text, W / 2, y, { weight: 700, size: who.size, align: "center" }); y += who.size + 8;

    const ix = Math.round((W - imgBox) / 2);
    if (charImg) ctx.drawImage(charImg, ix, y); else placeholderMark(ctx, ix, y, imgBox, r.code);
    y += imgBox + 6;

    let nameLines, nameSize;
    for (const s of [42, 38, 34]) { ctx.font = f(900, s); if (ctx.measureText(t.name).width <= inner) { nameLines = [t.name]; nameSize = s; break; } }
    if (!nameLines) { nameSize = 36; ctx.font = f(900, nameSize); nameLines = clampLines(ctx, wrap(ctx, t.name, inner), 2, inner); }
    nameLines.forEach((ln) => { drawText(ctx, ln, W / 2, y, { weight: 900, size: nameSize, align: "center" }); y += Math.round(nameSize * 1.18); });
    y += 4;

    ctx.font = f(800, 22);
    const tag = clampLines(ctx, wrap(ctx, `“${t.tagline}”`, inner), 2, inner);
    tag.forEach((ln) => { drawText(ctx, ln, W / 2, y, { weight: 800, size: 22, align: "center" }); y += 30; });
    y += 2;

    const kw = fitOneLine(ctx, t.keywords.map((k) => "#" + k).join(" "), 700, [22], inner);
    drawText(ctx, kw.text, W / 2, y, { weight: 700, size: 22, align: "center" }); y += 30;

    pageMark(ctx, "1/2");
    return y;    // 실제로 쓴 높이 (넘침 판단용)
  }

  // ---------- 뒷면 (2/2) ----------
  // 부산퀴어행동 No.0001 / ── / 축 막대 3줄 / - - - / ■ 섹션들 / 한마디 상자 / 응원 한 줄 / - - - / 축제 2/2
  // level이 올라갈수록 덜 중요한 것부터 뺌 (공간이 모자랄 때만)
  const DROPS = ["body", "clash", "role", "cheer", "bestWhy", "act3", "caution"];
  const MAX_LEVEL = DROPS.length;
  function backBlocks(r, level = 0) {
    const t = C().types[r.code], best = C().types[t.bestWith.code], clash = C().types[t.clashWith.code];
    const off = new Set(DROPS.slice(0, level));
    const B = [];
    const sec = { title: t.sections[0].title, paras: [] };
    if (!off.has("body")) sec.paras.push({ text: t.sections[0].body, weight: 700, max: 4 });
    B.push(sec);
    B.push({ title: "나의 강점", paras: [{ text: t.receipt.strength, weight: 700, max: 2 }] });
    if (!off.has("caution")) B.push({ title: "조심할 점", paras: [{ text: t.receipt.caution, weight: 700, max: 2 }] });
    const acts = off.has("act3") ? t.goodAt.slice(0, 2) : t.goodAt;
    B.push({ title: "이런 활동이 잘 맞아요", paras: acts.map((g) => ({ text: "· " + g, weight: 700, max: 2 })) });
    if (!off.has("role")) B.push({ title: "네 가지 역할로 보면", paras: [{ text: t.role.name, weight: 700, max: 2 }] });
    B.push({ title: "찰떡 궁합", paras: [{ text: off.has("bestWhy") ? best.name : `${best.name} — ${t.bestWith.why}`, weight: 700, max: 3 }] });
    if (!off.has("clash")) B.push({ title: "부딪히며 성장", paras: [{ text: clash.name, weight: 700, max: 1 }] });
    if (r.message) B.push({ kind: "msg", text: `“${r.message}”`, max: 3 });
    if (!off.has("cheer")) B.push({ kind: "cheer", text: t.cheer, max: 2 });
    return B;
  }

  // size: 본문 글자 크기, clamp: 줄 수 제한 적용 여부. draw=false면 높이만 계산
  function layoutBack(ctx, blocks, y0, size, clamp, draw) {
    const inner = W - 2 * M, lh = Math.round(size * 1.32);
    let y = y0;
    blocks.forEach((b, bi) => {
      if (bi) y += 10;
      if (b.kind === "msg" || b.kind === "cheer") {
        const box = b.kind === "msg", padX = box ? 12 : 0, w = inner - padX * 2, weight = box ? 800 : 900;
        if (box) { if (draw) drawText(ctx, "내가 외친 한마디", W / 2, y, { weight: 700, size, align: "center" }); y += lh; }
        const top = y; y += box ? 8 : 0;
        ctx.font = f(weight, size);
        let lines = wrap(ctx, b.text, w); if (clamp) lines = clampLines(ctx, lines, b.max, w);
        lines.forEach((ln) => { if (draw) drawText(ctx, ln, W / 2, y, { weight, size, align: "center" }); y += lh; });
        if (box) { y += 6; if (draw) { ctx.lineWidth = 3; ctx.strokeStyle = "#000"; roundRect(ctx, M + 1.5, top + 1.5, inner - 3, y - top - 3, 14); ctx.stroke(); } }
        return;
      }
      if (draw) drawText(ctx, "■ " + b.title, M, y, { weight: 900, size });
      ctx.font = f(900, size);
      y += lh * (clamp ? 1 : wrap(ctx, "■ " + b.title, inner).length);
      b.paras.forEach((p) => {
        ctx.font = f(p.weight, size);
        let lines = wrap(ctx, p.text, inner); if (clamp) lines = clampLines(ctx, lines, p.max, inner);
        lines.forEach((ln) => { if (draw) drawText(ctx, ln, M, y, { weight: p.weight, size }); y += lh; });
      });
    });
    return y;
  }

  function drawBack(ctx, r) {
    drawText(ctx, C().meta.org, M, M + 2, { weight: 800, size: 22 });
    drawText(ctx, `No.${pad(r.number)}`, W - M, M - 2, { weight: 900, size: 28, align: "right" });
    solidRule(ctx, M + 34);
    let top = M + 34 + 3 + 12;
    top = drawAxes(ctx, r, top) + 6;
    dashedRule(ctx, top); top += 2 + 12;

    const footTop = H - M - 22;
    const limit = footTop - 18;

    // 큰 글자 → 작은 글자 → 줄 수 제한(…) → 덜 중요한 것 빼기 순서로, 처음 들어가는 조합을 고름
    let pick = null;
    outer: for (let level = 0; level <= MAX_LEVEL; level++) {
      const blocks = backBlocks(r, level);
      for (const clamp of [false, true]) {
        for (const s of [24, MIN_PX]) {
          if (layoutBack(ctx, blocks, top, s, clamp, false) <= limit) { pick = { blocks, size: s, clamp, level }; break outer; }
        }
      }
    }
    if (!pick) pick = { blocks: backBlocks(r, MAX_LEVEL), size: MIN_PX, clamp: true, level: MAX_LEVEL, overflow: true };

    // 어떤 경우에도 하단 문구를 침범하지 않도록 잘라서 그림
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, limit + 4); ctx.clip();
    layoutBack(ctx, pick.blocks, top, pick.size, pick.clamp, true);
    ctx.restore();

    dashedRule(ctx, footTop - 10);
    drawText(ctx, C().meta.event || "", M, footTop, { weight: 800, size: 22 });
    pageMark(ctx, "2/2");
    return { size: pick.size, clamp: pick.clamp, level: pick.level, dropped: DROPS.slice(0, pick.level), overflow: !!pick.overflow };
  }

  // ---------- 공개 API ----------
  /**
   * @param r    결과 { number, nickname, message, code, axis_counts }
   * @param opts { withQR: true(앞면 결과 번호 옆 QR), resultUrl }
   * @returns { front: canvas, back: canvas, info }
   */
  async function render(r, opts = {}) {
    const t = C().types[r.code];
    if (!t) throw new Error(`알 수 없는 유형 코드: ${r.code}`);
    const withQR = opts.withQR !== false;
    const url = opts.resultUrl || "";
    const best = C().types[t.bestWith.code], clash = C().types[t.clashWith.code];
    await ensureFonts([
      C().meta.org, C().meta.title, C().meta.event || "",
      "결과 번호 QR로 결과 다시 보기 → 님의 퀴어 활동 유형은 나의 강점 조심할 점 이런 활동이 잘 맞아요 네 가지 역할로 보면 찰떡 궁합 부딪히며 성장 내가 외친 한마디 ■ No.0123456789/…“”·—#",
      r.nickname, r.message || "", t.name, t.tagline, t.keywords.join(""), t.sections[0].title, t.sections[0].body,
      t.receipt.strength, t.receipt.caution, t.goodAt.join(""), t.role.name, best.name, t.bestWith.why, clash.name, t.cheer,
      C().axes.map((a) => Object.values(a.poles).join("")).join(""),
    ]);

    let img = null;
    if (t.image) { try { img = await loadImage(t.image); } catch (_) { img = null; } }

    // 앞면: 캐릭터 240px(30mm)부터, 넘치면 그림을 줄임. 남는 공간은 위아래로 나눠 가운데 정렬
    const frontLimit = H - M - 30;               // 우하단 1/2 표시 위까지
    let front, box = 240, used = 0, art = null;
    for (; box >= 144; box -= 16) {
      front = newCanvas(); art = img ? dither(img, box) : null;
      used = drawFront(front.getContext("2d"), r, art, box, { withQR, url });
      if (used <= frontLimit) break;
    }
    const spare = frontLimit - used;
    if (spare > 8) {
      front = newCanvas();
      drawFront(front.getContext("2d"), r, art, box, { withQR, url, extra: Math.floor(spare / 2) });
    }
    binarize(front);

    const back = newCanvas();
    const info = drawBack(back.getContext("2d"), r);
    binarize(back);
    return { front, back, info: { ...info, imageBox: box, hasImage: !!img } };
  }

  window.LabelRender = { render, W, H };
})();
