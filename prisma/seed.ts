import { PrismaClient, Prisma } from '@prisma/client'
import { templateAssetUrl, presetBgmUrl } from '../src/lib/asset-paths'

const prisma = new PrismaClient()

const WEDDING_TEMPLATE_ID = 'wedding-classic-template-001'
const BABY_TEMPLATE_ID = 'baby-first-birthday-template-001'
const SEMINAR_TEMPLATE_ID = 'business-seminar-template-001'
const LAUNCH_TEMPLATE_ID = 'business-launch-template-001'
const TENNIS_TEMPLATE_ID = 'sports-tennis-template-001'
const VIP_NIGHT_TEMPLATE_ID = 'social-vip-night-template-001'
const YEAREND_TEMPLATE_ID = 'seasonal-yearend-template-001'
const BIRTHDAY_TEMPLATE_ID = 'birthday-celebration-template-001'
const GRADUATION_TEMPLATE_ID = 'education-graduation-template-001'
const EXHIBITION_TEMPLATE_ID = 'culture-exhibition-template-001'
const MEMORIAL_TEMPLATE_ID = 'memorial-obituary-template-001'

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

// ── 신규 템플릿(2026-05-01) — 비즈/스포츠/모임/시즌 공용 정보 그룹
const COMMON_EVENT_INFO_CONFIG = {
  label: '정보',
  items: [
    { id: 'required-datetime-venue', label: '일시 장소', iconName: 'CalendarDays', panelType: 'datetime-venue' },
  ],
}

// 비즈 세미나 — 라이트 모던 + 다크 그레이/블루 액센트
const SEMINAR_THEME_CONFIG = {
  fonts: ['Noto Sans KR', 'KoPubWorld돋움', '나눔바른고딕', '고운돋움'],
  bgColors:      ['#ffffff', '#f5f6f8', '#eef0f4', '#fafaf7', '#0e1729', '#1f1f1f'],
  accentColors:  ['#1f1f1f', '#2c5ba9', '#3a3a3a', '#7a8696', '#0a4f9c', '#c9a25b'],
  spacingColors: ['#e8eaef', '#dde1e8', '#f0ede5', '#cdd3dc', '#1a2a44', '#202938'],
  bgEffects:     ['none', 'grid', 'paper', 'dot'] as const,
}

// 신제품 런칭 — 럭셔리 미니멀 + 골드/베이지
const LAUNCH_THEME_CONFIG = {
  fonts: ['제주명조', '나눔명조', 'KoPubWorld돋움', 'Noto Sans KR'],
  bgColors:      ['#f8f5f0', '#fcf7ec', '#f0ebe0', '#ffffff', '#2a221b', '#1c1814'],
  accentColors:  ['#a08658', '#c8a45a', '#8a6a3c', '#3a3026', '#d4af37', '#665544'],
  spacingColors: ['#ece5d8', '#f4ecdc', '#ddd2bd', '#e8e0cf', '#3b2f24', '#1f1a14'],
  bgEffects:     ['none', 'paper', 'hanji', 'grid'] as const,
}

// 테니스 토너먼트 — 비비드 액티브 + 청록·라임
const TENNIS_THEME_CONFIG = {
  fonts: ['Noto Sans KR', '나눔바른고딕', 'KoPubWorld돋움'],
  bgColors:      ['#ffffff', '#f0fbff', '#e3f3fa', '#fbfff0', '#0a3a4a', '#1aaedb'],
  accentColors:  ['#1aaedb', '#0a3a4a', '#1f1f1f', '#0080a8', '#5dbb55', '#c9dc1f'],
  spacingColors: ['#d6eef7', '#e3f3fa', '#f3f8e4', '#cfe9f4', '#0e2c3a', '#0a4d68'],
  bgEffects:     ['none', 'grid', 'dot', 'paper'] as const,
}

// VIP 나이트 — 다크 럭셔리 + 골드
const VIP_NIGHT_THEME_CONFIG = {
  fonts: ['Noto Sans KR', '제주명조', 'KoPubWorld돋움', '고운돋움'],
  bgColors:      ['#142339', '#0a0a0e', '#1d2a3f', '#241b0e', '#312615', '#0d1e2c'],
  accentColors:  ['#d4af37', '#e8d8a8', '#c9a25b', '#a87b3c', '#cfd8e3', '#f5f5f5'],
  spacingColors: ['#1d2e47', '#16151a', '#22324c', '#2c2417', '#3b2f1c', '#152a3a'],
  bgEffects:     ['none', 'grid', 'dot', 'paper'] as const,
}

// 송년회 — 따뜻한 아이보리 + 골드 왁스 무드
const YEAREND_THEME_CONFIG = {
  fonts: ['고운돋움', '제주명조', '나눔명조', 'KoPubWorld돋움'],
  bgColors:      ['#faf6ee', '#fcf2dc', '#f4ecdc', '#ffffff', '#1d1610', '#2c2418'],
  accentColors:  ['#bf8c4d', '#a07338', '#d4a865', '#3a2c1c', '#c8a45a', '#7a5a32'],
  spacingColors: ['#f0e6d3', '#f5e9c9', '#dccdaa', '#ece4d4', '#231a10', '#3b2c1c'],
  bgEffects:     ['none', 'paper', 'hanji', 'grid'] as const,
}

// 생일/환갑 — 따뜻한 코랄·크림, 축하 무드
const BIRTHDAY_THEME_CONFIG = {
  fonts: ['고운돋움', '나눔바른고딕', 'Noto Sans KR', '제주명조'],
  bgColors:      ['#fff8f2', '#fff1e8', '#ffe9db', '#ffffff', '#3a241c', '#2a1b14'],
  accentColors:  ['#f2683c', '#d1603f', '#e8944a', '#c2410c', '#f2a65a', '#7a4a35'],
  spacingColors: ['#ffe4d3', '#ffddc9', '#ffd0b8', '#f7e3d5', '#3a2418', '#4a2e1e'],
  bgEffects:     ['none', 'dot', 'paper', 'grid'] as const,
}

