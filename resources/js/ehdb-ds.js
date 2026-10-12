/* EHDB DID 디자인 시스템 (port-2.html Design System 영역)
   ehdb-design-system.html에서 히어로를 뺀 나머지 동작. .eds 안에서만 동작한다. */
document.addEventListener('DOMContentLoaded', function () {
  var root = document.querySelector('.eds');
  if (!root) return;

  var IMG = 'resources/jeju-did/resources/images/';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };

  /* ---------- 등급 데이터 (환경부 대기환경기준) ---------- */
  var GRADES = [
    { ko: '좋음',     en: 'Good',           hex: '#289CFF', face: 'air_blue',   pm10: [0, 30],     pm25: [0, 15],     desc: '실외활동을 해도 좋습니다.' },
    { ko: '보통',     en: 'Moderate',       hex: '#1DB155', face: 'air_green',  pm10: [31, 80],    pm25: [16, 35],    desc: '민감군은 장시간 실외활동을 줄이세요.' },
    { ko: '나쁨',     en: 'Unhealthy',      hex: '#FFAC06', face: 'air_yellow', pm10: [81, 150],   pm25: [36, 75],    desc: '실외활동을 줄이고 창문을 닫아 주세요.', dark: true },
    { ko: '매우나쁨', en: 'Very Unhealthy', hex: '#FF3556', face: 'air_red',    pm10: [151, null], pm25: [76, null],  desc: '실외활동을 피하고 실내 공기를 관리하세요.' },
    { ko: '점검중',   en: 'No Signal',      hex: '#CDCDCD', face: 'air_gray',   pm10: null,        pm25: null,        desc: '측정기 수신장애 또는 점검 중입니다.', dark: true }
  ];
  var range = function (r) { return r ? (r[1] === null ? r[0] + ' 이상' : r[0] + ' – ' + r[1]) : '데이터 없음'; };

  /* ---------- Color: 상태 밴드 ---------- */
  var band = $('#eds-band');
  band.innerHTML = GRADES.map(function (g, i) {
    return '<article class="eds-band-col' + (i === 1 ? ' is-open' : '') + '" style="--c:' + g.hex + (g.dark ? ';--on:#111111' : '') + '"' + (g.dark ? ' data-dark' : '') + ' tabindex="0">' +
      '<div class="eds-band-top"><div class="eds-band-name">' + g.ko + '<small>' + g.en + '</small></div>' +
      '<img class="eds-band-face" alt="" src="' + IMG + 'air/' + g.face + '.png"></div>' +
      '<div class="eds-band-bottom"><div class="eds-ranges">' +
        (g.pm10 ? '<span><b>PM10</b>' + range(g.pm10) + '</span><span><b>PM2.5</b>' + range(g.pm25) + '</span>'
                : '<span>수신장애 · 점검중</span><span>값 대신 “-” 표시</span>') +
      '</div><button type="button" class="eds-copy" data-copy="' + g.hex + '">' + g.hex + '</button></div></article>';
  }).join('');
  function openCol(col) { $$('.eds-band-col', band).forEach(function (c) { c.classList.toggle('is-open', c === col); }); }
  $$('.eds-band-col', band).forEach(function (col) {
    col.addEventListener('mouseenter', function () { openCol(col); });
    col.addEventListener('focusin', function () { openCol(col); });
  });

  /* ---------- 컬러 코드 복사 ---------- */
  var toast = $('.eds-toast'), toastT;
  function showToast(msg) { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 1600); }
  function selectText(el) { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var v = b.dataset.copy;
    var fail = function () { selectText(b); showToast('선택됨 · Ctrl+C로 복사하세요'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(function () { showToast(v + ' 복사됨'); }, fail);
    } else { fail(); }
  });

  /* ---------- Typography: 굵기 전환 ---------- */
  var NOTES = { 300: 'Light 300 · 날씨 큰 숫자', 500: 'Medium 500 · 날짜, 보조 라벨', 700: 'Bold 700 · 수치, 항목명, 헤더' };
  $$('.eds-weights button').forEach(function (b) {
    b.addEventListener('click', function () {
      var glyph = $('.eds-glyph-big');
      $$('.eds-weights button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      glyph.classList.add('is-swap');
      setTimeout(function () { glyph.style.fontWeight = b.dataset.w; $('.eds-glyph-note').textContent = NOTES[b.dataset.w]; glyph.classList.remove('is-swap'); }, reduce ? 0 : 220);
    });
  });

  /* ---------- Typography: 타입 스케일 ---------- */
  var SCALE = [
    { role: '날씨 수치',        tok: 'weather-value', vw: 6.25,   w: 300, s: '15mm' },
    { role: '헤더 기관명',      tok: 'header-title',  vw: 2.39,   w: 700, s: '갈매사회복지관 - 실내 대기환경정보' },
    { role: '대기 수치',        tok: 'air-value',     vw: 2.1875, w: 700, s: '10㎍/㎥' },
    { role: '날짜·시간',        tok: 'header-date',   vw: 2.083,  w: 500, s: '08월 10일 오후 03:55' },
    { role: '원형 그래프 수치', tok: 'graph-value',   vw: 2.0,    w: 700, s: '0.03ppm' },
    { role: '섹션 타이틀',      tok: 'section-title', vw: 1.666,  w: 700, s: '실외 정보' },
    { role: '날씨 라벨',        tok: 'weather-label', vw: 1.666,  w: 500, s: '강우/적설량' },
    { role: '항목명',           tok: 'item-label',    vw: 1.5625, w: 700, s: '초미세먼지 농도' },
    { role: '범례 pill',        tok: 'legend',        vw: 1.302,  w: 700, s: 'PM10' },
    { role: '실내 측정 목록',   tok: 'room-list',     vw: 1.302,  w: 500, s: '예쁜둥지반  10㎍/㎥' },
    { role: '보조 태그',        tok: 'tag',           vw: 1.25,   w: 500, s: '날씨정보' },
    { role: '범례 아래첨자',    tok: 'legend-sub',    vw: 0.781,  w: 700, s: '2.5' }
  ];
  var WN = { 300: 'Light', 500: 'Medium', 700: 'Bold' };
  var scaleEl = $('#eds-scale'), res = 1920;
  function px(vw) { return (Math.round(vw * res / 100 * 10) / 10).toString(); }
  scaleEl.innerHTML = SCALE.map(function (r) {
    return '<tr style="--vw:' + r.vw + '"><td class="role">' + r.role + '<small>' + r.tok + '</small></td>' +
      '<td class="num">' + r.vw + 'vw</td><td class="px"><b>' + px(r.vw) + '</b>px</td>' +
      '<td class="num">' + WN[r.w] + ' ' + r.w + '</td><td class="bar"><i></i></td>' +
      '<td class="sample" style="font-weight:' + r.w + '">' + r.s + '</td></tr>';
  }).join('');
  $$('[data-res]').forEach(function (b) {
    b.addEventListener('click', function () {
      res = +b.dataset.res;
      $$('[data-res]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('tr', scaleEl).forEach(function (tr, i) {
        var cell = $('.px', tr), num = $('b', cell), target = +px(SCALE[i].vw), from = +num.textContent, t0 = null;
        cell.classList.add('is-flash');
        function step(t) {
          if (!t0) t0 = t;
          var k = reduce ? 1 : Math.min((t - t0) / 500, 1), e = 1 - Math.pow(1 - k, 3);
          num.textContent = (Math.round((from + (target - from) * e) * 10) / 10).toString();
          if (k < 1) requestAnimationFrame(step); else setTimeout(function () { cell.classList.remove('is-flash'); }, 300);
        }
        requestAnimationFrame(step);
      });
    });
  });

  /* ---------- Graph: 링 게이지 ---------- */
  var P = {
    pm10: { max: 200, unit: '㎍/㎥', lg: 'PM<small>10</small>',  full: 151, key: 'pm10', val: 46 },
    pm25: { max: 100, unit: '㎍/㎥', lg: 'PM<small>2.5</small>', full: 76,  key: 'pm25', val: 24 }
  };
  var pol = P.pm10;
  var arc = $('.eds-gauge .arc'), C = 2 * Math.PI * 148, armed = !('IntersectionObserver' in window) || reduce;
  arc.style.strokeDasharray = C; arc.style.strokeDashoffset = C;
  var gRange = $('#eds-range');
  function gradeOf(v) {
    for (var i = 0; i < 4; i++) { var r = GRADES[i][pol.key]; if (r[1] === null || v <= r[1]) return i; }
    return 3;
  }
  function renderGauge() {
    var v = +gRange.value, i = gradeOf(v), g = GRADES[i];
    $('.eds-gauge-stage').style.setProperty('--st', g.hex);
    if (armed) arc.style.strokeDashoffset = C * (1 - Math.min(v / pol.full, 1));
    $('.eds-gauge-text .v').innerHTML = v + '<small>' + pol.unit + '</small>';
    $('.eds-gauge-text .lg').innerHTML = pol.lg;
    $('#eds-range-out').textContent = v + ' ' + pol.unit;
    var face = $('.eds-grade img'), src = IMG + 'air/' + g.face + '.png';
    if (face.getAttribute('src') !== src) face.setAttribute('src', src);
    $('.eds-grade strong').textContent = g.ko;
    $('.eds-grade p').textContent = g.desc;
    $('.eds-thresh tbody').innerHTML = GRADES.slice(0, 4).map(function (gg, n) {
      return '<tr' + (n === i ? ' class="is-on"' : '') + '><td><i style="--c:' + gg.hex + '"></i>' + gg.ko + '</td><td>' + range(gg[pol.key]) + '</td></tr>';
    }).join('');
  }
  gRange.addEventListener('input', function () { pol.val = +gRange.value; renderGauge(); });
  $$('[data-p]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-p]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      pol = P[b.dataset.p]; gRange.max = pol.max; gRange.value = pol.val; renderGauge();
    });
  });
  renderGauge();
  // 화면에 들어올 때 링이 0에서 차오르도록
  if (!armed) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { armed = true; renderGauge(); io.disconnect(); }
    }, { threshold: .4 });
    io.observe($('.eds-gauge-stage'));
  }

  /* ---------- Graph: 에셋 목록 ---------- */
  function tiles(el, cls, list) {
    el.innerHTML = list.map(function (t) {
      return '<figure class="eds-asset ' + cls + '"><img alt="" src="' + IMG + t.src + '"><figcaption>' + t.name + '</figcaption></figure>';
    }).join('');
  }
  tiles($('#eds-rings'), 'is-ring', [
    { src: 'chart/chart.png', name: '점검중' }, { src: 'chart/chart-b.png', name: '좋음' }, { src: 'chart/chart-g.png', name: '보통' },
    { src: 'chart/chart-y.png', name: '나쁨' }, { src: 'chart/chart-r.png', name: '매우나쁨' }
  ]);
  tiles($('#eds-faces'), 'is-face', [
    { src: 'air/air_blue.png', name: '좋음' }, { src: 'air/air_green.png', name: '보통' }, { src: 'air/air_yellow.png', name: '나쁨' },
    { src: 'air/air_red.png', name: '매우나쁨' }, { src: 'air/air_gray.png', name: '수신장애' }
  ]);
  tiles($('#eds-skies'), 'is-sky', [
    { src: 'weather/SKY_01.png', name: '맑음' }, { src: 'weather/SKY_02.png', name: '구름많음' }, { src: 'weather/SKY_03.png', name: '흐림' },
    { src: 'weather/SKY_04.png', name: '비' }, { src: 'weather/SKY_05.png', name: '눈' }
  ]);

  /* ---------- 범례 pill ---------- */
  var LG = [['미세먼지', 'PM<small>10</small>'], ['초미세먼지', 'PM<small>2.5</small>'], ['오존', 'O<small>3</small>'], ['이산화탄소', 'CO<small>2</small>']];
  $('#eds-pill-board').innerHTML = LG.map(function (l) {
    return '<div class="eds-pill-row"><span>' + l[0] + '</span>' + GRADES.map(function (g) {
      return '<span class="eds-lg" style="--c:' + g.hex + '">' + l[1] + '</span>';
    }).join('') + '</div>';
  }).join('');
});
