/**
 * 커스텀 셀렉트
 * .field 안의 <select>를 찾아 버튼 + 목록(ul) UI로 바꾼다.
 * 값은 원본 <select>에 그대로 반영되므로 form 전송은 기존과 같다.
 */
document.querySelectorAll('.field > select').forEach((select) => {
  const box = select.parentElement;
  box.classList.add('select-box');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const list = document.createElement('ul');
  list.className = 'select-list';
  list.setAttribute('role', 'listbox');

  [...select.options].forEach((option, index) => {
    const item = document.createElement('li');
    item.className = 'select-option';
    item.setAttribute('role', 'option');
    item.textContent = option.textContent;
    item.addEventListener('click', () => {
      select.selectedIndex = index;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      render();
      close();
      trigger.focus();
    });
    list.appendChild(item);
  });

  box.append(trigger, list);

  const items = [...list.children];
  let focusIndex = -1;

  // 선택된 항목은 목록에서 숨기고 버튼에 표시
  function render() {
    trigger.textContent = select.options[select.selectedIndex].textContent;
    items.forEach((item, i) => {
      const selected = i === select.selectedIndex;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-selected', selected);
    });
  }

  function open() {
    document.querySelectorAll('.select-box.is-active').forEach((other) => {
      if (other !== box) other.dispatchEvent(new Event('select:close'));
    });
    box.classList.add('is-active');
    trigger.setAttribute('aria-expanded', 'true');
    // 선택 항목 바로 다음 항목이 목록 맨 위에 오도록 스크롤
    const next = items.slice(select.selectedIndex + 1).find((item) => !item.classList.contains('is-selected'));
    list.scrollTop = next ? next.offsetTop : list.scrollHeight;
    focusIndex = -1;
  }

  function close() {
    box.classList.remove('is-active');
    trigger.setAttribute('aria-expanded', 'false');
    items.forEach((item) => item.classList.remove('is-focus'));
  }

  function moveFocus(step) {
    const visible = items.filter((item) => !item.classList.contains('is-selected'));
    if (!visible.length) return;
    const current = visible.indexOf(items[focusIndex]);
    const target = visible[(current + step + visible.length) % visible.length];
    items.forEach((item) => item.classList.remove('is-focus'));
    target.classList.add('is-focus');
    target.scrollIntoView({ block: 'nearest' });
    focusIndex = items.indexOf(target);
  }

  trigger.addEventListener('click', () => {
    box.classList.contains('is-active') ? close() : open();
  });

  trigger.addEventListener('keydown', (e) => {
    const isOpen = box.classList.contains('is-active');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) open();
      moveFocus(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' && isOpen && focusIndex > -1) {
      e.preventDefault();
      items[focusIndex].click();
    } else if (e.key === 'Escape') {
      close();
    }
  });

  box.addEventListener('select:close', close);
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) close();
  });

  render();
});
