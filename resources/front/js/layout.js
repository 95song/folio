$(document).ready(function(){
//	$("#load").fakeLoader({ //페이지 로딩
//		bgColor:"#fff", // 배경색
//    timeToHide:000, // 로딩중에 걸리는 시간, 1000은 1초
//  });
	
	$("#load").delay(500).fadeOut();
	
	$(document).on('mouseover', '.header_wrap nav li a', function () { //최상단 1차 대메뉴에 마우스를 올리면 2차 메뉴가 슬라이드 다운됨.
		$(".header_wrap").removeClass("active");
		$(".header-sub ul").removeClass("active");
		var openid = $(this).attr("data-id");
		$("."+openid).addClass("active");
		$(".header_wrap").addClass("active");
		//alert(openid);
		//var opennow = $(".header_wrap").attr("data-id");
	});
	$(document).on('mouseover', '.intro,.bars-sitemap,.contents', function () { //최상단 1차 대메뉴에 마우스를 올리면 2차 메뉴가 슬라이드 다운됨.
		$(".header_wrap").removeClass("active");
		$(".header-sub ul").removeClass("active");
		
	});
	
	
	$(".bars-sitemap").click(function() { //최상단 오른쪽 bars(전체메뉴/사이트맵) 메뉴
		if ( $(".bars-sitemap").attr("data-id") == "close" ){
			$(".header_wrap").addClass("sitemap-on");
			$(".sitemap").fadeIn();
			$(".bars-sitemap").addClass("sitemap-on").attr("data-id","open");
			$("body").css("overflow","hidden");
		};
	});	
	$(".bars-sitemap-close").click(function() { //최상단 오른쪽 bars(전체메뉴/사이트맵) 메뉴
		if ( $(".bars-sitemap").attr("data-id") == "open" ){
			$(".header_wrap").removeClass("sitemap-on");
			$(".sitemap").fadeOut();
			$(".bars-sitemap").removeClass("sitemap-on").attr("data-id","close");
			$("body").css("overflow","auto");
		};
	});	
	
	$(".sitemap .bars-sitemap").click(function() { //최상단 오른쪽 bars(전체메뉴/사이트맵) 메뉴
	//	if ( $(".bars-sitemap").attr("data-id") == "open" ){
	//		$(".sitemap").removeClass("active");
	//		$(".total-bg-black").fadeOut();
	//		$(".bars-sitemap").removeClass("active").attr("data-id","close");
	//	};
	});	
	
	$(".total-bg-black").mouseover(function() { //메뉴혹은 사이트맵이 열렸을때 덮혀있는 검은색 영역에 마우스를 대면 모두 닫힘
	//	if ( $(".bars-sitemap").attr("data-id") != "open" ){
	//		$(".total-bg-black").hide();
	//		$('.gnb-depth-2').slideUp(100);
	//		$(".sub").attr("data-id","");
	//		$(".sub-line,.gnb-depth-1 li").removeClass("on");
	//	}
	});
    
    $(".family").click(function() { //최상단 오른쪽 bars(전체메뉴/사이트맵) 메뉴
		if ( $(".family").attr("data-id") == "close" ){
			$(".header_wrap").addClass("family_list");
			$(".family_list").fadeIn();
			$(".family").addClass("family_list").attr("data-id","open");
		};
	});	
	$(".bars-sitemap-close").click(function() { //최상단 오른쪽 bars(전체메뉴/사이트맵) 메뉴
		if ( $(".bars-sitemap").attr("data-id") == "open" ){
			$(".header_wrap").removeClass("sitemap-on");
			$(".sitemap").fadeOut();
			$(".bars-sitemap").removeClass("sitemap-on").attr("data-id","close");
		};
	});	
	
	$(window).scroll(function() {
		var scroll = $(window).scrollTop();
		if (scroll >= 1) {
			$(".header_wrap").addClass("nav")
		} else {
			$(".header_wrap").removeClass("nav")
		}
	});
	
	
	$(window).scroll(function() {
		var scroll = $(window).scrollTop();
		if (scroll >= 440) {
			$(".location").addClass("fixed")
		} else {
			$(".location").removeClass("fixed")
		}
	});
	


	$(".top a").click(function() { 
		$('body, html').stop();
		$('body, html').animate({ scrollTop: ($($(this).attr("href")).offset().top - (($(this).attr("href") == "warp")?0:0)) }, "slow");
		return false;
	});
	
	$('#myModal').on('shown.bs.modal', function () {
		  $('#myInput').focus()
	});
});
	

$(document).ready(function() {
	
	
	//서브페이지 상단 이미지 스크립트
	$(".sub-page .img").delay(1000).queue(function(){$(this).addClass("active")});
	
	
	$(".select-div a.active").attr("href","#");
	$(".location .span.select").mouseover(function() {
  	var selectID = $(this).attr("id");
		$("."+selectID).addClass("on");
		$(".select-div a.active").attr("href","#");
 	});
	$(".location .span.select").mouseout(function() {
  	var selectID = $(this).attr("id");
		$("."+selectID).removeClass("on");
 	});
    

});

document.addEventListener("DOMContentLoaded", function() {
    // pageTitle과 menuTitle을 가져오기
    var pageTitle = document.getElementById("pageTitle").textContent.trim();
    var menuTitle = document.getElementById("menuTitle").textContent.trim();

    // 모든 select-div를 가진 div들에 대해 순회
    document.querySelectorAll("[id^='select-div-']").forEach(function(selectDiv) {
        var links = Array.from(selectDiv.querySelectorAll("a"));

        // pageTitle과 일치하는 항목 찾기
        if (selectDiv.id === "select-div-1") {
            var pageLink = links.find(link => link.textContent.trim() === pageTitle);
            if (pageLink) {
                selectDiv.querySelector(".select-div").prepend(pageLink);
            }
        }

        // menuTitle과 일치하는 항목 찾기
        else {
            var menuLink = links.find(link => link.textContent.trim() === menuTitle);
            if (menuLink) {
                selectDiv.querySelector(".select-div").prepend(menuLink);
            }
        }
    });
});
