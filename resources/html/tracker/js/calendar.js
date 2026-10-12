/**
 * 캘린더
 * [data-calendar] 안의 input을 누르면 .calendar 박스가 열린다.
 * - 기본(기간): 첫 클릭 = 시작일, 두 번째 클릭 = 종료일 (시작일보다 앞이면 서로 바꿈)
 * - data-calendar="single": 날짜 하나를 고르면 바로 닫힘 (생년월일 등)
 */
const WEEKS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n) => String(n).padStart(2, '0');
const format = (d) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
const sameDay = (a, b) => a && b && a.getTime() === b.getTime();
const parse = (text) => {
  const m = /(\d{4})\.(\d{2})\.(\d{2})/.exec(text || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

document.querySelectorAll('[data-calendar]').forEach((wrap) => {
  const input = wrap.querySelector('input');
  const box = wrap.querySelector('.calendar');
  const single = wrap.dataset.calendar === 'single';
  let start = parse(input.value);
  let end = null;

  // 값이 없으면 placeholder 날짜(예: 생년월일) 또는 오늘이 있는 달로 연다
  const base = start || parse(input.placeholder) || new Date();
  let view = new Date(base.getFullYear(), base.getMonth(), 1);

  function render() {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const rows = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7);

    let html = `
      <div class="cal-head">
        <strong class="cal-title">${year}.${pad(month + 1)}</strong>
        <div class="cal-nav">
          <button class="cal-prev" type="button" aria-label="이전 달"></button>
          <button class="cal-next" type="button" aria-label="다음 달"></button>
        </div>
      </div>
      <div class="cal-grid">`;
    html += WEEKS.map((w) => `<span class="cal-week">${w}</span>`).join('');

    for (let i = 0; i < rows * 7; i++) {
      const date = new Date(year, month, 1 - first.getDay() + i);
      const cls = ['cal-day'];
      if (date.getMonth() !== month) cls.push('is-other');
      if (sameDay(date, start)) cls.push('is-start');
      if (start && end) cls.push('has-end');
      if (sameDay(date, end)) cls.push('is-end');
      if (start && end && date > start && date < end) cls.push('in-range');
      html += `<button class="${cls.join(' ')}" type="button" data-time="${date.getTime()}"><span>${date.getDate()}</span></button>`;
    }
    box.innerHTML = html + '</div>';
  }

  function updateInput() {
    if (!start) input.value = '';
    else input.value = end ? `${format(start)} ~ ${format(end)}` : format(start);
  }

  box.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('.cal-prev')) view.setMonth(view.getMonth() - 1);
    else if (e.target.closest('.cal-next')) view.setMonth(view.getMonth() + 1);
    else {
      const day = e.target.closest('.cal-day');
      if (!day) return;
      const date = new Date(Number(day.dataset.time));
      if (single) {
        start = date;
        wrap.classList.remove('is-active');
      } else if (!start || end) {
        start = date;
        end = null;
      } else if (date < start) {
        end = start;
        start = date;
      } else {
        end = date;
      }
      // 이전/다음 달 날짜를 누르면 그 달로 이동
      if (date.getMonth() !== view.getMonth()) view = new Date(date.getFullYear(), date.getMonth(), 1);
      updateInput();
    }
    render();
  });

  function open() {
    if (wrap.classList.contains('is-active')) return;
    wrap.classList.add('is-active');
    render();
    // 아래 공간(하단 탭바 제외)이 부족하면 위로 연다
    wrap.classList.remove('is-up');
    const tabBar = document.querySelector('.tab-bar');
    const limit = tabBar ? tabBar.getBoundingClientRect().top : window.innerHeight;
    if (box.getBoundingClientRect().bottom > limit) wrap.classList.add('is-up');
  }

  // 닫을 때 입력 중이던 불완전한 값은 마지막으로 확정된 날짜로 되돌린다
  function close() {
    if (!wrap.classList.contains('is-active')) return;
    wrap.classList.remove('is-active');
    updateInput();
  }

  /* ---------- 직접 입력: 숫자만 받고 . 과 ~ 는 자동 입력 ---------- */
  const maxDigits = single ? 8 : 16;
  input.readOnly = false;
  input.inputMode = 'numeric';
  let prevDigits = '';

  function formatDigits(digits) {
    const one = (d) => [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('.');
    if (digits.length <= 8) {
      // 구분자 자리까지 치면(예: 2026) . 이 바로 붙도록
      const text = one(digits);
      if (digits.length === 4 || digits.length === 6) return text + '.';
      if (!single && digits.length === 8) return text + ' ~ ';
      return text;
    }
    const rest = one(digits.slice(8));
    const tail = digits.length === 12 || digits.length === 14 ? '.' : '';
    return `${one(digits.slice(0, 8))} ~ ${rest}${tail}`;
  }

  function toDate(digits) {
    if (digits.length !== 8) return null;
    const y = Number(digits.slice(0, 4));
    const m = Number(digits.slice(4, 6)) - 1;
    const d = Number(digits.slice(6, 8));
    const date = new Date(y, m, d);
    // 2026.13.40 같은 없는 날짜는 무시
    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
  }

  input.addEventListener('input', (e) => {
    let digits = input.value.replace(/\D/g, '').slice(0, maxDigits);
    // 자동으로 붙은 . 이나 ~ 를 지우면 그 앞 숫자까지 지운다
    if (e.inputType && e.inputType.startsWith('delete') && digits === prevDigits) {
      digits = digits.slice(0, -1);
    }
    input.value = formatDigits(digits);
    prevDigits = digits;
    open();

    const first = toDate(digits.slice(0, 8));
    const second = single ? null : toDate(digits.slice(8, 16));
    if (!first) return;
    start = first;
    end = null;
    if (second) {
      if (second < first) {
        start = second;
        end = first;
      } else if (second > first) {
        end = second;
      }
    }
    const shown = second || first;
    view = new Date(shown.getFullYear(), shown.getMonth(), 1);
    render();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      close();
      input.blur();
    }
  });

  // 입력칸을 누르면 열기, 달력 아이콘을 누르면 열고 닫기
  wrap.addEventListener('click', (e) => {
    if (box.contains(e.target)) return;
    if (e.target === input) open();
    else if (wrap.classList.contains('is-active')) close();
    else {
      open();
      input.focus();
    }
  });
  input.addEventListener('focus', open);

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
});
