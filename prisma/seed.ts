import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const WEDDING_INFO_CONFIG = {
  label: '정보',
  items: [
    { id: 'required-host',           label: '혼주',     iconName: 'Heart',        panelType: 'wedding-host' },
    { id: 'required-datetime-venue', label: '일시 장소', iconName: 'CalendarDays', panelType: 'datetime-venue' },
  ],
}

const WEDDING_THEME_CONFIG = {
  fonts: ['고운돋움', '나눔명조', '제주명조', 'KoPubWorld돋움', 'Noto Sans KR'],
  // 1:아이보리  2:크림/베이지  3:블러시·로즈  4:세이지  5:더스티블루  6:라벤더
  bgColors:      ['#ffffff', '#faf5ef', '#fcf2ee', '#f1f4ed', '#ecf1f5', '#f3eef3'],
  accentColors:  ['#8a7b6e', '#bf8362', '#d97c74', '#7b9e87', '#668eaa', '#9a7ea0'],
  spacingColors: ['#ffffff', '#f5ebdf', '#f5dcd5', '#dde6d5', '#d4dfe8', '#e2d5e3'],
  bgEffects:     ['none', 'paper', 'grid', 'hanji'] as const,
}

const BABY_INFO_CONFIG = {
  label: '정보',
  items: [
    { id: 'required-host',           label: '주인공',   iconName: 'Baby',         panelType: 'baby-host' },
    { id: 'required-datetime-venue', label: '일시 장소', iconName: 'CalendarDays', panelType: 'datetime-venue' },
  ],
}

const BABY_THEME_CONFIG = {
  fonts: ['Noto Sans KR', '제주명조', '고운돋움', '나눔바른고딕'],
  bgColors:      ['#ffffff', '#fff8ec', '#fff0e6', '#ffeef0', '#ecf7ee', '#e8f1fa'],
  accentColors:  ['#9aa0a6', '#d4af6a', '#f48a6e', '#e88a9c', '#7ab87f', '#5a8ad4'],
  spacingColors: ['#ffffff', '#fff2dc', '#ffe1d0', '#ffd9df', '#d6ecd9', '#cde1f3'],
  bgEffects:     ['none', 'cloud', 'dot', 'paper'] as const,
}

