// 그래프 페이지: 디자인 가이드(design-system.html)의 도넛·막대 그래프를 앱 화면용으로 옮김
(() => {
  const STAGES = [
    { name: '좋음', color: 'var(--color-good)' },
    { name: '보통', color: 'var(--color-normal)' },
    { name: '나쁨', color: 'var(--color-bad)' },
    { name: '매우나쁨', color: 'var(--color-verybad)' },
  ];
  // 예시 데이터 (00시 ~ 23시, ㎍/㎥): 새벽은 좋음, 출퇴근 시간대(09–10시 · 17–19시)는 매우나쁨까지 오른다
  const hourly = [22, 19, 17, 14, 12, 13, 21, 34, 58, 79, 84, 71, 52, 44, 38, 41, 56, 77, 92, 86, 63, 45, 31, 26];
  // 환경부 초미세먼지 기준 (홈 화면 · 가이드와 동일): 0–15 좋음 · 16–35 보통 · 36–75 나쁨 · 76+ 매우나쁨
  const stageOf = v => (v <= 15 ? 0 : v <= 35 ? 1 : v <= 75 ? 2 : 3);

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  document.getElementById('avgValue').textContent = Math.round(hourly.reduce((a, b) => a + b, 0) / hourly.length);

  /* ---------- 도넛: 단계별 머문 시간 */
  (() => {
    const svg = document.getElementById('donut');
    const legend = document.getElementById('donutLegend');
    const counts = [0, 0, 0, 0];
    hourly.forEach(v => counts[stageOf(v)]++);

    const R = 74, C = 2 * Math.PI * R, gap = 3;
    el('circle', { cx: 100, cy: 100, r: R, fill: 'none', stroke: '#f1f5f8', 'stroke-width': 16 }, svg);
    let acc = 0;
    const segs = counts.map((n, i) => {
      const len = (n / hourly.length) * C;
      const seg = el('circle', {
        class: 'donut-seg', cx: 100, cy: 100, r: R, fill: 'none', 'stroke-width': 16,
        'stroke-dasharray': `${Math.max(0, len - gap)} ${C}`, 'stroke-dashoffset': C,
        transform: `rotate(${(acc / C) * 360 - 90} 100 100)`,
      }, svg);
      seg.style.stroke = STAGES[i].color;
      seg.style.transitionDelay = i * 0.15 + 's';
      acc += len;
      legend.insertAdjacentHTML('beforeend',
        `<div><dt><i style="background:${STAGES[i].color}"></i>${STAGES[i].name}</dt><dd>${n}시간</dd></div>`);
      return seg;
    });

    const t = el('text', { x: 100, y: 100, 'text-anchor': 'middle', 'font-family': 'GmarketSans, sans-serif' }, svg);
    t.innerHTML = `<tspan x="100" dy="6" style="font-size:40px;font-weight:700;fill:var(--text)">${hourly.length}</tspan>`
      + `<tspan x="100" dy="24" style="font-size:12px;fill:var(--text-sub)">시간</tspan>`;

    requestAnimationFrame(() => requestAnimationFrame(() => segs.forEach(s => s.setAttribute('stroke-dashoffset', 0))));
  })();

  /* ---------- 막대: 시간대별 (가로 스크롤, 세로축 고정) */
  (() => {
    const axis = document.getElementById('barAxis');
    const svg = document.getElementById('barChart');
    const card = document.getElementById('barCard');
    const tip = document.getElementById('barTip');

    const H = 260, pt = 36, ch = 177, max = 100;
    const pitch = 22, bw = 14, padR = 16;
    const W = hourly.length * pitch + padR;
    const yOf = v => pt + ch - (v / max) * ch;

    axis.setAttribute('viewBox', `0 0 44 ${H}`);
    axis.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    [0, 25, 50, 75, 100].forEach(v => {
      el('text', { x: 38, y: yOf(v) + 4, 'text-anchor': 'end' }, axis).textContent = v;
      el('line', { x1: 0, x2: W, y1: yOf(v), y2: yOf(v), 'stroke-dasharray': v ? '3 4' : '' }, svg);
    });
    [0, 6, 12, 18, 23].forEach(h => {
      el('text', { x: h * pitch + pitch / 2, y: pt + ch + 22, 'text-anchor': 'middle' }, svg).textContent = h + '시';
    });

    const g = el('g', { class: 'bars' }, svg);
    hourly.forEach((v, i) => {
      const x = i * pitch + (pitch - bw) / 2, y = yOf(v);
      const s = STAGES[stageOf(v)];
      const bar = el('path', { class: 'bar', d: `M${x} ${y + 3}q0-3 3-3h${bw - 6}q3 0 3 3V${pt + ch}H${x}z` }, g);
      bar.style.fill = s.color;
      bar.style.transitionDelay = i * 0.035 + 's';
      bar.addEventListener('mouseenter', () => {
        const r = svg.getBoundingClientRect(), c = card.getBoundingClientRect();
        tip.innerHTML = `<b>${v}</b>${i}시 · ${s.name}`;
        tip.style.left = r.left - c.left + x + bw / 2 + 'px';
        tip.style.top = r.top - c.top + y + 'px';
        tip.style.opacity = 1;
      });
      bar.addEventListener('mouseleave', () => (tip.style.opacity = 0));
    });

    // 카드가 화면에 들어올 때 한 번만 자라남
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      svg.classList.add('in');
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(card);
  })();
})();
