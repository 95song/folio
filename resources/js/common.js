/* =====================================================================
   common.js — 모든 페이지 공용 스크립트 (순수 JS, 외부 라이브러리 없음)
   1. 새로고침 시 스크롤 위치 복원 끄기
   2. 커서 따라다니는 동그라미 (.cursor-follower)
   3. 사원증 메뉴 (.id-badge) — 모든 페이지에 같은 메뉴를 만들어 넣고 열고 닫기
   4. GSAP 로딩이 화면이 가려진 상태에서 멈추지 않게 보완 (GSAP 을 쓰는 페이지에서만 동작)
   ===================================================================== */
(function () {
  'use strict';

  // 1. 새로고침 시 브라우저가 이전 스크롤 위치를 복원하면 핀/스크롤 연출이
  //    이미 진행된 상태로 보여 "열자마자 날아간 것"처럼 보일 수 있어 맨 위에서 시작한다.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }


  /* 4. GSAP 로딩 보완 ------------------------------------------------
     GSAP 은 requestAnimationFrame 으로 돌아가는데, 브라우저는 화면이 가려지거나
     백그라운드일 때 이 함수를 실행하지 않는다. 그 상태로 새로고침되면 로딩 애니메이션
     (profile 의 키워드 로딩, portfolio 의 PORT FOLIO 로딩)이 시작 지점에서 멈춰 보인다.
     그래서 페이지를 연 뒤 한동안은, 프레임이 쉬고 있으면 타이머가 대신 GSAP 을 한 칸씩 돌린다. */
  function keepGsapRunning() {
    if (!window.gsap) return;                    // GSAP 을 쓰지 않는 페이지(index 등)는 해당 없음
    var gsap = window.gsap;
    var GUARD_TIME = 20000;                      // 페이지를 연 뒤 이 시간(ms) 동안만 지켜본다 (로딩 구간)
    var lastTick = performance.now();
    var startedAt = lastTick;

    gsap.ticker.add(function () { lastTick = performance.now(); });   // 프레임이든 타이머든 돌 때마다 기록
    // 오래 쉬었다 돌아와도 애니메이션이 느리게 따라오지 않고 실제 시간에 맞춰 진행되게
    gsap.ticker.lagSmoothing(0);

    var timer = setInterval(function () {
      var now = performance.now();
      if (now - startedAt > GUARD_TIME) { clearInterval(timer); return; }
      if (now - lastTick > 150) gsap.ticker.tick();                   // 프레임이 쉬는 중 → 대신 진행
    }, 60);
  }

  /* 2. 커서 따라다니는 동그라미 -------------------------------------- */
  function initCursorFollower() {
    var follower = document.querySelector('.cursor-follower');
    if (!follower) return;

    // 숫자가 작을수록(예: 0.05) 더 천천히/뒤늦게 따라오고, 크면(예: 0.2) 빠르게 따라온다.
    var SPEED = 0.1;
    var targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    // 동일 출처 iframe(resources/front/mega-menu-demo.html)에서 마우스 좌표를 넘겨줄 수 있도록 전역 함수로 노출.
    // iframe 내부는 별도 document라 mousemove가 부모까지 오지 않으므로 iframe 쪽에서 직접 호출한다.
    window.__cursorFollowerSetTarget = function (x, y) {
      targetX = x;
      targetY = y;
    };

    (function render() {
      currentX += (targetX - currentX) * SPEED;
      currentY += (targetY - currentY) * SPEED;
      follower.style.left = currentX + 'px';
      follower.style.top = currentY + 'px';
      requestAnimationFrame(render);
    })();
  }

  /* 3. 사원증 메뉴 ---------------------------------------------------
     화면 오른쪽 위에 줄로 매달린 사원증을 누르면 크게 내려와 펼쳐지고, 카드에 인쇄된
     출입 권한(메뉴)으로 페이지를 이동한다. 스타일은 menu.css 의 .id-badge 참고.
     - 열고 닫을 때 'sitemap:toggle' 이벤트를 보낸다 (예: profile.js 가 부드러운 스크롤을 멈춤)
     - portfolio 페이지는 로딩이 끝날 때 portfolio.js 가 사원증을 내려보낸다 */
  var BADGE_MENU = [
    // [층, 이름, 한글 설명, 주소, 현재 페이지 판별]
    ['1F', 'HOME', '로비', 'index.html', function (p) { return p === '' || p === 'index.html'; }],
    ['2F', 'ABOUT', '프로필', 'profile.html', function (p) { return p === 'profile.html'; }],
    ['3F', 'PORTFOLIO', '업무 목록', 'portfolio.html', function (p) { return p === 'portfolio.html' || /^port-\d+\.html$/.test(p); }]
  ];

  // 증명사진 칸의 햄스터 (30×36 도트, 앞발을 모으고 선 전신)
  // D 갈색 테두리 · B 갈색 털 · L 밝은 갈색 · W 크림 · S 크림 그림자 · T 크림 테두리 · P 귀 안쪽
  // p 볼터치 · E 눈 · h 눈 하이라이트 · N 코 · M 입 · K 수염 · F 발
  var BADGE_FACE = [
    '..............................',
    '....DDDD..............DDDD....',
    '...DBBBBD............DBBBBD...',
    '...DBPPPBDDDDDDDDDDDDBPPPBD...',
    '..DBPPPPBBBBBBBBBBBBBBPPPPBD..',
    '...DPPPPBBBBBBLLBBBBBBPPPPD...',
    '...DBPPPBBBBBWWWWBBBBBPPPBD...',
    '....DBBBBBBBWWWWWWBBBBBBBD....',
    '...DBBBBBBBWWWWWWWWBBBBBBBD...',
    '...DBBBBBBWWWWWWWWWWBBBBBBD...',
    '...DBBBBBWWWWWWWWWWWWBBBBBD...',
    '..DBBBBBWWWWWWWWWWWWWWBBBBBD..',
    '..DBBBBWWWWWWWWWWWWWWWWBBBBD..',
    '..DBBBWWWWWWWWWWWWWWWWWWBBBD..',
    '...DBWWWWEEWWWWWWWWEEWWWWBD...',
    '...DBWWWEEhEWWWWWWEEhEWWWBD...',
    '...DBWWWEEEEWWWWWWEEEEWWWBD...',
    'KKKBBpppWEEWWWNNWWWEEWpppBBKKK',
    '..DBBpppWWWWMWMMWMWWWWpppBBD..',
    'KKKBBBWWWWWWWMWWMWWWWWWWBBBKKK',
    '..DBBBWWWWWWWWWWWWWWWWWWBBBD..',
    '.DBBBBWWWWWWWWWWWWWWWWWWBBBBD.',
    '.DBBBWWWWWWWWWWWWWWWWWWWWBBBD.',
    '.DBBBWWWWWWWWWWWWWWWWWWWWBBBD.',
    '.DBBBWWWWWSSWWWWWWSSWWWWWBBBD.',
    '..DBBWWWWWFFSWWWWSFFWWWWWBBD..',
    '..DBBWWWWWWFWWWWWWFWWWWWWBBD..',
    '..DBBWWWWWWWWWWWWWWWWWWWWBBD..',
    '...DBBWWWWWWWWWWWWWWWWWWBBD...',
    '....DBWWWWWWWWWWWWWWWWWWBD....',
    '.....DBWWWWWWWWWWWWWWWWBD.....',
    '......DDTWWWWWWWWWWWWTDD......',
    '......FFFFTTTTTTTTTTFFFF......',
    '......FFFF..........FFFF......',
    '......FFFF..........FFFF......',
    '..............................'
  ];
  var BADGE_FACE_COLOR = { B: '#c98a50', D: '#a8693a', E: '#3a2119', F: '#efa6a1', K: '#b48b70', L: '#deae7a', M: '#9b5848', N: '#f19aa4', P: '#f4b3b3', S: '#ecdccf', T: '#d8b8a0', W: '#fdf7f1', h: '#ffffff', p: '#f8c6c3' };

  function badgeFaceSvg() {
    var r = '', h = BADGE_FACE.length, w = BADGE_FACE[0].length;
    BADGE_FACE.forEach(function (row, y) {
      row.split('').forEach(function (c, x) {
        var f = BADGE_FACE_COLOR[c];
        if (f) r += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + f + '"/>';
      });
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
  }

  // 금속 부품: 줄 끝 캡 → 오링 → 회전 고리 → 랍스터 집게
  var BADGE_HOOK =
    '<svg class="ib-hw" viewBox="0 0 60 100" aria-hidden="true"><defs>' +
      '<linearGradient id="idBadgeMt" x1="0" x2="1"><stop offset="0" stop-color="#7d838b"/><stop offset=".35" stop-color="#eef1f4"/><stop offset=".55" stop-color="#ffffff"/><stop offset=".75" stop-color="#b9bec5"/><stop offset="1" stop-color="#6f757d"/></linearGradient>' +
      '<linearGradient id="idBadgeMtv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset="1" stop-color="#9aa0a8"/></linearGradient></defs>' +
    '<rect x="17" y="-1" width="26" height="13" rx="2.5" fill="url(#idBadgeMt)" stroke="#5f656d" stroke-width=".5"/>' +
    '<path d="M18 4.5h24M18 8h24" stroke="#5f656d" stroke-width=".5" opacity=".6"/>' +
    '<circle cx="30" cy="17.5" r="5" fill="none" stroke="url(#idBadgeMt)" stroke-width="2.6"/>' +
    '<circle cx="30" cy="17.5" r="5" fill="none" stroke="#5f656d" stroke-width=".4" opacity=".7"/>' +
    '<rect x="25.5" y="21.5" width="9" height="9" rx="2.2" fill="url(#idBadgeMtv)" stroke="#5f656d" stroke-width=".5"/>' +
    '<path d="M30 31 C39 31 43.5 44 42 59 C40.6 74 35.5 88 30 96 C24.5 88 19.4 74 18 59 C16.5 44 21 31 30 31 Z" fill="none" stroke="url(#idBadgeMt)" stroke-width="4"/>' +
    '<path d="M30 31 C39 31 43.5 44 42 59 C40.6 74 35.5 88 30 96 C24.5 88 19.4 74 18 59 C16.5 44 21 31 30 31 Z" fill="none" stroke="#5f656d" stroke-width=".5" opacity=".55"/>' +
    '<path d="M42.3 50 L42.3 68" stroke="#5f656d" stroke-width="1" opacity=".7"/>' +
    '<rect x="13.2" y="46" width="4.6" height="9" rx="1.2" fill="url(#idBadgeMtv)" stroke="#5f656d" stroke-width=".5"/>' +
    '</svg>';

  function initBadgeMenu() {
    if (document.querySelector('.id-badge')) return;
    var page = (location.pathname.split('/').pop() || '').toLowerCase();
    // 상세 페이지(port-*.html)는 하단 퀵 내비게이션(.quick-nav)이 메뉴 역할을 하므로 사원증을 만들지 않는다
    if (/^port-\d+\.html$/.test(page)) return;

    var dim = document.createElement('div');
    dim.className = 'id-badge-dim';
    var badge = document.createElement('nav');
    badge.className = 'id-badge';
    badge.setAttribute('aria-label', '사이트 메뉴');
    badge.innerHTML =
      '<div class="ib-swing">' +
        '<div class="ib-strap"><span>EUNSUN OFFICE</span></div>' +
        '<div class="ib-bcard" role="button" tabindex="0" aria-expanded="false" aria-label="메뉴 열기">' + BADGE_HOOK +
          '<div class="ib-case">' +
            '<span class="ib-slot"></span>' +
            '<div class="ib-paper">' +
              '<div class="ib-band"><span class="ib-logo">E</span><div><strong>EUNSUN OFFICE</strong><small>DESIGN · PUBLISHING TEAM</small></div></div>' +
              '<div class="ib-body"><div class="ib-photo">' + badgeFaceSvg() + '</div>' +
                '<div class="ib-who"><strong>송은선</strong><span class="ib-en">SONG EUNSUN</span><span class="ib-role">Web Designer<br>Publisher</span><span class="ib-no">ID <b>EO-2021-0750</b></span></div></div>' +
              '<p class="ib-acc"><span>ACCESS · 출입 권한</span><span>MENU</span></p>' +
              '<ul>' + BADGE_MENU.map(function (m) {
                // 상세 페이지(port-*.html)에선 PORTFOLIO 램프만 켜고, 누르면 목록으로 이동한다
                var lit = m[4](page), here = lit && (page || 'index.html') === m[3];
                return '<li><a href="' + m[3] + '" tabindex="-1"' + (lit ? ' class="on"' : '') + (here ? ' aria-current="page"' : '') + '>' +
                  '<i></i><b>' + m[0] + '</b><span>' + m[1] + '</span><em>' + m[2] + '</em></a></li>';
              }).join('') + '</ul>' +
              '<div class="ib-foot"><div class="ib-bars"><div></div><small>EO 2021 0750 26</small></div><span class="ib-holo"></span></div>' +
            '</div>' +
            '<span class="ib-gloss"></span>' +
          '</div>' +
        '</div>' +
      '</div>';
    var probe = document.createElement('i');
    probe.className = 'id-badge-probe';
    probe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dim);
    document.body.appendChild(probe);
    document.body.appendChild(badge);

    var swing = badge.querySelector('.ib-swing');
    var card = badge.querySelector('.ib-bcard');
    var links = Array.prototype.slice.call(badge.querySelectorAll('li a'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canAnimate = !reduce && typeof swing.animate === 'function';
    var CARD_W = 280, CARD_H = 524, EDGE = 16;
    var isOpen = function () { return badge.classList.contains('open'); };

    // 열린 크기(--ko)와, 카드가 화면 밖으로 나가지 않도록 옆으로 옮길 거리(--sx)를 화면 크기로 계산
    function fit() {
      var cs = getComputedStyle(badge);
      var strapOpen = parseFloat(cs.getPropertyValue('--ib-strap-o')) || 26;
      var ko = Math.min(1, (window.innerHeight - strapOpen - EDGE) / CARD_H, (window.innerWidth - EDGE * 2) / CARD_W);
      // 줄이 매달린 지점: 사원증의 right 는 열고 닫을 때 애니메이션 중이라 그 값 대신 기준점(probe)의 위치를 쓴다
      var hangX = probe.getBoundingClientRect().left;
      var sx = Math.min(0, window.innerWidth - EDGE - (hangX + CARD_W / 2 * ko));
      badge.style.setProperty('--ib-ko', ko.toFixed(3));
      badge.style.setProperty('--ib-sx-o', sx.toFixed(1) + 'px');
    }

    // 닫힐 때 한 번 출렁이는 동작(close)만 있고, 닫혀 있는 동안에는 흔들리지 않는다
    function stopAll() { swing.getAnimations().forEach(function (a) { a.cancel(); }); }

    function notify(open) {
      document.dispatchEvent(new CustomEvent('sitemap:toggle', { detail: { open: open } }));
    }
    function open() {
      if (isOpen()) return;
      fit();
      if (canAnimate) stopAll();   // 닫힐 때의 출렁임이 남아 있으면 멈추고 연다
      badge.classList.add('open');
      dim.classList.add('on');
      card.setAttribute('aria-expanded', 'true');
      card.setAttribute('aria-label', '사원증 메뉴');
      links.forEach(function (l) { l.removeAttribute('tabindex'); });
      notify(true);
    }
    function close(focusCard) {
      if (!isOpen()) return;
      badge.classList.remove('open');
      dim.classList.remove('on');
      card.setAttribute('aria-expanded', 'false');
      card.setAttribute('aria-label', '메뉴 열기');
      links.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
      if (focusCard) card.focus();
      notify(false);
      if (!canAnimate) return;
      // 줄어들며 올라가는 동안 살짝 출렁이고, 0도에서 멈춘다
      stopAll();
      swing.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(5deg)', offset: .3 }, { transform: 'rotate(-3deg)', offset: .62 }, { transform: 'rotate(1.2deg)', offset: .85 }, { transform: 'rotate(0deg)' }],
        { duration: 1300, easing: 'ease-in-out' });
    }

    card.addEventListener('click', function (e) { if (!isOpen()) { e.stopPropagation(); open(); } });
    card.addEventListener('keydown', function (e) {
      if (e.target === card && (e.key === 'Enter' || e.key === ' ') && !isOpen()) { e.preventDefault(); open(); links[0].focus(); }
    });
    dim.addEventListener('click', function () { close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(true); });
    window.addEventListener('resize', function () { if (isOpen()) fit(); });

    // 메뉴 누르기: 출입 램프가 켜진 걸 잠깐 보여준 뒤 이동. 지금 페이지면 닫기만 한다.
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.stopPropagation();   // 카드 클릭(열기)으로 번지지 않게
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // 새 탭 열기는 브라우저 기본 동작
        e.preventDefault();
        if (link.getAttribute('aria-current') === 'page') { close(); return; }
        links.forEach(function (l) { l.classList.toggle('on', l === link); });
        setTimeout(function () { location.href = link.href; }, reduce ? 0 : 380);
      });
    });
    // 뒤로 가기로 돌아왔을 때(bfcache) 열린 채로 남아 있지 않게
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      close();
      links.forEach(function (l, i) { l.classList.toggle('on', BADGE_MENU[i][4](page)); });
    });

  }

  // 실행은 맨 아래에서: defer 로 불러오면 이 시점에 이미 DOM 이 준비돼 있어 onReady 가 바로 실행되는데,
  // 위쪽에서 부르면 아래에 선언된 메뉴 데이터(BADGE_MENU 등)가 아직 비어 있다.
  onReady(function () {
    initCursorFollower();
    initBadgeMenu();
  });

  keepGsapRunning();
})();
