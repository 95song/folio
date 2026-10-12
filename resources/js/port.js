document.addEventListener("DOMContentLoaded", () => {
  const quoteEl = document.getElementById("testiQuote");
  const countCurrentEl = document.getElementById("testiCountCurrent");
  const countTotalEl = document.getElementById("testiCountTotal");
  const goalWrapEl = document.getElementById("testiGoal");
  const goalCurrentEl = document.getElementById("testiGoalCurrent");
  const goalTotalEl = document.getElementById("testiGoalTotal");
  const goalTextEl = document.getElementById("testiGoalText");
  const prevBtn = document.getElementById("testiPrevBtn");
  const nextBtn = document.getElementById("testiNextBtn");

  if (!quoteEl || !prevBtn || !nextBtn) return;

  // TODO: 실제 고객 후기/디자인 목표로 교체하세요. goal은 quote(클라이언트 요청)에
  // 대응하는 디자인 목표이며, index 0을 제외한 나머지는 기능 확인용 예시입니다.
  const testimonials = [
    {
      quote: "“불필요한 스크롤을 배제하고 브랜드 아이덴티티를 각인시킬 수 있는 메인페이지를 원해요.”",
      goal: "“홈페이지 인트로에 브랜드 로고를 짧은 모션으로 노출하여, 브랜드 심볼을 각인”"
    },
     {
      quote: "“전문 기술 용어와 방대한 실적 데이터가 포함된 사업 내용을 누구나 한눈에 쉽게 파악할 수 있도록 체계적으로 정리된 레이아웃을 원해요.”",
      goal: "“체계적인 디자인 시스템을 바탕으로 전문 용어와 실적 데이터를 카테고리별로 구조화하여 가독성을 높인 레이아웃을 설계”"
    },
    {
      quote: "“상세 페이지 진입 후에도 사용자가 다른 서브 메뉴로의 이동이 자유롭길 바래요.”",
      goal: "“상세페이지 내 서브 메뉴 바로가기 내비게이션을 배치해 자유로운 페이지 이동 동선을 설계”"
    },
    {
      quote: "“텍스트 중심의 타 메뉴와 달리, 사용자가 메뉴를 봤을때 제품 라인업을 한 눈에 파악할 수 있길 원해요.”",
      goal: "“제품 라인업을 이미지 카드형 그리드로 구성해 한눈에 파악 가능한 메뉴로 설계”"
    },
    {
      quote: "“모바일 및 태블릿 사용자가 많아진 만큼, 다양한 디바이스 환경에서도 홈페이지 이용에 불편함이 없기를 원해요.”",
      goal: "“모바일·태블릿 전용 반응형 레이아웃을 적용해 디바이스에 관계없이 일관된 사용 경험을 제공”"
    }
  ];

  let current = 0;
  let animating = false;

  if (countTotalEl) countTotalEl.textContent = testimonials.length;
  if (goalTotalEl) goalTotalEl.textContent = testimonials.length;

  // Wrap raw text in word spans so we can measure rendered line breaks.
  // The space between words is its own text node sibling, not part of the
  // inline-block span's own text - a trailing space *inside* an
  // inline-block gets trimmed away (it's trailing whitespace at the edge
  // of that inline-block's own line box), which silently shrinks the
  // measured width and (later) drops the space entirely when the word is
  // reused as-is in the rebuilt line.
  function buildWordSpans(container, text) {
    container.innerHTML = "";
    const words = text.split(" ");
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.textContent = word;
      span.style.display = "inline-block";
      container.appendChild(span);
      if (i < words.length - 1) {
        container.appendChild(document.createTextNode(" "));
      }
    });
  }

  // Group word spans into visual lines based on their offsetTop, then
  // rebuild the container as one .line-mask > .line-inner per line.
  // The measured word elements themselves are moved into each line-inner
  // (rather than reading their text and creating a fresh text node) so the
  // rebuilt line renders at the exact width that was measured - joining
  // separately-measured inline-block words back into one plain-text string
  // can shift by a few pixels (per-element rounding, no shared shaping),
  // which combined with white-space:nowrap silently clips the line.
  function splitIntoLines(container) {
    const words = Array.from(container.children);
    const lines = [];
    let currentTop = null;
    let currentLine = [];

    words.forEach((word) => {
      const top = word.offsetTop;
      if (currentTop === null || Math.abs(top - currentTop) < 2) {
        currentLine.push(word);
      } else {
        lines.push(currentLine);
        currentLine = [word];
      }
      currentTop = top;
    });
    if (currentLine.length) lines.push(currentLine);

    const fragment = document.createDocumentFragment();
    lines.forEach((lineWords) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      const inner = document.createElement("span");
      inner.className = "line-inner";
      lineWords.forEach((word, i) => {
        inner.appendChild(word);
        if (i < lineWords.length - 1) {
          inner.appendChild(document.createTextNode(" "));
        }
      });
      mask.appendChild(inner);
      fragment.appendChild(mask);
    });
    container.innerHTML = "";
    container.appendChild(fragment);
    return container.querySelectorAll(".line-inner");
  }

  function animateLinesIn(lineInners, baseDelay = 0, stagger = 70) {
    lineInners.forEach((el, i) => {
      el.classList.remove("out");
      el.style.transitionDelay = `${baseDelay + i * stagger}ms`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("in"));
      });
    });
  }

  function animateLinesOut(lineInners, stagger = 30) {
    lineInners.forEach((el, i) => {
      el.style.transitionDelay = `${i * stagger}ms`;
      el.classList.remove("in");
      el.classList.add("out");
    });
  }

  function showTestimonial(index) {
    if (animating) return;
    animating = true;
    const item = testimonials[index];

    const outdatedQuoteLines = quoteEl.querySelectorAll(".line-inner");
    const hasContent = outdatedQuoteLines.length > 0;

    if (hasContent) {
      animateLinesOut(outdatedQuoteLines);
      if (goalWrapEl) goalWrapEl.classList.add("is-swapping");
    }

    const exitDelay = hasContent ? 260 : 0;

    setTimeout(() => {
      buildWordSpans(quoteEl, item.quote);
      const quoteLines = splitIntoLines(quoteEl);

      if (countCurrentEl) countCurrentEl.textContent = index + 1;
      if (goalCurrentEl) goalCurrentEl.textContent = index + 1;
      if (goalTextEl) goalTextEl.textContent = item.goal;
      if (goalWrapEl) goalWrapEl.classList.remove("is-swapping");

      requestAnimationFrame(() => {
        animateLinesIn(quoteLines, 0, 70);
      });

      const totalDelay = quoteLines.length * 70 + 700;
      setTimeout(() => {
        animating = false;
      }, totalDelay);
    }, exitDelay);
  }

  function goTo(newIndex) {
    if (animating) return;
    const len = testimonials.length;
    current = (newIndex + len) % len;
    showTestimonial(current);
  }

  nextBtn.addEventListener("click", () => goTo(current + 1));
  prevBtn.addEventListener("click", () => goTo(current - 1));

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goTo(current + 1);
    if (e.key === "ArrowLeft") goTo(current - 1);
  });

  // Re-measure line breaks when the viewport width changes so wrapping
  // (and therefore which words belong to which revealed line) stays correct.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (animating) return;
      const item = testimonials[current];

      buildWordSpans(quoteEl, item.quote);
      const quoteLines = splitIntoLines(quoteEl);
      quoteLines.forEach((el) => {
        el.style.transitionDelay = "0ms";
        el.classList.add("in");
      });
    }, 150);
  });

  showTestimonial(current);
});