// 교육/기관 — 네이비 격식, 학교·기관 무드
const GRADUATION_THEME_CONFIG = {
  fonts: ['Noto Sans KR', 'KoPubWorld돋움', '나눔바른고딕', '제주명조'],
  bgColors:      ['#ffffff', '#f4f7fb', '#eaf0f8', '#f7f9f5', '#0f2440', '#14243a'],
  accentColors:  ['#16305c', '#254b7a', '#2c5282', '#b08d57', '#3a6ea5', '#8a6d3b'],
  spacingColors: ['#e7ecf3', '#dde6f1', '#eef2f7', '#d6e0ec', '#16283f', '#1d2f47'],
  bgEffects:     ['none', 'grid', 'paper', 'dot'] as const,
}

// 아트/문화 — 모노크롬 갤러리, 미니멀 전시 무드
const EXHIBITION_THEME_CONFIG = {
  fonts: ['제주명조', '나눔명조', 'Noto Sans KR', 'KoPubWorld돋움'],
  bgColors:      ['#f4f1ea', '#ffffff', '#efece5', '#f2f0eb', '#1a1a1a', '#26241f'],
  accentColors:  ['#141414', '#3a3a3a', '#8a7b5c', '#a03e2e', '#5c5c5c', '#c9a25b'],
  spacingColors: ['#e5e0d5', '#eceae3', '#ddd9cf', '#f0eee8', '#2a2a2a', '#33302a'],
  bgEffects:     ['none', 'paper', 'grid', 'hanji'] as const,
}

// 부고/추모 — 차분한 세이지·차콜, 절제된 무드
const MEMORIAL_THEME_CONFIG = {
  fonts: ['나눔명조', '제주명조', 'KoPubWorld돋움', 'Noto Sans KR'],
  bgColors:      ['#f3f4f1', '#ffffff', '#eef0ec', '#f2f3f0', '#26302a', '#2a2e2b'],
  accentColors:  ['#3f4f45', '#3e4a42', '#5a6b5e', '#3a3a3a', '#6b7a6c', '#556b5a'],
  spacingColors: ['#e2e5df', '#e8ebe5', '#dce1d9', '#eef0ec', '#2e352f', '#333a34'],
  bgEffects:     ['none', 'paper', 'hanji', 'grid'] as const,
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
  templateAssetUrl(WEDDING_TEMPLATE_ID, `gallery/${String(i + 1).padStart(3, '0')}.jpg`)
)

// 카테고리별 갤러리(각 4장, objectstore templates/{id}/gallery/0N.jpg)
const BIRTHDAY_GALLERY_IMAGES = Array.from({ length: 4 }, (_, i) =>
  templateAssetUrl(BIRTHDAY_TEMPLATE_ID, `gallery/${String(i + 1).padStart(2, '0')}.jpg`)
)
const GRADUATION_GALLERY_IMAGES = Array.from({ length: 4 }, (_, i) =>
  templateAssetUrl(GRADUATION_TEMPLATE_ID, `gallery/${String(i + 1).padStart(2, '0')}.jpg`)
)
const EXHIBITION_GALLERY_IMAGES = Array.from({ length: 4 }, (_, i) =>
  templateAssetUrl(EXHIBITION_TEMPLATE_ID, `gallery/${String(i + 1).padStart(2, '0')}.jpg`)
)

const WEDDING_TEMPLATE = {
  name: '클래식 웨딩 청첩장',
  description: '따뜻한 감성의 클래식 웨딩 청첩장. 커버 사진, 인사말, 캘린더, 갤러리, 오시는 길, 계좌번호, 방명록 포함.',
  thumbnail: templateAssetUrl(WEDDING_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(WEDDING_TEMPLATE_ID, 'main_img.jpg'),
    subImage: templateAssetUrl(WEDDING_TEMPLATE_ID, 'sub_img.jpg'),
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
    datetimeTitleBig: '2026. 10. 18. 일요일',
    datetimeTitleSmall: '낮 12시 00분',
    datetimeTitleSmallVisible: true,
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
      image: templateAssetUrl(WEDDING_TEMPLATE_ID, 'sub_img.jpg'),
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
          image: templateAssetUrl(WEDDING_TEMPLATE_ID, 'main_img.jpg'),
          title: '1990. 12. 10.',
          hashtags: ['ISTP'],
          description: '<p style="text-align: left">김아빠 · 박엄마의 아들</p>',
          descriptionVisible: true,
        },
        {
          name: '이지수',
          image: templateAssetUrl(WEDDING_TEMPLATE_ID, 'sub_img.jpg'),
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
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
    bgm: {
      source: 'preset',
      trackId: 'wedding-white-petals',
      url: presetBgmUrl('wedding', 'white-petals.mp3'),
      title: 'White Petals',
      artist: 'Keys of Moon',
      loopEnabled: false,
    },
  },
  infoConfig: WEDDING_INFO_CONFIG,
  themeConfig: WEDDING_THEME_CONFIG,
}

const BABY_TIMELINE_IMAGES = [
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/01.webp'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/02.webp'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/03.webp'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/04.webp'),
]

const BABY_GALLERY_IMAGES = [
  templateAssetUrl(BABY_TEMPLATE_ID, 'gallery/01.webp'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'gallery/02.webp'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'gallery/03.webp'),
]