const CATEGORIES = [
  {
    name: '웨딩', slug: 'wedding', icon: '💍', order: 1,
    subs: [
      { name: '웨딩(본식)', slug: 'wedding-main', order: 1 },
      { name: '리마인드 웨딩', slug: 'remind-wedding', order: 2 },
      { name: '피로연', slug: 'reception', order: 3 },
      { name: '브라이덜 샤워', slug: 'bridal-shower', order: 4 },
      { name: '상견례', slug: 'meet-parents', order: 5 },
      { name: '답례장', slug: 'thank-you-wedding', order: 6 },
    ],
  },
  {
    name: '베이비', slug: 'baby', icon: '🍼', order: 2,
    subs: [
      { name: '돌잔치', slug: 'first-birthday', order: 1 },
      { name: '백일', slug: 'hundred-days', order: 2 },
      { name: '베이비 샤워', slug: 'baby-shower', order: 3 },
      { name: '젠더 리빌', slug: 'gender-reveal', order: 4 },
    ],
  },
  {
    name: '생일', slug: 'birthday', icon: '🎂', order: 3,
    subs: [
      { name: '생일', slug: 'birthday-general', order: 1 },
      { name: '환갑', slug: 'hwangap', order: 2 },
      { name: '칠순', slug: 'chilsoon', order: 3 },
      { name: '팔순', slug: 'palsoon', order: 4 },
    ],
  },
  {
    name: '교육/기관', slug: 'education', icon: '🎓', order: 4,
    subs: [
      { name: '입학식', slug: 'entrance', order: 1 },
      { name: '졸업식', slug: 'graduation', order: 2 },
      { name: '학예회', slug: 'talent-show', order: 3 },
      { name: '입시설명회', slug: 'admissions', order: 4 },
      { name: '공개수업', slug: 'open-class', order: 5 },
    ],
  },
  {
    name: '비즈니스', slug: 'business', icon: '💼', order: 5,
    subs: [
      { name: '개업식', slug: 'opening', order: 1 },
      { name: '창립기념일', slug: 'anniversary', order: 2 },
      { name: '이전식', slug: 'relocation', order: 3 },
      { name: '런칭쇼', slug: 'launch', order: 4 },
      { name: '세미나', slug: 'seminar', order: 5 },
      { name: '워크숍', slug: 'workshop', order: 6 },
    ],
  },
  {
    name: '소셜/모임', slug: 'social', icon: '🎉', order: 6,
    subs: [
      { name: '집들이', slug: 'housewarming', order: 1 },
      { name: '홈파티', slug: 'home-party', order: 2 },
      { name: '포트럭 파티', slug: 'potluck', order: 3 },
      { name: '동창회', slug: 'reunion', order: 4 },
      { name: '정기모임', slug: 'regular-meeting', order: 5 },
    ],
  },
  {
    name: '대회/스포츠', slug: 'sports', icon: '⚽', order: 7,
    subs: [
      { name: '골프', slug: 'golf', order: 1 },
      { name: '테니스', slug: 'tennis', order: 2 },
      { name: '배드민턴', slug: 'badminton', order: 3 },
      { name: '게임대회', slug: 'game-tournament', order: 4 },
      { name: '해커톤', slug: 'hackathon', order: 5 },
    ],
  },
  {
    name: '아트/문화', slug: 'culture', icon: '🎨', order: 8,
    subs: [
      { name: '전시회', slug: 'exhibition', order: 1 },
      { name: '연주회', slug: 'concert', order: 2 },
      { name: '공연', slug: 'performance', order: 3 },
      { name: '출판기념회', slug: 'book-launch', order: 4 },
    ],
  },
  {
    name: '시즌/기념일', slug: 'seasonal', icon: '🎄', order: 9,
    subs: [
      { name: '크리스마스', slug: 'christmas', order: 1 },
      { name: '송년회', slug: 'year-end', order: 2 },
      { name: '신년회', slug: 'new-year', order: 3 },
      { name: '명절', slug: 'holiday', order: 4 },
    ],
  },
  {
    name: '부고/추모', slug: 'memorial', icon: '🌿', order: 10,
    subs: [
      { name: '부고', slug: 'obituary', order: 1 },
      { name: '답례장', slug: 'condolence-thanks', order: 2 },
      { name: '추도식', slug: 'memorial-service', order: 3 },
      { name: '49재', slug: 'forty-nine-days', order: 4 },
    ],
  },
]

const GALLERY_IMAGES = Array.from({ length: 9 }, (_, i) =>
  `/images/v1/wedding/gallery_sm/gallery_img_sm_${String(i + 1).padStart(3, '0')}.jpg`
)