// -------------------------------------------------------------
// 제품소개 메가메뉴 데모 iframe (goal-3) - 1600x900 고정 화면을
// 박스 너비에 맞춰 transform:scale()로 축소하고, 화면에 보일 때만
// iframe 내부의 가상 커서 애니메이션이 재생되도록 제어한다.
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("megamenuEmbed");
  if (!wrap) return;

  const iframe = wrap.querySelector("iframe");
  const NATIVE_WIDTH = 1600;
  const NATIVE_HEIGHT = 900;

  function applyScale() {
    // wrap은 box-sizing:border-box라 style.height로 지정하는 값이
    // 테두리까지 포함한 전체 높이가 된다. clientWidth는 이미 좌우
    // 테두리를 제외한 값이라 scale 계산엔 그대로 쓰지만, 높이를 다시
    // 설정할 땐 상하 테두리 두께를 더해줘야 iframe이 테두리 안쪽에
    // 딱 맞게 줄어들고 overflow:hidden에 잘리지 않는다.
    const style = getComputedStyle(wrap);
    const borderY = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const scale = wrap.clientWidth / NATIVE_WIDTH;
    iframe.style.transform = `scale(${scale})`;
    wrap.style.height = `${NATIVE_HEIGHT * scale + borderY}px`;
  }

  applyScale();
  window.addEventListener("resize", applyScale);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        try {
          if (entry.isIntersecting) {
            iframe.contentWindow.playCursorDemo && iframe.contentWindow.playCursorDemo();
          } else {
            iframe.contentWindow.pauseCursorDemo && iframe.contentWindow.pauseCursorDemo();
          }
        } catch (e) {
          /* 아직 iframe 문서가 로드되기 전이면 무시하고 다음 교차 변화 때 재시도 */
        }
      });
    },
    { threshold: 0.2 }
  );
  io.observe(wrap);

  // iframe 로드 시점에 이미 화면에 보이는 상태라면 바로 재생 시작
  iframe.addEventListener("load", () => {
    const rect = wrap.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (visible && iframe.contentWindow.playCursorDemo) {
      iframe.contentWindow.playCursorDemo();
    }
  });
});