const BABY_FIRST_BIRTHDAY_TEMPLATE = {
  name: '돌잔치 초대장',
  description: '아기의 첫 생일을 함께하는 돌잔치 초대장. 성장 타임라인, 인터뷰, 갤러리, 계좌, 방명록, RSVP 포함.',
  thumbnail: templateAssetUrl(BABY_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(BABY_TEMPLATE_ID, 'main_img.jpg'),
    invitationTitle: '시안이의 돌잔치에 초대합니다',
    greetingMessage: '첫 걸음마, 첫 미소, 첫 옹알이...\n소중한 순간들을 함께해 주신 분들께\n감사의 마음을 전하고자 합니다.\n\n저희 시안이의 첫 생일에\n따뜻한 축하를 부탁드립니다.',
    eventDate: '2026-04-26',
    eventTime: '오전 11시',
    datetimeTitleBig: '2026. 04. 26. 일요일',
    datetimeTitleSmall: '오전 11시',
    datetimeTitleSmallVisible: true,
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
          image: templateAssetUrl(BABY_TEMPLATE_ID, 'profile_img.webp'),
          title: '2025. 04. 26.',
          hashtags: ['웃음요정', '잠꾸러기'],
          description: '울다 웃다 자다\n그렇게 1년',
          descriptionVisible: true,
        },
      ],
    }},
    { id: 'baby-midphoto-1', type: 'midphoto', order: 5, required: false, config: {
      image: templateAssetUrl(BABY_TEMPLATE_ID, 'sub_img.webp'),
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
    { id: 'baby-photo-share-1', type: 'photo_share', order: 18, required: false, config: {
      koreanTitle: '사진 공유', koreanLabelVisible: true,
      englishTitle: 'Photo Share', labelVisible: true,
      previewPublic: true,
    }},
    { id: 'baby-ending-1', type: 'ending', order: 19, required: false, config: {
      image: templateAssetUrl(BABY_TEMPLATE_ID, 'ending_img.webp'),
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
    scrollAnimation: 'pop',
    showEnglishTitle: true,
    bgm: {
      source: 'preset',
      trackId: 'baby-happy-clappy-ukulele',
      url: presetBgmUrl('baby', 'happy-clappy-ukulele.mp3'),
      title: 'Happy Clappy Ukulele',
      artist: 'Shane Ivers',
      loopEnabled: false,
    },
  },
  infoConfig: BABY_INFO_CONFIG,
  themeConfig: BABY_THEME_CONFIG,
}

// ──────────────────────────────────────────────────────────
// 신규 템플릿 5종 (2026-05-01 추가)
// itscard 모바일 초대장 샘플(MInvite02/03/08/09/10)을 참고한 디자인 무드
// ──────────────────────────────────────────────────────────

const seminarGallery = [templateAssetUrl(SEMINAR_TEMPLATE_ID, 'main_img.png')]
const launchGallery  = [templateAssetUrl(LAUNCH_TEMPLATE_ID, 'main_img.png')]
const tennisGallery  = [templateAssetUrl(TENNIS_TEMPLATE_ID, 'main_img.png')]
const vipNightGallery = [templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'main_img.png')]
const yearendGallery = [templateAssetUrl(YEAREND_TEMPLATE_ID, 'main_img.png')]

const BUSINESS_SEMINAR_TEMPLATE = {
  name: '비즈 세미나 초대장',
  description: '연사·강연 중심의 세미나, 포럼, 컨퍼런스 초대장. 라이트 모던 톤에 다크 그레이/네이비 액센트.',
  thumbnail: templateAssetUrl(SEMINAR_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(SEMINAR_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: '2026 Annual Business Forum에 초대합니다',
    greetingMessage: '한 해 동안의 통찰과\n다가올 변화를 함께 나누는 자리,\n2026 Annual Business Forum에 모십니다.\n\n각 분야의 리더가 모여\n새로운 가능성을 이야기합니다.\n\n바쁘신 일정에도 참석하시어\n자리를 빛내 주시면 감사하겠습니다.',
    eventDate: '2026-05-21',
    eventTime: 'PM 1:30',
    datetimeTitleBig: '2026. 05. 21. 토요일',
    datetimeTitleSmall: 'PM 1:30',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '서울 그랜드 호텔',
      hall: 'Grand Ballroom 3F',
      address: '서울특별시 중구 세종대로 80',
      lat: 37.5650,
      lng: 126.9784,
    },
    venueTitleBig: '서울 그랜드 호텔 Grand Ballroom 3F',
    shareTitle: '2026 Annual Business Forum',
    shareText: '2026.05.21 토요일 PM 1:30 · 서울 그랜드 호텔',
  },
  defaultModules: [
    { id: 'sem-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'corp-headline',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      textSlots: {
        inviteLabel: 'INVITATION',
        title: '2026 Annual Business Forum\n행사 안내',
        dateBig: '2026.05.21',
        bottomText: '2026. 05. 21. (토) PM 1:30',
        subText: '서울 그랜드 호텔 Grand Ballroom 3F',
      },
    }},
    { id: 'sem-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'sem-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'sem-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'sem-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'sem-gallery-1',  type: 'gallery',  order: 6, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: seminarGallery,
      layout: 'grid',
    }},
    { id: 'sem-tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">1·2호선 시청역 4번 출구 도보 3분</p>' },
        { label: '버스',   content: '<p style="text-align: center">간선 100, 152 · 시청앞 정류장 하차</p>' },
        { label: '주차',   content: '<p style="text-align: center">호텔 지하주차장 4시간 무료</p>' },
      ],
    }},
    { id: 'sem-guestbook-1', type: 'guestbook', order: 8, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: 'Noto Sans KR',
    accentColor: '#1f1f1f',
    bgColor: '#ffffff',
    spacingColor: '#e8eaef',
    bgEffect: 'grid',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'soft',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: SEMINAR_THEME_CONFIG,
}

