/* =====================================================================
   port-6.js — 리플렛 상세 섹션(.leaflet) 스크롤 연출
   port-6(학교 미세먼지 리플렛), port-4(Vision AI Edge 리플렛), port-5(연하장 시리즈)가 함께 쓴다.
   순수 JS. 스크롤 연출은 requestAnimationFrame 한 번으로 묶어서 처리한다.
   port.js 가 #stage / #panel 을 쓰므로 여기 ID는 전부 lf / vae / ny 접두사를 붙였다.
   ===================================================================== */
(function () {
  function boot() {
    const ov = document.getElementById('lfOv');
    const fold = document.getElementById('lfFold');

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
    const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; // easeInOutCubic

    /* ---------- 공통 등장 ---------- */
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in'); io.unobserve(e.target);
      e.target.querySelectorAll('[data-count]').forEach(countUp);
    }), { threshold: .18 });

    /* 벤토 숫자 카운트업 */
    function countUp(el) {
      const to = +el.dataset.count;
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now();
      const step = t => { const k = clamp((t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    document.querySelectorAll('.leaflet .reveal').forEach(el => io.observe(el));

    // port-4 (Vision AI Edge) 전용 연출
    if (document.getElementById('vaeFlip')) initVae(reduce, clamp, ease);

    // port-5 (연하장 시리즈) 전용 연출
    if (document.getElementById('nyDeck')) initNy(reduce, clamp);

    // 여기부터는 port-6 (학교 미세먼지) 전용 연출
    if (!ov || !fold) return;

    /* ---------- Overview 가로 스크롤 ---------- */
    const ovTrack = document.getElementById('lfOvTrack');
    const ovBar = document.getElementById('lfOvBar');
    const ovThumbs = [...ovTrack.querySelectorAll('.thumb')];
    function renderOverview() {
      if (reduce) return;
      const r = ov.getBoundingClientRect();
      const p = ease(clamp((clamp(-r.top / (r.height - innerHeight)) - .05) / .9));
      const max = ovTrack.scrollWidth - innerWidth + 48;
      ovTrack.style.transform = `translateX(${-p * max}px)`;
      ovBar.style.width = (p * 100) + '%';
      // 카드가 화면 안으로 들어올수록 리플렛 이미지가 떠오름
      ovThumbs.forEach(t => {
        const local = clamp(1 - t.parentElement.getBoundingClientRect().left / innerWidth);
        t.style.setProperty('--lf-ty', (40 - local * 60) + 'px');
      });
    }

    /* ---------- 접지 펼침 ---------- */
    const stage = document.getElementById('lfStage');
    const sheet = document.getElementById('lfSheet');
    const p1 = document.getElementById('lfP1');
    const p3 = document.getElementById('lfP3');
    const mapCells = [...document.querySelectorAll('#lfFoldRows i')];
    const mapNow = [...document.querySelectorAll('#lfFoldNow > div')];
    // 단계별로 보이는 면 (o = 외지, i = 내지)
    const visibleFaces = [['oc'], ['i1', 'o4'], ['i1', 'i2', 'i3'], ['o4', 'om', 'oc']];
    let W = 280, curStep = -1;

    function sizeStage() {
      const maxByWidth = (stage.clientWidth - 32) / 3;
      const maxByHeight = innerHeight * (innerWidth < 860 ? .42 : .5) * 778 / 1649;
      W = Math.floor(Math.min(320, maxByWidth, maxByHeight));
      stage.style.setProperty('--lf-w', W + 'px');
    }

    function renderFold() {
      let e1 = 1, e3 = 1, e4 = 0;
      if (!reduce) {
        const r = fold.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - innerHeight));
        e1 = ease(clamp((p - .06) / .24));   // 표지 넘김
        e3 = ease(clamp((p - .38) / .24));   // 내지 전체 펼침
        e4 = ease(clamp((p - .72) / .22));   // 뒤집어서 외지
      }
      p1.style.transform = `translateZ(${(1 - e1) * 2}px) rotateY(${(1 - e1) * 180}deg)`;
      p3.style.transform = `translateZ(${(1 - e3) * 1}px) rotateY(${(1 - e3) * -180}deg)`;
      // 접히는 면에 음영
      p1.style.setProperty('--lf-shade', (Math.sin(e1 * Math.PI) * .28).toFixed(3));
      p3.style.setProperty('--lf-shade', (Math.sin(e3 * Math.PI) * .28).toFixed(3));
      // 보이는 면이 항상 화면 중앙에 오도록 이동
      sheet.style.setProperty('--lf-shift', (W / 2 * (e1 - e3)) + 'px');
      // 펼친 리플렛 전체를 뒤집기 (뒤집는 동안 살짝 뒤로 물러나 화면 밖으로 튀어나오지 않게)
      sheet.style.setProperty('--lf-flip', (e4 * 180) + 'deg');
      sheet.style.setProperty('--lf-back', (-Math.sin(e4 * Math.PI) * W * .9) + 'px');

      const s = e4 > .5 ? 3 : e3 > .5 ? 2 : e1 > .5 ? 1 : 0;
      if (s !== curStep) {
        curStep = s;
        mapCells.forEach(c => c.classList.toggle('on', visibleFaces[s].includes(c.dataset.f)));
        mapNow.forEach((d, i) => d.classList.toggle('on', i === s));
      }
    }

    /* ---------- 문항 모듈 하이라이트 (스크롤 연동) ---------- */
    const anatomy = document.getElementById('lfAnatomy');
    const anaQ = document.getElementById('lfAnaQ');
    const notes = [...document.querySelectorAll('#lfNotes li')];
    function renderAnatomy() {
      const r = anatomy.getBoundingClientRect();
      const p = clamp((innerHeight * .8 - r.top) / (r.height + innerHeight * .3));
      const n = reduce ? 3 : Math.min(3, Math.floor(p * 4));
      [1, 2, 3].forEach(k => anaQ.classList.toggle('hl-' + k, !reduce && n === k));
      notes.forEach((li, i) => li.classList.toggle('on', i < n));
    }

    /* ---------- 표지 줌 ---------- */
    const coverFeature = document.getElementById('lfCoverFeature');
    function renderCover() {
      if (reduce) return;
      const r = coverFeature.getBoundingClientRect();
      coverFeature.style.setProperty('--lf-cp', clamp((innerHeight - r.top) / (innerHeight + r.height * .5)).toFixed(3));
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { renderOverview(); renderFold(); renderAnatomy(); renderCover(); ticking = false; });
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { sizeStage(); onScroll(); });
    sizeStage(); onScroll();
  }

  /* =====================================================================
     port-4 · Vision AI Edge 리플렛
     ===================================================================== */
  function initVae(reduce, clamp, ease) {
    const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

    /* ---------- Overview: 중앙 카드 뒤집기 ---------- */
    const flip = document.getElementById('vaeFlip'), card = document.getElementById('vaeFlipCard');
    const sides = [...flip.querySelectorAll('.ov-side')];
    const shades = [...card.querySelectorAll('.shade')];
    let side = 0;
    function renderFlip() {
      const p = reduce ? 0 : prog(flip);
      const e = ease(clamp((p - .3) / .4));
      card.style.setProperty('--lf-ry', (e * 180) + 'deg');
      card.style.setProperty('--lf-rz', (Math.sin(e * Math.PI) * -3) + 'deg');
      shades.forEach(s => s.style.opacity = (Math.sin(e * Math.PI) * .25).toFixed(3));
      const s = e > .5 ? 1 : 0;
      if (s !== side) { side = s; sides.forEach((x, i) => x.classList.toggle('on', i === s)); }
    }

    /* ---------- Challenge: 흩어진 키워드 정렬 ----------
       칩마다 흩어질 위치를 고정 시드로 정해 매번 같은 배치가 나오게 함 */
    const chBoard = document.getElementById('vaeChBoard'), chCols = [...chBoard.querySelectorAll('.ch-col')];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    chBoard.querySelectorAll('.ch-chip').forEach(c => {
      c.style.setProperty('--lf-dx', ((rnd() - .5) * (innerWidth < 860 ? 160 : 340)) + 'px');
      c.style.setProperty('--lf-dy', (-30 - rnd() * 130) + 'px');
      c.style.setProperty('--lf-r', ((rnd() - .5) * 50) + 'deg');
    });
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    function renderChips() {
      if (reduce) return;
      const br = chBoard.getBoundingClientRect();
      chCols.forEach((col, i) => {
        const p = clamp((innerHeight * .95 - br.top - i * 40) / (innerHeight * .55));
        col.style.setProperty('--lf-k', (1 - easeOut(p)).toFixed(3));
      });
    }

    /* ---------- Front: 고정 리플렛 주석 단계 ---------- */
    const fr = document.getElementById('vaeFr'), frCur = document.getElementById('vaeFrCur');
    const frEls = ['.hl', '.pin', '.call', '.fr-mtext div'].map(sel => [...fr.querySelectorAll(sel)]);
    let frStep = -1;
    function renderFront() {
      const s = reduce ? 0 : Math.min(2, Math.floor(clamp((prog(fr) - .05) / .9) * 3));
      if (s === frStep) return;
      frStep = s;
      frEls.forEach(list => list.forEach((x, i) => x.classList.toggle('on', i === s)));
      frCur.textContent = '0' + (s + 1);
    }

    let tick = false;
    const onScroll = () => { if (tick) return; tick = true; requestAnimationFrame(() => { renderFlip(); renderChips(); renderFront(); tick = false; }); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    /* ---------- Process: 시안 결합 토글 ---------- */
    const seg = document.getElementById('vaeSeg'), pill = seg.querySelector('.pill'), btns = [...seg.querySelectorAll('button')];
    const srcs = [...document.querySelectorAll('#vaeMerge .src')];
    const resImgs = [...document.querySelectorAll('#vaeMerge .result img')];
    const notes = [...document.querySelectorAll('.leaflet .merge-note div')];
    const addNote = document.getElementById('vaeAddNote'), resultName = document.getElementById('vaeResultName');
    const uses = { front: ['a'], back: ['b', 'c'] };
    function movePill(b) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; }
    function setMode(m) {
      btns.forEach(b => b.classList.toggle('on', b.dataset.m === m));
      movePill(seg.querySelector('button.on'));
      srcs.forEach(s => {
        const hit = uses[m].includes(s.dataset.k);
        s.classList.toggle('hit', hit); s.classList.toggle('dim', !hit);
        const chip = s.querySelector('.chip'); if (hit) chip.textContent = chip.dataset[m];
      });
      resImgs.forEach(im => im.classList.toggle('on', im.dataset.m === m));
      notes.forEach(n => n.classList.toggle('on', n.dataset.m === m));
      addNote.classList.toggle('on', m === 'front');
      resultName.textContent = m === 'front' ? '최종안 · 앞면' : '최종안 · 뒷면';
    }
    btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
    setMode('front');
    addEventListener('resize', () => movePill(seg.querySelector('button.on')));
    document.fonts && document.fonts.ready.then(() => movePill(seg.querySelector('button.on')));
  }

  /* =====================================================================
     port-5 (연하장 시리즈) 전용 연출 — .leaflet.ny
     카드 스택: 21st.dev 'Stacked Card Image Carousel'(kedhareswer) 동작을 순수 JS로 옮김
     캐릭터 시트: 탭 + 이미지 위 핀 / 목록 연동, 'Tilt Card'(tom_ui) 기울기
     ===================================================================== */
  function initNy(reduce, clamp) {
    const IMG = 'resources/img/port/';

    /* ---------- Year by Year : 카드 스택 ---------- */
    const YEARS = [
      { y: '2024', c: 'var(--ny-c24)', t: 'var(--ny-t24)' },
      { y: '2025', c: 'var(--ny-c25)', t: 'var(--ny-t25)' },
      { y: '2026', c: 'var(--ny-c26)', t: 'var(--ny-t26)' }
    ];
    const deck = document.getElementById('nyDeck'), cards = [...deck.querySelectorAll('.ny-card')], n = cards.length;
    const yby = document.getElementById('nyYby'), texts = [...document.querySelectorAll('#nyYtext .ny-yt')];
    const cur = document.getElementById('nyCur'), live = document.getElementById('nyLive');
    const wrapI = i => ((i % n) + n) % n;
    const tiltFor = i => { const u = (((i + 1) * 2654435761) >>> 0) / 4294967296; return (u * 2 - 1) * 7; };
    let top = 0, busy = false, over = null, lastTouch = 0;

    function pose(depth, i) {
      const d = Math.min(depth, 3);
      return { y: d ? -d * 18 : 0, s: 1 - d * .06, r: depth === 0 || reduce ? 0 : tiltFor(i), o: depth > 3 ? 0 : 1, sh: 1 - d * .08 };
    }
    function layout() {
      cards.forEach((c, i) => {
        const depth = wrapI(i - top), p = pose(depth, i), o = over && over.i === i ? over : null;
        c.style.transform = o ? `translate(${o.x}px,${o.y}px) rotate(${o.r}deg)` : `translateY(${p.y}px) scale(${p.s}) rotate(${p.r.toFixed(2)}deg)`;
        c.style.zIndex = o ? n + 1 : n - depth;
        c.style.opacity = o ? 1 : p.o;
        c.style.filter = o || depth === 0 ? 'none' : `brightness(${p.sh})`;
        c.dataset.top = depth === 0 ? '1' : '0';
        c.dataset.mode = o ? o.mode : '';
        c.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
      });
    }
    function setYear() {
      const Y = YEARS[top];
      yby.style.setProperty('--tint', Y.t);
      yby.style.setProperty('--lf-accent', Y.c);
      texts.forEach((t, i) => t.classList.toggle('on', i === top));
      cur.textContent = Y.y;
      live.textContent = `${Y.y}년 연하장, ${n}장 중 ${top + 1}번째`;
    }
    function throwTop(dirX = 1, fx = 0, fy = 0, dirY = 0) {
      if (busy) return; busy = true;
      const w = deck.offsetWidth, sx = dirX >= 0 ? 1 : -1;
      over = { i: top, x: fx + sx * w * 1.25, y: fy + dirY * .4 - 40, r: sx * 16, mode: 'fly' }; layout();
      setTimeout(() => { over = null; top = wrapI(top + 1); layout(); setYear(); busy = false; }, reduce ? 200 : 430);
    }
    function pullBack() {
      if (busy) return; busy = true;
      const w = deck.offsetWidth, i = wrapI(top - 1);
      over = { i, x: -w * 1.25, y: -40, r: -16, mode: 'snap' }; layout();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        over = { i, x: 0, y: 0, r: 0, mode: 'fly' }; layout();
        setTimeout(() => { over = null; top = i; layout(); setYear(); busy = false; }, reduce ? 200 : 450);
      }));
    }
    let drag = null;
    deck.addEventListener('pointerdown', e => {
      lastTouch = performance.now();
      const c = e.target.closest('.ny-card');
      if (busy || !c || c.dataset.top !== '1' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      c.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, lx: e.clientX, lt: e.timeStamp, vx: 0 };
    });
    deck.addEventListener('pointermove', e => {
      if (!drag) return;
      const dt = Math.max(1, e.timeStamp - drag.lt);
      drag.vx = .8 * ((e.clientX - drag.lx) / dt) + .2 * drag.vx; drag.lx = e.clientX; drag.lt = e.timeStamp;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      over = { i: top, x: dx, y: dy, r: reduce ? 0 : dx * .05, mode: 'drag' }; layout();
    });
    const end = e => {
      if (!drag) return;
      const d = drag; drag = null; lastTouch = performance.now();
      const dx = e.clientX - d.x, dy = e.clientY - d.y, w = deck.offsetWidth;
      if (Math.abs(dx) > w * .28 || (Math.abs(d.vx) > .55 && Math.abs(dx) > 24)) throwTop(dx, dx, dy, dy);
      else { over = null; layout(); }
    };
    deck.addEventListener('pointerup', end); deck.addEventListener('pointercancel', end);
    deck.addEventListener('keydown', e => {
      lastTouch = performance.now();
      if (e.key === 'ArrowRight') throwTop(1); else if (e.key === 'ArrowLeft') pullBack(); else return;
      e.preventDefault();
    });
    document.getElementById('nyNext').addEventListener('click', () => { lastTouch = performance.now(); throwTop(1); });
    document.getElementById('nyPrev').addEventListener('click', () => { lastTouch = performance.now(); pullBack(); });
    // 자동 넘김: 화면에 보이고 최근 조작이 없을 때만
    let seen = false;
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: .4 }).observe(deck);
    if (!reduce) setInterval(() => { if (seen && !document.hidden && performance.now() - lastTouch > 5000) throwTop(1); }, 5000);
    layout(); setYear();

    /* ---------- Characters : 캐릭터 프로필 시트 ---------- */
    function bindTilt(scope) {
      if (reduce || !matchMedia('(hover:hover)').matches) return;
      scope.querySelectorAll('.ny-tilt:not(.flat)').forEach(el => {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          el.style.transform = `perspective(1200px) rotateX(${(py - .5) * -14}deg) rotateY(${(px - .5) * 14}deg) scale3d(1.02,1.02,1.02)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      });
    }
    // pts: [x%, y%, 제목, 설명] — 좌표는 각 캐릭터 PNG 기준 %. 이미지를 교체하면 함께 조정
    // flat: 그림자 · 기울기 효과 없음
    const CH = [
      { name: '청룡', yr: '2024 · 갑진년', img: IMG + 'port-5-char-blue.png', flat: true, c: 'var(--ny-c24)', t: 'var(--ny-t24)',
        kw: ['장난스러운', '씩씩한', '주인공'], sw: ['#00BAEF', '#FFD270', '#FFB6A9', '#FFFFFF'],
        desc: '갑진년의 상징인 청룡을 주인공으로 삼았습니다. 위엄 있는 용 대신 거래처에 가볍게 웃음을 건넬 수 있도록 둥근 몸과 짧은 팔다리로 그렸습니다.',
        info: [['연하장 속 위치', '복주머니 오른편'], ['함께 등장', '아기 청룡, 복주머니']],
        pts: [[40, 34, '장난스러운 눈썹', '살짝 찡그린 눈썹으로 개구쟁이 같은 표정을 만들었습니다.'], [14, 59, '길게 뻗은 수염', '양옆으로 크게 휘어지는 수염이 용다운 인상을 지켜줍니다.'], [50, 83, '두 손에 쥔 여의주', '복을 나눠주는 역할을 소품 하나로 설명했습니다.']] },
      { name: '아기 청룡', yr: '2024 · 갑진년', img: IMG + 'port-5-char-green.png', flat: true, c: 'var(--ny-c24)', t: 'var(--ny-t24)',
        kw: ['어린', '수줍은', '성장 중'], sw: ['#A3DC52', '#FFE58C', '#FAC5A8', '#7ED348'],
        desc: '청룡이 다 자라기 전의 모습을 아기 청룡으로 그려, 복주머니를 사이에 두고 청룡과 나란히 세웠습니다. 같은 용이지만 뿔·수염·지느러미의 차이로 성장 단계를 보여주고, 몸 색도 아직 푸르게 물들기 전의 연둣빛으로 두었습니다.',
        info: [['연하장 속 위치', '복주머니 왼편'], ['함께 등장', '청룡, 복주머니']],
        pts: [[35, 12, '아직 짧은 뿔', '청룡의 갈라진 뿔과 달리 끝이 둥근 새싹 같은 뿔로 그렸습니다.'], [21, 45, '수염 대신 발그레한 볼', '청룡의 길게 뻗은 수염은 아직 나지 않은 것으로 두고, 그 자리에 큼직한 볼터치만 남겨 아기다운 얼굴을 만들었습니다.'], [80, 55, '아직 없는 등지느러미', '청룡의 등을 따라 난 물결 지느러미 대신 매끈한 등과 작은 꼬리만 남겼습니다.']] },
      { name: '푸른 뱀', yr: '2025 · 을사년', img: IMG + 'port-5-char-snake.png', c: 'var(--ny-c25)', t: 'var(--ny-t25)',
        kw: ['차분한', '지혜로운', '수호자'], sw: ['#0A3763', '#203D61', '#FFFFFF', '#EB6A53'],
        desc: '풍경 중심의 서정적인 장면에 맞춰, 귀여움보다 차분하고 지혜로운 인상을 택했습니다. 복주머니를 감싸 안은 형태로 \'복을 지킨다\'는 의미를 담았습니다.',
        info: [['연하장 속 위치', '차례상 가운데 복주머니 위'], ['함께 등장', '차례상 소품, 둥근 창 풍경']],
        pts: [[24, 8, '또렷한 눈과 머리 무늬', '흰 선 무늬와 맑은 눈으로 지혜로운 인상을 주었습니다.'], [48, 14, '별빛 같은 점무늬', '남색 몸에 흩뿌린 점이 밤하늘처럼 보이도록 했습니다.'], [28, 60, '한 바퀴 감아 올린 몸', '복주머니를 품듯 몸을 한 바퀴 감아 올려 복을 지키는 역할을 표현했습니다.']] }
    ];
    const chSec = document.getElementById('nyChars'), tabs = document.getElementById('nyTabs'), stage = document.getElementById('nyStage'), prof = document.getElementById('nyProf');
    tabs.innerHTML = CH.map((c, i) => `<button class="ny-tab${i ? '' : ' on'}" role="tab" aria-selected="${!i}" style="--yc:${c.c};--tint:${c.t}"><span class="av"><img src="${c.img}" alt=""></span><span>${c.name}<br><small>${c.yr}</small></span></button>`).join('');
    const tabEls = [...tabs.children];
    function renderChar(i, anim = true) {
      const c = CH[i];
      const apply = () => {
        chSec.style.setProperty('--yc', c.c); chSec.style.setProperty('--tint', c.t);
        stage.innerHTML = `<div class="ny-tilt${c.flat ? ' flat' : ''}"><img src="${c.img}" alt="${c.name} 캐릭터">${c.pts.map((p, j) => `<button class="ny-pin${j ? '' : ' on'}" aria-label="${p[2]}">${j + 1}</button>`).join('')}</div>`;
        prof.innerHTML = `<span class="yr">${c.yr}</span><h3>${c.name}</h3><div class="ny-kw">${c.kw.map(k => `<span>${k}</span>`).join('')}</div><p class="ny-desc">${c.desc}</p>
          <div class="ny-pts">${c.pts.map((p, j) => `<button class="ny-pt${j ? '' : ' on'}"><b>${j + 1}</b><div><h4>${p[2]}</h4><p>${p[3]}</p></div></button>`).join('')}</div>
          <dl>${c.info.map(d => `<dt>${d[0]}</dt><dd>${d[1]}</dd>`).join('')}<dt>캐릭터 색</dt><dd><div class="ny-swatch">${c.sw.map(x => `<i style="background:${x}"></i>`).join('')}</div></dd></dl>`;
        const pins = [...stage.querySelectorAll('.ny-pin')], pts = [...prof.querySelectorAll('.ny-pt')];
        const sel = j => { pins.forEach((x, k) => x.classList.toggle('on', k === j)); pts.forEach((x, k) => x.classList.toggle('on', k === j)); };
        [pins, pts].forEach(list => list.forEach((x, j) => { x.addEventListener('click', () => sel(j)); x.addEventListener('mouseenter', () => sel(j)); x.addEventListener('focus', () => sel(j)); }));
        // 핀 좌표(PNG 기준 %)를 이미지 여백(9%)과 contain 비율을 반영해 실제 그림 위치로 바꾼다
        const im = stage.querySelector('img');
        const place = () => {
          const r = im.naturalWidth / im.naturalHeight || 1, inner = 82;
          const cw = r >= 1 ? inner : inner * r, chh = r >= 1 ? inner / r : inner;
          pins.forEach((x, j) => { x.style.left = (100 - cw) / 2 + c.pts[j][0] * cw / 100 + '%'; x.style.top = (100 - chh) / 2 + c.pts[j][1] * chh / 100 + '%'; });
        };
        im.complete ? place() : im.addEventListener('load', place);
        bindTilt(stage);
        stage.classList.remove('out'); prof.classList.remove('out');
      };
      tabEls.forEach((t, k) => { t.classList.toggle('on', k === i); t.setAttribute('aria-selected', k === i); });
      if (!anim || reduce) return apply();
      stage.classList.add('out'); prof.classList.add('out'); setTimeout(apply, 250);
    }
    tabEls.forEach((t, i) => t.addEventListener('click', () => renderChar(i)));
    renderChar(0, false);

    /* ---------- Recurring : 끊김 없이 돌도록 항목 복제 ---------- */
    const mt = document.getElementById('nyMtrack');
    if (mt && !reduce) [...mt.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); mt.appendChild(k); });

    /* ---------- Mockup (#ending-curtain) : 화면에 들어오면 살짝 줌 아웃 ---------- */
    const mio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); mio.unobserve(e.target); }
    }), { threshold: .15 });
    document.querySelectorAll('#ending-curtain .ny-stack > div').forEach(el => mio.observe(el));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
