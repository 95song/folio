window.addEventListener("load", function (event) {
    //스와이프
    const swiper = new Swiper('.swiper', {
        // Optional parameters
        direction: 'vertical',
        loop: true,
        autoplay: {
            delay: 3000, // 3초마다 자동으로 넘김
            disableOnInteraction: false, // 터치·드래그 후에도 자동 넘김 유지
        },
    });

});
