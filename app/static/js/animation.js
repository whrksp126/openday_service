// Intersection Observer 설정
const options = {
  rootMargin: '0px',
  threshold: 0.5
};

// Intersection Observer 콜백 함수
const callback = (entries, observer) => {
  entries.forEach(entry => {
      if (entry.isIntersecting) {
          const element = entry.target;
          // console.log(element)
          // if(element.classList.contains('heroworks-count-element')){
          //     countAnimation('cumulative-data', 32942394, 123456, 10, '')
          //     countAnimation('cumulative-capacity', 60, 1 , 30, 'GB')
          //     countAnimation('number-of-hotels', 2500,123, 100, '+')
          // }
          const animation = element.getAttribute('data-animation');
          element.classList.add(animation);
          observer.unobserve(element);
      }
  });
};

// Intersection Observer 생성
const observer = new IntersectionObserver(callback, options);

// 모든 box 엘리먼트를 감시
const boxes = document.querySelectorAll('.animation-box');
boxes.forEach(box => observer.observe(box));