const BUSINESS_LAUNCH_TEMPLATE = {
  name: '신제품 런칭 초대장',
  description: '럭셔리 미니멀 무드의 신제품·브랜드 런칭쇼 초대장. 골드와 베이지의 따뜻한 톤.',
  thumbnail: templateAssetUrl(LAUNCH_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(LAUNCH_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: 'PRESTIGE COLLECTION LAUNCH',
    greetingMessage: '오랜 시간 정성으로 빚어 온\n새로운 컬렉션을 선보이는 자리에\n가장 가까운 분들을 모십니다.\n\n빛나는 순간을 함께\n나누어 주시기를 청합니다.',
    eventDate: '2026-06-15',
    eventTime: 'PM 7:30',
    datetimeTitleBig: '2026. 06. 15. 월요일',
    datetimeTitleSmall: 'PM 7:30',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '청담 플래그십 라운지',
      hall: '',
      address: '서울특별시 강남구 도산대로 320',
      lat: 37.5232,
      lng: 127.0414,
    },
    venueTitleBig: '청담 플래그십 라운지',
    shareTitle: 'PRESTIGE COLLECTION LAUNCH',
    shareText: '2026.06.15 월요일 PM 7:30 · 청담 플래그십 라운지',
  },
  defaultModules: [
    { id: 'lan-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'prestige-product',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        monthDay: '06.15',
        inviteLabel: 'INVITATION',
        title: 'PRESTIGE COLLECTION LAUNCH',
        bottomText: 'Mon. 15 Jun 2026 · PM 7:30',
        subText: 'Cheongdam Flagship Lounge',
      },
    }},
    { id: 'lan-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'lan-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'lan-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'lan-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'lan-gallery-1',  type: 'gallery',  order: 6, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: launchGallery,
      layout: 'grid',
    }},
    { id: 'lan-tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">분당선 압구정로데오역 5번 출구 도보 8분</p>' },
        { label: '버스',   content: '<p style="text-align: center">청담동 정류장 하차 후 도보 5분</p>' },
        { label: '발레파킹', content: '<p style="text-align: center">건물 입구에서 발레파킹 가능</p>' },
      ],
    }},
    { id: 'lan-guestbook-1', type: 'guestbook', order: 8, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: '제주명조',
    accentColor: '#a08658',
    bgColor: '#f8f5f0',
    spacingColor: '#ece5d8',
    bgEffect: 'paper',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: LAUNCH_THEME_CONFIG,
}

const SPORTS_TENNIS_TEMPLATE = {
  name: '오픈 테니스 컵 초대장',
  description: '오픈 테니스 토너먼트, 동호회 대회 초대장. 비비드한 청록·라임 컬러로 액티브한 무드.',
  thumbnail: templateAssetUrl(TENNIS_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(TENNIS_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: 'OPEN TENNIS CUP 2026',
    greetingMessage: '함께 즐기는 코트 위의 시간,\n2026 오픈 테니스 컵에 초대합니다.\n\n실력보다 즐거움을 나누는 대회입니다.\n가벼운 마음으로 함께해 주세요!',
    eventDate: '2026-07-12',
    eventTime: '오전 9시',
    datetimeTitleBig: '2026. 07. 12. 일요일',
    datetimeTitleSmall: 'AM 9:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '양재 시민의숲 테니스장',
      hall: '',
      address: '서울특별시 서초구 매헌로 99',
      lat: 37.4716,
      lng: 127.0387,
    },
    venueTitleBig: '양재 시민의숲 테니스장',
    shareTitle: 'OPEN TENNIS CUP 2026',
    shareText: '2026.07.12 일요일 AM 9:00 · 양재 시민의숲 테니스장',
  },
  defaultModules: [
    { id: 'ten-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'event-headline',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'INVITATION',
        title: '2026 OPEN\nTENNIS CUP',
        dateLine: '26. 07. 12. (Sun) AM 9:00',
        subText: '양재 시민의숲 테니스장',
      },
    }},
    { id: 'ten-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'ten-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'ten-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'ten-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'ten-gallery-1',  type: 'gallery',  order: 6, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: tennisGallery,
      layout: 'grid',
    }},
    { id: 'ten-tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '대회 안내', koreanLabelVisible: true,
      englishTitle: 'Tournament Info', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '경기 방식', content: '<p style="text-align: center">단·복식 토너먼트<br>1세트 6게임 (타이브레이크 적용)</p>' },
        { label: '준비물',   content: '<p style="text-align: center">개인 라켓, 운동복, 코트화<br>공은 대회측 제공</p>' },
        { label: '오시는 길', content: '<p style="text-align: center">신분당선 양재시민의숲역 5번 출구 도보 7분</p>' },
      ],
    }},
    { id: 'ten-guestbook-1', type: 'guestbook', order: 8, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: 'Noto Sans KR',
    accentColor: '#1aaedb',
    bgColor: '#ffffff',
    spacingColor: '#e3f3fa',
    bgEffect: 'grid',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'pop',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: TENNIS_THEME_CONFIG,
}

const SOCIAL_VIP_NIGHT_TEMPLATE = {
  name: 'VIP 나이트 초대장',
  description: '깊은 네이비와 골드의 다크 럭셔리 무드. VIP 모임, 네트워킹 디너, 프라이빗 파티 초대장.',
  thumbnail: templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: 'VIP NIGHT',
    greetingMessage: '특별한 인연으로 맺어진 분들을 모시고\n뜻깊은 저녁을 함께 나누고자 합니다.\n\n바쁘신 일상 속 잠시,\n품격 있는 시간으로 모십니다.',
    eventDate: '2026-09-26',
    eventTime: 'PM 7:00',
    datetimeTitleBig: '2026. 09. 26. 토요일',
    datetimeTitleSmall: 'PM 7:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '강남 시그니처 라운지',
      hall: '23F',
      address: '서울특별시 강남구 테헤란로 511',
      lat: 37.5083,
      lng: 127.0635,
    },
    venueTitleBig: '강남 시그니처 라운지 23F',
    shareTitle: 'VIP NIGHT',
    shareText: '2026.09.26 토요일 PM 7:00 · 강남 시그니처 라운지',
  },
  defaultModules: [
    { id: 'vip-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'dark-invitation',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'INVITATION',
        brandTitle: 'VIP NIGHT',
        bottomText: 'Sat. 26 Sep 2026 · PM 7:00',
        subText: 'Gangnam Signature Lounge · 23F',
      },
    }},
    { id: 'vip-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'vip-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'vip-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'vip-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'vip-gallery-1',  type: 'gallery',  order: 6, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: vipNightGallery,
      layout: 'grid',
    }},
    { id: 'vip-tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '드레스 코드', content: '<p style="text-align: center">Cocktail Attire</p><p style="text-align: center">차분한 톤의 격식 있는 의상으로 함께해 주세요.</p>' },
        { label: '오시는 길',   content: '<p style="text-align: center">2호선 강남역 11번 출구 도보 5분</p>' },
        { label: '주차',       content: '<p style="text-align: center">발레파킹 가능 · 빌딩 지하 1~3층</p>' },
      ],
    }},
    { id: 'vip-guestbook-1', type: 'guestbook', order: 8, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: 'Noto Sans KR',
    accentColor: '#d4af37',
    bgColor: '#142339',
    spacingColor: '#1d2e47',
    bgEffect: 'none',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: VIP_NIGHT_THEME_CONFIG,
}

