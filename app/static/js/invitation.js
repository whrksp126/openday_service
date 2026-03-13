// 글귀 멘트 추가
insertHTML('[data-type="message"]', message_templates_dict);

// 교통 수단 추가
transport_list.forEach((transport, index)=>{
  insertHTML(`[data-type="transport"][data-index="${index}"]`, transport);
})

// 방명록 추가
guestbook_list.forEach((guestbook, index)=>{
  insertHTML(`[data-type="guestbook"][data-index="${index}"]`, guestbook);
})

// 갤러리 이미지 슬라이더 만들기
var swiper = new Swiper(".gallery_swiper", {
  autoHeight: true,
  spaceBetween: 20,
  loop: true,
  zoom: true,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});
// 이미지 슬라이더 열기
const showImgSlider = (index) => {
  const slider = document.getElementById('gallery_slider_element');
  slider.classList.add('show');
  swiper.slideTo(index, 300);
  document.querySelector('body').style.overflow = 'hidden';


}
// 이미지 슬라이더 닫기
const closeImgSlider = () => {
  const slider = document.getElementById('gallery_slider_element');
  slider.classList.remove('show');
  document.querySelector('body').style.overflow = 'initial';
}
// 위도 경도 좌표 찍기
const lat_lng = wedding_schedule_dict.lat_lng
const mapOptions = {
  center: new naver.maps.LatLng(wedding_schedule_dict.lat, wedding_schedule_dict.lng), //지도의 초기 중심 좌표
  zoom: 16, //지도의 초기 줌 레벨
  minZoom: 7, //지도의 최소 줌 레벨
  zoomControl: false, //줌 컨트롤의 표시 여부
  zoomControlOptions: { //줌 컨트롤의 옵션
      position: naver.maps.Position.TOP_RIGHT
  }
};
const map = new naver.maps.Map('map', mapOptions);
new naver.maps.Marker({
  map: map,
  position: new naver.maps.LatLng(wedding_schedule_dict.lat, wedding_schedule_dict.lng)
})

// setOptions 메서드를 이용해 옵션을 조정할 수도 있습니다.
map.setOptions("mapTypeControl", false); // 지도 유형 컨트롤의 표시 여부
map.setOptions("scaleControl", false); // 지도 축척 컨트롤의 표시 여부입니다.
map.setOptions("mapDataControl", false); // 지도 데이터 저작권 컨트롤의 표시 여부입니다.




// 달력 시작

// 윤년 체크
function checkedLeapYear(year){
  if(year % 400 == 0) return true;
  else if(year % 100 == 0) return false;
  else if(year % 4 == 0) return true;
  else return false;
};

// 달의 시작일이 어떤 요일(몇 번째 위치)에서 시작하는지 계산
function getFirstDayOfWeek(year, month){
  if(month < 10) {
      month = "0" + month;
  };
  return (new Date(year + "-" + month + "-01" )).getDay();
};

// 월의 마지막 일자 계산
function changeYearMonth(year, month){
  let month_day = [31,28,31,30,31,30,31,31,30,31,30,31];
  if(month == 2) if(checkedLeapYear(year)) month_day[1] = 29;
  let first_day_of_week = getFirstDayOfWeek(year, month);
  let arr_calendar = [];
  for(let i=0; i<first_day_of_week; i++){
      arr_calendar.push('');
  };
  for(let i=1; i<=month_day[month-1]; i++){
      arr_calendar.push(String(i));
  };
  let remain_day = 7 - (arr_calendar.length % 7);
  if(remain_day < 7){
      for(let i=0; i<remain_day; i++){
          arr_calendar.push('');
      };
  };
  renderCalendar(arr_calendar)

};

function renderCalendar(data){
  let h = [];
  for(let i=0; i<data.length; i++){
      if(i==0){
          h.push('<tr>');
      }else if(i % 7 == 0){
          h.push('</tr>')
          h.push('<tr>');
      };
      h.push(`<td class="animation-box order-${i%7}" data-animation="slide-up">
          <div id="calendar_${current_year}_${current_month}_${data[i]}" style="position: relative;">
              ${data[i]}
          </div>
      </td>`);
  }
  h.push('</tr>');
  document.getElementById('tb_body').innerHTML = h.join('')
  // $("#tb_body").html(h.join(''));
}

