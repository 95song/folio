/* =====================================================================
   profile.js — profile.html 전용 스크립트
   (공용 동작은 common.js / 아래 HERO_CONFIG 에서 히어로 문구·구간 수정)
   ===================================================================== */

/* =====================================================================
   HERO 설정 — 문구·키워드·단계 구간은 여기서만 수정하면 됩니다
   ===================================================================== */
const HERO_CONFIG = {
  // 1단계(헤맴)에 흩어지는 트렌드 키워드 (8~12개 권장)
  keywords: ['AI', 'Motion', 'Brutalism', '3D', 'Minimal', 'UX Writing', 'Y2K', 'Glassmorphism', 'Bento Grid', 'Variable Font', 'Dark Mode', 'Neumorphism'],
  // 2단계(탐색)에서 해독되는 문장
  sentence: '트렌드를 쫓아 헤매던 끝에, 나만의 기준을 찾았다.',
  // 3단계(발견)에서 혼자 남는 핵심 단어 — sentence 안에 그대로 들어있어야 함
  keyword: '기준',
  // 3단계 끝에 나타나는 한 줄 (HTML 사용 가능)
  found: '<span class="tag">Found</span>유행이 아니라, <b>기준</b>으로 디자인합니다.',
  // 단계 경계 [1→2, 2→3] (0~1 사이 스크롤 진행도)
  stages: [0.33, 0.66],
  // 2단계 안에서 해독이 끝나는 지점 (0~1, 낮을수록 빨리 끝남)
  decodeEnd: 0.85,
};