// =================================================================
// .blob-words: 칩끼리 뭉쳐 보이는 단어 애니메이션. 의존성 없는 순수 JS.
// 가운데는 고정 배열을 유지하고,
// 바깥 여백은 고정 시드(data-seed) 기반 랜덤 라벨로 채워서 가로 100% 폭에도
// 라벨이 늘어나며 자연스럽게 채워지게 한다. 화면에 처음 보일 때 한 번만
// 등장하고(중앙 먼저 조립 → 바깥은 거리순으로 퍼지듯 등장), 이후 사라지지
// 않는다(등장 후 약한 흔들림은 계속됨).
// =================================================================
(function () {
  // 가운데 배열(0~100 퍼센트 좌표, 중심 기준). 항상 가운데에 고정된다.
  const CENTER = [
    { type: 'text', w: 0, cx: 35, cy: 10, rot: 40 },
    { type: 'text', w: 1, cx: 70, cy: 12, rot: -10 },
    { type: 'circle',     cx: 58, cy: 16, r: 5 },
    { type: 'text', w: 3, cx: 76, cy: 26, rot: 25 },

    { type: 'text', w: 2, cx: 45, cy: 30, rot: -15 },
    { type: 'text', w: 1, cx: 20, cy: 35, rot: 15 },
    { type: 'text', w: 2, cx: 18, cy: 46, rot: -5 },
    { type: 'text', w: 2, cx: 62, cy: 42, rot: 35 },
    { type: 'text', w: 1, cx: 72, cy: 36, rot: 15 },
    { type: 'text', w: 1, cx: 85, cy: 46, rot: 5 },

    { type: 'circle',     cx: 12, cy: 55, r: 6 },
    { type: 'text', w: 0, cx: 18, cy: 60, rot: 45 },
    { type: 'circle',     cx: 33, cy: 68, r: 5 },
    { type: 'text', w: 0, cx: 20, cy: 70, rot: -30 },
    { type: 'circle',     cx: 18, cy: 80, r: 6 },

    { type: 'text', w: 3, cx: 48, cy: 52, rot: 5 },
    { type: 'text', w: 3, cx: 78, cy: 64, rot: 20 },
    { type: 'text', w: 3, cx: 50, cy: 75, rot: -5 },
    { type: 'text', w: 2, cx: 52, cy: 84, rot: -2 },
  ];
  // 단어 슬롯별 라벨 크기(unit 배수).
  const SIZES = [
    { wd: 26, h: 12, fs: 4.2 }, // word 1
    { wd: 16, h: 10, fs: 4.2 }, // word 2
    { wd: 34, h: 10, fs: 3.8 }, // word 3
    { wd: 24, h: 10, fs: 4.2 }, // word 4
  ];

  const FPS = 30;
  // 랜덤 아이템은 고정된 필드(unit 좌표) 위에 한 번만 생성해두고, 리사이즈되면
  // 그중 보이는 범위만 더 드러날 뿐 이미 배치된 것들이 다시 섞이지 않는다.
  const FIELD_X = 700, FIELD_Y = 160;
  const DENSITY = 19 / (100 * 100) * 0.8;    // 유닛² 당 아이템 수, 가운데 밀집도보다 살짝 여유있게
  const CENTER_ZONE = { x: 52, y: 50 };        // 랜덤 아이템이 가운데 클러스터 영역을 침범하지 않게

  // Remotion 스타일 스프링(mass 1, 0→1, 정지 상태 시작)을 해석적으로 계산.
  function spring(frame, damping = 18, stiffness = 90, mass = 1) {
    if (frame <= 0) return 0;
    const t = frame / FPS;
    const w0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    if (zeta < 1) {
      const w1 = w0 * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(w1 * t) + (zeta * w0 / w1) * Math.sin(w1 * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }

  function interpolate(v, [a, b], [c, d], clampLeft = true, clampRight = true) {
    let p = (v - a) / (b - a);
    if (clampLeft && p < 0) p = 0;
    if (clampRight && p > 1) p = 1;
    return c + (d - c) * p;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---- 기하: 겹침 체크를 위해 모든 아이템을 캡슐(알약) 형태로 취급 ----
  function capsule(it) {
    if (it.type === 'circle') return { ax: it.x, ay: it.y, bx: it.x, by: it.y, r: it.r };
    const a = (it.wd - it.h) / 2, rad = it.rot * Math.PI / 180;
    const ux = Math.cos(rad) * a, uy = Math.sin(rad) * a;
    return { ax: it.x - ux, ay: it.y - uy, bx: it.x + ux, by: it.y + uy, r: it.h / 2 };
  }
  function segDist(p, q) { // 선분 p.a–p.b 와 q.a–q.b 사이 거리
    const d1x = p.bx - p.ax, d1y = p.by - p.ay, d2x = q.bx - q.ax, d2y = q.by - q.ay;
    const rx = p.ax - q.ax, ry = p.ay - q.ay;
    const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
    let s, t;
    if (a < 1e-9 && e < 1e-9) { s = t = 0; }
    else if (a < 1e-9) { s = 0; t = Math.min(1, Math.max(0, f / e)); }
    else {
      const c = d1x * rx + d1y * ry;
      if (e < 1e-9) { t = 0; s = Math.min(1, Math.max(0, -c / a)); }
      else {
        const b = d1x * d2x + d1y * d2y, den = a * e - b * b;
        s = den !== 0 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); }
        else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
      }
    }
    const dx = p.ax + d1x * s - (q.ax + d2x * t), dy = p.ay + d1y * s - (q.ay + d2y * t);
    return Math.hypot(dx, dy);
  }

  const layoutCache = new Map();
  function generateLayout(seed) {
    if (layoutCache.has(seed)) return layoutCache.get(seed);
    const rng = mulberry32(seed);
    const items = [];
    const CELL = 40, grid = new Map();
    const key = (i, j) => i + ',' + j;
    function add(it) {
      it.cap = capsule(it);
      items.push(it);
      const i = Math.floor(it.x / CELL), j = Math.floor(it.y / CELL);
      const k = key(i, j);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(it);
    }
    function fits(it, clearance) {
      const cap = capsule(it);
      const i0 = Math.floor(it.x / CELL), j0 = Math.floor(it.y / CELL);
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
        const list = grid.get(key(i, j));
        if (!list) continue;
        for (const o of list) if (segDist(cap, o.cap) < cap.r + o.cap.r + clearance) return false;
      }
      return true;
    }

    // 1. 가운데 클러스터, 정해 둔 스태거 순서대로.
    CENTER.forEach((c, i) => {
      const it = { type: c.type, x: (c.cx - 50) * 1.2, y: (c.cy - 50) * 1.2, rot: c.rot || 0, order: i, center: true };
      if (c.type === 'circle') it.r = c.r; else Object.assign(it, { w: c.w }, SIZES[c.w]);
      add(it);
    });

    // 2. 필드 전체에 랜덤 배치. 일부는 살짝 겹치게 허용해서 가운데의 "이어붙은
    //    라벨"처럼 구이 효과로 뭉쳐 보이게 한다.
    const target = Math.round(FIELD_X * 2 * FIELD_Y * 2 * DENSITY);
    let placed = 0;
    for (let tries = 0; tries < target * 40 && placed < target; tries++) {
      const x = (rng() * 2 - 1) * FIELD_X, y = (rng() * 2 - 1) * FIELD_Y;
      const isCircle = rng() < 0.18;
      const it = { type: isCircle ? 'circle' : 'text', x, y, rot: 0, jitter: rng() };
      if (isCircle) it.r = 5 + rng() * 1.5;
      else { it.w = Math.floor(rng() * 4); Object.assign(it, SIZES[it.w]); it.rot = Math.round(rng() * 90 - 42); }
      const clearance = rng() < 0.28 ? -0.5 : 3;
      if (Math.abs(x) < CENTER_ZONE.x && Math.abs(y) < CENTER_ZONE.y) continue;
      if (!fits(it, clearance)) continue;
      add(it);
      placed++;
    }
    layoutCache.set(seed, items);
    return items;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  function mount(root) {
    const d = root.dataset;
    const words = (d.words || 'UX/UI,DESIGN,PORTFOLIO,SYSTEM').split(',').map(s => s.trim());
    const cfg = {
      bg: d.bg || '#000000',
      fill: d.fill || '#000000',
      border: d.border || '#ffffff',
      text: d.text || '#ffffff',
      font: d.font || 'Inter',
      // 1 unit의 px 크기. 4.2 = 기존 420px 세로형 버전 기준(예: 6글자 라벨 ≈ 109x50px).
      unit: parseFloat(d.unit || 4.2),
      seed: parseInt(d.seed || 7, 10),
      scale: parseFloat(d.scale || 1),
      speed: parseFloat(d.speed || 1),
      blobbiness: parseFloat(d.blobbiness || 1),
      wobble: parseFloat(d.wobble || 1),
    };
    const unit = cfg.unit;
    const all = generateLayout(cfg.seed);
    const filterId = 'bw-blob-' + (++uid);

    root.style.background = cfg.bg;
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', words.join(' '));
    root.innerHTML = `
      <div class="bw-stage" style="transform: scale(${cfg.scale})">
        <svg width="0" height="0" style="position:absolute" aria-hidden="true">
          <defs>
            <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="${unit * 1.2 * cfg.blobbiness}" result="blur"/>
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo"/>
              <feMorphology in="goo" operator="dilate" radius="${unit * 0.5}" result="dilated"/>
              <feFlood flood-color="${cfg.border}" result="borderFlood"/>
              <feComposite in="borderFlood" in2="dilated" operator="in" result="coloredBorder"/>
              <feFlood flood-color="${cfg.fill}" result="fillFlood"/>
              <feComposite in="fillFlood" in2="goo" operator="in" result="coloredInner"/>
              <feMerge><feMergeNode in="coloredBorder"/><feMergeNode in="coloredInner"/></feMerge>
            </filter>
          </defs>
        </svg>
        <div class="bw-layer bw-shapes" style="filter:url(#${filterId})"></div>
        <div class="bw-layer bw-texts" aria-hidden="true"></div>
      </div>`;

    const shapesLayer = root.querySelector('.bw-shapes');
    const textsLayer = root.querySelector('.bw-texts');

    let nodes = [];
    let W = 0, H = 0, visibleKey = '';

    function makeNode(item, index) {
      const isCircle = item.type === 'circle';
      const w = (isCircle ? item.r * 2 : item.wd) * unit;
      const h = (isCircle ? item.r * 2 : item.h) * unit;
      const shape = document.createElement('div');
      shape.className = 'bw-shape';
      shape.style.cssText = `background:#fff;opacity:0;width:${w}px;height:${h}px;border-radius:${isCircle ? '50%' : unit * 2 + 'px'}`;
      shapesLayer.appendChild(shape);
      let text = null, span = null;
      if (!isCircle) {
        text = document.createElement('div');
        text.className = 'bw-text';
        text.style.width = w + 'px';
        text.style.height = h + 'px';
        span = document.createElement('span');
        span.textContent = words[item.w] ?? '';
        span.style.cssText = `color:${cfg.text};font-family:${cfg.font}, system-ui, sans-serif;font-size:${item.fs * unit}px;opacity:0`;
        text.appendChild(span);
        textsLayer.appendChild(text);
      }
      return { item, shape, text, span, seed: index };
    }

    function layout() {
      W = root.clientWidth; H = root.clientHeight;
      const hx = W / 2 / unit + 25, hy = H / 2 / unit + 25;
      const visible = all.filter(it => Math.abs(it.x) < hx && Math.abs(it.y) < hy);
      const k = visible.length + ':' + (visible[visible.length - 1] ? all.indexOf(visible[visible.length - 1]) : 0);
      if (k === visibleKey) return;
      visibleKey = k;

      // 타이밍: 가운데가 정해 둔 순서대로 먼저 조립되고, 나머지는 바깥으로 퍼지듯 등장.
      const maxDist = Math.hypot(W / 2 / unit, H / 2 / unit) || 1;
      shapesLayer.textContent = '';
      textsLayer.textContent = '';
      nodes = visible.map(it => {
        const n = makeNode(it, all.indexOf(it));
        n.delay = it.center
          ? it.order * 2
          : 8 + Math.min(1, Math.hypot(it.x, it.y) / maxDist) * 42 + it.jitter * 8;
        return n;
      });
    }

    function render(frame) {
      const f = frame * cfg.speed;
      const cx = W / 2, cy = H / 2;
      const travel = 150 * unit; // minDim의 1.5배
      nodes.forEach(({ item, shape, span, text, seed, delay }) => {
        const p = spring(Math.max(0, f - delay));

        const tx = cx + item.x * unit;
        const ty = cy + item.y * unit;
        // 중심에서 바깥으로 날아 들어온다.
        const dist = Math.hypot(item.x, item.y) || 1;
        const sx = tx + (item.x / dist) * travel;
        const sy = ty + (item.y / dist) * travel;

        const x = interpolate(p, [0, 1], [sx, tx]);
        const y = interpolate(p, [0, 1], [sy, ty]);

        const ws = reduceMotion ? 0 : interpolate(p, [0, 1], [0, cfg.wobble], false, true);
        const wx = Math.sin(f * 0.03 + seed * 2) * unit * 1.5 * ws;
        const wy = Math.cos(f * 0.025 + seed * 3) * unit * 1.5 * ws;
        const wr = Math.sin(f * 0.02 + seed) * 6 * ws;

        const tf = `translate(${x + wx}px, ${y + wy}px) translate(-50%, -50%) rotate(${item.rot + wr}deg)`;
        shape.style.transform = tf;
        shape.style.opacity = interpolate(p, [0, 0.5], [0, 1], false, true);
        if (text) {
          text.style.transform = tf;
          span.style.opacity = interpolate(p, [0.3, 0.8], [0, 1]);
        }
      });
    }

    layout();
    render(0);

    let start = null, running = false, pausedAt = 0, started = false;

    function tick(now) {
      if (!running) return;
      if (start === null) start = now - pausedAt;
      render(((now - start) / 1000) * FPS);
      requestAnimationFrame(tick);
    }
    function play() {
      if (running) return;
      running = true; start = null;
      requestAnimationFrame(tick);
    }
    function pause() {
      if (!running) return;
      running = false;
      pausedAt = start === null ? pausedAt : performance.now() - start;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) {
          started = true;
          if (reduceMotion) { render(1000); return; } // 즉시 정착 상태로
        }
        if (!started || reduceMotion) return;
        // 한 번 시작되면 다시 사라지거나 재시작하지 않고, 화면 밖일 때만 멈춘다.
        e.isIntersecting ? play() : pause();
      });
    }, { threshold: 0.05 });
    // 고정 위치(position:fixed) 푸터는 다른 콘텐츠에 가려져 있어도
    // IntersectionObserver 입장에선 늘 "화면 안"이라 판단해서, 그대로 두면
    // 가려진 채로 애니메이션이 먼저 재생돼버린다. data-trigger로 실제
    // 흐름(in-flow) 상의 대리 요소(예: 빈 자리 spacer)를 지정하면 그
    // 요소가 화면에 드러나는 시점 기준으로 재생을 시작한다.
    io.observe((d.trigger && document.querySelector(d.trigger)) || root);

    new ResizeObserver(() => {
      layout();
      if (!running) render(started ? (reduceMotion ? 1000 : (pausedAt / 1000) * FPS) : 0);
    }).observe(root);
  }

  const init = () => document.querySelectorAll('.blob-words').forEach(mount);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

