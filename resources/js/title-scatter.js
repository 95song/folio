/* =====================================================================
   제목 망점 흩어짐 — [data-scatter] 가 붙은 제목을 망점(점묘) 글자로 그린다.
   사용법: <div class="main-title" data-scatter>Tracker</div>
   선택 속성:
     data-scatter-gap="5"       점 사이 간격(px). 기본은 글자 크기의 1/30 (최소 3)
     data-scatter-radius="90"   마우스가 점을 밀어내는 거리(px). 기본 90
   - 글자를 한 번 그려 본 뒤 격자 칸마다 글자가 덮인 만큼 점 크기를 정한다.
   - 마우스가 지나가면 점이 밀려났다가 스프링처럼 제자리로 돌아오고, 누르면 파동이 한 번 퍼진다.
   - 캔버스는 제목의 부모(첫 화면 전체)를 덮어 점이 글자 밖으로 흩어져도 잘리지 않는다.
   - 원래 글자는 그대로 두고 투명하게만 만든다 (모양은 port-1.css 의 .is-scatter).
   - 점이 모두 제자리에 있으면 그리기를 멈추고, 화면에서 벗어나면 쉰다.
   - 첫 화면 등장(<html class="intro-on">)일 때는 흩어진 점이 글자 자리로 모이며 시작한다.
   ===================================================================== */
