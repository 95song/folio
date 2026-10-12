/* =====================================================================
   port-6.js — 리플렛 상세 섹션(.leaflet) 스크롤 연출
   port-6(학교 미세먼지 리플렛)과 port-4(Vision AI Edge 리플렛)가 함께 쓴다.
   순수 JS. 스크롤 연출은 requestAnimationFrame 한 번으로 묶어서 처리한다.
   port.js 가 #stage / #panel 을 쓰므로 여기 ID는 전부 lf / vae 접두사를 붙였다.
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