// =================================================================
// 사이트 전체가 공유하는 프로젝트 목록(순서 = 포트폴리오 노출 순서).
// 새 프로젝트 페이지가 생기면 여기에 한 줄만 추가하면 모든 페이지의
// prev/next(.goodbye-section, .quick-nav)가 자동으로 갱신된다.
// =================================================================
// title/thumb는 portfolio.html 슬라이더의 .wr-slider-text-main(프로젝트 명),
// .wr-slider-mask-item(이미지)과 같은 값을 쓴다.
window.PROJECTS = [
  { id: 'port-1', href: 'port-1.html', title: 'Tracker 앱 리뉴얼', thumb: 'resources/img/common/portfolio-1.png' },
  { id: 'port-2', href: 'port-2.html', title: '환경성 질환 예방센터 DID', thumb: 'resources/img/common/portfolio-2.png' },
  { id: 'port-3', href: 'port-3.html', title: '금화 C&E 홈페이지 리뉴얼', thumb: 'resources/img/common/portfolio-3.png' },
  { id: 'port-4', href: 'port-4.html', title: 'Vision AI Edge 리플렛', thumb: 'resources/img/common/portfolio-4.png' },
  // port-5.html 파일이 생기면 아래 줄의 주석만 풀면 된다.
  // { id: 'port-5', href: 'port-5.html', title: '근하신년 연하장', thumb: 'resources/img/common/portfolio-5.png' },
  { id: 'port-6', href: 'port-6.html', title: '학교 미세먼지 관리 안내서', thumb: 'resources/img/common/portfolio-6.png' },
];

(function () {
  function currentIndex() {
    // body의 data-project-id가 없으면 파일명(port-1.html -> port-1)으로 판단한다.
    var id = document.body.getAttribute('data-project-id') ||
      location.pathname.split('/').pop().replace(/\.html?$/, '');
    return window.PROJECTS.findIndex(function (p) { return p.id === id; });
  }

  function wrap(i, n) {
    return ((i % n) + n) % n;
  }

  function applyProject(el, project, opts) {
    if (!el || !project) return;
    el.href = project.href;
    if (opts.titleSelector) {
      // "Prev/Next Project" 라벨 자리를 프로젝트 명으로 바꾼다.
      var titleEl = el.querySelector(opts.titleSelector);
      if (titleEl) titleEl.textContent = project.title;
    }
    if (opts.imgSelector) {
      var imgEl = el.querySelector(opts.imgSelector);
      if (imgEl) imgEl.src = project.thumb;
    }
  }

  function fillNav(prevEl, nextEl, opts) {
    var list = window.PROJECTS;
    var i = currentIndex();
    if (i < 0 || list.length < 2) return; // 현재 페이지가 목록에 없거나 비교할 다른 프로젝트가 없으면 손대지 않는다
    applyProject(prevEl, list[wrap(i - 1, list.length)], opts);
    applyProject(nextEl, list[wrap(i + 1, list.length)], opts);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // 좌하단 goodbye-section의 Prev/Next Project 카드(제목 + 썸네일)
    fillNav(
      document.querySelector('.goodbye-box[data-nav="prev"]'),
      document.querySelector('.goodbye-box[data-nav="next"]'),
      { titleSelector: '.goodbye-box-label span:first-child', imgSelector: '.prev-img img' }
    );
    // 하단 고정 퀵 내비게이션(.quick-nav)은 링크만 필요
    fillNav(
      document.querySelector('.quick-nav-prev'),
      document.querySelector('.quick-nav-next'),
      { titleSelector: null, imgSelector: null }
    );
  });
})();