(() => {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 글자 분리 ---------- */
  function split(el, cls) {
    const nodes = [...el.childNodes];
    el.textContent = '';
    nodes.forEach(n => {
      if (n.nodeType === 3) {
        [...n.textContent].forEach(c => {
          if (/\s/.test(c)) { el.append(' '); return; }
          const s = document.createElement('span');
          s.className = cls; s.textContent = c;
          if (cls === 'ch') { const w = document.createElement('span'); w.className = 'ch_wrap'; w.append(s); el.append(w); }
          else el.append(s);
        });
      } else if (n.nodeName === 'BR') el.append(n);
      else { split(n, cls); el.append(n); }
    });
  }
  document.querySelectorAll('[data-split]').forEach(el => split(el, 'ch'));

  /* ---------- 공용: 스크롤 기반 스크램블 해독 (히어로 문장 · LIFE NOW 에서 사용) ---------- */
  // 한글 → 랜덤 음절, 영문 → 같은 대/소문자 알파벳, 숫자 → 숫자, 그 외(문장부호)는 그대로
  const charType = c => /[가-힣]/.test(c) ? 'ko' : /[a-z]/.test(c) ? 'lo' : /[A-Z]/.test(c) ? 'up' : /[0-9]/.test(c) ? 'num' : null;
  const pickChar = t => t === 'ko' ? String.fromCharCode(0xAC00 + Math.floor(Math.random() * 11172))
    : t === 'num' ? String(Math.floor(Math.random() * 10))
    : String.fromCharCode((t === 'up' ? 65 : 97) + Math.floor(Math.random() * 26));
  // t(0~1)만큼 앞에서부터 해독. reroll=true 일 때만 아직 안 풀린 글자를 다시 섞음 (스크롤 멈추면 정지)
  function decodeChars(chars, t, reroll) {
    const n = chars.length, count = Math.min(n, Math.floor(Math.max(0, Math.min(1, t)) * (n + 1)));
    for (let i = 0; i < n; i++) {
      const c = chars[i], scr = i >= count;
      if (scr && (reroll || !c.el.dataset.r)) c.el.dataset.r = pickChar(c.type);
      c.el.classList.toggle('is-scr', scr);
      c.el.classList.toggle('is-head', scr && i === count);
    }
  }
  // 요소의 글자를 단어(.sw) > 글자(.sc) 로 나누고 해독 대상 목록을 돌려줌
  function buildDecode(el) {
    const text = el.textContent.trim(), chars = [];
    el.setAttribute('aria-label', text); el.textContent = '';
    text.split(' ').forEach((word, wi, arr) => {
      const sw = document.createElement('span'); sw.className = 'sw'; sw.setAttribute('aria-hidden', 'true');
      for (const c of word) {
        const sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = c;
        const type = charType(c); if (type) chars.push({ el: sc, type });
        sw.append(sc);
      }
      el.append(sw); if (wi < arr.length - 1) el.append(' ');
    });
    return chars;
  }

  /* ---------- 부드러운 스크롤 ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- 메뉴 ---------- */
  // 열고 닫기는 common.js 가 처리 → 메뉴가 열려 있는 동안 부드러운 스크롤만 멈춤
  document.addEventListener('sitemap:toggle', e => { if (lenis) e.detail.open ? lenis.stop() : lenis.start(); });

  /* ---------- 커서: 따라다니기는 common.js, 여기서는 링크·버튼 위에서 확대 ---------- */
  const follower = document.querySelector('.cursor-follower');
  document.querySelectorAll('a, button, .skill_row').forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('hover-concept-1'));
    el.addEventListener('mouseleave', () => follower.classList.remove('hover-concept-1'));
  });

  /* ---------- 0. 로더 → 히어로 등장 ---------- */
  gsap.set('.loader_name .ch', { yPercent: 110 });

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const counter = { v: 0 };
  intro
    .to('.loader_name .ch', { yPercent: 0, duration: 1.1, stagger: .05 })
    .to(counter, { v: 100, duration: reduce ? .2 : 1.6, ease: 'power2.inOut',
      onUpdate: () => document.getElementById('loaderCount').textContent = String(Math.round(counter.v)).padStart(3, '0') }, 0)
    .to('.loader_bar', { scaleX: 1, duration: reduce ? .2 : 1.6, ease: 'power2.inOut' }, 0)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '+=.15')
    .set('.loader', { display: 'none' })
    .from('#heroWords, .hero-lead', { autoAlpha: 0, scale: 1.06, duration: 1.6, stagger: .15, clearProps: 'all' }, '-=.6')
    .from('.hero_meta, .hero-hud', { autoAlpha: 0, y: 16, duration: 1, stagger: .08, clearProps: 'all' }, '-=1.2')
    .add(() => lenis && lenis.start());

  /* 히어로: 실시간 서울 시계 */
  const clock = document.getElementById('heroClock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => clock.textContent = fmt.format(new Date());
  tick(); setInterval(tick, 1000);

  /* ---------- 1. HERO : 스크롤 타이포 (순수 JS, 라이브러리 미사용) ---------- */
  initHero();

  /* ---------- 공통: 글자 상승 리빌 ---------- */
  gsap.utils.toArray('[data-split]').forEach(el => {
    if (el.closest('.hero') || el.closest('.loader')) return;
    gsap.from(el.querySelectorAll('.ch'), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .03,
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- 3. ABOUT ---------- */
  initAbout();

  /* ---------- 4. LIFE : 한 화면 타임라인 — 라인이 채워지며 지나간 지점이 선명해짐 ---------- */
  const lifeLine = document.getElementById('lifeLine');
  const lifeBar = document.getElementById('lifeProgress');
  const lifeBarBox = lifeBar.parentElement;
  const lifePoints = gsap.utils.toArray('.life_point');
  const lifeNowChars = buildDecode(document.getElementById('lifeNow'));
  const LIFE_LINE_END = .8;   // 진행도 0~0.8: 라인 채움, 0.8~1: NOW 문구 해독
  let lifeStops = [], lifeLastRoll = -1;

  // 각 지점의 점 위치를 라인 길이 대비 0~1 로 측정 (가로/세로 공용)
  function measureLife() {
    const vertical = innerWidth <= 768;
    lifeBarBox.style.height = '';   // 가로로 돌아올 때 세로용 높이 제거
    if (vertical) {   // 세로: 라인 길이를 첫 점 → 마지막 점으로 맞춤 (top 기준, 레이아웃 1회)
      const first = lifePoints[0].querySelector('.life_dot').getBoundingClientRect();
      const last = lifePoints[lifePoints.length - 1].querySelector('.life_dot').getBoundingClientRect();
      lifeBarBox.style.height = (last.top - first.top) + 'px';
    }
    const b = lifeBarBox.getBoundingClientRect(), len = vertical ? b.height : b.width;
    lifeStops = lifePoints.map(pt => {
      const d = pt.querySelector('.life_dot').getBoundingClientRect();
      const pos = vertical ? (d.top + d.height / 2) - b.top : (d.left + d.width / 2) - b.left;
      return len ? Math.max(0, Math.min(1, pos / len)) : 0;
    });
  }

  function renderLife(progress) {
    const lp = Math.min(1, progress / LIFE_LINE_END);
    lifeBar.style.setProperty('--lp', lp.toFixed(4));
    lifePoints.forEach((pt, i) => pt.classList.toggle('is-on', lp >= lifeStops[i] - .001));
    const t = (progress - LIFE_LINE_END) / (1 - LIFE_LINE_END - .03);
    const reroll = Math.abs(progress - lifeLastRoll) > .004;
    if (reroll) lifeLastRoll = progress;
    decodeChars(lifeNowChars, t, reroll);
  }

  if (reduce) {
    measureLife(); renderLife(1);   // 연출 없이 최종 상태
    addEventListener('resize', measureLife);
  } else {
    measureLife(); renderLife(0);
    ScrollTrigger.addEventListener('refreshInit', measureLife);
    ScrollTrigger.matchMedia({
      // 데스크톱: 약 150vh 동안 고정하며 진행
      '(min-width: 769px)': () => {
        ScrollTrigger.create({ trigger: '.life', start: 'top top', end: '+=150%', pin: true, scrub: true,
          onUpdate: st => renderLife(st.progress) });
      },
      // 모바일: 고정 없이 세로 타임라인을 스크롤하는 동안 진행
      '(max-width: 768px)': () => {
        ScrollTrigger.create({ trigger: lifeLine, start: 'top 75%', end: 'bottom 55%', scrub: true,
          onUpdate: st => renderLife(st.progress) });
      }
    });
  }

  /* ---------- 5. SKILLS : 막대 + 숫자 카운트 ---------- */
  gsap.utils.toArray('.skill_row').forEach((row, i) => {
    const pct = row.querySelector('.skill_pct'), bar = row.querySelector('.skill_bar i'), to = +pct.dataset.pct;
    const o = { v: 0 };
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%' } })
      .from(row.querySelector('a'), { yPercent: 60, opacity: 0, duration: 1, ease: 'expo.out' })
      .to(bar, { scaleX: to / 100, duration: 1.6, ease: 'expo.out' }, .1)
      .to(o, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => pct.textContent = Math.round(o.v) + '%' }, .1);
  });

  /* ---------- 6. 띠 : 스크롤 속도에 반응하는 마퀴 ---------- */
  gsap.utils.toArray('.band_track').forEach(tr => {
    // data-dir -1: 왼쪽으로 흐름(0 → -50%) / 1: 오른쪽으로 흐름(-50% → 0). 트랙이 2벌 복제라 -50%에서 이음매 없이 반복
    const dir = +tr.dataset.dir;
    const loop = dir > 0
      ? gsap.fromTo(tr, { xPercent: -50 }, { xPercent: 0, duration: 28, ease: 'none', repeat: -1 })
      : gsap.fromTo(tr, { xPercent: 0 }, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    // 스크롤이 빠를수록 잠깐 가속했다가 원래 속도로 (방향은 그대로)
    ScrollTrigger.create({ trigger: '.bands', start: 'top bottom', end: 'bottom top',
      onUpdate: s => {
        const v = gsap.utils.clamp(-6, 6, s.getVelocity() / 300);
        gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: .2, overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2 }) });
      } });
  });

  /* ---------- 7. CTA 자석 효과 ---------- */
  const cta = document.getElementById('cta');
  const qx = gsap.quickTo(cta, 'x', { duration: .6, ease: 'power3.out' });
  const qy = gsap.quickTo(cta, 'y', { duration: .6, ease: 'power3.out' });
  cta.addEventListener('mousemove', e => {
    const r = cta.getBoundingClientRect();
    qx((e.clientX - r.left - r.width / 2) * .35); qy((e.clientY - r.top - r.height / 2) * .35);
  });
  cta.addEventListener('mouseleave', () => { qx(0); qy(0); });

  document.getElementById('toTop').addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 2 }) : scrollTo({ top: 0, behavior: 'smooth' }));

  addEventListener('load', () => ScrollTrigger.refresh());

  /* =================================================================
     ABOUT — 순수 JS (IntersectionObserver + rAF)
     ================================================================= */
  function initAbout() {
    const items = [...document.querySelectorAll('.about_item')];
    const texts = items.map(it => it.querySelector('.about_text'));
    const odos = [...document.querySelectorAll('#aboutNum, #aboutKey')].map(o => [...o.querySelectorAll('.odo_item')]);

    // 왼쪽 번호/키워드 교체: 현재보다 앞은 위로, 뒤는 아래로 → 스크롤 방향대로 굴러감
    let current = 0;
    const setActive = idx => {
      if (idx === current) return;
      current = idx;
      odos.forEach(list => list.forEach((el, k) => {
        el.classList.toggle('is-on', k === idx);
        el.classList.toggle('is-above', k < idx);
      }));
    };
    // 화면 세로 중앙선(위아래 50% 잘라낸 영역)에 걸친 항목을 활성화
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(items.indexOf(e.target)); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    items.forEach(it => io.observe(it));

    if (reduce) return;   // 모션 감소: 문장 굵기·색은 CSS 고정값

    // 문장 포커스: 중앙에서의 거리(화면 높이 40% 이내)를 0~1 로 → --focus
    let ticking = false;
    const update = () => {
      ticking = false;
      const mid = innerHeight / 2, range = innerHeight * .4;
      const vals = texts.map(t => { const r = t.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - mid); });  // 읽기 먼저
      texts.forEach((t, i) => {                                                                                          // 쓰기는 나중에
        const x = Math.max(0, 1 - vals[i] / range), f = x * x * (3 - 2 * x);
        const v = f.toFixed(3);
        if (t.dataset.f !== v) { t.dataset.f = v; t.style.setProperty('--focus', v); }
      });
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
    update();
  }

  /* =================================================================
     HERO 엔진 — 스크롤 진행도(0~1)를 계산해 .hero-sticky 의 CSS 변수로 전달
     ================================================================= */
  function initHero() {
    const H = HERO_CONFIG;
    const hTrack = document.getElementById('heroTrack');
    const hSticky = document.getElementById('heroSticky');
    const hSent = document.getElementById('heroSentence');
    const hKey = document.getElementById('heroKey');
    const hStages = document.querySelectorAll('#heroStages li');
    const hPct = document.getElementById('heroPct');
    const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
    const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

    /* 1단계 키워드 배치 — 자리·속도·방향·블러·투명도는 인덱스 기반 의사난수(새로고침해도 동일) */
    const SPOTS = [[6,16],[58,10],[28,28],[76,26],[8,50],[66,48],[36,70],[80,72],[14,82],[48,40],[86,12],[2,66]];
    const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const wordsBox = document.getElementById('heroWords');
    H.keywords.forEach((w, i) => {
      const el = document.createElement('span');
      el.className = 'hero-word size-' + Math.floor(rnd(i + 80) * 3);
      el.textContent = w;
      const [x, y] = SPOTS[i % SPOTS.length];
      el.style.cssText =
        '--x:' + x + '%;--y:' + y + '%;' +
        '--vx:' + ((rnd(i) - .5) * 40).toFixed(1) + ';' +          // 가로 이동량(vw)
        '--vy:' + ((rnd(i + 20) - .5) * 80).toFixed(1) + ';' +     // 세로 이동량(vh)
        '--b:' + (4 + rnd(i + 40) * 4).toFixed(1) + 'px;' +        // blur 4~8px
        '--o:' + (.2 + rnd(i + 60) * .2).toFixed(2);               // opacity 0.2~0.4
      wordsBox.append(el);
    });

    /* 2단계 문장 — 단어(.sw) > 핵심/일반 조각(.sk) > 글자(.sc) */
    hSent.setAttribute('aria-label', H.sentence);
    let kStart = H.sentence.indexOf(H.keyword);
    if (kStart < 0) kStart = H.sentence.lastIndexOf(' ') + 1;       // 못 찾으면 마지막 단어
    const kEnd = kStart + (H.sentence.indexOf(H.keyword) < 0 ? H.sentence.length : H.keyword.length);
    const chars = [];
    let idx = 0;
    H.sentence.split(' ').forEach((word, wi, arr) => {
      const sw = document.createElement('span'); sw.className = 'sw'; sw.setAttribute('aria-hidden', 'true');
      let seg = null, segIsKey = null;
      for (const c of word) {
        const isKey = idx >= kStart && idx < kEnd;
        if (!seg || segIsKey !== isKey) { seg = document.createElement('span'); seg.className = 'sk' + (isKey ? ' is-key' : ''); segIsKey = isKey; sw.append(seg); }
        const sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = c;
        const type = charType(c);
        if (type) chars.push({ el: sc, type });                       // 문장부호·공백은 그대로
        seg.append(sc); idx += c.length;
      }
      hSent.append(sw);
      if (wi < arr.length - 1) { hSent.append(' '); idx++; }
    });
    hKey.textContent = H.keyword;
    document.getElementById('heroFound').innerHTML = H.found;

    /* 측정: 트랙 위치 + 문장 속 핵심 단어 → 중앙 큰 단어까지의 거리/배율 */
    let trackTop = 0, range = 1;
    function measure() {
      trackTop = hTrack.getBoundingClientRect().top + scrollY;
      range = Math.max(1, hTrack.offsetHeight - innerHeight);
      const segs = hSent.querySelectorAll('.sk.is-key');
      if (!segs.length) return;
      let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
      segs.forEach(el => { const q = el.getBoundingClientRect(); l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top); b = Math.max(b, q.bottom); });
      const sr = hSticky.getBoundingClientRect();
      const prevW = hSticky.style.getPropertyValue('--kw');
      hSticky.style.setProperty('--kw', 200);                        // 시작 굵기 기준으로 폭 측정
      const keyW = hKey.offsetWidth || 1;
      hSticky.style.setProperty('--kw', prevW || 200);
      hSticky.style.setProperty('--kx', ((l + r) / 2 - (sr.left + sr.width / 2)).toFixed(1));
      hSticky.style.setProperty('--ky', ((t + b) / 2 - (sr.top + sr.height / 2)).toFixed(1));
      hSticky.style.setProperty('--ks', ((r - l) / keyW).toFixed(4));
    }

    const cache = {};
    const setVar = (k, v) => { const s = typeof v === 'number' ? v.toFixed(4) : v; if (cache[k] !== s) { cache[k] = s; hSticky.style.setProperty(k, s); } };
    let lastP = -1, lastRoll = -1, lastStage = -1;

    function update(force) {
      const p = reduce ? 1 : clamp01((scrollY - trackTop) / range);
      if (p === lastP && !force) return;
      lastP = p;
      const [s1, s2] = H.stages;
      const p1 = clamp01(p / s1);
      const p2 = clamp01((p - s1) / (s2 - s1));
      const p3 = clamp01((p - s2) / (1 - s2));

      setVar('--p', p);
      setVar('--p1', p1);
      setVar('--l-fade', smooth(0, .45, p1));        // 1단계: 안내문 사라짐
      setVar('--w-fade', smooth(.55, 1, p1));        // 1단계 끝: 키워드 사라짐
      setVar('--s-o', smooth(0, .14, p2));           // 2단계: 문장 등장
      setVar('--k-fade', smooth(0, .3, p3));         // 3단계: 나머지 단어 페이드아웃
      setVar('--k-swap', smooth(.02, .16, p3));      // 3단계: 핵심 단어 → 아웃라인 단어로 교체
      setVar('--k-move', smooth(.08, .5, p3));       // 3단계: 중앙으로 이동·확대
      setVar('--k-fill', smooth(.42, .9, p3));       // 3단계: 왼쪽부터 채움
      setVar('--kw', Math.round(200 + 600 * smooth(.3, 1, p3)));   // 3단계: 굵기 200 → 800
      setVar('--f-o', smooth(.86, 1, p3));           // 3단계 끝: 마무리 문구

      // 해독은 스크롤로만 진행 — 스크롤이 멈추면 랜덤 글자도 멈춤
      const reroll = Math.abs(p - lastRoll) > .0015;
      if (reroll) lastRoll = p;
      decodeChars(chars, p2 / H.decodeEnd, reroll);

      const stage = p < s1 ? 0 : p < s2 ? 1 : 2;
      if (stage !== lastStage) { lastStage = stage; hStages.forEach((li, i) => li.classList.toggle('is-on', i === stage)); }
      hPct.textContent = String(Math.round(p * 100)).padStart(3, '0');
    }

    // requestAnimationFrame 스로틀: 스크롤 이벤트가 여러 번 와도 프레임당 1회만 계산
    let ticking = false;
    const request = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); };

    const remeasure = () => { measure(); update(true); };
    remeasure();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(remeasure);
    addEventListener('resize', remeasure);
    addEventListener('load', remeasure);
    if (!reduce) addEventListener('scroll', request, { passive: true });
  }
})();
