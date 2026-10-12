/* =====================================================================
   common.js — 모든 페이지 공용 스크립트 (순수 JS, 외부 라이브러리 없음)
   1. 새로고침 시 스크롤 위치 복원 끄기
   2. 커서 따라다니는 동그라미 (.cursor-follower)
   3. 햄버거 메뉴 + 사이트맵 열고 닫기 (.ham / .site_wrap / .site_bg)
   4. 사이트맵 아코디언 (.sitemap_dep1)
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

  onReady(function () {
    initCursorFollower();
    initSitemap();
  });

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

  /* 3·4. 햄버거 메뉴 + 사이트맵 -------------------------------------- */
  function initSitemap() {
    var hams = document.querySelectorAll('.ham');
    var panels = document.querySelectorAll('.site_wrap, .site_bg');

    hams.forEach(function (ham) {
      ham.addEventListener('click', function () {
        var open = !ham.classList.contains('active');
        hams.forEach(function (h) { h.classList.toggle('active', open); });
        panels.forEach(function (p) { p.classList.toggle('active', open); });
        // 페이지별 스크립트가 반응할 수 있도록 알림 (예: profile.js 가 부드러운 스크롤을 멈춤)
        document.dispatchEvent(new CustomEvent('sitemap:toggle', { detail: { open: open } }));
      });
    });

    // 사이트맵 아코디언: 클릭한 항목만 열고 나머지는 닫기
    var items = document.querySelectorAll('.sitemap_dep1');
    document.querySelectorAll('.sitemap_dep1 > a').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var parentItem = this.parentElement;
        items.forEach(function (item) { if (item !== parentItem) item.classList.remove('active'); });
        parentItem.classList.toggle('active');
      });
    });
  }
})();