// =================================================================
// #outro(Ctrl+S 클로징 화면 + blob-words 라벨 애니메이션)의 "커튼 공개
// (reveal footer)" 처리. #outro는 CSS에서 이미 position:fixed로 화면
// 하단에 고정돼 있고, 앞의 .page-content가 그 위를 덮고 있다가 스크롤이
// .outro-spacer까지 내려가야 뒤에 있던 #outro가 자연스럽게 드러난다
// (GSAP pin/scrub 불필요 - 브라우저 기본 스택 규칙만으로 동작).
// 이 스크립트가 하는 일은 두 가지뿐이다:
//   1. .outro-spacer 높이를 #outro 실제 높이에 맞춰 자동 동기화
//   2. .outro-spacer가 화면에 보이기 시작하면(=커튼이 걷히기 시작하면)
//      Ctrl+S 텍스트/Prev-Next 카드가 순차적으로(스태거) 나타나게 함
// blob-words(.port-footer 라벨 애니메이션)의 등장 타이밍은 위쪽
// .blob-words의 data-trigger=".outro-spacer" 옵션이 알아서 처리한다
// (별도 연결 코드 불필요).
// =================================================================
document.addEventListener('DOMContentLoaded', function () {
  var outro = document.getElementById('outro');
  var spacer = document.querySelector('.outro-spacer');
  if (!outro || !spacer) return;

  // 1. 빈 자리(.outro-spacer) 높이를 #outro 실제 높이로 맞춰서, 스크롤이
  //    끝까지 내려갔을 때 정확히 #outro 높이만큼만 더 스크롤되게 한다.
  new ResizeObserver(function () {
    spacer.style.height = outro.offsetHeight + 'px';
  }).observe(outro);

  // 2. Ctrl+S 텍스트/Prev-Next 카드 등장 애니메이션. GSAP이 없으면
  //    CSS 기본 상태(그냥 바로 보임)로 두고 넘어간다.
  var targets = (typeof gsap !== 'undefined')
    ? gsap.utils.toArray('.goodbye-bold span, .goodbye-thin, .goodbye-box')
    : [];
  if (!targets.length) return;

  var played = false;
  function reveal() {
    if (played) return;
    played = true;
    gsap.from(targets, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.12,
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) reveal();
    });
  }, { threshold: 0.35 });
  io.observe(spacer);
});

// =================================================================
// 제품 핫스팟 + 상세 패널.
// #stage가 없는 페이지에서는 곧바로 빠져나가므로 이 파일을 불러오는
// 모든 페이지에 안전하게 둘 수 있다.
// =================================================================
(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function run() {
    var stage = document.getElementById('stage');
    if (!stage) return;

    // -----------------------------------------------------------------
    // 장면(배경) 목록. 패널의 → 버튼으로 한 장면의 마지막 핫스팟을 지나면
    // 다음 장면으로 배경 이미지가 바뀌고, 그 장면의 첫 핫스팟 내용이 뜬다
    // (← 는 이전 장면의 마지막 핫스팟으로). 장면마다 핫스팟 개수는 자유.
    // - image / width / height: 배경 이미지와 픽셀 크기(비율 계산용)
    // - bg: 이미지 가장자리 배경색 (화면 비율 때문에 남는 영역을 채움)
    // - hotspots[].x / y: 그 장면 이미지 기준 % 좌표
    // - hotspots[].zoom: 패널 이미지가 보여줄 원본 가로폭 비율(0~1, 작을수록 확대)
    // - hotspots[].image: (선택) 패널 이미지. 없으면 배경을 확대 크롭해서 보여줌
    // -----------------------------------------------------------------
    var HS_SCENES = [
      {
        name: "메인",
        image: "resources/img/port/tracker-task.png", width: 4500, height: 3000, bg: "#ddedf8",
        alt: "비스듬히 놓인 스마트폰",
        hotspots: [
          {
            x: 51, y: 49.5, zoom: .42,
            title: "메인 화면의 정보 위계 불명확",
            body: [
              "미세먼지 수치, 측정 상태, 안내 문구 등의 정보가 유사한 비중으로 배치되어 있어 사용자가 현재 상태를 판단하는 데 필요한 핵심 정보를 빠르게 파악하기 어렵습니다."
            ]
          },
          {
            x: 61.2, y: 21.9, zoom: .3,
            title: "위치 맥락이 부족한 정보 구조",
            body: [
              "현재 측정된 미세먼지 정보의 위치가 구체적으로 표시되지 않아 사용자가 해당 데이터가 어느 지역을 기준으로 제공되는지 즉시 인지하기 어렵습니다."
            ]
          },
          {
            x: 52, y: 21, zoom: .2,
            title: "숨겨진 메뉴 구조",
            body: [
              "주요 기능이 Drawer Menu 안에 숨겨져 있어 콘텐츠를 확인하면서 다른 기능으로 이동하기 위해 별도의 메뉴를 열어야 하는 구조입니다."
            ]
          }
        ]
      },
      {
        // TODO: 임시 문구 - 직접 수정
        name: "위치 데이터",
        image: "resources/img/port/tracker-task-2.png", width: 4500, height: 3000, bg: "#ddedf8",
        alt: "위치 데이터 목록 화면이 띄워진 스마트폰",
        hotspots: [
          {
            x: 56, y: 26.5, zoom: .25,
            title: "구분이 약한 날짜 탭",
            body: [
              "'어제'와 '오늘' 탭의 선택 상태가 색 차이만으로 표시되어 지금 어떤 날짜의 데이터를 보고 있는지 한눈에 알기 어렵습니다."
            ]
          },
          {
            x: 46.3, y: 52.5, zoom: .3,
            title: "텍스트로만 나열된 측정 기록",
            body: [
              "시간·위치·구분이 같은 형태의 행으로 끝없이 반복되어 특정 시간대나 이상 수치를 찾으려면 목록을 일일이 훑어봐야 합니다."
            ]
          },
          {
            x: 52.7, y: 75, zoom: .25,
            title: "지도 없이 표시되는 위치",
            body: [
              "위치가 '종로구' 같은 텍스트로만 제공되어 실제로 어디에서 측정된 데이터인지 공간적으로 파악하기 어렵습니다."
            ]
          }
        ]
      },
      {
        // TODO: 임시 문구 - 직접 수정
        name: "환경설정",
        image: "resources/img/port/tracker-task-3.png", width: 4500, height: 3000, bg: "#ddedf8",
        alt: "환경설정 화면이 띄워진 스마트폰",
        hotspots: [
          {
            x: 50, y: 35, zoom: .3,
            title: "한 화면에 몰린 입력 폼",
            body: [
              "기본 정보, 추가 정보, 질병 정보가 한 화면에 모두 입력 필드로 나열되어 무엇을 수정해야 하는지 파악하기 어렵습니다."
            ]
          },
          {
            x: 50.4, y: 77.3, zoom: .28,
            title: "눈에 띄지 않는 저장 버튼",
            body: [
              "저장하기 버튼이 배경과 비슷한 톤으로 표시되어 주요 동작임에도 시각적 우선순위가 낮습니다."
            ]
          }
        ]
      }
    ];

    var ICON_PLUS = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 1v14M1 8h14"/></svg>';

    var demo = stage.closest('.hotspot-demo') || stage;
    var firstProduct = document.getElementById('product');
    var panel = document.getElementById('panel');
    var media = document.getElementById('media');
    var body = document.getElementById('hotspotBody');
    var dots = document.getElementById('dots');
    var closeBtn = document.getElementById('closeBtn');
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');

    // 모든 장면의 핫스팟을 이동 순서대로 펼친 목록
    var ITEMS = [];
    var current = -1;     // ITEMS 인덱스, 패널이 닫혀 있으면 -1
    var sceneIndex = -1;  // 현재 보이는 장면

    // 장면 레이어 묶음. 패널이 열릴 때 이 묶음 전체가 옆으로 비켜난다.
    // HTML에 이미 있는 #product는 첫 장면으로 재사용하고, 나머지 장면은 JS가 만든다.
    var scenesEl = document.createElement('div');
    scenesEl.className = 'scenes';
    stage.insertBefore(scenesEl, stage.firstChild);

    HS_SCENES.forEach(function (scene, s) {
      var product = (s === 0 && firstProduct) ? firstProduct : document.createElement('div');
      product.className = 'product';
      product.removeAttribute('id');
      product.style.setProperty('--hs-img-ratio', scene.width / scene.height);

      var img = product.querySelector('img');
      if (!img) { img = new Image(); product.appendChild(img); }
      img.removeAttribute('id');
      img.src = scene.image;
      img.alt = scene.alt || '';
      img.width = scene.width;
      img.height = scene.height;

      scene.el = product;
      scene.firstItem = ITEMS.length;

      scene.hotspots.forEach(function (h, k) {
        var b = document.createElement('button');
        b.className = 'hotspot';
        b.style.setProperty('--x', h.x + '%');
        b.style.setProperty('--y', h.y + '%');
        b.style.setProperty('--i', k);
        b.style.setProperty('--d', (k * 0.35) + 's');
        b.setAttribute('aria-label', h.title);
        b.setAttribute('aria-expanded', 'false');
        b.setAttribute('aria-controls', 'panel');
        b.innerHTML = ICON_PLUS;
        var index = ITEMS.length;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          if (current === index) close(); else open(index);
        });
        product.appendChild(b);
        ITEMS.push({ scene: s, local: k, data: h, spot: b });
      });

      scenesEl.appendChild(product);
    });

    // 장면 전환: 배경 이미지 크로스페이드 + 배경색 변경 + 점(dots) 다시 그리기
    function showScene(s) {
      if (s === sceneIndex) return;
      HS_SCENES.forEach(function (scene, k) { scene.el.classList.toggle('is-active', k === s); });
      demo.style.setProperty('--hs-bg', HS_SCENES[s].bg);
      sceneIndex = s;

      dots.innerHTML = '';
      HS_SCENES[s].hotspots.forEach(function (h, k) {
        var d = document.createElement('button');
        d.className = 'dot';
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', (k + 1) + ' / ' + HS_SCENES[s].hotspots.length + ': ' + h.title);
        d.addEventListener('click', function () { open(HS_SCENES[s].firstItem + k); });
        dots.appendChild(d);
      });
    }

    // 패널 이미지: 핫스팟 전용 이미지, 없으면 해당 장면 배경을 확대 크롭
    function makeMedia(item) {
      var h = item.data, scene = HS_SCENES[item.scene];
      if (h.image) {
        var img = new Image();
        img.src = h.image; img.alt = '';
        return img;
      }
      var W = scene.width, H = scene.height;
      var crop = document.createElement('div');
      crop.className = 'crop';
      var cw = W * (h.zoom || .3);
      var ch = cw * 3 / 4;
      var cx = h.x / 100 * W, cy = h.y / 100 * H;
      var vx = Math.max(0, Math.min(W - cw, cx - cw / 2));
      var vy = Math.max(0, Math.min(H - ch, cy - ch / 2));
      crop.style.backgroundImage = 'url("' + scene.image + '")';
      crop.style.backgroundSize = (W / cw * 100) + '% auto';
      crop.style.backgroundPosition = (vx / (W - cw) * 100) + '% ' + (vy / (H - ch) * 100) + '%';
      return crop;
    }

    function swapLayer(container, newContent, animate) {
      container.querySelectorAll('.layer:not(.leave)').forEach(function (old) {
        if (!animate) { old.remove(); return; }
        old.classList.remove('enter');
        old.classList.add('leave');
        old.addEventListener('animationend', function () { old.remove(); }, { once: true });
        setTimeout(function () { old.remove(); }, 1000); // animationend가 안 올 때 대비
      });
      var layer = document.createElement('div');
      layer.className = 'layer' + (animate ? ' enter' : '');
      layer.append(newContent);
      container.insertBefore(layer, container === media ? closeBtn : null);
      return layer;
    }

    // ← / → 가 장면을 넘어갈 때는 스크린리더에 다음 장면 이름을 알려준다
    function updateArrows() {
      var n = ITEMS.length;
      var next = ITEMS[(current + 1) % n], prev = ITEMS[(current - 1 + n) % n];
      var here = ITEMS[current].scene;
      nextBtn.setAttribute('aria-label', next.scene !== here ? '다음 장면: ' + HS_SCENES[next.scene].name : '다음');
      prevBtn.setAttribute('aria-label', prev.scene !== here ? '이전 장면: ' + HS_SCENES[prev.scene].name : '이전');
    }

    function open(i) {
      var n = ITEMS.length;
      i = (i + n) % n;
      if (i === current) return;
      var wasOpen = current !== -1;
      var item = ITEMS[i], scene = HS_SCENES[item.scene];

      showScene(item.scene);

      swapLayer(media, makeMedia(item), wasOpen);
      var frag = document.createElement('div');
      frag.innerHTML =
        '<span class="eyebrow">' + ('0' + (item.scene + 1)).slice(-2) + ' ' + scene.name + ' · ' + (item.local + 1) + '/' + scene.hotspots.length + '</span>' +
        '<h2 id="panelTitle">' + item.data.title + '</h2>' +
        item.data.body.map(function (p) { return '<p>' + p + '</p>'; }).join('');
      body.querySelectorAll('[id="panelTitle"]').forEach(function (el) { el.removeAttribute('id'); });
      swapLayer(body, frag, wasOpen);

      ITEMS.forEach(function (it, k) { it.spot.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
      Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute('aria-current', k === item.local ? 'true' : 'false'); });
      current = i;
      updateArrows();

      if (!wasOpen) {
        panel.setAttribute('aria-hidden', 'false');
        panel.classList.add('is-open');
        stage.classList.add('panel-open');
        requestAnimationFrame(function () { closeBtn.focus({ preventScroll: true }); });
      }
    }

    function close() {
      if (current === -1) return;
      var spot = ITEMS[current].spot; // 항상 현재 보이는 장면의 핫스팟
      spot.setAttribute('aria-expanded', 'false');
      current = -1;
      panel.classList.remove('is-open');
      stage.classList.remove('panel-open');
      panel.setAttribute('aria-hidden', 'true');
      spot.focus({ preventScroll: true });
    }

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { open(current - 1); });
    nextBtn.addEventListener('click', function () { open(current + 1); });

    stage.addEventListener('click', close);
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    document.addEventListener('keydown', function (e) {
      if (current === -1) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') open(current + 1);
      else if (e.key === 'ArrowLeft') open(current - 1);
    });

    // 첫 장면으로 시작하고, 나머지 배경은 미리 불러와 전환 시 바로 보이게 한다
    showScene(0);
    HS_SCENES.slice(1).forEach(function (s) { new Image().src = s.image; });
  }
})();

