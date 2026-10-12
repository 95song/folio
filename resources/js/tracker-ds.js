/* =====================================================================
   Tracker 디자인 가이드 (port-1 · .design-system 전용)
   Tracker/guide.html 의 스크립트 중 Color · Typography · Layout · Components · Flow Chart 부분.
   토큰은 .design-system 에만 정의돼 있으므로 그 요소의 계산값에서 읽는다.
   ===================================================================== */
(function () {
  'use strict';
  function run() {
        const root = document.querySelector('.design-system');
        if (!root || !document.getElementById('brand')) return;
        const $ = (s, r = document) => r.querySelector(s);
        const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const rootCS = getComputedStyle(root);
        const tok = (n) => rootCS.getPropertyValue(n).trim();

        /* 스크롤 등장 (.rv → .is-in) */
        const io = new IntersectionObserver((ents) => ents.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in'); io.unobserve(e.target);
        }), { rootMargin: '0px 0px -8% 0px' });

        // 화면 폭(기본 375, data-w 로 바꿀 수 있음)에 맞춰 축소
        const ro = new ResizeObserver((ents) => ents.forEach((e) => e.target.style.setProperty('--s', e.contentRect.width / (+e.target.dataset.w || 375))));
        function mountScreen(box, src) {
          const f = document.createElement('iframe');
          f.src = src; f.tabIndex = -1; f.title = ''; f.setAttribute('aria-hidden', 'true');
          // 목업은 보기 전용이라 스크롤이 필요 없다: iframe 자체에서 스크롤바를 끈다 (안쪽 페이지 높이와 상관없이 적용)
          f.setAttribute('scrolling', 'no');
          // 목업 안에서는 스크롤바를 숨긴다 (같은 출처라 스타일을 넣을 수 있다)
          f.addEventListener('load', () => {
            try { const st = f.contentDocument.createElement('style'); st.textContent = 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}'; f.contentDocument.head.appendChild(st); } catch (err) { /* 다른 출처 */ }
          });
          box.appendChild(f); ro.observe(box);
          return f;
        }

        /* =====================================================================
           01 COLOR
           ===================================================================== */
        const BRAND = [
          ['--color-primary', 'Primary', '주 버튼 · 강조 · 좋음'],
          ['--color-primary-light', 'Primary Light', '배경 그라데이션'],
          ['--color-primary-dark', 'Primary Dark', '링크 · 포커스'],
          ['--color-primary-tint', 'Primary Tint', '선택 영역 30%'],
        ];
        $('#brand').innerHTML = BRAND.map(([v, n, u], i) => {
          const val = tok(v), light = /light|tint/.test(v);
          return `<div class="tg-chip rv" style="--d:${i}">
            <span class="tg-chip-sw${v.endsWith('tint') ? ' alpha' : ''}" style="--c:${val};--on:${light ? '#2e3e4a' : '#fff'}"><span>${esc(u)}</span></span>
            <span class="tg-chip-name">${n}</span><span class="tg-chip-val tg-mono">${val.toUpperCase()}</span></div>`;
        }).join('');
        const STATES = [['--color-primary-hover', 'Hover'], ['--color-primary-press', 'Pressed'], ['--color-primary-soft', 'Soft · 선택 배경'], ['--color-primary-dark', 'Focus · Link']];
        $('#states').innerHTML = STATES.map(([v, n], i) => `<div class="tg-state rv" style="--d:${i}"><i style="--c:${tok(v)}"></i><span><b>${n}</b><small class="tg-mono">${tok(v)}</small></span></div>`).join('');

        const NEUTRAL = [
          ['--text', 'Text', '본문 · 제목'], ['--text-chip', 'Text Deep', '진한 글자 · 입력 노드'], ['--text-sub', 'Sub Text', '보조 설명'], ['--text-placeholder', 'Placeholder', '입력 안내'],
          ['--text-disabled', 'Disabled', '비활성 버튼'], ['--border-field', 'Field Line', '입력칸 테두리'], ['--border-line', 'Line', '구분선 · 카드'], ['--border-list', 'List Line', '목록 구분'],
          ['--bg-segment', 'Segment', '세그먼트 배경'], ['--color-error', 'Error', '오류 · 경고 문구'], ['--color-purple', 'Agreement', '약관 동의 체크'], ['--dim', 'Dim', '팝업 뒤 배경 30%'],
        ];
        $('#neutral').innerHTML = NEUTRAL.map(([v, n, u], i) => `<div class="tg-row rv" style="--d:${i % 6}"><i style="--c:${tok(v)}"></i><span><b>${n}</b><small>${u}</small></span><span class="tg-mono">${tok(v)}</span></div>`).join('');

        /* 미세먼지 단계 슬라이더 + 실제 홈 화면 */
        const STAGES = [
          { k: 'good', name: '좋음', min: 0, max: 15, msg: '“야외 활동하기 좋은 날씨입니다.”' },
          { k: 'normal', name: '보통', min: 16, max: 35, msg: '“가벼운 산책은 괜찮은 날씨입니다.”' },
          { k: 'bad', name: '나쁨', min: 36, max: 75, msg: '“마스크를 꼭 챙겨야 할 날씨입니다.”' },
          { k: 'verybad', name: '매우 나쁨', min: 76, max: 999, msg: '“외출을 자제해야 할 날씨입니다.”' },
        ];
        const REP = { good: 12, normal: 28, bad: 54, verybad: 96 };
        const scaleInput = $('#scaleInput'), stageScreen = $('#stageScreen');
        $('#stageList').innerHTML = STAGES.map((s) => `<li><button type="button" data-stage="${s.k}" style="--c:var(--color-${s.k})" aria-pressed="false"><i></i><b>${s.name}</b><small>${s.min}${s.max < 999 ? '–' + s.max : '+'} · ${tok('--color-' + s.k)}</small></button></li>`).join('');
        let stageFrames = null, curStage = null;
        function renderScale() {
          const v = +scaleInput.value, s = STAGES.find((x) => v <= x.max);
          $('#scale').style.setProperty('--stage', `var(--color-${s.k})`);
          $('#scaleVal').textContent = v;
          scaleInput.setAttribute('aria-valuetext', `${v} ㎍/㎥, ${s.name}`);
          $('#scaleThumb').style.left = `calc(${(v / 120) * 100}% + ${14 - (v / 120) * 28}px)`;
          // 목업 화면 속 숫자도 막대 값과 맞춘다
          if (stageFrames) {
            const f = stageFrames.find((x) => x.dataset.k === s.k), d = f && f.contentDocument;
            if (d && d.body) {
              const sv = d.querySelector('.sphere-value'), ds = d.querySelector('.dust-status b');
              if (sv) sv.textContent = v;
              if (ds) ds.textContent = `${s.name} ${v}`;
            }
          }
          if (curStage === s.k) return;
          curStage = s.k;
          $('#scaleLabel').textContent = s.name;
          $('#scaleMsg').textContent = s.msg;
          $$('.tg-range-track i').forEach((el, i) => el.classList.toggle('on', STAGES[i].k === s.k));
          $$('#stageList button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.stage === s.k));
          if (stageFrames) stageFrames.forEach((f) => f.classList.toggle('on', f.dataset.k === s.k));
        }
        scaleInput.addEventListener('input', renderScale);
        function animateTo(to) {
          const from = +scaleInput.value, t0 = performance.now(), dur = reduced ? 0 : 700;
          const step = (now) => { const p = dur ? Math.min(1, (now - t0) / dur) : 1; scaleInput.value = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); renderScale(); if (p < 1) requestAnimationFrame(step); };
          requestAnimationFrame(step);
        }
        $('#stageList').addEventListener('click', (e) => { const b = e.target.closest('[data-stage]'); if (b) animateTo(REP[b.dataset.stage]); });
        // 네 단계 화면을 겹쳐 두고 투명도로 바꿔 끼운다 (다시 불러오지 않아 부드럽다)
        new IntersectionObserver((ents, ob) => ents.forEach((e) => {
          if (!e.isIntersecting) return; ob.disconnect();
          stageFrames = STAGES.map((s) => { const f = mountScreen(stageScreen, `resources/html/tracker/main-${s.k}.html`); f.dataset.k = s.k; f.addEventListener('load', () => { curStage = null; renderScale(); }); return f; });
          curStage = null; renderScale();
        }), { rootMargin: '300px 0px' }).observe(stageScreen);
        renderScale();

        /* =====================================================================
           02 TYPOGRAPHY · 03 LAYOUT
           ===================================================================== */
        const TYPE = [
          ['--fs-50', 700, '17', '구체 속 농도 수치'], ['--fs-40', 700, 'Tracker', '로고'], ['--fs-30', 700, '좋음 17', '단계 표기'],
          ['--fs-20', 700, '회원정보 수정', '페이지 제목'], ['--fs-18', 500, '현재 초미세먼지 농도', '카드 제목 · 팝업'], ['--fs-16', 700, '다음', '버튼 · 약관 안내(500)'],
          ['--fs-14', 500, '서울시 종로구 신교동', '입력칸 · 칩 · 메시지'], ['--fs-12', 500, '필수 항목을 입력해 주세요', '안내 · 보조 문구'], ['--fs-10', 500, '(㎍/㎥)', '단위 · 탭 이름'],
        ];
        $('#typeScale').innerHTML = TYPE.map(([v, w, s, u], i) => `<div class="tg-type-row rv" style="--d:${i % 4}"><span class="tok tg-mono">${v}</span><span class="px tg-mono">${tok(v)} · ${w}</span><span class="sample" style="font-size:${tok(v)};font-weight:${w}">${s}</span><span class="use">${u}</span></div>`).join('');

        const RAD = [['--br-4', '작은 칩'], ['--br-5', '모든 입력칸'], ['--br-8', '사각 · 라인 버튼'], ['--br-10', '팝업 · 캘린더'], ['--br-12', '정보 카드'], ['--br-15', '패널 · 시트'], ['--br-30', '위치 칩'], ['--br-full', '버튼 · 메시지 알약']];
        $('#radius').innerHTML = RAD.map(([v, u], i) => `<div class="tg-rad rv" style="--d:${i % 4};--r:${tok(v) === '100px' ? '64px' : tok(v)}"><i></i><b class="tg-mono">${tok(v)}</b><small>${v}<br />${u}</small></div>`).join('');
        const SH = [['--shadow-tab', 'Tab', '탭바 윗선'], ['--shadow-float', 'Float', '지도 위 버튼'], ['--shadow-pop', 'Pop', '팝업 · 캘린더']];
        $('#shadows').innerHTML = SH.map(([v, n, u], i) => `<div class="tg-shadow rv" style="--d:${i};--v:${tok(v)}"><i></i><b>${n}</b><small>${v} · ${u}</small></div>`).join('');

        /* =====================================================================
           04 COMPONENTS: 단계 아이콘 순환 · 탭바 전환
           ===================================================================== */
        const STEP_NAMES = ['기본 정보', '성별', '주소', '전화번호', '신체 정보'];
        const steps = $$('#stepsDemo .signup-step');
        let stepI = 0;
        function showStep(i) {
          steps.forEach((s, j) => { s.classList.toggle('is-current', j === i); if (j === i) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current'); });
          $('#stepsCap').textContent = `${i + 1} / 5 · ${STEP_NAMES[i]}`;
        }
        if (!reduced) setInterval(() => { if (document.hidden) return; stepI = (stepI + 1) % 5; showStep(stepI); }, 1800);
        $('#tabDemo').addEventListener('click', (e) => {
          const b = e.target.closest('.tab-button'); if (!b) return;
          $$('#tabDemo .tab-button').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.querySelector('img').src = `resources/html/tracker/public/tab-${x.dataset.k}-${on ? 'on' : 'off'}.svg`; });
        });

        /* =====================================================================
           05 FLOW CHART — 글씨 상자 + 선. 마우스를 올리면 이어진 경로를 강조
           type: screen | input | tab | decision | info   flags: c 핵심 · r 검토 · u 수정·추가
           ===================================================================== */
        const N = [
          { id: 'intro', t: '스플래시', x: 0, y: 0 },
          { id: 'dMember', t: '회원 여부', x: 0, y: 1.55, type: 'decision' },
          { id: 'login', t: '로그인', x: 1, y: 1.55, type: 'input', f: 'c' },
          { id: 'findId', t: '아이디 찾기', x: 2, y: 0 },
          { id: 'findPw', t: '패스워드 찾기', x: 2, y: 0.8 },
          { id: 'result', t: '결과 팝업', x: 3, y: 0.4, f: 'u' },
          { id: 'home', t: '홈', x: 2, y: 2.6, type: 'tab' },
          { id: 'dStage', t: '농도 단계', x: 3, y: 2.6, type: 'decision', f: 'c' },
          { id: 'sGood', t: '좋음 0–15', x: 4, y: 1.55, stage: 'good' },
          { id: 'sNormal', t: '보통 16–35', x: 4, y: 2.25, stage: 'normal' },
          { id: 'sBad', t: '나쁨 36–75', x: 4, y: 2.95, stage: 'bad' },
          { id: 'sVery', t: '매우 나쁨 76+', x: 4, y: 3.65, stage: 'verybad' },
          { id: 'loc', t: '위치 데이터', x: 2, y: 5.1, type: 'tab', f: 'c' },
          { id: 'cal', t: '기간 선택', x: 3, y: 4.7, type: 'input', f: 'u' },
          { id: 'route', t: '이동 경로 · 핀', x: 3, y: 5.5 },
          { id: 'graph', t: '그래프', x: 4, y: 5.5, f: 'r' },
          { id: 'heat', t: '히트맵', x: 2, y: 6.9, type: 'tab' },
          { id: 'hot', t: '오래 머문 곳의 농도', x: 3, y: 6.9, type: 'info' },
          { id: 'my', t: '환경설정', x: 2, y: 9.3, type: 'tab' },
          { id: 'member', t: '회원정보 수정', x: 3, y: 8.3, f: 'u' },
          { id: 'memberI', t: '이름 · 생년월일 · 성별\n키 · 체중', x: 4, y: 8.3, type: 'info' },
          { id: 'disease', t: '질병정보 수정', x: 3, y: 9.1, f: 'u' },
          { id: 'diseaseI', t: '과거병력 · 장애유형\n중증도', x: 4, y: 9.1, type: 'info' },
          { id: 'tl', t: '타임라인 보내기', x: 3, y: 9.9, f: 'r' },
          { id: 'tlI', t: '사고 개요 입력', x: 4, y: 9.9, type: 'input' },
          { id: 'confirm', t: '확인 팝업 → 환경설정', x: 5, y: 9.1, f: 'u' },
          { id: 'logout', t: '로그아웃', x: 3, y: 10.7 },
          { id: 'logoutI', t: '→ 로그인', x: 4, y: 10.7, type: 'info' },
          { id: 'signup', t: '회원가입', x: 0, y: 3.1, type: 'input' },
          { id: 'terms', t: '약관 동의', x: 0, y: 4.1, f: 'u' },
          { id: 'termsFull', t: '위치 약관 전문', x: 1, y: 4.1 },
          { id: 'p1', t: '기본 정보 입력', x: 0, y: 5.1, type: 'input' },
          { id: 'p2', t: '성별 선택', x: 0, y: 6.1 },
          { id: 'p3', t: '주소 입력', x: 0, y: 7.1, type: 'input', f: 'u' },
          { id: 'p4', t: '휴대폰 인증', x: 0, y: 8.1, type: 'input' },
          { id: 'dCert', t: '인증 통과', x: 0, y: 9.4, type: 'decision' },
          { id: 'p5', t: '신체 정보 입력', x: 0, y: 10.7, type: 'input', f: 'u' },
          { id: 'p6', t: '과거병력 선택', x: 0, y: 11.7 },
          { id: 'p7', t: '장애유형 선택', x: 0, y: 12.7, f: 'u' },
          { id: 'p8', t: '장애중증도 선택', x: 0, y: 13.7, f: 'u' },
          { id: 'done', t: '가입 완료 → 로그인', x: 0, y: 14.7, type: 'info' },
        ];
        const E = [
          ['intro', 'dMember'], ['dMember', 'login', 'Yes'], ['dMember', 'signup', 'No'],
          ['login', 'findId'], ['login', 'findPw'], ['findId', 'result'], ['findPw', 'result'],
          ['login', 'home'], ['login', 'loc'], ['login', 'heat'], ['login', 'my'],
          ['home', 'dStage'], ['dStage', 'sGood'], ['dStage', 'sNormal'], ['dStage', 'sBad'], ['dStage', 'sVery'],
          ['loc', 'cal'], ['loc', 'route'], ['route', 'graph'], ['heat', 'hot'],
          ['my', 'member'], ['my', 'disease'], ['my', 'tl'], ['my', 'logout'],
          ['member', 'memberI'], ['disease', 'diseaseI'], ['tl', 'tlI'], ['logout', 'logoutI'],
          ['memberI', 'confirm'], ['diseaseI', 'confirm'], ['tlI', 'confirm'],
          ['signup', 'terms'], ['terms', 'termsFull'], ['terms', 'p1'], ['p1', 'p2'], ['p2', 'p3'], ['p3', 'p4'], ['p4', 'dCert'],
          ['dCert', 'p4', 'No', 'loop'], ['dCert', 'p5', 'Yes'], ['p5', 'p6'], ['p6', 'p7'], ['p7', 'p8'], ['p8', 'done'],
        ];
        const FLAG = { c: 'var(--color-normal)', r: 'var(--color-bad)', u: 'var(--color-verybad)' };
        const COL = 186, ROW = 58, W = 156, H = 38, DH = 60, PADX = 32, PADY = 36;
        const byId = Object.fromEntries(N.map((n) => [n.id, n]));
        const chart = $('#chart');

        function geom(n) {
          const w = W * (n.w || 1), h = n.type === 'decision' ? DH : H;
          const l = PADX + n.x * COL, cy = PADY + n.y * ROW + H / 2;
          return { l, r: l + w, t: cy - h / 2, b: cy + h / 2, cx: l + w / 2, cy, w, h };
        }
        (function buildChart() {
          const width = PADX * 2 + 5 * COL + W, height = PADY * 2 + 14.7 * ROW + H;
          chart.style.width = width + 'px'; chart.style.height = height + 'px';
          const paths = E.map(([a, b, label, kind], i) => {
            const A = geom(byId[a]), B = geom(byId[b]);
            let d, lx, ly;
            if (kind === 'loop') {
              d = `M${A.r},${A.cy} H${A.r + 28} V${B.cy} H${B.r + 4}`;
              lx = A.r + 6; ly = A.cy - 8;
            } else if (byId[a].x === byId[b].x) {
              d = `M${A.cx},${A.b} V${B.t - 4}`;
              lx = A.cx + 8; ly = A.b + 14;
            } else {
              const sx = A.r;
              const mx = B.l - 22;
              d = `M${sx},${A.cy} H${mx} V${B.cy} H${B.l - 4}`;
              lx = sx + 6; ly = A.cy - 8;
            }
            return `<path class="tg-edge draw${kind === 'loop' ? ' loop' : ''}" data-a="${a}" data-b="${b}" d="${d}" marker-end="url(#arr)" style="--d:${i}"/>` +
              (label ? `<text class="tg-edge-label" x="${lx}" y="${ly}">${label}</text>` : '');
          }).join('');
          const nodes = N.map((n, i) => {
            const g = geom(n);
            const flags = (n.f || '').split('').filter(Boolean).map((k) => `<i style="--c:${FLAG[k]}"></i>`).join('');
            return `<div class="tg-node ${n.type || 'screen'}" data-id="${n.id}" style="left:${g.l}px;top:${g.t}px;width:${g.w}px;height:${g.h}px;--d:${i}">${n.stage ? `<span class="stg" style="--c:var(--color-${n.stage})"></span>` : ''}${esc(n.t)}${flags ? `<span class="flags">${flags}</span>` : ''}</div>`;
          }).join('');
          chart.innerHTML = `<svg width="${width}" height="${height}" aria-hidden="true"><defs><marker id="arr" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L6,4 L1,7" fill="none" stroke="#9fbcd2" stroke-width="1.2"/></marker></defs>${paths}</svg>` + nodes;
          $$('.tg-edge.draw', chart).forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1));
          new IntersectionObserver((ents, ob) => ents.forEach((e) => { if (e.isIntersecting) { ob.disconnect(); chart.classList.add('is-drawn'); } }), { threshold: 0.12 }).observe(chart);
        })();

        function hot(id) {
          chart.classList.toggle('is-focus', !!id);
          $$('.tg-node.hot', chart).forEach((n) => n.classList.remove('hot'));
          $$('.tg-edge', chart).forEach((p) => {
            const on = !!id && (p.dataset.a === id || p.dataset.b === id);
            p.classList.toggle('hot', on);
            if (on) { chart.querySelector(`[data-id="${p.dataset.a}"]`).classList.add('hot'); chart.querySelector(`[data-id="${p.dataset.b}"]`).classList.add('hot'); }
          });
          if (id) chart.querySelector(`[data-id="${id}"]`).classList.add('hot');
        }
        chart.addEventListener('mouseover', (e) => { const n = e.target.closest('.tg-node'); if (n) hot(n.dataset.id); });
        chart.addEventListener('mouseleave', () => hot(null));


        /* 시작 */
        $$('.rv', root).forEach((el) => io.observe(el));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
