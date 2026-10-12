/**
 * 확인 팝업 (취소 / 확인)
 * - <form data-confirm="#팝업id" data-confirm-next="./이동할화면.html"> 를 제출하면 바로 보내지 않고 팝업을 띄운다.
 * - 취소 · Esc · 바깥(어두운 영역) 클릭: 팝업을 닫고 누른 버튼으로 포커스를 되돌린다.
 * - 확인: data-confirm-next 화면으로 이동한다.
 */
(function () {
  document.querySelectorAll('form[data-confirm]').forEach((form) => {
    const pop = document.querySelector(form.dataset.confirm);
    if (!pop) return;
    const ok = pop.querySelector('.popup-button:not(.cancel)');
    const cancel = pop.querySelector('.popup-button.cancel');
    let lastFocus = null;

    function open(trigger) {
      lastFocus = trigger || document.activeElement;
      pop.classList.add('is-active');
      ok.focus();
    }
    function close() {
      pop.classList.remove('is-active');
      if (lastFocus) lastFocus.focus();
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      open(e.submitter);
    });
    cancel.addEventListener('click', close);
    ok.addEventListener('click', () => {
      if (form.dataset.confirmNext) location.href = form.dataset.confirmNext;
      else close();
    });
    pop.addEventListener('click', (e) => {
      if (e.target === pop) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pop.classList.contains('is-active')) close();
    });
  });
})();