function setDate(day){
  // document.querySelector('.current_day').classList.remove('current_day')
  let target_date = `calendar_${current_year}_${current_month}_${day}`
  document.getElementById(`${target_date}`).classList.add('current_day')
  // const el = document.querySelector('#parse_emotion_view');
  // const sheet = el.sheet;
  // const rules = sheet.cssRules;
  // const rule = rules[0];
  // sheet.insertRule('.current_day::after{content: "'+ day +'"; position: absolute; line-height: 29px; top: -1.5px; bottom: 0; margin: 0 auto; width: 32px; height: 32px; background: #FFE3DF; left: 0; border-radius: 50%;}', rules.length)
  // if(day<10){
  //     day = "0" + day;
  // }
  // console.log(current_year, current_month, day)

}

function changeMonth(diff) {
  current_month = current_month + diff;
  if(current_month == 0){
      current_year = current_year - 1;
      current_month = 12;
  }else if(current_month === 13){
      current_year = current_year + 1;
      current_month = 1;
  }
  loadCalendar(current_year, current_month)
}

function loadCalendar(year, month){
  changeYearMonth(year, month);
  document.getElementById('current_date').innerText = `${year}년  ${month}월`
  if(this_year === year && this_month === month){
      // setDate(this_date)
  }
  
}

let current_year = (new Date()).getFullYear();
let current_month = (new Date()).getMonth() + 1;
let current_date = (new Date()).getDate();

let this_year = (new Date()).getFullYear();
let this_month = (new Date()).getMonth() + 1;
let this_date = (new Date()).getDate();


const dateString = wedding_schedule_dict['date'];
const dateArray = dateString.split(/\D+/); // 정규표현식을 사용하여 숫자가 아닌 문자열을 분리하여 배열로 반환
loadCalendar(parseInt(dateArray[0]), parseInt(dateArray[1]))
setDate(parseInt(dateArray[2]))
// 달력 만들기 끝

// D-day 계산 함수
function calculateDday(targetDate) {
  const pattern = /(\d{4})년 (\d{1,2})월 (\d{1,2})일/;
  const [, year, month, day] = targetDate.match(pattern);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  const timeDiff = target.getTime() - today.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return dayDiff > 0 ? 'D-' + dayDiff : dayDiff === 0 ? 'D-Day' : 'D+' + Math.abs(dayDiff);
}
const dday = calculateDday(dateString);
document.querySelector('.dday-wrap .d-day').innerHTML = dday

// 팝업 시 스크롤 방지
document.querySelector('#popup_1').addEventListener('change', function() {
  if (this.checked) {
    document.querySelector('body').style.overflow = 'hidden';
  } else {
    document.querySelector('body').style.overflow = 'initial';
  }
});

// 복사하기
const __copyButton = document.querySelectorAll('.copy-text');
__copyButton.forEach((copyButton)=>{
  copyButton.addEventListener('click', (e) => {
    const dataTarget = e.currentTarget.getAttribute("data-target")
    if(navigator.clipboard == undefined){
      const textArea = document.createElement("textarea");
      textArea.value = dataTarget;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }else{
      navigator.clipboard.writeText(dataTarget)
    }
    alert('복사되었습니다');
  });
});

// 카카오 공유하기 
//<![CDATA[
  // // 사용할 앱의 JavaScript 키를 설정해 주세요.
  Kakao.init('19e6d6ca2612380690e073e3e59433ec');
  // // 카카오링크 버튼을 생성합니다. 처음 한번만 호출하면 됩니다.
  Kakao.Share.createDefaultButton({
    container: '#kakao-link-btn',
    objectType: 'feed',
    content: {
      title: `${groom_dict.lastname}${groom_dict.firstname} ♥ ${bride_dict.lastname}${bride_dict.firstname} 결혼합니다`,
      description: `${wedding_schedule_dict.hall_detail}  ${wedding_schedule_dict.date}  ${wedding_schedule_dict.time}`,
      imageUrl: `http://wedding.ghmate.com${image_list.main_img}`,
      link: {
        mobileWebUrl: 'http://wedding.ghmate.com/invitation',
        webUrl: 'http://wedding.ghmate.com/invitation'
      }
    },
    buttons: [
      {
        title: '모바일 청첩장 확인하기',
        link: {
          mobileWebUrl: 'http://wedding.ghmate.com/invitation',
          webUrl: 'http://wedding.ghmate.com/invitation'
        }
      },
    ]
  });
//]]>


