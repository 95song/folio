/* =====================================================================
   main.js — index.html(메인) 전용 스크립트
   히어로 문구 효과: 위·아래 큰 제목 스크램블(TextScramble), 가운데 문구 타이핑
   ===================================================================== */
 
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}=+*^?#ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ";
    this.frame = 0;
    this.queue = [];
    this.update = this.update.bind(this);
  }
 
  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
 
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20) + 10;
      this.queue.push({ from, to, start, end, char: "" });
    }
 
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
  }
 
  update() {
    let output = "";
    let complete = 0;
 
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
 
      if (this.frame >= item.end) {
        complete++;
        output += item.to;
      } else if (this.frame >= item.start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = this.randomChar();
        }
        output += `<span class="scramble_char">${item.char}</span>`;
      } else {
        output += item.from;
      }
    }
 
    this.el.innerHTML = output;
 
    if (complete < this.queue.length) {
      this.frame++;
      this.frameRequest = requestAnimationFrame(this.update);
    }
  }
 
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}
 
function typeWriter(el, speed = 90, lineDelay = 400, startDelay = 0) {
  const lines = el.innerHTML.split(/<br\s*\/?>/i).map((s) => s.trim());
  let lineIndex = 0;
  let charIndex = 0;
 
  function step() {
    if (lineIndex >= lines.length) {
      el.innerHTML = lines.join("<br>") + '<span class="typing_cursor"></span>';
      return;
    }
 
    const currentLine = lines[lineIndex];
    const doneLines = lines.slice(0, lineIndex).join("<br>");
    const partial = currentLine.slice(0, charIndex);
    el.innerHTML = (doneLines ? doneLines + "<br>" : "") + partial + '<span class="typing_cursor"></span>';
 
    if (charIndex < currentLine.length) {
      charIndex++;
      setTimeout(step, speed);
    } else {
      lineIndex++;
      charIndex = 0;
      setTimeout(step, lineDelay);
    }
  }
 
  el.innerHTML = "";
  setTimeout(step, startDelay);
}
 
// 히어로 문구 효과 시작 (로딩이 열리기 시작할 때 호출)
const NOTE_DELAY = 1300;   // "밥은 먹고 살아야지"가 나타나기까지의 시간(ms) — 가운데 문구는 600ms 에 시작
 
function startHeroCopy() {
  const midTarget = document.querySelector(".hero_copy_mid");
  if (midTarget) {
    typeWriter(midTarget, 90, 400, 600);
  }
 
  // "밥은 먹고 살아야지" + 지시선: 가운데 문구 타이핑(0.6초 뒤 시작)보다 조금 늦게 등장
  const noteStage = document.querySelector(".hero_stage");
  if (noteStage) setTimeout(() => noteStage.classList.add("is-in"), NOTE_DELAY);
 
  const topTarget = document.querySelector(".hero_copy_top");
  if (topTarget) {
    const topPhrases = ["확실한 휴식", "확실한 보상", "확실한 당분"];
    const topFx = new TextScramble(topTarget);
    let topIndex = 0;
 
    topFx.setText(topPhrases[topIndex]);
 
    setInterval(() => {
      topIndex = (topIndex + 1) % topPhrases.length;
      topFx.setText(topPhrases[topIndex]);
    }, 2800);
  }
 
  const bottomTarget = document.querySelector(".hero_copy_bottom");
  if (bottomTarget) {
    const phrases = ["확실한 일꾼", "확실한 성과", "확실한 창의력"];
    const fx = new TextScramble(bottomTarget);
    let index = 0;
 
    fx.setText(phrases[index]);
 
    setInterval(() => {
      index = (index + 1) % phrases.length;
      fx.setText(phrases[index]);
    }, 2800);
  }
}
 
/* =====================================================================
   로딩: 도트 햄스터의 출근길
   햄스터가 왼쪽에서 걸어와 오른쪽 회사 문으로 들어간다 (걸어간 만큼 = 진행률)
   ===================================================================== */
const LOADER = {
  minTime: 2600,     // 출근길을 걷는 최소 시간(ms)
  maxWait: 5000,     // 영상을 기다리는 최대 시간(ms). 준비 전에는 90%에서 멈춰 기다림
  walkStep: 130,     // 걸음 한 컷의 간격(ms) — 작을수록 종종걸음
  arriveHold: 380,   // 문 앞에 도착해 "출근 완료!"를 보여주는 시간(ms)
  doorClose: 440,    // 문이 닫히는 시간(ms)
  exit: 600,         // 화면이 걷히는 시간(ms) — main.css 의 loaderExit 와 같게
  pixel: 5,          // 도트 한 칸의 화면 크기(px). 좁은 화면(700px 미만)에서는 pixelSmall
  pixelSmall: 4,
};
 
