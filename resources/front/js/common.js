function logout(){
	document.location.href="/auth/logout";
}

function calender(objId){
	 $(objId).datepicker({
	    	dateFormat: 'yy.mm.dd',
	        //showOn: "both", // 버튼과 텍스트 필드 모두 캘린더를 보여준다.
	        //buttonImage: "/application/db/jquery/images/calendar.gif", // 버튼 이미지
	        //buttonImageOnly: true, // 버튼에 있는 이미지만 표시한다.
	        showButtonPanel: true, // 캘린더 하단에 버튼 패널을 표시한다. 
	        currentText: '오늘 날짜' , // 오늘 날짜로 이동하는 버튼 패널
	        closeText: '닫기',  // 닫기 버튼 패널
	        changeYear: true, // 년을 바꿀 수 있는 셀렉트 박스를 표시한다.
	        changeMonth: true, // 월을 바꿀수 있는 셀렉트 박스를 표시한다.
	        yearRange: 'c-100:c+50', // 년도 선택 셀렉트박스를 현재 년도에서 이전, 이후로 얼마의 범위를 표시할것인가.
	        minDate: '-100y', // 현재날짜로부터 100년이전까지 년을 표시한다.
	        showAnim: "slide", //애니메이션을 적용한다.
	         prevText: '이전 달',
	         nextText: '다음 달',
	         monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
	         monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
	         dayNames: ['일', '월', '화', '수', '목', '금', '토'],
	         dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
	         dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
	         showMonthAfterYear: true,
	         showOtherMonths: true,
	         selectOtherMonths: true,
	         autoSize: true,
	         yearSuffix: '년'      
	    });
	
}


function isEmpty(value){
	if( value == null || typeof value == 'undefined' || value.trim().length < 1 || value == '&nbsp;' || value == '<p>&nbsp;</p>'){
		return true
	}
//	console.log("isEmpty value :   " + value);
	return false;
}	


function isRegExp(str){
    //특수문자 검증 start
	//  var str = "2011-12-27";
	//    var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
  
   var regExp = /[<>&\"]/gi;
   
   if(regExp.test(str)){
        //특수문자 제거
        //var t = str.replace(regExp, "")
        //alert("특수문자를 제거했습니다. ==>" + t);
	   //console.log('--- <>&" 특수문자가 존재 합니다.');
      return true;
    }else{
       // alert("정상적인 문자입니다. ==>" + str);
       //console.log('--- 정상적인 문자 입니다. ');
       return false;
    }
    //특수문자 검증 end
}


// upload file 확장명 체크 
function checkFile(obj) {
	var fileName = obj;
	var fileLen = fileName.length;
	var lastDot = fileName.lastIndexOf(".");
	
	var fileExt = fileName.substring(lastDot, fileLen).toLowerCase();
	
	console.log("fileExt : ", fileExt);
	
	if (fileExt != "" && fileExt != ".jpg" && fileExt != ".jpeg" && fileExt != ".png" && fileExt != ".pdf" && fileExt != ".zip"){
	    alert("JPG, PNG, PDF, ZIP 파일만 등록 가능합니다.");
	    return false;
	}
	
	return true;
}