// 전화 걸기
const makeCall = (type, detail) => {
  const phoneNumber = getNumber(type, detail)
  const phoneLink = 'tel:' + phoneNumber; // 전화번호를 URI Scheme으로 변환합니다.
  window.location.href = phoneLink; // 전화를 걸도록 URI Scheme을 사용하여 링크를 엽니다.
}
// 문자 전송
const sendMessage = (type, detail) => {
  const phoneNumber = getNumber(type, detail)
  var message = ''; // 보낼 문자메시지를 변수에 저장합니다.
  var smsLink = 'sms:' + phoneNumber + '?body=' + message; // 문자메시지를 URI Scheme으로 변환합니다.
  window.location.href = smsLink; // 문자메시지를 보내도록 URI Scheme을 사용하여 링크를 엽니다.
}
const getNumber = (type, detail) => {
  let phoneNumber;
  if(type == 'groom_dict') {
    phoneNumber = groom_dict[detail]
  }
  if(type == 'bride_dict') {
    phoneNumber = bride_dict[detail]
  }
  return phoneNumber
}

// 방명록 전송하기
const submitGuestbook = () => {
  const name = document.querySelector('.c-guestbook-delete-modal input[type="text"]').value
  const password = document.querySelector('.c-guestbook-delete-modal input[type="password"]').value
  const content = document.querySelector('.c-guestbook-delete-modal textarea').value
  const postData = new Object();
  postData.name = name
  postData.password = password
  postData.content = content
  // search_geocoding
  fetch('set_gusetbook', {
      method: 'POST', // 요청 메서드
      headers: {
        'Content-Type': 'application/json' // 요청 헤더 설정
      },
      body: JSON.stringify(postData) // 요청 바디에 보낼 데이터
  })
  .then(response => response.json()) // 응답 데이터를 JSON으로 파싱
  .then(result => {
      // 성공적으로 응답 받았을 때 실행할 코드 작성
      console.log(result)
      // console.log(result);
  })
  .catch(error => {
      // 요청이 실패했을 때 실행할 코드 작성
      console.error(error);
  });

}

// 방명록 삭제 모달 열기
const openModalDeleteGusetbook = (id) => {
  let html = `
    <div id="modal-container">
      <form class="modal-content" onsubmit="deleteGuestBook(${id},event)">
        <div class="top">
          <h3>방명록 삭제</h3>
          <button onclick="hiddenModal()"><i class="ph-bold ph-x"></i></button>
        </div> 
        <div class="middle">
          <label for="gustBook_password">비밀번호 :</label>
          <input id="gustBook_password" type="password" placeholder="비밀번호" onkeypress="if(event.keyCode == 13) { deleteGuestBook(${id},event) }"> 
        </div> 
        <button class="bottom" type="submit">
          삭제하기
        </button> 
      </form>
    </div>
  `
  document.querySelector('body').insertAdjacentHTML('beforeend', html);
  document.querySelector('body').style.overflow='hidden';
  document.querySelector('#modal-container').addEventListener('click', (e)=>{
    if(e.target.id == 'modal-container') {
      hiddenModal()
    }
  })
}
// 방명록 삭제
const deleteGuestBook = (id, event) => {
  console.log('실행됨')
  event.preventDefault();
  const password = document.querySelector('#gustBook_password').value
  const postData = new Object();
  postData.password = password
  postData.id = id
  fetch('delete_gusetbook', {
    method: 'POST', // 요청 메서드
    headers: {
      'Content-Type': 'application/json' // 요청 헤더 설정
    },
    body: JSON.stringify(postData) // 요청 바디에 보낼 데이터
  })
  .then(response => response.json()) // 응답 데이터를 JSON으로 파싱
  .then(result => {
      // 성공적으로 응답 받았을 때 실행할 코드 작성
      console.log(result)
      hiddenModal()
      // console.log(result);
  })
  .catch(error => {
      // 요청이 실패했을 때 실행할 코드 작성
      console.error(error);
  });
}
// 모달 닫기
const hiddenModal = () => {
  document.querySelector('#modal-container').remove();
  document.querySelector('body').style.overflow='initial';
}

// 카카오 내비
function kakaoMap() {
  Kakao.Navi.share({
    name: `${wedding_schedule_dict.hall_name}`,
    x: Number(`${wedding_schedule_dict.lng}`),
    y: Number(`${wedding_schedule_dict.lat}`),
    coordType: 'wgs84',
  });
}
// 네이버 지도 내비
function naverMap() {
  window.location.href = `nmap://route/car?dlat=${wedding_schedule_dict.lat}&dlng=${wedding_schedule_dict.lng}&dname=${wedding_schedule_dict.hall_name}&appname=wedding`;
}
// T map
function tMap(){
  const url = `tmap://route?goalname=${wedding_schedule_dict.hall_name}&goalx=${wedding_schedule_dict.lng}&goaly=${wedding_schedule_dict.lat}`;
  window.location.href = url;
}