/* 도트 그림 (# 검정 · g 회색 · o 흰색 · . 투명) */
const PIXEL = {
  ink: "#111111", gray: "#b6b6b6", white: "#ffffff",
  // 햄스터 몸통 (오른쪽을 보는 옆모습, 20x12) — 귀: 안쪽 회색 / 눈: 2x2 / 볼: 회색 2칸
  hamster: [
    "............##......",
    "...........#gg#.....",
    ".....######.#gg###..",
    "...##gggggg##oooooo#",
    "..#gggggggggooooooo#",
    ".#ggggggggooooo##oo#",
    "#ogggggggoooooo##o##",
    "#oogggggooooooooooo#",
    "#oooooooooooooggoo#.",
    ".#oooooooooooooo##..",
    "..##oooooooooo##....",
    "....##########......",
  ],
  // 발 2컷 (벌린 발 / 모은 발)
  feet: [
    ["....##.....##.......", "...##.......##......"],
    [".....##...##........", ".....##...##........"],
  ],
  cloud: [
    "....#####...",
    "..##ooooo##.",
    ".#ooooooooo#",
    "#oooooooooo#",
    ".##########.",
  ],
  // 간판 글자 (3x5)
  font: {
    O: ["###", "#.#", "#.#", "#.#", "###"],
    F: ["###", "#..", "##.", "#..", "#.."],
    I: ["###", ".#.", ".#.", ".#.", "###"],
    C: ["###", "#..", "#..", "#..", "###"],
    E: ["###", "#..", "##.", "#..", "###"],
    5: ["###", "#..", "###", "..#", "###"],
    0: ["###", "#.#", "#.#", "#.#", "###"],
  },
};
 
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("mainLoader");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!loader || reduce) {          // 로딩이 없거나 모션 감소 → 바로 시작
    if (loader) loader.remove();
    startHeroCopy();
    return;
  }
 
  const video = document.querySelector(".hero_bg_video");
  const scene = document.getElementById("mainLoaderScene");
  const canvas = document.getElementById("mainLoaderCanvas");
  const ctx = canvas.getContext("2d");
  const bubble = document.getElementById("mainLoaderBubble");
  const bubbleText = document.getElementById("mainLoaderBubbleText");
  const pctEl = document.getElementById("mainLoaderPct");
  const minEl = document.getElementById("mainLoaderMin");
  const msgEl = document.getElementById("mainLoaderMsg");
  const videoReady = () => !video || video.readyState >= 3;
 
  /* ---------- 장면 좌표 (칸 단위) — 화면 폭에 맞춰 칸 수를 정한다 ---------- */
  const H = canvas.height;                     // 58칸
  const G = 48;                                // 바닥(길) y
  const HAM_W = 20, HAM_H = PIXEL.hamster.length + 2;   // 햄스터 크기(몸통 + 발 2칸)
  const BLD_W = 34, BLD_Y = 10, DOOR_W = 22, DOOR_Y = 31, START_X = 4;
  let P, W, BLD_X, DOOR_X, END_X, STOP_X;
  function layout() {
    P = innerWidth < 700 ? LOADER.pixelSmall : LOADER.pixel;
    W = Math.ceil(innerWidth / P);
    canvas.width = W;                                      // 칸 수 = 화면 폭 / 도트 크기 → 길이 화면 전체 폭
    canvas.style.width = W * P + "px"; canvas.style.height = H * P + "px";
    BLD_X = W - BLD_W - 4; DOOR_X = BLD_X + 6; END_X = DOOR_X + 1;
    STOP_X = Math.round(START_X + (END_X - START_X) * .5) + HAM_W / 2;   // 50% 지점 표지판
  }
  layout();
  addEventListener("resize", layout);
  const at = f => Math.round(START_X + (BLD_X - START_X) * f);           // 길 위의 비율 → 칸
 
  const px = (x, y, w = 1, h = 1, c = PIXEL.ink) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const sprite = (rows, x, y, map) => rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
    const c = map ? map[ch] : (ch === "#" ? PIXEL.ink : ch === "g" ? PIXEL.gray : ch === "o" ? PIXEL.white : null);
    if (c) px(x + rx, y + ry, 1, 1, c);
  }));
  const box = (x, y, w, h, fill) => { px(x, y, w, h); px(x + 1, y + 1, w - 2, h - 2, fill || PIXEL.white); };
 
  function drawBackdrop(t, hamCenter) {
    // 구름: 천천히 왼쪽으로 흘러감
    [[.12, 4, .0035], [.4, 9, .0022], [.66, 3, .003], [.9, 7, .0026]].forEach(([f, by, sp]) => {
      const x = ((W * f - t * sp) % (W + 14) + (W + 14)) % (W + 14) - 13;
      sprite(PIXEL.cloud, Math.round(x), by);
    });
    // 길 = 로딩바: 지나온 길은 굵은 검정 실선, 남은 길은 회색 점선
    const done = Math.max(0, Math.min(W, Math.round(hamCenter)));
    px(0, G, done, 2);
    for (let x = done + (done % 4 ? 4 - done % 4 : 0); x < W; x += 4) px(x, G, 2, 1, PIXEL.gray);
    // 보도블록
    for (let x = 3; x < W; x += 9) px(x, G + 4, 4, 1, PIXEL.gray);
    for (let x = 8; x < W; x += 13) px(x, G + 7, 2, 1, PIXEL.gray);
    // 가로등 (넓은 화면에서는 2개)
    (W >= 150 ? [.2, .76] : [.16]).forEach(f => { const x = at(f); px(x, 25, 1, G - 25); px(x, 24, 5, 1); px(x + 3, 25, 3, 2, PIXEL.gray); px(x - 1, G - 1, 3, 1); });
    // 나무 (동그란 잎 + 기둥)
    if (W >= 120) {
      const tx = at(.34);
      px(tx, 36, 2, G - 36);
      for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
        const d = Math.hypot(x + .5, y + .5);
        if (d < 8.2) px(tx + 1 + x, 29 + y, 1, 1, d > 7.1 ? PIXEL.ink : ((x * 3 + y * 5) % 7 === 0 ? PIXEL.gray : PIXEL.white));
      }
    }
    // 풀 몇 포기
    [.08, .28, .62, .88].forEach(f => { const x = at(f); px(x, G - 2, 1, 2); px(x + 2, G - 3, 1, 3); px(x + 4, G - 2, 1, 2); });
    // 50% 지점 표지판: 지나기 전에는 연한 회색, 지나가면 검정으로 또렷해짐
    const signColor = hamCenter >= STOP_X ? PIXEL.ink : PIXEL.gray;
    px(STOP_X, 31, 1, G - 31, signColor);
    px(STOP_X - 4, 24, 9, 7, signColor); px(STOP_X - 3, 25, 7, 5, PIXEL.white);
    const tone = { "#": signColor };
    sprite(PIXEL.font[5], STOP_X - 3, 25, tone); sprite(PIXEL.font[0], STOP_X + 1, 25, tone);
  }
 
  function drawBuilding() {
    box(BLD_X, BLD_Y, BLD_W, G - BLD_Y + 2);              // 건물 몸체
    px(BLD_X - 2, BLD_Y - 2, BLD_W + 4, 2);                // 지붕
    [BLD_X + 4, BLD_X + 14, BLD_X + 24].forEach(x => { box(x, 14, 7, 7, PIXEL.gray); px(x + 3, 15, 1, 5); px(x + 1, 17, 5, 1); });   // 창문 3개
    [..."OFFICE"].forEach((ch, i) => sprite(PIXEL.font[ch], BLD_X + 6 + i * 4, 24));   // 간판
    px(DOOR_X - 1, DOOR_Y - 1, DOOR_W + 2, G - DOOR_Y + 1);                            // 열린 문(검은 입구)
    px(DOOR_X, DOOR_Y, DOOR_W, G - DOOR_Y, "#2a2a2a");
  }
 
  function drawHamster(x, frame) {
    const y = G - HAM_H + (frame ? 0 : 1) - 1;            // 걸을 때 한 칸씩 통통
    sprite(PIXEL.hamster, x, y);
    sprite(PIXEL.feet[frame], x, y + PIXEL.hamster.length);
    return y;
  }
 
  function drawSweat(x, y, t) {                            // 기다리는 동안 머리 뒤로 땀방울
    const k = Math.floor(t / 260) % 2;
    px(x + 8, y - 2 - k, 1, 2, PIXEL.gray); px(x + 5, y + 1 - k, 1, 2, PIXEL.gray);
  }
 
  function drawDoor(k) {                                   // k: 0(열림) → 1(닫힘), 오른쪽에서 왼쪽으로 닫힘
    const w = Math.round(DOOR_W * k);
    if (w <= 0) return;
    const x = DOOR_X + DOOR_W - w;
    px(x, DOOR_Y, w, G - DOOR_Y, PIXEL.white);
    px(x, DOOR_Y, 1, G - DOOR_Y);
    if (w > 6) px(x + 3, DOOR_Y + 9, 2, 2);                // 손잡이
  }
 
  /* ---------- 진행 ---------- */
  const t0 = performance.now();
  let shown = 0, phase = "walk", phaseAt = 0, done = false, waiting = false;
 
  function render(now) {
    if (done) return;
    // requestAnimationFrame 의 시각(now)은 t0 보다 조금 이를 수 있다(새로고침 직후 자주 발생).
    // 음수가 되면 아래 걸음 컷 계산이 -1 이 되어 그리기 오류 → 로딩이 바로 끝나 버리므로 0 아래로 내려가지 않게 막는다.
    const elapsed = Math.max(0, now - t0);
 
    if (phase === "walk") {
      const ready = videoReady() || elapsed > LOADER.maxWait;
      shown = Math.min(ready ? 100 : 90, elapsed / LOADER.minTime * 100);   // 경과 시간 기준
      const nowWaiting = !ready && shown >= 90;
      if (nowWaiting !== waiting) { waiting = nowWaiting; bubbleText.textContent = waiting ? "숨 고르는 중" : "출근 중"; }
      if (shown >= 100) {
        phase = "arrive"; phaseAt = now;
        bubbleText.textContent = "출근 완료!"; pctEl.textContent = ""; bubble.classList.add("is-done");
        msgEl.textContent = "출근 완료. 이제 일하러 갑니다";
      }
    } else if (phase === "arrive" && now - phaseAt > LOADER.arriveHold) {
      phase = "close"; phaseAt = now; bubble.style.visibility = "hidden";
    } else if (phase === "close" && now - phaseAt > LOADER.doorClose + 160) {
      phase = "exit";
      finish();
    }
 
    const p = shown / 100;
    const hx = Math.round(START_X + (END_X - START_X) * p);
    const frame = phase === "walk" && !waiting ? Math.floor(elapsed / LOADER.walkStep) % 2 : 1;
 
    ctx.clearRect(0, 0, W, H);
    drawBackdrop(elapsed, hx + HAM_W / 2);
    drawBuilding();
    const hy = drawHamster(hx, frame);
    if (waiting) drawSweat(hx, hy, elapsed);
    if (phase === "close" || phase === "exit") drawDoor(Math.min(1, Math.ceil((now - phaseAt) / LOADER.doorClose * 5) / 5));
 
    // 말풍선(퍼센트) · 가운데 시계
    bubble.style.left = ((hx + HAM_W / 2) * P).toFixed(1) + "px";
    bubble.style.top = (hy * P).toFixed(1) + "px";
    bubble.classList.toggle("is-edge", (hx + HAM_W / 2) * P < 90);
    if (phase === "walk") pctEl.textContent = Math.round(shown) + "%";
    const min = 50 + Math.floor(p * 10);                   // 08:50 → 09:00 에 도착
    if (min >= 60) { minEl.previousElementSibling.previousElementSibling.textContent = "09"; minEl.textContent = "00"; }
    else minEl.textContent = String(min);
  }
 
  // 로딩 끝: 화면을 걷고 본문 시작 (한 번만 실행)
  function finish() {
    if (done) return;
    done = true;
    clearInterval(backupTimer); clearTimeout(watchdog);
    loader.classList.add("is-exit");
    if (video && video.paused) video.play().catch(() => {});
    startHeroCopy();                                       // 화면이 걷히기 시작할 때 문구 효과 시작
    setTimeout(() => loader.remove(), LOADER.exit + 60);
  }
 
  /* ---------- 구동 ----------
     requestAnimationFrame 은 화면이 가려지거나 백그라운드일 때 브라우저가 아예 실행하지 않는다
     (그 상태로 새로고침되면 0%에서 멈춰 보임). 그래서 타이머로도 함께 돌린다.
     진행은 경과 시간 기준이라 어느 쪽이 돌려도 같은 속도다. */
  let lastFrame = 0;
  function step(now) {
    lastFrame = now;
    try { render(now); }
    catch (err) { console.error("[loader]", err); finish(); }   // 그리기 중 오류가 나도 로딩에 갇히지 않게
  }
  function loop(now) { if (done) return; step(now); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  const backupTimer = setInterval(() => {                  // rAF 가 쉬는 동안 대신 진행
    const now = performance.now();
    if (!done && now - lastFrame > 150) step(now);
  }, 60);
  // 어떤 이유로든 끝까지 못 가면 강제로 넘어간다
  const watchdog = setTimeout(finish, LOADER.minTime + LOADER.maxWait + 4000);
});