/* 목업 슬라이더 (.ms) (원래 resources/js/mockup-slider.js 를 합침).
   HTML에 적힌 .ms-slide 순서대로 프레임 안에 한 장씩 들어온다.
   - 다음 화면은 항상 프레임 왼쪽에 대기하다가 오른쪽으로 밀려 들어오고,
     현재 화면은 프레임 오른쪽 밖(clip-path 영역)으로 밀려나 사라진다.
   - 한 칸 이동이 끝나면 맨 오른쪽(이미 안 보이는) 슬라이드를 맨 왼쪽으로
     옮기고 위치를 되돌려서 끊김 없이 무한 반복한다.
   옵션: <div class="ms" data-delay="2500"> - 한 장이 머무는 시간(ms) */
(function(){
  function init(root){
    var viewport = root.querySelector('.ms-viewport');
    var track = root.querySelector('.ms-track');
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;

    var delay = parseInt(root.getAttribute('data-delay'), 10) || 2500;

    // 왼쪽 빈 공간을 채울 만큼 세트를 복제 (이미지가 적어도 왼쪽이 비지 않게)
    var seq = slides.slice();
    while (seq.length < 10) {
      slides.forEach(function(s){
        var c = s.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.querySelectorAll('img').forEach(function(img){ img.alt = ''; });
        seq.push(c);
      });
    }

    // 다음 화면이 왼쪽에서 오므로 DOM은 역순으로 배치.
    // active = 뒤에서 두 번째 칸, 맨 끝 한 칸은 재활용용(프레임 오른쪽에 숨어 있음)
    var n = seq.length;
    var active = n - 2;
    track.innerHTML = '';
    for (var i = 0; i < n; i++) {
      track.appendChild(seq[((active - i) % n + n) % n]);
    }

    function slideW(){ return track.children[0].getBoundingClientRect().width; }
    function step(){ return slideW() + (parseFloat(getComputedStyle(track).columnGap) || 0); }

    // active 슬라이드의 가운데를 뷰포트 가운데(=프레임 가운데)에 맞춘다
    function place(){
      var x = viewport.clientWidth / 2 - (active * step() + slideW() / 2);
      track.style.transform = 'translateX(' + x + 'px)';
      return x;
    }

    var timer = null;
    var moving = false;
    var visible = true;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function next(){
      if (moving) return;
      moving = true;
      var x = place();
      track.offsetWidth; // 위치 확정 후 transition 시작
      track.classList.add('is-moving');
      track.style.transform = 'translateX(' + (x + step()) + 'px)';
    }

    track.addEventListener('transitionend', function(e){
      if (e.target !== track) return;
      track.classList.remove('is-moving');
      track.insertBefore(track.lastElementChild, track.firstElementChild);
      place();
      moving = false;
      schedule();
    });

    function schedule(){
      clearTimeout(timer);
      if (reduce || !visible || document.hidden || moving) return;
      timer = setTimeout(next, delay);
    }

    place();
    window.addEventListener('resize', function(){ if (!moving) place(); });
    document.addEventListener('visibilitychange', schedule);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries){
        visible = entries[0].isIntersecting;
        schedule();
      }).observe(root);
    } else {
      schedule();
    }
  }

  function boot(){
    document.querySelectorAll('.ms').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// =================================================================
// port-2 DESIGN CONCEPT: 붓으로 그린 원(.concept-ring)이 화면에 들어오면
// 12시 방향부터 한 바퀴 그려지는 애니메이션. 스타일은 port-1.css의
// .concept-ring / .is-ring-ready / .is-ring-drawn 참고.
// .concept-list가 없는 페이지에서는 바로 빠져나간다.
// =================================================================
(function () {
  function boot() {
    var list = document.querySelector('.concept-list');
    if (!list) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 애니메이션을 못 쓰는 환경(모션 줄이기, @property 미지원 등)이면 원래대로 다 그려진 원을 보여준다
    if (reduce || !('IntersectionObserver' in window) || !(window.CSS && 'registerProperty' in CSS)) return;

    list.classList.add('is-ring-ready');
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      list.classList.add('is-ring-drawn');
      io.disconnect();
    }, { threshold: 0.4 });
    io.observe(list);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// =================================================================
// 위치 데이터 기능 소개 (.location-feature)
// 흰 박스 안의 실제 컴포넌트(날짜 검색칸 · 그래프 버튼)를 박스 크기에 맞춰 키우고,
// 캘린더는 예시 날짜 하루가 선택된 채로 펼쳐 둔다.
// =================================================================
(function () {
  function boot() {
    var cards = document.querySelectorAll('.location-feature .lf-card');
    if (!cards.length) return;

    // 1) 박스 크기에 맞춘 배율: 캘린더는 박스 높이의 72%, 그래프 버튼은 박스 높이의 38%
    function fit(card) {
      var live = card.querySelector('.lf-live');
      if (!live) return;
      var w = +live.dataset.w, h = +live.dataset.h;
      var isCal = card.classList.contains('lf-card-cal');
      var k = isCal
        ? Math.min(card.clientHeight * 0.72 / h, card.clientWidth * 0.7 / w)
        : card.clientHeight * 0.38 / h;
      live.style.setProperty('--lf-w', w);
      live.style.setProperty('--lf-h', h);
      live.style.setProperty('--lf-k', Math.max(0.8, Math.min(k, 2.4)).toFixed(3));
    }
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function (ents) { ents.forEach(function (e) { fit(e.target); }); }) : null;
    cards.forEach(function (card) { fit(card); if (ro) ro.observe(card); });

    // 2) 캘린더: 예시 날짜 하루를 넣어 펼친다 (calendar.js 가 입력값을 읽어 달력을 그린다)
    var cal = document.getElementById('lfCalendar');
    var input = cal && cal.querySelector('input');
    if (input) {
      input.value = '2026.09.15';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// =================================================================
// Main Page 쇼케이스 (.dd-stage)
// 1) 스크롤 연동 펼침: 섹션이 화면에 올라오는 만큼 폰에서 가까운 것부터 한 장씩
//    펼쳐지고, 스크롤을 올리면 다시 접힌다.
//    - 카드: 폰 뒤에 숨어 있다가 부채처럼 제자리로 펼쳐진다.
//    - 칩: 배경이 투명해 겹치면 글자가 엉키므로, 제자리 근처에서 밀려 들어오며 나타난다.
// 2) 자동 순환: 다 펼쳐진 뒤 3초마다 단계가 한 칸씩 폰 쪽으로 당겨지고, 맨 앞에 있던
//    단계는 맨 뒤로 간다. 화면 끝에서 잘려 있던 카드도 차례로 앞으로 나온다.
//    - 카드나 칩에 마우스를 올리면 멈추고, 누르면 그 단계가 맨 앞자리로 온다.
//    - 카드와 칩은 같은 단계끼리 짝지어 함께 움직인다.
// 제자리(다 펼쳐진 모습)는 CSS 가 정하고, 여기서는 자리 이동을 transform · opacity 로 준다.
// =================================================================
(function () {
  function boot() {
    var stage = document.querySelector('.dd-stage');
    var phone = stage && stage.querySelector('.dd-phone');
    if (!stage || !phone) return;

    // 폰에서 가까운 순서로 맞춘다: 카드는 오른쪽 끝부터, 칩은 왼쪽 끝부터.
    // 같은 번호끼리 같은 단계다 (0 보통 · 1 나쁨 · 2 매우나쁨).
    var cardEls = Array.prototype.slice.call(stage.querySelectorAll('.dd-card')).reverse();
    var chipEls = Array.prototype.slice.call(stage.querySelectorAll('.dd-chip'));
    var n = Math.min(cardEls.length, chipEls.length);
    if (!n) return;
    var cards = cardEls.slice(0, n).map(function (el, i) { return { el: el, id: i, chip: false }; });
    var chips = chipEls.slice(0, n).map(function (el, i) { return { el: el, id: i, chip: true }; });
    var items = cards.concat(chips);

    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var narrow = matchMedia('(max-width: 900px)');
    var STAGGER = 0.2;      // 펼침: 다음 장이 출발하기까지의 간격 (전체 진행 0~1 기준)
    var SPAN = 0.6;         // 펼침: 한 장이 펼쳐지는 데 쓰는 구간
    var CHIP_SHIFT = 56;    // 펼침: 칩이 밀려 들어오는 거리(px)
    var CYCLE_MS = 3000;    // 순환: 자리 바꾸는 간격
    var FIRST_MS = 1200;    // 순환: 다 펼쳐진 뒤 첫 번째로 자리를 바꾸기까지
    var SNAP_AT = 0.85;     // 펼침: 이만큼 진행되면 스크롤을 더 내리지 않아도 끝까지 펼친다
    var DONE_AT = 0.985;    // 펼침: 이 이상이면 눈으로는 다 펼쳐진 상태 (순환 시작 기준)
    var MOVE_MS = 800;      // 순환: 한 번 자리 바꾸는 데 걸리는 시간 (CSS .is-cycling 의 transition 과 같게)

    var order = [];         // order[자리] = 단계 번호. 자리 0 이 폰 바로 옆
    for (var k = 0; k < n; k++) order.push(k);
    var cur = 0, target = 0, raf = 0, timer = 0, paused = false, wrapTimers = [];

    function slotOf(id) { return order.indexOf(id); }
    function clear() {
      items.forEach(function (it) { it.el.style.transform = ''; it.el.style.opacity = ''; it.el.style.zIndex = ''; });
    }

    // 제자리 기준으로 "폰 뒤에 숨는 거리"와 "자리별 위치"를 잰다
    var cardSlotLeft = [], chipStart = 0, chipGap = 0;
    function measure() {
      clear();
      var p = phone.getBoundingClientRect(), center = p.left + p.width / 2;
      items.forEach(function (it) {
        var r = it.el.getBoundingClientRect();
        it.left = r.left; it.width = r.width;
        it.hide = center - (r.left + r.width / 2);
      });
      cardSlotLeft = cards.map(function (c) { return c.left; });   // 카드는 폭이 같아 자리 = 원래 위치
      chipStart = chips[0].left;
      chipGap = n > 1 ? chips[1].left - (chips[0].left + chips[0].width) : 0;
    }
    // 지금 순서에서 각 요소가 제자리에서 얼마나 옮겨 가야 하는지
    function place() {
      cards.forEach(function (c) { c.shift = cardSlotLeft[slotOf(c.id)] - c.left; });
      var x = chipStart;   // 칩은 폭이 서로 달라 순서대로 다시 쌓는다
      order.forEach(function (id) { var c = chips[id]; c.shift = x - c.left; x += c.width + chipGap; });
    }

    function render() {
      items.forEach(function (it) {
        var q = Math.min(1, Math.max(0, (cur - slotOf(it.id) * STAGGER) / SPAN));
        var e = 1 - Math.pow(1 - q, 3);   // 끝에서 부드럽게 멈춤
        if (it.chip) {
          it.el.style.transform = 'translateX(' + (it.shift - CHIP_SHIFT * (1 - e)).toFixed(1) + 'px)';
          it.el.style.opacity = e.toFixed(3);
        } else {
          it.el.style.transform = 'translateX(' + (it.shift * e + it.hide * (1 - e)).toFixed(1) + 'px) scale(' + (0.9 + 0.1 * e).toFixed(3) + ')';
        }
      });
    }

    /* ---------- 자동 순환 ---------- */
    function clearWrap() { wrapTimers.forEach(clearTimeout); wrapTimers = []; }
    // 새 순서로 옮긴다. moved = 맨 앞에서 뒤로 넘어가는 단계들 (다른 것 뒤로 지나가게 처리)
    function applyOrder(next, moved) {
      clearWrap();
      order = next;
      place();
      cards.forEach(function (c) { c.el.style.zIndex = moved.indexOf(c.id) > -1 ? '0' : '1'; });
      chips.forEach(function (c) {
        if (moved.indexOf(c.id) < 0) return;
        // 칩은 투명 배경이라 가로질러 가는 동안은 숨겼다가 도착하면 다시 보인다
        c.el.style.opacity = '0';
        wrapTimers.push(setTimeout(function () { c.el.style.opacity = '1'; }, MOVE_MS));
      });
      items.forEach(function (it) {
        it.el.style.transform = it.chip
          ? 'translateX(' + it.shift.toFixed(1) + 'px)'
          : 'translateX(' + it.shift.toFixed(1) + 'px) scale(1)';
        if (!it.chip || moved.indexOf(it.id) < 0) it.el.style.opacity = it.chip ? '1' : '';
      });
    }
    function next() { applyOrder(order.slice(1).concat(order[0]), [order[0]]); }
    function bringFront(id) {
      var s = slotOf(id);
      if (s <= 0) return;
      applyOrder(order.slice(s).concat(order.slice(0, s)), order.slice(0, s));
    }
    function step() { if (!paused && !document.hidden) next(); }
    function startCycle(firstDelay) {
      if (timer || reduced) return;
      stage.classList.add('is-cycling');
      // 첫 번째는 조금 빨리, 그다음부터 일정한 간격으로
      timer = setTimeout(function () {
        step();
        timer = setInterval(step, CYCLE_MS);
      }, firstDelay == null ? FIRST_MS : firstDelay);
    }
    function stopCycle() {
      if (!timer) return;
      clearTimeout(timer); clearInterval(timer); timer = 0;
      clearWrap();
      stage.classList.remove('is-cycling');
    }
    // 직접 고른 뒤에는 한 간격을 온전히 쉬었다가 다시 돈다
    function restartCycle() { if (timer) { clearTimeout(timer); clearInterval(timer); timer = 0; startCycle(CYCLE_MS); } }

    /* ---------- 스크롤 연동 ---------- */
    // 섹션 윗변이 화면의 85% 지점에 오면 시작, 25% 지점에 오면 다 펼쳐진다
    function readTarget() {
      var vh = window.innerHeight, top = stage.getBoundingClientRect().top;
      var t = Math.min(1, Math.max(0, (vh * 0.85 - top) / (vh * 0.6)));
      return t >= SNAP_AT ? 1 : t;
    }
    function tick() {
      raf = 0;
      if (timer) { cur = target; return; }   // 순환이 시작됐으면 자리는 순환 쪽이 맡는다
      cur += (target - cur) * 0.14;       // 스크롤을 살짝 늦게 따라가 움직임이 매끈해진다
      if (Math.abs(target - cur) < 0.001) cur = target;
      render();
      if (target === 1 && cur >= DONE_AT) startCycle();   // 눈으로 다 펼쳐지면 순환 시작 (마무리 구간을 기다리지 않는다)
      if (cur !== target) raf = requestAnimationFrame(tick);
    }
    function update() {
      if (reduced || narrow.matches) return;
      target = readTarget();
      if (target < 1) stopCycle();        // 접히는 동안은 순환을 쉰다
      if (!raf && cur !== target) raf = requestAnimationFrame(tick);
    }
    function reset() {
      stopCycle();
      cancelAnimationFrame(raf); raf = 0;
      if (narrow.matches) { clear(); return; }
      measure();
      place();
      cur = target = reduced ? 1 : readTarget();
      render();
      if (cur === 1) startCycle();
    }

    /* ---------- 마우스 · 키보드 ---------- */
    [stage.querySelector('.dd-cards'), stage.querySelector('.dd-chips')].forEach(function (zone) {
      if (!zone) return;
      zone.addEventListener('mouseenter', function () { paused = true; });
      zone.addEventListener('mouseleave', function () { paused = false; });
    });
    items.forEach(function (it) {
      function pick() {
        if (narrow.matches || cur < 1) return;
        stage.classList.add('is-cycling');
        bringFront(it.id);
        restartCycle();
      }
      it.el.setAttribute('role', 'button');
      it.el.setAttribute('tabindex', '0');
      it.el.addEventListener('click', pick);
      it.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      it.el.addEventListener('focus', function () { paused = true; });
      it.el.addEventListener('blur', function () { paused = false; });
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', reset);
    window.addEventListener('load', reset);   // 이미지가 다 불러와진 뒤 크기를 다시 잰다
    reset();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
