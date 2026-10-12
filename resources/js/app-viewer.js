/* =====================================================================
   앱 뷰어 — 버튼을 누르면 화면 위에 폰 프레임을 띄우고 그 안에서 실제 앱을 연다.
   사용법: <button data-app-viewer="시작 페이지 주소" data-app-title="이름">
   선택 속성 (없으면 아이폰 16 크기의 폰으로 연다):
     data-app-width="1376" data-app-height="1032"   화면 크기(px). 기본 393 × 852
     data-app-radius="28"                           프레임 바깥 모서리(px). 기본 56
     data-app-mobile="fit"                          767px 이하에서도 프레임을 유지하고 화면 폭에 맞춰 줄인다.
                                                    기본은 "full" (프레임 없이 전체 화면)
   - 화면은 iframe 으로 그대로 열기 때문에 HTML · CSS · JS 가 모두 작동한다.
   - 닫기: 닫기 버튼 · Esc · 프레임 바깥(어두운 영역) 클릭. 닫으면 누른 버튼으로 포커스가 돌아간다.
   - 가로가 더 긴 화면은 버튼 줄이 프레임 위쪽에 놓인다 (모양은 app-viewer.css).
   ===================================================================== */
(function () {
  'use strict';

  var DEFAULT_W = 393, DEFAULT_H = 852, DEFAULT_RADIUS = 56;   // 아이폰 16
  var BORDER = 7;                              // app-viewer.css 의 --av-border 와 같게
  var MARGIN = 24;                             // 창 가장자리와 프레임 사이 최소 여백
  var TOOLS = 60;                              // 버튼 줄이 차지하는 폭 또는 높이 (16 + 44)
  var appW = DEFAULT_W, appH = DEFAULT_H, wide = false;
  var viewer = null, phone = null, frame = null, titleEl = null;
  var lastFocus = null, currentSrc = '';

  var ICON_CLOSE = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15"/></svg>';
  var ICON_HOME = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 9a5.5 5.5 0 1 0 1.7-4"/><path d="M3 2.8v3h3"/></svg>';

  function build() {
    viewer = document.createElement('div');
    viewer.className = 'app-viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-hidden', 'true');
    viewer.innerHTML =
      '<div class="app-viewer-stage">' +
        '<div class="app-viewer-phone"></div>' +
        '<div class="app-viewer-tools">' +
          '<span class="app-viewer-title"></span>' +
          '<button class="app-viewer-btn" type="button" data-av="close" aria-label="닫기">' + ICON_CLOSE + '</button>' +
          '<button class="app-viewer-btn" type="button" data-av="restart" aria-label="처음 화면으로">' + ICON_HOME + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(viewer);
    phone = viewer.querySelector('.app-viewer-phone');
    titleEl = viewer.querySelector('.app-viewer-title');

    viewer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-av]');
      if (btn) { if (btn.dataset.av === 'close') close(); else load(currentSrc); return; }
      if (e.target === viewer) close();   // 폰 바깥(어두운 영역)
    });
    window.addEventListener('resize', fit);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && viewer.classList.contains('is-open')) close();
    });
  }

  // 창이 프레임보다 작으면 프레임 전체를 줄인다 (화면은 지정한 크기 그대로 그려진다).
  // 버튼 줄 자리: 세로형은 프레임 오른쪽(가운데 정렬을 위해 양쪽에), 가로형은 프레임 위쪽.
  function fit() {
    if (!viewer) return;
    var w = window.innerWidth, h = window.innerHeight;
    var narrow = w <= 767;
    var m = narrow ? 12 : MARGIN;
    var roomW = w - m * 2 - (wide ? 0 : TOOLS * 2);
    var roomH = h - m * 2 - (wide ? TOOLS * 2 : 0);
    var k = Math.min(1, roomH / (appH + BORDER * 2), roomW / (appW + BORDER * 2));
    viewer.style.setProperty('--av-k', Math.max(0.1, k).toFixed(4));
  }

  // 앱을 연다. iframe 은 매번 새로 만들어 닫으면 완전히 멈추게 한다.
  function load(src) {
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.title = (titleEl.textContent || '앱') + ' 화면';
    frame.addEventListener('load', function () {
      // 화면 폭이 스크롤바만큼 줄지 않도록 앱 안의 스크롤바를 숨긴다 (같은 출처일 때만 가능)
      try {
        var doc = frame.contentDocument;
        var st = doc.createElement('style');
        st.textContent = 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}';
        doc.head.appendChild(st);
        // 앱 안에서 Esc 를 눌러도 뷰어가 닫히게
        doc.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && !e.defaultPrevented) close();
        });
      } catch (err) { /* 다른 출처면 건너뛴다 */ }
    });
    frame.src = src;
    phone.appendChild(frame);
  }

  function open(src, title, trigger) {
    if (!viewer) build();
    lastFocus = trigger || document.activeElement;
    currentSrc = src;
    // 화면 크기 · 모서리 · 모바일 방식 (버튼 속성, 없으면 기본 폰)
    var d = (trigger && trigger.dataset) || {};
    appW = parseInt(d.appWidth, 10) || DEFAULT_W;
    appH = parseInt(d.appHeight, 10) || DEFAULT_H;
    wide = appW > appH;
    viewer.style.setProperty('--av-w', appW);
    viewer.style.setProperty('--av-h', appH);
    viewer.style.setProperty('--av-radius', (parseInt(d.appRadius, 10) || DEFAULT_RADIUS) + 'px');
    viewer.classList.toggle('is-wide', wide);
    viewer.classList.toggle('is-mobile-fit', d.appMobile === 'fit');
    titleEl.textContent = title || '';
    viewer.setAttribute('aria-label', (title ? title + ' ' : '') + '앱 미리보기');
    fit();
    load(src);
    document.documentElement.classList.add('app-viewer-lock');
    viewer.setAttribute('aria-hidden', 'false');
    viewer.classList.add('is-open');
    viewer.querySelector('[data-av="close"]').focus({ preventScroll: true });
  }

  function close() {
    if (!viewer || !viewer.classList.contains('is-open')) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('app-viewer-lock');
    // 사라지는 모션이 끝난 뒤 앱을 내린다
    var old = frame; frame = null;
    setTimeout(function () { if (old) old.remove(); }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-app-viewer]');
    if (!btn) return;
    e.preventDefault();
    open(btn.getAttribute('data-app-viewer'), btn.getAttribute('data-app-title'), btn);
  });
})();
