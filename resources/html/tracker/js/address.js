/**
 * 주소 검색 (카카오 우편번호 서비스)
 * - [data-address] 칸이나 [data-address-search="#칸id"] 버튼을 누르면 전체 화면 검색 레이어가 열린다.
 * - 주소를 고르면 칸에 도로명 주소를 넣고, data-address-detail 로 지정한 칸(상세주소)으로 커서를 옮긴다.
 * - 스크립트를 못 불러오면(인터넷 끊김 등) 주소 칸의 readonly 를 풀어 직접 입력하게 한다.
 */
(function () {
  const SDK = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  const fields = document.querySelectorAll('[data-address]');
  if (!fields.length) return;

  /* ---------- 검색 레이어 (Tracker 상단 제목줄 + 검색 영역) ---------- */
  const layer = document.createElement('div');
  layer.className = 'address-layer';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'addressLayerTitle');
  layer.innerHTML = `
    <section class="top-section">
      <div class="top-title">
        <div class="spacer-24"></div>
        <h2 class="title-b" id="addressLayerTitle">주소 검색</h2>
        <button class="icon-close" type="button" aria-label="닫기"><img src="./public/icon-close.svg" alt="" /></button>
      </div>
    </section>
    <div class="address-embed"></div>`;
  document.body.appendChild(layer);
  const embed = layer.querySelector('.address-embed');
  let lastFocus = null;

  // 카카오 화면은 숨기기만 하고, 비우는 것은 다음에 열 때 한다
  // (카카오 콜백 안에서 바로 비우면 카카오가 자기 요소를 지우다 오류를 낸다)
  function close() {
    layer.classList.remove('is-active');
    if (lastFocus) lastFocus.focus();
  }
  layer.querySelector('.icon-close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && layer.classList.contains('is-active')) close();
  });

  /* ---------- 카카오 스크립트 불러오기 (한 번만) ---------- */
  let sdk = null;
  function loadSdk() {
    if (window.daum && window.daum.Postcode) return Promise.resolve();
    if (!sdk) {
      sdk = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SDK;
        s.onload = () => (window.daum && window.daum.Postcode ? resolve() : reject());
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return sdk;
  }

  // 불러오지 못하면 직접 입력으로 전환
  function fallbackToTyping() {
    fields.forEach((f) => {
      f.readOnly = false;
      f.placeholder = '주소를 입력해 주세요';
    });
    document.querySelectorAll('[data-address-search]').forEach((b) => (b.hidden = true));
  }

  /* ---------- 열기 ---------- */
  function open(input) {
    lastFocus = input;
    loadSdk()
      .then(() => {
        embed.innerHTML = '';
        layer.classList.add('is-active');
        new window.daum.Postcode({
          width: '100%',
          height: '100%',
          animation: false,
          oncomplete(data) {
            // 도로명 주소 우선, 없으면 지번 주소. 건물명이 있으면 괄호로 덧붙인다.
            let address = data.roadAddress || data.jibunAddress;
            if (data.buildingName && data.apartment === 'Y') address += ` (${data.buildingName})`;
            input.value = address;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            layer.classList.remove('is-active');
            const detail = document.querySelector(input.dataset.addressDetail);
            (detail || input).focus();
          },
        }).embed(embed);
      })
      .catch(() => {
        fallbackToTyping();
        input.focus();
      });
  }

  fields.forEach((f) => {
    f.addEventListener('click', () => { if (f.readOnly) open(f); });
    f.addEventListener('keydown', (e) => {
      if (f.readOnly && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(f); }
    });
  });
  document.querySelectorAll('[data-address-search]').forEach((btn) => {
    const target = document.querySelector(btn.dataset.addressSearch);
    if (target) btn.addEventListener('click', () => open(target));
  });

  // HTML 을 더블클릭(file://)으로 열면 카카오 검색 창은 열리지만,
  // 고른 주소를 돌려주는 통신(postMessage)이 막혀 칸에 주소가 들어오지 않는다.
  // 이때는 검색 대신 직접 입력으로 바꿔 둔다. (Live Server 등 http 로 열면 정상 동작)
  if (location.protocol === 'file:') {
    fallbackToTyping();
    console.warn('[address.js] file:// 로 열려 카카오 주소 검색을 쓸 수 없어 직접 입력으로 전환했습니다. http 서버로 열어 주세요.');
    return;
  }

  // 미리 불러와 두면 처음 누를 때 더 빨리 열린다 (실패하면 바로 직접 입력으로 전환)
  loadSdk().catch(fallbackToTyping);
})();