const WEDDING_TEMPLATE = {
  name: '클래식 웨딩 청첩장',
  description: '따뜻한 감성의 클래식 웨딩 청첩장. 커버 사진, 인사말, 캘린더, 갤러리, 오시는 길, 계좌번호, 방명록 포함.',
  thumbnail: '/images/v1/template_thumbnail/01.jpeg',
  isPublic: true,
  defaultContent: {
    coverImage: '/images/v1/wedding/main_img.jpg',
    subImage: '/images/v1/wedding/sub_img.jpg',
    invitationTitle: '소중한 분들을 초대합니다',
    greetingMessage: '저희 두 사람의 작은 만남이\n진실한 사랑으로 꽃피어\n오늘 이 자리를 빛내는 결혼식으로 이어졌습니다.\n\n평생 서로를 귀히 여기며\n처음의 설렘과 순수함을 잃지 않고\n존중하고 아껴 나가겠습니다.\n\n믿음과 사랑을 기초로 한 이 날에\n여러분의 따뜻한 축복이 함께 한다면\n더할 나위 없는 기쁨으로 간직하겠습니다.',
    greetingTitleSmall: '',
    greetingTitleSmallVisible: false,
    groom: { last: '김', first: '민준', role: '신랑', fatherName: '김대호', motherName: '박정숙' },
    bride: { last: '이', first: '지수', role: '신부', fatherName: '이성훈', motherName: '최미래' },
    groomFirst: true,
    deceasedStyle: 'hanja',
    eventDate: '2026-10-18',
    eventTime: '낮 12시 00분',
    datetimeTitleBig: '2026. 10. 18. 일요일 낮 12시 00분',
    datetimeTitleSmall: '',
    datetimeTitleSmallVisible: false,
    venue: {
      name: '서울 그랜드 웨딩홀',
      hall: '2층 그레이스홀',
      address: '서울특별시 강남구 테헤란로 123',
      lat: 37.4979,
      lng: 127.0276,
    },
    venueTitleBig: '서울 그랜드 웨딩홀 2층 그레이스홀',
    groomPhone: '010-1234-5678',
    bridePhone: '010-9876-5432',
  },
  defaultModules: [
    { id: 'main-1',         type: 'main',         order: 1, required: true, config: {
      variant: 'classic',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      textSlots: {
        topText: '김민준\n그리고\n이지수',
        bottomText: '2026. 10. 18. 낮 12시 00분',
        subText: '서울 그랜드 웨딩홀 2층 그레이스홀',
      },
    } },
    { id: 'greeting-1',     type: 'greeting',     order: 3, required: false, config: {} },
    { id: 'midphoto-1',     type: 'midphoto',     order: 4, required: false, config: {
      image: '/images/v1/wedding/sub_img.jpg',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      noSideMargin: true,
    } },
    { id: 'profile-1',      type: 'profile',      order: 5, required: false, config: {
      koreanTitle: '저희를 소개합니다',
      koreanLabelVisible: true,
      englishTitle: 'About Us',
      labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      persons: [
        {
          name: '김민준',
          image: '/images/v1/wedding/main_img.jpg',
          title: '1990. 12. 10.',
          hashtags: ['ISTP'],
          description: '<p style="text-align: left">김아빠 · 박엄마의 아들</p>',
          descriptionVisible: true,
        },
        {
          name: '이지수',
          image: '/images/v1/wedding/sub_img.jpg',
          title: '1993. 03. 14.',
          hashtags: ['ESTJ'],
          description: '<p style="text-align: right">이아빠 · 최엄마의 딸</p>',
          descriptionVisible: true,
        },
      ],
    } },
    { id: 'datetime-1',     type: 'datetime',     order: 6, required: false, config: {} },
    { id: 'venue-1',        type: 'venue',        order: 7, required: false, config: { showMap: true } },
    { id: 'gallery-1',      type: 'gallery',      order: 8, required: false, config: { images: GALLERY_IMAGES, layout: 'grid' } },
    { id: 'slide-1', type: 'slide', order: 9, required: false, config: {
      koreanTitle: '안내사항',
      koreanLabelVisible: true,
      englishTitle: 'Information',
      labelVisible: true,
      titleBigVisible: false,
      slides: [
        {
          image: GALLERY_IMAGES[0],
          imageVisible: true,
          title: '<p style="text-align: center">강아지 화동 안내</p>',
          titleVisible: true,
          content: '<p style="text-align: center">특별한 순간에 저희 반려견이</p><p style="text-align: center">화동으로 함께합니다.</p><p style="text-align: center"></p><p style="text-align: center">알러지나 두려움이 있으신 분은</p><p style="text-align: center">미리 알려주시면 반려견 동선과</p><p style="text-align: center">겹치지 않는 좌석을 안내해 드리겠습니다.</p>',
          contentVisible: true,
        },
        {
          image: GALLERY_IMAGES[1],
          imageVisible: true,
          title: '<p style="text-align: center">연회 &amp; 식사 안내</p>',
          titleVisible: true,
          content: '<p style="text-align: center">식사는 결혼식 및 사진 촬영이 끝난 후</p><p style="text-align: center">웨딩홀 2층에서 뷔페식으로 진행됩니다.</p><p style="text-align: center"></p><p style="text-align: center">한식·중식·양식·일식 등</p><p style="text-align: center">다채로운 메뉴가 마련되어 있으니,</p><p style="text-align: center">편안하게 즐겨 주시기 바랍니다.</p>',
          contentVisible: true,
        },
      ],
    } },
    { id: 'guestbook-1', type: 'guestbook', order: 10, required: false, config: {} },
    { id: 'account-1',   type: 'account',  order: 11, required: false, config: {
      koreanTitle: '계좌 정보',
      koreanLabelVisible: true,
      englishTitle: 'Account',
      labelVisible: true,
      titleBig: '마음 전하실 곳',
      titleBigVisible: true,
      groups: [
        { label: '신랑측 계좌번호', accounts: [
          { bank: '국민은행', number: '123-456-789012', name: '김민준' },
          { bank: '신한은행', number: '110-123-456789', name: '김대호' },
        ]},
        { label: '신부측 계좌번호', accounts: [
          { bank: '우리은행', number: '1002-123-456789', name: '이지수' },
        ]},
      ],
    } },
    { id: 'contact-1', type: 'contact', order: 12, required: false, config: {
      koreanTitle: '연락하기',
      koreanLabelVisible: true,
      englishTitle: 'Contact',
      labelVisible: true,
      titleBig: '',
      titleBigVisible: false,
      groups: [
        { label: '신랑 측', englishLabel: 'GROOM', contacts: [
          { name: '신랑', phone: '', bindTo: 'groomPhone' },
          { name: '신랑 아버님', phone: '' },
          { name: '신랑 어머님', phone: '' },
        ]},
        { label: '신부 측', englishLabel: 'BRIDE', contacts: [
          { name: '신부', phone: '', bindTo: 'bridePhone' },
          { name: '신부 아버님', phone: '' },
          { name: '신부 어머님', phone: '' },
        ]},
      ],
    } },
    { id: 'timeline-1', type: 'timeline', order: 13, required: false, config: {
      koreanTitle: '타임라인',
      koreanLabelVisible: true,
      englishTitle: 'Timeline',
      labelVisible: true,
      items: [
        { image: GALLERY_IMAGES[0], title: '첫 만남',   content: '우연한 만남에서\n사랑이 시작되었습니다.', titleVisible: true, contentVisible: true },
        { image: GALLERY_IMAGES[1], title: '첫 여행',   content: '함께하는 모든 시간이\n추억이 되었습니다.', titleVisible: true, contentVisible: true },
        { image: GALLERY_IMAGES[2], title: '프로포즈', content: '영원을 약속한 날\n우리는 하나가 되기로 했습니다.', titleVisible: true, contentVisible: true },
      ],
    } },
    { id: 'timeline-polaroid-1', type: 'timeline_polaroid', order: 14, required: false, config: {
      koreanTitle: '폴라로이드',
      koreanLabelVisible: true,
      englishTitle: 'Polaroid',
      labelVisible: true,
      items: [
        { image: GALLERY_IMAGES[3], title: '우리의 하루',   content: '평범하지만 특별한\n일상을 담았습니다.', titleVisible: true, contentVisible: true },
        { image: GALLERY_IMAGES[4], title: '웨딩 촬영',     content: '가장 빛나는 순간을\n사진에 새겼습니다.', titleVisible: true, contentVisible: true },
        { image: GALLERY_IMAGES[5], title: '함께한 시간',   content: '앞으로도 이렇게\n함께 걸어가겠습니다.', titleVisible: true, contentVisible: true },
      ],
    } },
    { id: 'rsvp-1', type: 'rsvp', order: 15, required: false, config: {
      koreanTitle: '참석 의사',
      koreanLabelVisible: true,
      englishTitle: 'RSVP',
      labelVisible: true,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      questions: [
        { id: 'rsvp-q-side',       type: 'single-choice', label: '어느 측 하객이신가요?', required: true, options: ['신랑', '신부'] },
        { id: 'rsvp-q-attendance', type: 'single-choice', label: '참석 하시나요?',         required: true, options: ['참석', '불참석'] },
        { id: 'rsvp-q-name',       type: 'text-short',    label: '성함',                   required: true, placeholder: '성함을 입력하세요.' },
      ],
    } },
    { id: 'interview-1', type: 'interview', order: 17, required: false, config: {
      koreanTitle: '인터뷰',
      koreanLabelVisible: true,
      englishTitle: 'Interview',
      labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      items: [
        {
          question: '<p>첫인상은 어땠나요?</p>',
          answer: '<p><strong>신랑 김민준</strong></p><p>아주 밝고 에너지가 넘쳤어요.</p><p>처음 만났는데도 오래 알던 사람처럼 편했어요.</p><p></p><p><strong>신부 이지수</strong></p><p>말수가 적지만 진중한 느낌이었어요.</p><p>눈웃음이 인상적이었고요 :)</p>',
          questionVisible: true,
          answerVisible: true,
        },
        {
          question: '<p>결혼을 결심한 계기가 있다면?</p>',
          answer: '<p><strong>신랑 김민준</strong></p><p>매일의 사소한 순간들이 즐겁고 편안했어요.</p><p>\'아, 이 사람이구나\' 싶었죠.</p><p></p><p><strong>신부 이지수</strong></p><p>어떤 상황에서도 저를 먼저 생각해주는 마음.</p><p>그 따뜻함이 확신이 되었어요.</p>',
          questionVisible: true,
          answerVisible: true,
        },
        {
          question: '<p>신혼여행은 어디로 가요?</p>',
          answer: '<p>미국과 칸쿤으로 13박 14일.</p>',
          questionVisible: true,
          answerVisible: true,
        },
      ],
    } },
    { id: 'tab-1', type: 'tab', order: 16, required: false, config: {
      koreanTitle: '오시는 길 안내',
      koreanLabelVisible: true,
      englishTitle: 'Directions',
      labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">2호선 강남역 5번 출구에서 도보 5분<br>3호선 신사역 8번 출구에서 도보 10분</p>' },
        { label: '버스', content: '<p style="text-align: center">간선 143, 341, 360 · 강남역 정류장 하차<br>지선 3412, 4212 · 뱅뱅사거리 정류장 하차</p>' },
        { label: '택시', content: '<p style="text-align: center">"서울 그랜드 웨딩홀"로 안내해 주세요.<br>강남역 인근 택시승강장에서 약 5분 거리입니다.</p>' },
      ],
    } },
  ],
  styles: {
    font: '고운돋움',
    accentColor: '#bf8362',
    bgColor: '#faf5ef',
    spacingColor: '#f5ebdf',
    bgEffect: 'none',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: true,
    showEnglishTitle: true,
    bgm: {
      source: 'preset',
      trackId: 'wedding-white-petals',
      url: '/music/wedding/white-petals.mp3',
      title: 'White Petals',
      artist: 'Keys of Moon',
      loopEnabled: false,
    },
  },
  infoConfig: WEDDING_INFO_CONFIG,
  themeConfig: WEDDING_THEME_CONFIG,
}