const SEASONAL_YEAREND_TEMPLATE = {
  name: '송년회 초대장',
  description: '한 해를 마무리하며 마음을 전하는 송년회 초대장. 따뜻한 아이보리와 골드 왁스 무드.',
  thumbnail: templateAssetUrl(YEAREND_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(YEAREND_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: '2026 SEASON FINALE 송년회',
    greetingMessage: '함께해 주신 한 해에 감사드립니다.\n\n돌아보면 모든 순간이\n여러분 덕분에 빛났습니다.\n\n저물어 가는 한 해의 마지막 자리에\n따뜻한 발걸음 부탁드립니다.',
    eventDate: '2026-12-20',
    eventTime: 'PM 6:00',
    datetimeTitleBig: '2026. 12. 20. 토요일',
    datetimeTitleSmall: 'PM 6:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '한남 빈티지 라운지',
      hall: '',
      address: '서울특별시 용산구 한남대로 27',
      lat: 37.5346,
      lng: 127.0046,
    },
    venueTitleBig: '한남 빈티지 라운지',
    shareTitle: '2026 SEASON FINALE 송년회',
    shareText: '2026.12.20 토요일 PM 6:00 · 한남 빈티지 라운지',
  },
  defaultModules: [
    { id: 'yer-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'seal-emblem',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'circle',
      textSlots: {
        englishTagline: '2026 SEASON FINALE',
        title: '한 해의 마지막,\n따뜻한 자리에 모십니다',
        bottomText: '2026. 12. 20. (토) PM 6:00',
        subText: '한남 빈티지 라운지',
      },
    }},
    { id: 'yer-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'yer-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'yer-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'yer-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'yer-gallery-1',  type: 'gallery',  order: 6, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: yearendGallery,
      layout: 'grid',
    }},
    { id: 'yer-tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '드레스 코드', content: '<p style="text-align: center">Warm &amp; Cozy</p><p style="text-align: center">자유롭게, 편안한 차림으로 와주세요.</p>' },
        { label: '메뉴',       content: '<p style="text-align: center">코스 디너 + 와인 페어링</p>' },
        { label: '오시는 길',   content: '<p style="text-align: center">6호선 한강진역 1번 출구 도보 6분</p>' },
      ],
    }},
    { id: 'yer-guestbook-1', type: 'guestbook', order: 8, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: '고운돋움',
    accentColor: '#bf8c4d',
    bgColor: '#faf6ee',
    spacingColor: '#f0e6d3',
    bgEffect: 'paper',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: YEAREND_THEME_CONFIG,
}

