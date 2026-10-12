window.addEventListener("load", function (event) {
    // 원형 그래프 SVG 삽입 (Swiper loop가 슬라이드를 복제하기 전에 넣어야 복제본에도 들어감)
    // core: 안쪽 원 / track: core에 붙은 회색 링 / arc: 트랙 바깥 테두리에 걸친 등급 선
    const graphSvg =
        '<svg class="air-graph-svg" viewBox="0 0 320 320" aria-hidden="true">' +
        '<circle class="track" cx="160" cy="160" r="133"></circle>' +
        '<circle class="arc" cx="160" cy="160" r="148" pathLength="100"></circle>' +
        '<circle class="core" cx="160" cy="160" r="118"></circle>' +
        '</svg>';
    document.querySelectorAll('.air-graph').forEach(function (graph) {
        graph.insertAdjacentHTML('afterbegin', graphSvg);
    });

    // 현재 보이는 슬라이드의 그래프 선을 처음부터 다시 그림
    function drawGraphs(swiper) {
        swiper.slides.forEach(function (slide) {
            slide.classList.remove('is-drawing');
        });
        const active = swiper.slides[swiper.activeIndex];
        if (!active) return;
        void active.offsetWidth; // 애니메이션 재시작
        active.classList.add('is-drawing');
    }

    //스와이프
    const swiper = new Swiper('.swiper', {
        // Optional parameters
        direction: 'vertical',
        loop: true,
        autoplay: {
            delay: 3000, // 3초마다 자동으로 넘김
            disableOnInteraction: false, // 터치·드래그 후에도 자동 넘김 유지
        },
        on: {
            afterInit: drawGraphs,
            slideChangeTransitionStart: drawGraphs,
        },
    });

});