const BABY_TIMELINE_IMAGES = [
  '/images/v1/baby/timeline/01.webp',
  '/images/v1/baby/timeline/02.webp',
  '/images/v1/baby/timeline/03.webp',
  '/images/v1/baby/timeline/04.webp',
]

const BABY_GALLERY_IMAGES = [
  '/images/v1/baby/gallery/01.webp',
  '/images/v1/baby/gallery/02.webp',
  '/images/v1/baby/gallery/03.webp',
]

const BABY_FIRST_BIRTHDAY_TEMPLATE = {
  name: '돌잔치 초대장',
  description: '아기의 첫 생일을 함께하는 돌잔치 초대장. 성장 타임라인, 인터뷰, 갤러리, 계좌, 방명록, RSVP 포함.',
  thumbnail: '/images/v1/template_thumbnail/02.jpeg',
  isPublic: true,
  defaultContent: {
    coverImage: '/images/v1/baby/main_img.jpg',
    invitationTitle: '시안이의 돌잔치에 초대합니다',
    greetingMessage: '첫 걸음마, 첫 미소, 첫 옹알이...\n소중한 순간들을 함께해 주신 분들께\n감사의 마음을 전하고자 합니다.\n\n저희 시안이의 첫 생일에\n따뜻한 축하를 부탁드립니다.',
    eventDate: '2026-04-26',
    eventTime: '오전 11시',
    datetimeTitleBig: '2026. 04. 26. 일요일 오전 11시',
    datetimeTitleSmallVisible: false,
    venue: {
      name: '비비드바우스 파티룸',
      hall: '',
      address: '경기 성남시 분당구 정자일로 95',
      lat: 37.3675,
      lng: 127.1086,
    },
    venueTitleBig: '비비드바우스 파티룸',
    baby: {
      name: '시안',
      birthDate: '2025-04-26',
      hashtags: ['웃음요정', '잠꾸러기'],
      description: '울다 웃다 자다\n그렇게 1년',
      role: '주인공',
    },
    parents: {
      father: { role: 'father' as const, name: '이윤종', phone: '010-1234-5678' },
      mother: { role: 'mother' as const, name: '이다영', phone: '010-9876-5432' },
    },
    babyFatherFirst: true,
    shareTitle: '시안이의 돌잔치에 초대합니다',
    shareText: '2026.04.26 일요일 오전 11시\n비비드바우스 파티룸',
  },
  defaultModules: [
    { id: 'baby-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'arch',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      textSlots: {
        yearText: '2026',
        topAccent: 'HAPPY',
        mainTitle: '1st BIRTHDAY',
        dateText: '04.26',
        subjectFormatted: '+ 시안 +',
        bottomText: '2026. 4. 26. 오전 11시',
        subText: '비비드바우스 파티룸',
      },
    }},
    { id: 'baby-greeting-1', type: 'greeting', order: 3, required: false, config: {} },
    { id: 'baby-profile-1', type: 'solo_profile', order: 4, required: false, config: {
      koreanTitle: '주인공 소개',
      koreanLabelVisible: true,
      englishTitle: 'About Baby',
      labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      persons: [
        {
          name: '시안',
          image: '/images/v1/baby/profile_img.webp',
          title: '2025. 04. 26.',
          hashtags: ['웃음요정', '잠꾸러기'],
          description: '울다 웃다 자다\n그렇게 1년',
          descriptionVisible: true,
        },
      ],
    }},
    { id: 'baby-midphoto-1', type: 'midphoto', order: 5, required: false, config: {
      image: '/images/v1/baby/sub_img.webp',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      noSideMargin: true,
    }},
    { id: 'baby-datetime-1', type: 'datetime', order: 6, required: false, config: {} },
    { id: 'baby-venue-1', type: 'venue', order: 7, required: false, config: { showMap: true } },
    { id: 'baby-dday-1', type: 'dday', order: 8, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'baby-gallery-1', type: 'gallery', order: 9, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: BABY_GALLERY_IMAGES,
      layout: 'grid',
    }},
    { id: 'baby-timeline-1', type: 'timeline', order: 10, required: false, config: {
      koreanTitle: '성장 이야기', koreanLabelVisible: true,
      englishTitle: 'Growth', labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      items: [
        { image: BABY_TIMELINE_IMAGES[0], title: '출생 당일', content: '세상에 처음 인사한 날\n작은 손, 작은 발이 너무 신기했어요.', titleVisible: true, contentVisible: true },
        { image: BABY_TIMELINE_IMAGES[1], title: '100일',     content: '백일을 맞아 환하게 웃어주었어요.\n그 미소가 가족의 보물이 되었습니다.', titleVisible: true, contentVisible: true },
        { image: BABY_TIMELINE_IMAGES[2], title: '처음이 가득했던 날들', content: '뒤집기, 옹알이, 첫 걸음마...\n매일이 처음이고 기적이었어요.', titleVisible: true, contentVisible: true },
        { image: BABY_TIMELINE_IMAGES[3], title: '첫 생일',   content: '벌써 한 살이 되었어요.\n앞으로의 시간이 더욱 빛나기를.', titleVisible: true, contentVisible: true },
      ],
    }},
    { id: 'baby-interview-1', type: 'interview', order: 11, required: false, config: {
      koreanTitle: '시안이의 한마디', koreanLabelVisible: true,
      englishTitle: 'Interview', labelVisible: true,
      titleBigVisible: false, titleSmallVisible: false,
      items: [
        { question: '<p>가장 좋아하는 건 뭐예요?</p>', answer: '<p>엄마 품, 아빠 무릎, 그리고 우유!</p>', questionVisible: true, answerVisible: true },
        { question: '<p>요즘 푹 빠진 일은?</p>',       answer: '<p>걸음마 연습이요. 곧 뛸 수 있을 거예요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>오늘 인사 부탁해요.</p>',      answer: '<p>와주셔서 감사합니다 :)</p>', questionVisible: true, answerVisible: true },
      ],
    }},
    { id: 'baby-tab-1', type: 'tab', order: 12, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">분당선 정자역 4번 출구 도보 5분</p>' },
        { label: '버스',   content: '<p style="text-align: center">정자동 주민센터 정류장 하차 후 도보 3분</p>' },
        { label: '주차',   content: '<p style="text-align: center">건물 지하 주차장 2시간 무료</p>' },
      ],
    }},
    { id: 'baby-slide-1', type: 'slide', order: 13, required: false, config: {
      koreanTitle: '안내사항', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      slides: [
        {
          image: BABY_GALLERY_IMAGES[0], imageVisible: true,
          title: '<p style="text-align: center">식사 안내</p>', titleVisible: true,
          content: '<p style="text-align: center">행사 후 코스 식사가 준비되어 있습니다.</p>', contentVisible: true,
        },
        {
          image: BABY_GALLERY_IMAGES[1], imageVisible: true,
          title: '<p style="text-align: center">드레스 코드</p>', titleVisible: true,
          content: '<p style="text-align: center">파스텔 톤으로 함께 빛내주세요.</p>', contentVisible: true,
        },
      ],
    }},
    { id: 'baby-guestbook-1', type: 'guestbook', order: 14, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
    { id: 'baby-account-1', type: 'account', order: 15, required: false, config: {
      koreanTitle: '계좌 정보', koreanLabelVisible: true,
      englishTitle: 'Account', labelVisible: true,
      titleBig: '마음 전하실 곳', titleBigVisible: true,
      groups: [
        { label: '아빠 측', accounts: [{ bank: 'KB국민은행', number: '23123154-3232',  name: '이윤종' }] },
        { label: '엄마 측', accounts: [{ bank: '카카오뱅크',  number: '8908-4019-21312', name: '이다영' }] },
      ],
    }},
    { id: 'baby-contact-1', type: 'contact', order: 16, required: false, config: {
      koreanTitle: '연락처', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '아빠', englishLabel: 'FATHER', contacts: [{ name: '아빠', phone: '', bindTo: 'parents.father.phone' }] },
        { label: '엄마', englishLabel: 'MOTHER', contacts: [{ name: '엄마', phone: '', bindTo: 'parents.mother.phone' }] },
      ],
    }},
    { id: 'baby-rsvp-1', type: 'rsvp', order: 17, required: false, config: {
      koreanTitle: '참석 의사', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      buttonLabel: '참석 여부 알리기', modalTitle: '참석 여부 전달', submitLabel: '전달하기',
      questions: [
        { id: 'baby-rsvp-q-attendance', type: 'single-choice', label: '참석 하시나요?', required: true, options: ['참석', '불참석'] },
        { id: 'baby-rsvp-q-name',       type: 'text-short',    label: '성함',           required: true, placeholder: '성함을 입력하세요.' },
        { id: 'baby-rsvp-q-count',      type: 'number',        label: '참석 인원(본인 포함)', required: false, placeholder: '예: 2' },
      ],
    }},
    { id: 'baby-guestalbum-1', type: 'guestalbum', order: 18, required: false, config: {
      koreanTitle: '하객 앨범', koreanLabelVisible: true,
      englishTitle: 'Guest Album', labelVisible: true,
    }},
    { id: 'baby-ending-1', type: 'ending', order: 19, required: false, config: {
      image: '/images/v1/baby/ending_img.webp',
      message: '시안이의 첫 생일을\n함께해 주셔서 감사합니다.',
    }},
  ],
  styles: {
    font: 'Noto Sans KR',
    accentColor: '#f48a6e',
    bgColor: '#fff0e6',
    spacingColor: '#ffe1d0',
    bgEffect: 'cloud',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: true,
    showEnglishTitle: true,
    bgm: {
      source: 'preset',
      trackId: 'baby-happy-clappy-ukulele',
      url: '/music/baby/happy-clappy-ukulele.mp3',
      title: 'Happy Clappy Ukulele',
      artist: 'Shane Ivers',
      loopEnabled: false,
    },
  },
  infoConfig: BABY_INFO_CONFIG,
  themeConfig: BABY_THEME_CONFIG,
}