(function () {
  'use strict';

  var PUSH = 2.6;          // 마우스가 미는 힘
  var SPRING = 0.05;       // 제자리로 당기는 힘
  var DAMP = 0.84;         // 감쇠
  var RING_MS = 900;       // 파동이 지속되는 시간
  var RING_SPEED = 0.9;    // 파동이 퍼지는 속도 (px/ms)
  var RING_BAND = 26;      // 파동 띠의 두께
  var RING_PUSH = 3.2;     // 파동이 미는 힘
  var FAR = -1e5;          // 마우스가 없을 때의 좌표

  function init(title) {
    var root = title.parentElement;
    var canvas = document.createElement('canvas');
    canvas.className = 'title-scatter-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w = 0, h = 0, dpr = 1;
    var px = FAR, py = FAR;
    var raf = 0, visible = true, awake = true;
    var ring = { x: 0, y: 0, t: -1 };
    var dots = new Float32Array(0);   // 점마다 x, y, vx, vy, 제자리 x, 제자리 y, 반지름
    var count = 0;
    var color = '#ffffff';
    // 미세먼지처럼 흩어져 있다가 모이는 첫 등장 (port.js 가 <html class="intro-on"> 을 붙였을 때만)
    var gather = !reduced && document.documentElement.classList.contains('intro-on');

    // 글자를 1배율 캔버스에 그린 뒤 격자로 훑어 점을 만든다
    function layout() {
      var rootBox = root.getBoundingClientRect();
      var box = title.getBoundingClientRect();
      w = Math.max(1, Math.round(rootBox.width));
      h = Math.max(1, Math.round(rootBox.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      var cs = getComputedStyle(title);
      var size = parseFloat(cs.fontSize) || 100;
      var word = title.textContent.trim() || ' ';
      // 처음 한 번만 읽는다 (그 뒤에는 글자가 투명해져서 색을 읽을 수 없다)
      if (!title.classList.contains('is-scatter')) color = cs.color || color;

      var mask = document.createElement('canvas');
      mask.width = w;
      mask.height = h;
      var m = mask.getContext('2d', { willReadFrequently: true });
      if (!m) return;
      m.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
      if ('letterSpacing' in m && cs.letterSpacing !== 'normal') m.letterSpacing = cs.letterSpacing;
      m.fillStyle = '#000';
      m.textAlign = 'center';
      var cx = box.left - rootBox.left + box.width / 2;
      var met = m.measureText(word);
      if (met.fontBoundingBoxAscent) {
        // 줄 상자 안에서 글꼴 높이가 가운데 놓이는 CSS 방식 그대로 기준선을 잡는다
        var fa = met.fontBoundingBoxAscent, fd = met.fontBoundingBoxDescent;
        m.textBaseline = 'alphabetic';
        m.fillText(word, cx, box.top - rootBox.top + (box.height - (fa + fd)) / 2 + fa);
      } else {
        m.textBaseline = 'middle';
        m.fillText(word, cx, box.top - rootBox.top + box.height / 2);
      }
      var img = m.getImageData(0, 0, w, h).data;

      var gap = Math.max(3, parseFloat(title.dataset.scatterGap) || size / 30);
      var cols = Math.ceil(w / gap), rows = Math.ceil(h / gap);
      var tmp = [];
      for (var gy = 0; gy < rows; gy++) {
        for (var gx = 0; gx < cols; gx++) {
          // 칸 안 3×3 지점의 평균으로 글자가 덮인 정도를 구한다
          var sum = 0;
          for (var sy = 0; sy < 3; sy++) {
            for (var sx = 0; sx < 3; sx++) {
              var x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
              var y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          var cov = sum / (9 * 255);
          if (cov < 0.06) continue;
          var hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
          // 넓이가 덮인 정도에 비례하도록 반지름을 정한다
          // 첫 등장(intro-on)일 때는 화면 곳곳에 흩어진 점에서 시작해 글자 자리로 모인다
          var sx0 = gather ? Math.random() * w : hx, sy0 = gather ? Math.random() * h : hy;
          tmp.push(sx0, sy0, 0, 0, hx, hy, Math.sqrt(Math.min(1, cov)) * gap * 0.56);
        }
      }
      dots = new Float32Array(tmp);
      count = tmp.length / 7;
      if (count > 0) gather = false;
      title.classList.toggle('is-scatter', count > 0);
      awake = true;
    }

    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var r = reduced ? 0 : Math.max(0, parseFloat(title.dataset.scatterRadius) || 90);
      var ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      var ringR = ringAge * RING_SPEED;
      var moving = false;

      ctx.fillStyle = color;
      ctx.beginPath();
      for (var i = 0; i < count; i++) {
        var j = i * 7;
        var x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3];
        var hx = dots[j + 4], hy = dots[j + 5];
        if (!reduced) {
          var dx, dy, d;
          if (ringAge < RING_MS) {
            dx = hx - ring.x; dy = hy - ring.y;
            d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            var band = 1 - Math.min(1, Math.abs(d - ringR) / RING_BAND);
            if (band > 0) {
              var rf = band * RING_PUSH * (1 - ringAge / RING_MS);
              vx += (dx / d) * rf;
              vy += (dy / d) * rf;
            }
          }
          dx = x - px; dy = y - py;
          var d2 = dx * dx + dy * dy;
          if (r > 0 && d2 < r * r) {
            d = Math.sqrt(d2) + 0.001;
            var f = (1 - d / r) * PUSH;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
          vx = (vx + (hx - x) * SPRING) * DAMP;
          vy = (vy + (hy - y) * SPRING) * DAMP;
          x += vx; y += vy;
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true;
          else { x = hx; y = hy; vx = 0; vy = 0; }
          dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
        }
        var rad = dots[j + 6];
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, 6.2832);
      }
      ctx.fill();
      // 모두 제자리에 있고 미는 것이 없으면 쉰다
      awake = moving || ringAge < RING_MS || px > -1e4;
    }

    function loop(now) {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    }
    function wake() {
      awake = true;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    }
    function toLocal(e) {
      var b = canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    }

    root.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;   // 터치는 누를 때의 파동만
      var p = toLocal(e);
      px = p[0]; py = p[1];
      wake();
    });
    root.addEventListener('pointerleave', function () {
      px = FAR; py = FAR;
      wake();
    });
    root.addEventListener('pointerdown', function (e) {
      if (reduced || e.target.closest('a,button')) return;
      var p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    });

    function relayout() { layout(); draw(performance.now()); wake(); }
    relayout();
    new ResizeObserver(relayout).observe(root);
    new IntersectionObserver(function (entries) {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    }).observe(root);
    // 웹폰트가 늦게 도착하면 실제 글꼴로 다시 만든다
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  }

  function start() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-scatter]'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