// 생일 — 따뜻한 코랄, accent-bar (사진 없음)
const BIRTHDAY_TEMPLATE = {
  name: '생일 초대장',
  description: '소중한 사람들과 함께하는 생일·환갑 초대장. 따뜻한 코랄 톤의 액센트 바 레이아웃, 사진 없이 완성.',
  thumbnail: templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'main_img.jpg'),
    invitationTitle: '생일에 초대합니다',
    greetingMessage: '소중한 사람들과 함께\n특별한 하루를 보내고 싶습니다.\n\n귀한 걸음으로\n이 날을 더욱 빛내 주세요.',
    eventDate: '2026-08-22',
    eventTime: 'PM 5:00',
    datetimeTitleBig: '2026. 08. 22. 토요일',
    datetimeTitleSmall: 'PM 5:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '더 가든 파티하우스',
      hall: '2F 홀',
      address: '서울특별시 마포구 양화로 45',
      lat: 37.5511,
      lng: 126.9142,
    },
    venueTitleBig: '더 가든 파티하우스 2F',
    shareTitle: '생일 초대',
    shareText: '2026.08.22 토요일 PM 5:00 · 더 가든 파티하우스',
    greetingAuthorVisible: false,
  },
  defaultModules: [
    { id: 'bir-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'sticker-pop',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'rounded',
      photoTilt: -3,
      decorations: ['confetti'],
      backgroundPattern: 'dots',
      textSlots: {
        mainTitle: 'HAPPY\nBIRTHDAY!',
        bottomText: '2026. 08. 22. (토) PM 5:00',
        subText: '더 가든 파티하우스 2F',
      },
    }},
    { id: 'bir-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'bir-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'bir-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'bir-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'bir-rsvp-1', type: 'rsvp', order: 6, required: false, config: {
      koreanTitle: '참석 여부', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      questions: [
        { id: 'bir-rsvp-attend', type: 'single-choice', label: '참석하시나요?',       required: true, options: ['참석', '불참석'] },
        { id: 'bir-rsvp-count',  type: 'number',        label: '함께 오는 인원(본인 포함)', required: false, placeholder: '예: 2' },
        { id: 'bir-rsvp-name',   type: 'text-short',    label: '성함',                required: true, placeholder: '성함을 입력하세요.' },
      ],
    }},
    { id: 'bir-interview-1', type: 'interview', order: 7, required: false, config: {
      koreanTitle: '주인공 인터뷰', koreanLabelVisible: true,
      englishTitle: 'Interview', labelVisible: true,
      titleBigVisible: false, titleSmallVisible: false,
      items: [
        { question: '<p>올 한 해 가장 기억에 남는 순간은?</p>', answer: '<p>좋아하는 사람들과 함께한 모든 날들이요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>다가올 한 해 이루고 싶은 것이 있다면?</p>', answer: '<p>더 자주 웃고, 더 자주 모이는 한 해가 되었으면 해요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>오늘 와주신 분들께 한마디!</p>', answer: '<p>바쁜 하루 중에 와주셔서 정말 고마워요. 오늘 실컷 즐겨요!</p>', questionVisible: true, answerVisible: true },
      ],
    }},
    { id: 'bir-gallery-1', type: 'gallery', order: 8, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: BIRTHDAY_GALLERY_IMAGES,
      layout: 'grid',
    }},
    { id: 'bir-account-1', type: 'account', order: 9, required: false, config: {
      koreanTitle: '마음 전하실 곳', koreanLabelVisible: true,
      englishTitle: 'Gift', labelVisible: true,
      titleBig: '마음 전하실 곳', titleBigVisible: true,
      groups: [
        { label: '축하의 마음', accounts: [
          { bank: '국민은행', number: '123-45-6789012', name: '홍길동' },
        ]},
      ],
    }},
    { id: 'bir-guestbook-1', type: 'guestbook', order: 10, required: false, config: {
      koreanTitle: '축하 한마디', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: '고운돋움',
    accentColor: '#f2683c',
    bgColor: '#fff8f2',
    spacingColor: '#ffe4d3',
    bgEffect: 'dot',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'pop',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: BIRTHDAY_THEME_CONFIG,
}

// 교육/기관 — 네이비 격식, corp-headline (사진 없음)
const GRADUATION_TEMPLATE = {
  name: '졸업식 초대장',
  description: '학교·기관 행사를 위한 격식 있는 초대장. 네이비 톤의 단정한 코퍼레이트 레이아웃, 사진 없이 완성.',
  thumbnail: templateAssetUrl(GRADUATION_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(GRADUATION_TEMPLATE_ID, 'main_img.jpg'),
    invitationTitle: '졸업식에 초대합니다',
    greetingMessage: '뜻깊은 배움의 여정을 마치고\n새로운 출발선에 서는 자리에\n귀한 분들을 모십니다.\n\n함께하시어\n축하와 격려를 나누어 주시기 바랍니다.',
    eventDate: '2027-02-05',
    eventTime: 'AM 10:00',
    datetimeTitleBig: '2027. 02. 05. 금요일',
    datetimeTitleSmall: 'AM 10:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '한빛대학교 대강당',
      hall: '',
      address: '서울특별시 성북구 안암로 145',
      lat: 37.5894,
      lng: 127.0326,
    },
    venueTitleBig: '한빛대학교 대강당',
    shareTitle: '졸업식 안내',
    shareText: '2027.02.05 금요일 AM 10:00 · 한빛대학교 대강당',
    greetingAuthorVisible: false,
  },
  defaultModules: [
    { id: 'grad-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'half-split',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'GRADUATION',
        title: '2027\n학위수여식',
        bottomText: '2027. 02. 05. (금) AM 10:00',
        subText: '한빛대학교 대강당',
      },
    }},
    { id: 'grad-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'grad-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'grad-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'grad-dday-1',     type: 'dday',     order: 5, required: false, config: {
      koreanTitle: '디데이', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'grad-tab-1', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '식순 · 안내', koreanLabelVisible: true,
      englishTitle: 'Program', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '식순',       content: '<p style="text-align: center">개식 · 국민의례 · 학위수여 · 축사 · 학위기 수여 · 폐식</p>' },
        { label: '주차',       content: '<p style="text-align: center">교내 주차장 이용 · 행사 당일 무료</p>' },
        { label: '오시는 길',   content: '<p style="text-align: center">6호선 안암역 1번 출구 도보 10분</p>' },
      ],
    }},
    { id: 'grad-gallery-1', type: 'gallery', order: 7, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: GRADUATION_GALLERY_IMAGES,
      layout: 'grid',
    }},
    { id: 'grad-rsvp-1', type: 'rsvp', order: 8, required: false, config: {
      koreanTitle: '참석 회신', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      questions: [
        { id: 'grad-rsvp-attend', type: 'single-choice', label: '참석하시나요?',        required: true, options: ['참석', '불참석'] },
        { id: 'grad-rsvp-count',  type: 'number',        label: '동반 인원(본인 포함)', required: false, placeholder: '예: 2' },
        { id: 'grad-rsvp-name',   type: 'text-short',    label: '성함',                 required: true, placeholder: '성함을 입력하세요.' },
      ],
    }},
    { id: 'grad-contact-1', type: 'contact', order: 9, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBig: '', titleBigVisible: false,
      groups: [
        { label: '행사 문의', englishLabel: 'OFFICE', contacts: [
          { name: '학사 지원팀', phone: '' },
        ]},
      ],
    }},
    { id: 'grad-guestbook-1', type: 'guestbook', order: 10, required: false, config: {
      koreanTitle: '축하 방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: 'KoPubWorld돋움',
    accentColor: '#16305c',
    bgColor: '#ffffff',
    spacingColor: '#e7ecf3',
    bgEffect: 'grid',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'soft',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: GRADUATION_THEME_CONFIG,
}

// 아트/문화 — 모노크롬 갤러리, typo-only (사진 없음)
const EXHIBITION_TEMPLATE = {
  name: '전시회 초대장',
  description: '전시·연주·공연을 위한 미니멀 초대장. 모노크롬 타이포그래피로 담백하게, 사진 없이 완성.',
  thumbnail: templateAssetUrl(EXHIBITION_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(EXHIBITION_TEMPLATE_ID, 'main_img.jpg'),
    invitationTitle: '전시에 초대합니다',
    greetingMessage: '오랜 시간 담아 온 작업을\n조심스레 선보이는 자리입니다.\n\n느린 걸음으로 둘러보시며\n각자의 이야기를 만나 가시길 바랍니다.',
    eventDate: '2026-09-18',
    eventTime: 'PM 6:00',
    datetimeTitleBig: '2026. 09. 18. 금요일',
    datetimeTitleSmall: 'PM 6:00 오프닝',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '더 화이트 갤러리',
      hall: 'B1',
      address: '서울특별시 종로구 삼청로 30',
      lat: 37.5820,
      lng: 126.9816,
    },
    venueTitleBig: '더 화이트 갤러리 B1',
    shareTitle: '전시 오프닝 초대',
    shareText: '2026.09.18 금요일 PM 6:00 · 더 화이트 갤러리',
    greetingAuthorVisible: false,
  },
  defaultModules: [
    { id: 'exh-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'overlay-title',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        title: '고요한\n시간들',
        subText: '2026. 09. 18. (금) PM 6:00 · 더 화이트 갤러리 B1',
      },
    }},
    { id: 'exh-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'exh-interview-1', type: 'interview', order: 3, required: false, config: {
      koreanTitle: '작가의 말', koreanLabelVisible: true,
      englishTitle: 'Artist Note', labelVisible: true,
      titleBigVisible: false, titleSmallVisible: false,
      items: [
        { question: '<p>이번 전시는 어떤 이야기를 담고 있나요?</p>', answer: '<p>매일의 고요한 시간들, 그 안에 머무는 감정의 결을 담았습니다.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>관람객이 어떻게 봐주었으면 하나요?</p>', answer: '<p>정답을 찾기보다, 각자의 속도로 천천히 머물다 가시길 바랍니다.</p>', questionVisible: true, answerVisible: true },
      ],
    }},
    { id: 'exh-datetime-1', type: 'datetime', order: 4, required: false, config: {} },
    { id: 'exh-venue-1',    type: 'venue',    order: 5, required: false, config: { showMap: true } },
    { id: 'exh-dday-1',     type: 'dday',     order: 6, required: false, config: {
      koreanTitle: '오프닝까지', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    { id: 'exh-tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '관람 안내', koreanLabelVisible: true,
      englishTitle: 'Visit', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '관람 시간', content: '<p style="text-align: center">11:00 – 19:00<br>매주 월요일 휴관</p>' },
        { label: '입장',       content: '<p style="text-align: center">무료 관람 · 별도 예약 없이 입장 가능</p>' },
        { label: '오시는 길',   content: '<p style="text-align: center">3호선 안국역 1번 출구 도보 8분</p>' },
      ],
    }},
    { id: 'exh-gallery-1', type: 'gallery', order: 8, required: false, config: {
      koreanTitle: '전시 미리보기', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: EXHIBITION_GALLERY_IMAGES,
      layout: 'grid',
    }},
    { id: 'exh-contact-1', type: 'contact', order: 9, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBig: '', titleBigVisible: false,
      groups: [
        { label: '갤러리 문의', englishLabel: 'GALLERY', contacts: [
          { name: '더 화이트 갤러리', phone: '' },
        ]},
      ],
    }},
    { id: 'exh-guestbook-1', type: 'guestbook', order: 10, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: '제주명조',
    accentColor: '#141414',
    bgColor: '#f4f1ea',
    spacingColor: '#e5e0d5',
    bgEffect: 'paper',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: EXHIBITION_THEME_CONFIG,
}