async function main() {
  console.log('Seeding categories and subcategories...')

  for (const { subs, ...catData } of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: catData,
      create: catData,
    })

    for (const sub of subs) {
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: sub.slug } },
        update: sub,
        create: { ...sub, categoryId: category.id },
      })
    }
  }

  // 웨딩 템플릿 시딩
  console.log('Seeding wedding template...')
  const weddingCategory = await prisma.category.findUnique({ where: { slug: 'wedding' } })
  const weddingMainSub = weddingCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: weddingCategory.id, slug: 'wedding-main' } })
    : null

  if (weddingCategory) {
    await prisma.template.upsert({
      where: { id: 'wedding-classic-template-001' },
      update: {
        ...WEDDING_TEMPLATE,
        categoryId: weddingCategory.id,
        subcategoryId: weddingMainSub?.id ?? null,
      },
      create: {
        id: 'wedding-classic-template-001',
        ...WEDDING_TEMPLATE,
        categoryId: weddingCategory.id,
        subcategoryId: weddingMainSub?.id ?? null,
      },
    })
  }

  // 돌잔치 템플릿 시딩
  console.log('Seeding baby first-birthday template...')
  const babyCategory = await prisma.category.findUnique({ where: { slug: 'baby' } })
  const babyFirstBirthdaySub = babyCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: babyCategory.id, slug: 'first-birthday' } })
    : null

  if (babyCategory) {
    await prisma.template.upsert({
      where: { id: 'baby-first-birthday-template-001' },
      update: {
        ...BABY_FIRST_BIRTHDAY_TEMPLATE,
        categoryId: babyCategory.id,
        subcategoryId: babyFirstBirthdaySub?.id ?? null,
      },
      create: {
        id: 'baby-first-birthday-template-001',
        ...BABY_FIRST_BIRTHDAY_TEMPLATE,
        categoryId: babyCategory.id,
        subcategoryId: babyFirstBirthdaySub?.id ?? null,
      },
    })
  }

  // templateConfigJson 백필 — 기존 invitation은 templateId 기준으로 wedding/baby config 매핑
  console.log('Backfilling templateConfigJson on existing invitations...')
  const targets = await prisma.invitation.findMany({
    where: { templateConfigJson: { equals: Prisma.JsonNull } },
    select: { id: true, templateId: true },
  })
  for (const inv of targets) {
    const isBabyTemplate = inv.templateId === 'baby-first-birthday-template-001'
    const config = isBabyTemplate
      ? { info: BABY_INFO_CONFIG, theme: BABY_THEME_CONFIG }
      : { info: WEDDING_INFO_CONFIG, theme: WEDDING_THEME_CONFIG }
    await prisma.invitation.update({
      where: { id: inv.id },
      data: { templateConfigJson: config as unknown as Prisma.InputJsonValue },
    })
  }
  console.log(`Backfilled ${targets.length} invitation(s).`)

  console.log('Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
