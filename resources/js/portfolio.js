/* =====================================================================
   portfolio.js — portfolio.html 전용 스크립트
   로딩 애니메이션 → 레이어드 이미지 슬라이더 (GSAP CustomEase·Observer 필요)
   ===================================================================== */

// 박스가 열리는 로딩과 레이어드 이미지 슬라이더를 하나로 이어붙였다.
// 로딩 박스가 화면 전체(100vw/100dvh)로 다 열리면, 그 순간 같은 자리에
// 슬라이더를 노출시켜 이어받는다. 박스의 마지막 이미지와 슬라이더 첫
// 배경 이미지를 동일하게 맞춰서 전환이 끊기지 않게 했다.
(function () {
  gsap.registerPlugin(CustomEase, Observer);
  CustomEase.create("wrEase", "M0,0 C0.625,0.05 0,1 1,1");
 
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('wrHeader');
  if (!header) return;
 
  // ================= Layered Image Slider =================
  // 요소 선택자는 data-layered-slider-* 를 쓰고, 클래스 이름은 페이지 전역과
  // 충돌하지 않게 wr- 접두어를 쓴다.
  function initLayeredImageSlider() {
    document.querySelectorAll('[data-layered-slider-init]').forEach(function (root) {
      if (root._layeredSlider) root._layeredSlider.destroy();
 
      var titles = Array.prototype.slice.call(root.querySelectorAll('[data-layered-slider-title]'));
      if (!titles.length) return;
      var count = titles.length;
 
      var backgrounds = Array.prototype.slice.call(root.querySelectorAll('[data-layered-slider-bg]'));
      var maskItems = Array.prototype.slice.call(root.querySelectorAll('[data-layered-slider-mask-item]'));
      var maskFrame = root.querySelector('[data-layered-slider-mask]');
      var fill = root.querySelector('[data-layered-slider-fill]');
      var currentEl = root.querySelector('[data-layered-slider-current]');
      var totalEl = root.querySelector('[data-layered-slider-total]');
      var prevBtn = root.querySelector('[data-layered-slider-prev]');
      var nextBtn = root.querySelector('[data-layered-slider-next]');
 
      // 자동재생을 잠깐 멈추게 하는(hover) 모든 요소
      var controls = Array.prototype.slice.call(new Set(titles.concat(Array.prototype.slice.call(root.querySelectorAll('a, button')))));
 
      // 자동재생 간격(초). 0이면 자동재생 없음
      var autoplayAttr = root.getAttribute('data-layered-slider-autoplay');
      var autoplay = autoplayAttr !== null ? parseFloat(autoplayAttr) : 5;
 
      var clampFn = gsap.utils.clamp;
      var wrap = function (distance) { return distance - count * Math.round(distance / count); };
 
      var transitionDuration = 1;
      var backgroundZoom = 0;
 
      if (totalEl) totalEl.textContent = String(count).padStart(2, '0');
 
      var maskStep = 0;
      function measure() {
        // clientWidth는 정수로 반올림돼서(230.4 → 230) 카드 사이에 틈이 생긴다. 실제 폭을 쓴다.
        maskStep = maskFrame ? maskFrame.getBoundingClientRect().width : root.clientWidth;
      }
      measure();
 
      // ---------- 챕터 진행 표시(UX/UI · EDITORIAL) ----------
      // 각 [data-chapter] 버튼의 글자를 한 글자씩 쪼개 "흐린 글자 / 흰 글자" 두 벌을
      // 세로로 쌓아두고, 활성화되면 CSS가 한 칸 위로 굴려 올린다(인트로의 글자
      // 등장과 같은 언어). 칸(bar)은 data-category가 같은 슬라이드 수만큼 만든다.
      var chaptersEl = root.querySelector('[data-layered-slider-chapters]');
      var chapters = chaptersEl ? Array.prototype.slice.call(chaptersEl.querySelectorAll('[data-chapter]')).map(function (btn) {
        var key = btn.getAttribute('data-chapter');
        var indexes = [];
        titles.forEach(function (t, i) { if (t.getAttribute('data-category') === key) indexes.push(i); });
 
        // 재초기화 시 이미 쪼개진 글자(두 벌)를 다시 읽지 않도록 aria-label을 우선 사용
        var text = btn.getAttribute('aria-label') || btn.textContent.trim();
        btn.textContent = '';
        btn.setAttribute('aria-label', text);
 
        var label = document.createElement('span');
        label.className = 'wr-chapter-label';
        label.setAttribute('aria-hidden', 'true');
        Array.prototype.forEach.call(text, function (ch, n) {
          var glyph = ch === ' ' ? ' ' : ch;
          var char = document.createElement('span');
          char.className = 'wr-chapter-char';
          char.style.setProperty('--i', n);
          for (var k = 0; k < 2; k++) {
            var face = document.createElement('span');
            face.textContent = glyph;
            char.appendChild(face);
          }
          label.appendChild(char);
        });
 
        var barsEl = document.createElement('span');
        barsEl.className = 'wr-chapter-bars';
        barsEl.setAttribute('aria-hidden', 'true');
        var bars = indexes.map(function () {
          var bar = document.createElement('span');
          bar.className = 'wr-chapter-bar';
          barsEl.appendChild(bar);
          return bar;
        });
 
        btn.appendChild(label);
        btn.appendChild(barsEl);
        if (!indexes.length) btn.disabled = true;
        return { btn: btn, indexes: indexes, bars: bars };
      }) : [];
 
      function chapterOf(index) {
        for (var c = 0; c < chapters.length; c++) if (chapters[c].indexes.indexOf(index) >= 0) return c;
        return -1;
      }
 
      function updateChapters(index) {
        chapters.forEach(function (ch) {
          var pos = ch.indexes.indexOf(index);
          ch.btn.classList.toggle('is-active', pos >= 0);
          ch.btn.setAttribute('aria-current', pos >= 0 ? 'true' : 'false');
          ch.bars.forEach(function (bar, n) { bar.classList.toggle('is-filled', pos >= 0 && n <= pos); });
        });
      }
 
      // 챕터가 바뀌는 이동이면 카드(마스크)를 좌우로 살짝 좁혔다가 다시 편다.
      // 마스크 프레임은 CSS transform(translateX(-50%))과 인트로의 y 트윈을
      // 이미 쓰고 있어서, 충돌하지 않도록 transform 대신 clip-path로 처리한다.
      // (브라우저가 inset(0% 0% 0% 0%)를 inset(0%)로 줄여 써서 clip-path 문자열을
      // 직접 트윈하면 값이 엉뚱하게 짝지어진다. 좌우 여백 % 숫자 하나만 트윈한다.)
      var squeezeTween = null;
      var squeeze = { x: 0 };
      function applySqueeze() {
        maskFrame.style.clipPath = squeeze.x ? 'inset(0% ' + squeeze.x + '% round 0.75em)' : '';
      }
      function squeezeMask() {
        if (!maskFrame || reduced) return;
        if (squeezeTween) squeezeTween.kill();
        squeezeTween = gsap.timeline({ onUpdate: applySqueeze })
          .to(squeeze, { x: 9, duration: transitionDuration * .45, ease: 'power2.in' })
          .to(squeeze, { x: 0, duration: transitionDuration * .6, ease: 'expo.out' });
      }
 
      var state = { progress: 0 };
      var activeIndex = -1;
 
      function setActive(previousIndex, index) {
        [backgrounds, titles, maskItems].forEach(function (list) {
          if (previousIndex >= 0 && list[previousIndex]) list[previousIndex].removeAttribute('data-active');
          if (list[index]) list[index].setAttribute('data-active', '');
        });
      }
 
      function render(progress) {
        var centeredIndex = ((Math.round(progress) % count) + count) % count;
 
        for (var i = 0; i < count; i++) {
          var offset = wrap(i - progress);
          var distance = Math.abs(offset);
 
          var background = backgrounds[i];
          if (background) {
            var backgroundOpacity = clampFn(0, 1, 1 - distance);
            gsap.set(background, {
              opacity: backgroundOpacity,
              scale: 1 + backgroundZoom - backgroundZoom * backgroundOpacity,
              zIndex: Math.round(backgroundOpacity * 100),
            });
          }
 
          // 좌하단 캡션(타이틀)은 이제 좌우로 미끄러지지 않고 같은 자리에서
          // 배경 이미지와 동일한 속도로 크로스페이드(opacity만 전환)된다.
          gsap.set(titles[i], {
            opacity: clampFn(0, 1, 1 - distance),
            pointerEvents: i === centeredIndex ? 'auto' : 'none',
          });
 
          var maskItem = maskItems[i];
          // 소수점 위치면 맞닿은 두 카드 가장자리가 반투명하게 안티앨리어싱되어
          // 뒤 배경이 회색 선처럼 비친다. 정수 픽셀로 맞추고, CSS에서 1px 겹쳐 덮는다.
          if (maskItem) gsap.set(maskItem, { x: Math.round(offset * maskStep) });
        }
 
        if (centeredIndex !== activeIndex) {
          var previousIndex = activeIndex;
          activeIndex = centeredIndex;
          setActive(previousIndex, centeredIndex);
          if (currentEl) currentEl.textContent = String(centeredIndex + 1).padStart(2, '0');
          updateChapters(centeredIndex);
        }
      }
 
      var hovering = 0;
      var autoTween = null;
      function startAutoplay() {
        if (!autoTween) return;
        autoTween.restart();
        if (hovering > 0) autoTween.pause();
      }
 
      var slideTween = null, current = 0;
      function goTo(delta) {
        var fromIndex = ((current % count) + count) % count;
        current += delta;
        var toIndex = ((current % count) + count) % count;
        if (chapterOf(fromIndex) !== chapterOf(toIndex)) squeezeMask();
        if (slideTween) slideTween.kill();
        slideTween = gsap.to(state, {
          progress: current,
          duration: reduced ? 0 : transitionDuration,
          ease: 'wrEase',
          onUpdate: function () { render(state.progress); },
        });
        startAutoplay();
      }
 
      function goToIndex(i) {
        var delta = wrap(i - current);
        if (delta !== 0) goTo(delta);
      }
 
      if (autoplay > 0 && !reduced && fill) {
        gsap.set(fill, { scaleX: 0, transformOrigin: 'left center' });
        autoTween = gsap.to(fill, {
          scaleX: 1,
          duration: autoplay,
          ease: 'none',
          paused: true,
          onComplete: function () { goTo(1); },
        });
      }
 
      // 좌우 드래그(터치/마우스)로도 슬라이드 이동
      var gestureUsed = false;
      var dragged = false; // 카드(링크)를 스와이프하고 손을 뗄 때 클릭으로 처리돼 이동하는 것을 막는다
      var observer = Observer.create({
        target: root,
        type: 'touch,pointer',
        dragMinimum: 10,
        tolerance: 25,
        lockAxis: true,
        onPress: function () { dragged = false; },
        onDragStart: function () { gestureUsed = false; dragged = true; },
        onLeft: function () { if (!gestureUsed) { gestureUsed = true; goTo(1); } },
        onRight: function () { if (!gestureUsed) { gestureUsed = true; goTo(-1); } },
      });
 
      var onPrev = function () { goTo(-1); };
      var onNext = function () { goTo(1); };
      if (prevBtn) prevBtn.addEventListener('click', onPrev);
      if (nextBtn) nextBtn.addEventListener('click', onNext);
 
      var onTitleClick = function (e) {
        var i = titles.indexOf(e.currentTarget);
        if (i === activeIndex) return;
        e.preventDefault();
        goToIndex(i);
      };
      titles.forEach(function (title) { title.addEventListener('click', onTitleClick); });
 
      var onMaskClick = function (e) { if (dragged) e.preventDefault(); };
      maskItems.forEach(function (item) { item.addEventListener('click', onMaskClick); });
 
      // 챕터 라벨을 누르면 그 챕터의 첫 작품으로 이동
      var chapterHandlers = chapters.map(function (ch) {
        var handler = function () { if (ch.indexes.length) goToIndex(ch.indexes[0]); };
        ch.btn.addEventListener('click', handler);
        return handler;
      });
 
      var onEnter = function () { hovering++; if (autoTween) autoTween.pause(); };
      var onLeave = function () { hovering = Math.max(0, hovering - 1); if (autoTween && hovering === 0) autoTween.resume(); };
      controls.forEach(function (el) {
        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
      });
 
      var onResize = function () { measure(); render(state.progress); };
      window.addEventListener('resize', onResize);
      if (document.fonts) document.fonts.ready.then(onResize);
 
      render(0);
      startAutoplay();
 
      root._layeredSlider = {
        goTo: goTo,
        destroy: function () {
          observer.kill();
          if (slideTween) slideTween.kill();
          if (autoTween) autoTween.kill();
          window.removeEventListener('resize', onResize);
          if (prevBtn) prevBtn.removeEventListener('click', onPrev);
          if (nextBtn) nextBtn.removeEventListener('click', onNext);
          titles.forEach(function (title) { title.removeEventListener('click', onTitleClick); });
          maskItems.forEach(function (item) { item.removeEventListener('click', onMaskClick); });
          chapters.forEach(function (ch, c) { ch.btn.removeEventListener('click', chapterHandlers[c]); });
          if (squeezeTween) squeezeTween.kill();
          controls.forEach(function (el) {
            el.removeEventListener('pointerenter', onEnter);
            el.removeEventListener('pointerleave', onLeave);
          });
          root._layeredSlider = null;
        },
      };
    });
  }
 
  // ================= Loading Animation =================
  // 로딩 레이어(.wr-loader)와 슬라이더를 별도 레이어로 나누지 않고, 로딩 박스
  // 안에서 커지는 이미지 요소를 슬라이더의 배경 요소로 그대로 재사용한다.
  // "레이어를 갈아끼우는" 순간이 아예 없어서 위치가 어긋나거나 화면이
  // 깜빡이는 일이 생길 수 없다. 로딩이 끝나면 같은 타임라인에 이어서
  // 슬라이더 UI(캡션/마스크/버튼/햄버거)가 스르륵 올라온다.
  function playIntro() {
    var loadingLetter = header.querySelectorAll('.wr-letter');
    var box = header.querySelectorAll('.wr-loader-box');
    var growingImage = header.querySelectorAll('.wr-growing-image');
    var headingStart = header.querySelectorAll('.wr-h1-start');
    var headingEnd = header.querySelectorAll('.wr-h1-end');
    var bgItems = Array.prototype.slice.call(header.querySelectorAll('[data-layered-slider-bg]'));
    var bgDark = header.querySelector('.wr-slider-bg-dark');
 
    // 첫 번째([data-active], 최종적으로 남는 실제 이미지)를 뺀 나머지 중 3장을
    // "로딩 중 스쳐가는 미리보기"로 재활용한다.
    // 미리보기가 사라지고 나면 곧 슬라이더의 첫 배경(진짜 activ 이미지)이
    // 이미 그 자리에 있던 것이므로 로딩->슬라이더 전환에 별도 처리가 필요없다.
    // 배경들은 z-index 없이 겹쳐 있어 HTML 에서 뒤에 있는 이미지일수록 위에 보인다.
    // 위에 있는 이미지부터 사라져야 한 장씩 차례로 드러나므로, 순서를 뒤집어
    // (port-4 → port-3 → port-2 순으로 사라짐) 미리보기 3장 + 최종 1장이 모두 보이게 한다.
    var flickerBg = bgItems.filter(function (el) { return !el.hasAttribute('data-active'); }).slice(0, 3).reverse();
 
    function reveal() {
      initLayeredImageSlider();
 
      var textCollection = header.querySelector('.wr-slider-text-collection');
      var maskCollection = header.querySelector('.wr-slider-mask-collection');
      var overlay = header.querySelector('.wr-slider-overlay');
 
      var tl2 = gsap.timeline();
      if (bgDark) tl2.to(bgDark, { opacity: 1, duration: .8 }, 0);
      // CSS 기본값이 opacity:0이라 .from()을 쓰면 "현재 값(0)"에서 "현재 값(0)"으로
      // 애니메이션하는 꼴이 되어 아무 일도 안 일어난다. 목표값(1)을 명시하는
      // .fromTo()를 써야 한다.
      tl2.fromTo(
        [maskCollection, overlay, textCollection].filter(Boolean),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .12 },
        0.05
      );
      // 로딩 중엔 숨겨뒀던 사원증 메뉴(.id-badge, common.js 가 만듦)도 슬라이더 UI가
      // 나타나는 타이밍에 위에서 줄을 타고 내려온다.
      var badge = document.querySelector('.id-badge');
      if (badge) {
        tl2.fromTo(badge, { opacity: 0, yPercent: -60 }, { opacity: 1, yPercent: 0, duration: 1.1, ease: 'back.out(1.6)' }, 0.1);
      }
    }
 
    if (reduced) {
      if (box.length) gsap.set(box, { width: '110vw' });
      if (growingImage.length) gsap.set(growingImage, { width: '100vw', height: '100dvh' });
      header.classList.add('is-intro-ready');
      reveal();
      return;
    }
 
    // 박스가 flex 흐름 밖으로 나가 화면 중앙에 독립적으로 고정되면서, 글자가
    // 더는 박스 너비만큼 자동으로 밀려나지 않게 됐다. 그래서 매 프레임 박스의
    // 실제 렌더링 너비를 읽어서 그 절반만큼 "PORT"는 왼쪽으로, "FOLIO"는
    // 오른쪽으로 밀어준다 - 박스가 커지는 만큼 글자가 자연스럽게 벌어진다.
    //
    // 다만 "PORT"(4글자)와 "FOLIO"(5글자)는 폭이 서로 달라서, 단순히 절반씩
    // 대칭으로만 밀면 박스 중심(화면 정중앙)을 기준으로 한쪽(T)은 여유
    // 간격이 생기고 반대쪽(F)은 그만큼 모자라서 박스에 딱 붙어버린다.
    // 시작 시점(박스 너비 0)의 실제 좌표를 미리 재서, 두 글자 그룹이 박스와
    // 항상 "같은 간격"을 유지하도록 보정값(endCorrection)을 한 번 계산해둔다.
    var loaderBoxEl = box[0];
    var startEl = headingStart[0];
    var endEl = headingEnd[0];
    var endCorrection = 0;
    if (loaderBoxEl && startEl && endEl) {
      var boxRect0 = loaderBoxEl.getBoundingClientRect(); // width:0 상태라 left===right===박스 중심
      var boxCenter = boxRect0.left;
      var startRight0 = startEl.getBoundingClientRect().right;
      var endLeft0 = endEl.getBoundingClientRect().left;
      // T쪽 간격(gapT) = boxCenter - startRight0 (박스 폭과 무관하게 항상 일정).
      // F쪽도 같은 간격이 나오도록 endX = half + endCorrection 형태로 보정한다.
      endCorrection = 2 * boxCenter - startRight0 - endLeft0;
    }
    function pushLettersByBoxWidth() {
      if (!loaderBoxEl) return;
      var half = loaderBoxEl.offsetWidth / 2;
      if (headingStart.length) gsap.set(headingStart, { x: -half });
      if (headingEnd.length) gsap.set(headingEnd, { x: half + endCorrection });
    }
 
    var tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: reveal,
    });
 
    if (loadingLetter.length) {
      // .from()은 시작 상태(아래로 내린 글자)를 다음 프레임에 적용한다. 그 전에 글자를 보이게 하면
      // 제자리 글자가 한 번 보일 수 있으므로, 먼저 set으로 즉시 내려놓고 도착점(0)을 명시한다.
      gsap.set(loadingLetter, { yPercent: 100 });
      tl.fromTo(loadingLetter, { yPercent: 100 }, { yPercent: 0, stagger: 0.025, duration: 1.25 });
    }
    if (box.length) {
      tl.fromTo(box, { width: '0em' }, { width: '1em', duration: 1.25, onUpdate: pushLettersByBoxWidth }, '<1.25');
    }
    if (growingImage.length) {
      tl.fromTo(growingImage, { width: '0%' }, { width: '100%', duration: 1.25 }, '<');
    }
    if (flickerBg.length) {
      // 실제 데모와 동일하게 stagger 0.5초 간격으로 미리보기 이미지 3장이 사라진다.
      // 슬라이더 CSS 기본값은 opacity:0(비활성 슬라이드)라서, 사라지기 전에
      // 먼저 보이게(opacity:1) 만들어준다.
      gsap.set(flickerBg, { opacity: 1 });
      tl.fromTo(flickerBg, { opacity: 1 }, { opacity: 0, duration: 0.05, ease: 'none', stagger: 0.5 }, '-=0.05');
    }
    if (growingImage.length) {
      tl.to(growingImage, { width: '100vw', height: '100dvh', duration: 2 }, '<1.25');
    }
    if (box.length) {
      tl.to(box, { width: '110vw', duration: 2, onUpdate: pushLettersByBoxWidth }, '<');
    }
    // 여기까지 오면 글자는 이미 아래로 내려가 숨겨진 시작 상태다(위에서 set 으로 즉시 적용).
    // 이제 CSS 로 숨겨 뒀던 글자를 보이게 해도 깜빡이지 않는다.
    header.classList.add('is-intro-ready');
  }
 
  document.addEventListener('DOMContentLoaded', playIntro);
})();