// 부고/추모 — 차분한 세이지, typo-only (사진 없음, dday·갤러리 제외)
const MEMORIAL_TEMPLATE = {
  name: '부고 · 추모 안내',
  description: '부고와 추모를 위한 절제된 안내장. 차분한 세이지·차콜 톤으로 발인 일시·빈소·마음 전하실 곳을 안내.',
  thumbnail: templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'main_img.jpg'),
    invitationTitle: '삼가 고인의 별세를 알려드립니다',
    greetingMessage: '평소 고인께서 베풀어 주신\n따뜻한 정에 깊이 감사드립니다.\n\n갑작스러운 비보를 전하게 되어\n송구한 마음뿐입니다.\n\n부디 오시어 고인의\n마지막 길을 함께해 주시면\n감사하겠습니다.',
    eventDate: '2026-08-05',
    eventTime: 'AM 7:00',
    datetimeTitleBig: '발인 · 2026. 08. 05. 수요일',
    datetimeTitleSmall: 'AM 7:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '한빛장례식장',
      hall: '3층 특7호실',
      address: '서울특별시 서대문구 연세로 50',
      lat: 37.5623,
      lng: 126.9376,
    },
    venueTitleBig: '한빛장례식장 3층 특7호실',
    shareTitle: '부고 안내',
    shareText: '발인 2026.08.05 수요일 AM 7:00 · 한빛장례식장',
    greetingKoreanTitle: '부고',
    greetingEnglishTitle: 'In Memoriam',
    greetingAuthor: '상주 일동',
    greetingAuthorVisible: true,
  },
  defaultModules: [
    { id: 'mem-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'classic',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'arch',
      showNames: true,
      textSlots: {
        topText: '삼가 고인의 명복을 빕니다',
        bottomText: '발인 2026. 08. 05. (수) AM 7:00',
        subText: '한빛장례식장 3층 특7호실',
      },
    }},
    { id: 'mem-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'mem-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'mem-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    { id: 'mem-contact-1', type: 'contact', order: 5, required: false, config: {
      koreanTitle: '상주', koreanLabelVisible: true,
      englishTitle: 'Family', labelVisible: true,
      titleBig: '', titleBigVisible: false,
      groups: [
        { label: '상주', englishLabel: 'CHIEF MOURNER', contacts: [
          { name: '장남 홍길동', phone: '' },
          { name: '차남 홍길서', phone: '' },
        ]},
      ],
    }},
    { id: 'mem-tab-1', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '조문 안내', content: '<p style="text-align: center">조문은 24시간 가능합니다.</p>' },
        { label: '장지',     content: '<p style="text-align: center">하늘추모공원 (경기도 파주시)</p>' },
        { label: '오시는 길', content: '<p style="text-align: center">2호선 신촌역 2번 출구 · 장례식장 지하주차장 이용</p>' },
      ],
    }},
    { id: 'mem-account-1', type: 'account', order: 7, required: false, config: {
      koreanTitle: '마음 전하실 곳', koreanLabelVisible: true,
      englishTitle: 'Condolence', labelVisible: true,
      titleBig: '마음 전하실 곳', titleBigVisible: true,
      groups: [
        { label: '조의금', accounts: [
          { bank: '농협', number: '302-1234-5678-91', name: '상주 홍길동' },
        ]},
      ],
    }},
    { id: 'mem-guestbook-1', type: 'guestbook', order: 8, required: false, config: {
      koreanTitle: '추모의 글', koreanLabelVisible: true,
      englishTitle: 'Tribute', labelVisible: true,
    }},
  ],
  styles: {
    font: '나눔명조',
    accentColor: '#3f4f45',
    bgColor: '#f3f4f1',
    spacingColor: '#e2e5df',
    bgEffect: 'none',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'soft',
    showEnglishTitle: false,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: MEMORIAL_THEME_CONFIG,
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
      // 관리자 편집 보존 — 시드는 FK만 동기화하고, 콘텐츠 필드는 건드리지 않는다.
      update: {
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

  // 신규 템플릿 5종 (2026-05-01)
  console.log('Seeding new templates (seminar/launch/tennis/vip-night/yearend)...')
  const businessCategory = await prisma.category.findUnique({ where: { slug: 'business' } })
  const sportsCategory   = await prisma.category.findUnique({ where: { slug: 'sports' } })
  const socialCategory   = await prisma.category.findUnique({ where: { slug: 'social' } })
  const seasonalCategory = await prisma.category.findUnique({ where: { slug: 'seasonal' } })

  const seminarSub = businessCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: businessCategory.id, slug: 'seminar' } })
    : null
  const launchSub = businessCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: businessCategory.id, slug: 'launch' } })
    : null
  const tennisSub = sportsCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: sportsCategory.id, slug: 'tennis' } })
    : null
  const regularMeetingSub = socialCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: socialCategory.id, slug: 'regular-meeting' } })
    : null
  const yearEndSub = seasonalCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: seasonalCategory.id, slug: 'year-end' } })
    : null

  if (businessCategory) {
    await prisma.template.upsert({
      where: { id: 'business-seminar-template-001' },
      update: { categoryId: businessCategory.id, subcategoryId: seminarSub?.id ?? null },
      create: { id: 'business-seminar-template-001', ...BUSINESS_SEMINAR_TEMPLATE, categoryId: businessCategory.id, subcategoryId: seminarSub?.id ?? null },
    })
    await prisma.template.upsert({
      where: { id: 'business-launch-template-001' },
      update: { categoryId: businessCategory.id, subcategoryId: launchSub?.id ?? null },
      create: { id: 'business-launch-template-001', ...BUSINESS_LAUNCH_TEMPLATE, categoryId: businessCategory.id, subcategoryId: launchSub?.id ?? null },
    })
  }

  if (sportsCategory) {
    await prisma.template.upsert({
      where: { id: 'sports-tennis-template-001' },
      update: { categoryId: sportsCategory.id, subcategoryId: tennisSub?.id ?? null },
      create: { id: 'sports-tennis-template-001', ...SPORTS_TENNIS_TEMPLATE, categoryId: sportsCategory.id, subcategoryId: tennisSub?.id ?? null },
    })
  }

  if (socialCategory) {
    await prisma.template.upsert({
      where: { id: 'social-vip-night-template-001' },
      update: { categoryId: socialCategory.id, subcategoryId: regularMeetingSub?.id ?? null },
      create: { id: 'social-vip-night-template-001', ...SOCIAL_VIP_NIGHT_TEMPLATE, categoryId: socialCategory.id, subcategoryId: regularMeetingSub?.id ?? null },
    })
  }

  if (seasonalCategory) {
    await prisma.template.upsert({
      where: { id: 'seasonal-yearend-template-001' },
      update: { categoryId: seasonalCategory.id, subcategoryId: yearEndSub?.id ?? null },
      create: { id: 'seasonal-yearend-template-001', ...SEASONAL_YEAREND_TEMPLATE, categoryId: seasonalCategory.id, subcategoryId: yearEndSub?.id ?? null },
    })
  }

  // 신규 템플릿 4종 — 빈 카테고리 채우기 (생일/교육/문화/부고, 2026-07-13)
  console.log('Seeding new templates (birthday/graduation/exhibition/memorial)...')
  const birthdayCategory  = await prisma.category.findUnique({ where: { slug: 'birthday' } })
  const educationCategory = await prisma.category.findUnique({ where: { slug: 'education' } })
  const cultureCategory   = await prisma.category.findUnique({ where: { slug: 'culture' } })
  const memorialCategory  = await prisma.category.findUnique({ where: { slug: 'memorial' } })

  const birthdaySub = birthdayCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: birthdayCategory.id, slug: 'birthday-general' } })
    : null
  const graduationSub = educationCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: educationCategory.id, slug: 'graduation' } })
    : null
  const exhibitionSub = cultureCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: cultureCategory.id, slug: 'exhibition' } })
    : null
  const obituarySub = memorialCategory
    ? await prisma.subcategory.findFirst({ where: { categoryId: memorialCategory.id, slug: 'obituary' } })
    : null

  if (birthdayCategory) {
    await prisma.template.upsert({
      where: { id: BIRTHDAY_TEMPLATE_ID },
      update: { ...BIRTHDAY_TEMPLATE, categoryId: birthdayCategory.id, subcategoryId: birthdaySub?.id ?? null },
      create: { id: BIRTHDAY_TEMPLATE_ID, ...BIRTHDAY_TEMPLATE, categoryId: birthdayCategory.id, subcategoryId: birthdaySub?.id ?? null },
    })
  }

  if (educationCategory) {
    await prisma.template.upsert({
      where: { id: GRADUATION_TEMPLATE_ID },
      update: { ...GRADUATION_TEMPLATE, categoryId: educationCategory.id, subcategoryId: graduationSub?.id ?? null },
      create: { id: GRADUATION_TEMPLATE_ID, ...GRADUATION_TEMPLATE, categoryId: educationCategory.id, subcategoryId: graduationSub?.id ?? null },
    })
  }

  if (cultureCategory) {
    await prisma.template.upsert({
      where: { id: EXHIBITION_TEMPLATE_ID },
      update: { ...EXHIBITION_TEMPLATE, categoryId: cultureCategory.id, subcategoryId: exhibitionSub?.id ?? null },
      create: { id: EXHIBITION_TEMPLATE_ID, ...EXHIBITION_TEMPLATE, categoryId: cultureCategory.id, subcategoryId: exhibitionSub?.id ?? null },
    })
  }

  if (memorialCategory) {
    await prisma.template.upsert({
      where: { id: MEMORIAL_TEMPLATE_ID },
      update: { ...MEMORIAL_TEMPLATE, categoryId: memorialCategory.id, subcategoryId: obituarySub?.id ?? null },
      create: { id: MEMORIAL_TEMPLATE_ID, ...MEMORIAL_TEMPLATE, categoryId: memorialCategory.id, subcategoryId: obituarySub?.id ?? null },
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
