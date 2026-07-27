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
const BIRTHDAY_KIDS_TEMPLATE_ID = 'birthday-kids-template-001'
const MEMORIAL_TEMPLATE_ID = 'memorial-obituary-template-001'

// ── 템플릿 행사일 유틸 ───────────────────────────────────────────────────────
// 시드에 절대 날짜를 박으면 시간이 지나며 미리보기에 "D+65" 처럼 이미 끝난 행사가 뜬다.
// 시드 실행 시점 기준 상대 날짜로 만들고, 화면에 찍히는 문자열도 전부 이 날짜에서 파생시킨다.
const SEED_TODAY = new Date()
const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface EventDay {
  /** contentJson.eventDate 로 저장되는 ISO 날짜 (YYYY-MM-DD) */
  iso: string
  /** 2026. 09. 26. 토요일 */
  koFull: string
  /** 2026. 09. 26. (토) */
  koShort: string
  /** Sat. 26 Sep 2026 */
  enShort: string
  /** 2026.09.26 토요일 */
  koCompact: string
}

/**
 * `minDays` 일 이후 중 지정한 요일에 처음 걸리는 날.
 * 돌잔치가 화요일 오전, 학위수여식이 일요일에 잡히는 것을 막는다.
 * weekday: 0=일 … 6=토
 */
function eventDayOn(minDays: number, weekday: number): EventDay {
  for (let d = minDays; d < minDays + 7; d++) {
    const probe = new Date(SEED_TODAY)
    probe.setDate(probe.getDate() + d)
    if (probe.getDay() === weekday) return eventDay(d)
  }
  return eventDay(minDays)
}

/** 송년회처럼 계절이 고정된 행사 — 가장 가까운 12월 셋째 주 토요일. */
function nextDecemberSaturday(): EventDay {
  for (let year = SEED_TODAY.getFullYear(); year <= SEED_TODAY.getFullYear() + 1; year++) {
    const first = new Date(year, 11, 1)
    // 12월 첫 토요일 → 셋째 토요일
    const firstSat = 1 + ((6 - first.getDay() + 7) % 7)
    const target = new Date(year, 11, firstSat + 14)
    const diff = Math.round((target.getTime() - new Date(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth(), SEED_TODAY.getDate()).getTime()) / 86400000)
    if (diff >= 21) return eventDay(diff)
  }
  return eventDay(70)
}

/**
 * 특정 행사일의 `n`일 전.
 * 회신·입금 마감처럼 **행사일에 종속된** 날짜는 반드시 이걸로 파생시킨다.
 * `eventDay(n)` 은 오늘 기준이라, 계절 고정 행사(송년회)에 쓰면 마감이 행사보다
 * 몇 달 앞서는 값이 나온다.
 */
function daysBefore(day: EventDay, n: number): EventDay {
  const target = new Date(`${day.iso}T00:00:00Z`)
  const today = Date.UTC(SEED_TODAY.getFullYear(), SEED_TODAY.getMonth(), SEED_TODAY.getDate())
  return eventDay(Math.round((target.getTime() - today) / 86400000) - n)
}

// ── 템플릿 콘텐츠 동기화 정책 ────────────────────────────────────────────────
// 기본값은 FK(카테고리·서브카테고리)만 동기화하고 콘텐츠 필드는 건드리지 않는다.
// 관리자가 /admin/templates 에서 손댄 내용을 재배포가 되돌리면 안 되기 때문이다.
//
// 템플릿 개편처럼 시드가 정본(source of truth)이 되어야 할 때만
// `SEED_SYNC_TEMPLATES=1` 을 켜서 콘텐츠까지 덮어쓴다.
//
//   docker exec -e SEED_SYNC_TEMPLATES=1 <container> npm run prisma:seed
const SYNC_TEMPLATE_CONTENT = process.env.SEED_SYNC_TEMPLATES === '1'

/** upsert 의 update 브랜치 값. 플래그가 꺼져 있으면 FK 만 반환한다. */
function templateUpdate<T extends object>(tpl: T, fk: { categoryId: string; subcategoryId: string | null }) {
  return SYNC_TEMPLATE_CONTENT ? { ...tpl, ...fk } : fk
}

function eventDay(daysFromNow: number): EventDay {
  const d = new Date(SEED_TODAY)
  d.setDate(d.getDate() + daysFromNow)
  const y = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const ko = KO_WEEKDAYS[d.getDay()]
  return {
    iso: `${y}-${mm}-${dd}`,
    koFull: `${y}. ${mm}. ${dd}. ${ko}요일`,
    koShort: `${y}. ${mm}. ${dd}. (${ko})`,
    enShort: `${EN_WEEKDAYS[d.getDay()]}. ${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${y}`,
    koCompact: `${y}.${mm}.${dd} ${ko}요일`,
  }
}

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


// ─────────────────────────────────────────────────────────────────────────────
// 클래식 웨딩 청첩장 (wedding-classic-template-001) — 재작성 시드 블록
//
// 감사 문서 docs/template-audit/01-wedding-classic.md 의 W-1 ~ W-12 반영본.
// prisma/seed.ts 의 기존 `GALLERY_IMAGES` / `WEDDING_TEMPLATE` 선언부를 이 블록으로 교체한다.
// (상수명은 그대로 유지 — 다른 곳에서 참조 중)
// ─────────────────────────────────────────────────────────────────────────────

// W-1 대응. 갤러리는 커버(main_img)를 재사용하지 않는다.
// 기존 키는 gallery/001.jpg ~ 009.jpg 였다. 전량 재생성이므로 2자리 신규 키로 옮겨
// 오브젝트스토리지/브라우저 캐시가 옛 사진을 물고 있는 상황을 원천 차단한다.
const GALLERY_IMAGES = Array.from({ length: 9 }, (_, i) =>
  templateAssetUrl(WEDDING_TEMPLATE_ID, `gallery/${String(i + 1).padStart(2, '0')}.jpg`)
)

// 타임라인은 "첫 만남 / 첫 여행 / 프로포즈" — 웨딩드레스가 아니라 연애 시절 스냅이어야 한다.
// 예전엔 GALLERY_IMAGES[0~2] 를 그대로 돌려써서 같은 사진이 한 페이지에 두 번 나왔다.
const WEDDING_TIMELINE_IMAGES = Array.from({ length: 3 }, (_, i) =>
  templateAssetUrl(WEDDING_TEMPLATE_ID, `timeline/${String(i + 1).padStart(2, '0')}.jpg`)
)

// 안내사항 슬라이드 이미지(16:9). 텍스트 가독성이 우선이라 인물 없는 정물/공간 컷.
const WEDDING_SLIDE_IMAGES = Array.from({ length: 3 }, (_, i) =>
  templateAssetUrl(WEDDING_TEMPLATE_ID, `slide/${String(i + 1).padStart(2, '0')}.jpg`)
)

// C-7 — 절대 날짜 금지. 청첩장 권장 리드타임 85일(약 3개월 전 발송).
const WEDDING_DAY = eventDayOn(85, 0)   // 예식은 주말 낮이 관례다 (일요일)
// 참석 회신 마감은 예식 2주 전. 식사 인원 확정 시점과 맞춘다.
const WEDDING_RSVP_DUE = daysBefore(WEDDING_DAY, 14)

const WEDDING_TEMPLATE = {
  name: '클래식 웨딩 청첩장',
  description: '크림·테라코타 톤의 클래식 웨딩 청첩장. 인사말, 두 사람 소개, 예식 일시·장소, 오시는 길, 안내사항, 갤러리, 참석 회신, 마음 전하실 곳까지.',
  thumbnail: templateAssetUrl(WEDDING_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(WEDDING_TEMPLATE_ID, 'main_img_v2.jpg'),
    invitationTitle: '소중한 분들을 초대합니다',
    greetingMessage: '저희 두 사람의 작은 만남이\n진실한 사랑으로 꽃피어\n오늘 이 자리를 빛내는 결혼식으로 이어졌습니다.\n\n평생 서로를 귀히 여기며\n처음의 설렘과 순수함을 잃지 않고\n존중하고 아껴 나가겠습니다.\n\n귀한 걸음으로 축복해 주시면\n더할 나위 없는 기쁨으로 간직하겠습니다.',
    greetingTitleSmall: '',
    greetingTitleSmallVisible: false,
    // greetingAuthor 는 일부러 비운다.
    // GreetingSection 은 groom/bride 가 있으면 '김민준 · 이지수' 를 자동 조립하므로,
    // 여기에 문자열을 박으면 사용자가 에디터에서 이름을 바꿔도 서명만 옛 이름으로 남는다.
    groom: { last: '김', first: '민준', role: '신랑', fatherName: '김대호', motherName: '박정숙' },
    bride: { last: '이', first: '지수', role: '신부', fatherName: '이성훈', motherName: '최미래' },
    groomFirst: true,
    deceasedStyle: 'hanja',
    eventDate: WEDDING_DAY.iso,
    eventTime: '낮 12시 00분',
    // 라벨(예식 일시 / 예식 장소 / 인사말·Invitation)은 category-labels.ts 의 wedding 프리셋이
    // 이미 채운다 — 여기서 중복 지정하지 않는다.
    datetimeTitleBig: WEDDING_DAY.koFull,
    datetimeTitleSmall: '낮 12시 00분',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '서울 그랜드 웨딩홀',
      hall: '2층 그레이스홀',
      address: '서울특별시 강남구 테헤란로 123',
      // W-8 — 기존 좌표(37.4979, 127.0276)는 강남역 사거리 한복판이라
      // 핀이 지하철 출구·상가 위에 찍혔다. 주소(테헤란로 123)에 맞춰 건물 블록으로 이동.
      lat: 37.5004,
      lng: 127.0349,
    },
    // C-9 — venue.address 는 VenueSection 이 자동으로 한 줄 렌더한다.
    // venueTitleSmall 에 주소를 중복으로 넣지 않는다.
    venueTitleBig: '서울 그랜드 웨딩홀 2층 그레이스홀',
    // C-10 — 예약 대역. 사용자는 에디터에서 자기 번호로 교체한다.
    groomPhone: '010-0000-0000',
    bridePhone: '010-0000-0000',
    shareTitle: '김민준 · 이지수 결혼합니다',
    shareText: `${WEDDING_DAY.koCompact} 낮 12시 · 서울 그랜드 웨딩홀 2층 그레이스홀`,
  },
  // ── 모듈 순서 (W-2 / W-3) ──────────────────────────────────────────────────
  // 누구 → 왜(인사) → 두 사람 소개 → 언제 → 어디서 → 어떻게 가나 → 당일 안내
  // → 감상(갤러리·이야기·인터뷰) → 참석 회신 → 마음 → 연락처 → 방명록
  defaultModules: [
    { id: 'main-1', type: 'main', order: 1, required: true, config: {
      variant: 'classic',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      textSlots: {
        topText: '김민준\n그리고\n이지수',
        bottomText: `${WEDDING_DAY.koShort} 낮 12시 00분`,
        subText: '서울 그랜드 웨딩홀 2층 그레이스홀',
      },
    } },
    { id: 'greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    // 인사말 뒤 한 호흡. 같은 커플의 한복 컷.
    { id: 'midphoto-1', type: 'midphoto', order: 3, required: false, config: {
      image: templateAssetUrl(WEDDING_TEMPLATE_ID, 'sub_img_v2.jpg'),
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      noSideMargin: true,
    } },
    // W-4 — 부모 이름을 defaultContent.groom/bride 의 fatherName·motherName 과 일치시킨다.
    // (예전엔 '김아빠 · 박엄마' 라는 플레이스홀더가 남아 연락처와 어긋났다)
    { id: 'profile-1', type: 'profile', order: 4, required: false, config: {
      koreanTitle: '저희를 소개합니다',
      koreanLabelVisible: true,
      englishTitle: 'About Us',
      labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      persons: [
        {
          name: '김민준',
          image: templateAssetUrl(WEDDING_TEMPLATE_ID, 'profile/groom.jpg'),
          title: '1993. 12. 10.',
          hashtags: ['ISTP'],
          description: '<p style="text-align: left">김대호 · 박정숙의 아들</p>',
          descriptionVisible: true,
        },
        {
          name: '이지수',
          image: templateAssetUrl(WEDDING_TEMPLATE_ID, 'profile/bride.jpg'),
          title: '1995. 03. 14.',
          hashtags: ['ESTJ'],
          description: '<p style="text-align: right">이성훈 · 최미래의 딸</p>',
          descriptionVisible: true,
        },
      ],
    } },
    { id: 'datetime-1', type: 'datetime', order: 5, required: false, config: {} },
    { id: 'venue-1', type: 'venue', order: 6, required: false, config: { showMap: true } },
    // W-2 / C-11 — 오시는 길은 반드시 지도 바로 다음. 예전엔 8개 섹션 뒤에 있었다.
    { id: 'tab-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '오시는 길',
      koreanLabelVisible: true,
      englishTitle: 'Directions',
      labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">2호선 역삼역 3번 출구에서 도보 3분<br>2호선 · 신분당선 강남역 12번 출구에서 도보 10분</p>' },
        { label: '버스',   content: '<p style="text-align: center">간선 341, 360 · 역삼역 정류장 하차<br>지선 4412 · 국기원입구 정류장 하차</p>' },
        { label: '주차',   content: '<p style="text-align: center">웨딩홀 지하 1~4층 주차장 · 2시간 무료<br>2층 안내데스크에서 주차 등록을 도와드립니다.<br>주말에는 혼잡하니 대중교통을 권해 드립니다.</p>' },
        { label: '택시',   content: '<p style="text-align: center">"역삼역 서울 그랜드 웨딩홀"로 말씀해 주세요.<br>강남역 택시승강장에서 약 5분 거리입니다.</p>' },
      ],
    } },
    // W-7 — 기본값을 '강아지 화동 안내'(소수 사례) 에서 대다수가 그대로 쓰는 항목으로 교체.
    // 슬라이드 높이가 고정이라 본문이 길면 잘린다 → 각 슬라이드 본문을 4줄 이내로 유지.
    { id: 'slide-1', type: 'slide', order: 8, required: false, config: {
      koreanTitle: '안내사항',
      koreanLabelVisible: true,
      englishTitle: 'Information',
      labelVisible: true,
      titleBigVisible: false,
      slides: [
        {
          image: WEDDING_SLIDE_IMAGES[0],
          imageVisible: true,
          title: '<p style="text-align: center">화환 안내</p>',
          titleVisible: true,
          content: '<p style="text-align: center">축하 화환은 정중히 사양합니다.</p><p style="text-align: center">보내 주시려는 마음만 감사히 받겠습니다.</p>',
          contentVisible: true,
        },
        {
          image: WEDDING_SLIDE_IMAGES[1],
          imageVisible: true,
          title: '<p style="text-align: center">연회 &amp; 식사 안내</p>',
          titleVisible: true,
          content: '<p style="text-align: center">식사는 예식과 사진 촬영이 끝난 후</p><p style="text-align: center">웨딩홀 2층에서 뷔페식으로 진행됩니다.</p><p style="text-align: center">편안하게 즐겨 주시기 바랍니다.</p>',
          contentVisible: true,
        },
        {
          image: WEDDING_SLIDE_IMAGES[2],
          imageVisible: true,
          title: '<p style="text-align: center">사진 촬영 안내</p>',
          titleVisible: true,
          content: '<p style="text-align: center">예식 중 통로 촬영은 삼가 주시고</p><p style="text-align: center">식후 포토테이블에서 함께 사진 남겨 주세요.</p>',
          contentVisible: true,
        },
      ],
    } },
    // ── 감상 파트 ────────────────────────────────────────────────────────────
    { id: 'gallery-1', type: 'gallery', order: 9, required: false, config: {
      koreanTitle: '갤러리',
      koreanLabelVisible: true,
      englishTitle: 'Gallery',
      labelVisible: true,
      images: GALLERY_IMAGES,
      layout: 'grid',
    } },
    { id: 'timeline-1', type: 'timeline', order: 10, required: false, config: {
      koreanTitle: '우리의 이야기',
      koreanLabelVisible: true,
      englishTitle: 'Our Story',
      labelVisible: true,
      items: [
        { image: WEDDING_TIMELINE_IMAGES[0], title: '첫 만남',  content: '2020년 봄,\n우연한 자리에서 처음 만났습니다.', titleVisible: true, contentVisible: true },
        { image: WEDDING_TIMELINE_IMAGES[1], title: '첫 여행',  content: '함께 걸은 낯선 골목마다\n서로를 조금씩 더 알게 되었습니다.', titleVisible: true, contentVisible: true },
        { image: WEDDING_TIMELINE_IMAGES[2], title: '프로포즈', content: '늘 걷던 길 위에서\n평생을 함께하기로 약속했습니다.', titleVisible: true, contentVisible: true },
      ],
    } },
    // W-10 — timeline_polaroid 는 timeline 과 성격이 겹쳐(둘 다 '사진 + 짧은 글로 우리 이야기')
    // 기본 모듈에서 제외한다. 필요하면 에디터에서 추가. 약 1,500px 단축 + 스토리 중복 제거.
    // W-9 — 세 문항 모두 같은 형식(굵은 라벨 + 답변)으로 통일. Q3 만 라벨 없이 한 줄이던 것을 고침.
    { id: 'interview-1', type: 'interview', order: 11, required: false, config: {
      koreanTitle: '두 사람의 인터뷰',
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
          question: '<p>신혼여행은 어디로 가나요?</p>',
          answer: '<p><strong>두 사람</strong></p><p>멕시코 칸쿤으로 13박 14일 다녀옵니다.</p><p>돌아와서 못 뵌 분들께 차례로 인사드릴게요.</p>',
          questionVisible: true,
          answerVisible: true,
        },
      ],
    } },
    // ── 행동 유도 ────────────────────────────────────────────────────────────
    // 식사 인원을 정확히 잡는 것이 예식 준비의 핵심이라 동행 인원·식사 여부까지 받는다.
    { id: 'rsvp-1', type: 'rsvp', order: 12, required: false, config: {
      koreanTitle: '참석 회신',
      koreanLabelVisible: true,
      englishTitle: 'RSVP',
      labelVisible: true,
      titleBigVisible: false,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      deadline: WEDDING_RSVP_DUE.koShort,
      questions: [
        { id: 'rsvp-q-side',       type: 'single-choice', label: '어느 측 하객이신가요?', required: true,  options: ['신랑 측', '신부 측'] },
        { id: 'rsvp-q-attendance', type: 'single-choice', label: '참석하시나요?',         required: true,  options: ['참석', '불참'] },
        { id: 'rsvp-q-name',       type: 'text-short',    label: '성함',                  required: true,  placeholder: '성함을 입력해 주세요.' },
        { id: 'rsvp-q-count',      type: 'number',        label: '동행 인원 (본인 포함)',  required: true,  placeholder: '1' },
        { id: 'rsvp-q-meal',       type: 'single-choice', label: '식사하실 예정인가요?',   required: false, options: ['식사함', '식사 안 함'] },
        { id: 'rsvp-q-message',    type: 'text-long',     label: '전하고 싶은 말',         required: false, placeholder: '축하 인사나 전달 사항을 남겨 주세요.' },
      ],
    } },
    // W-5 / C-8 — '계좌 정보 / Account / 마음 전하실 곳' 3중 중복을 정리.
    { id: 'account-1', type: 'account', order: 13, required: false, config: {
      koreanTitle: '마음 전하실 곳',
      koreanLabelVisible: true,
      englishTitle: 'Account',
      labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '신랑 측', accounts: [
          { bank: '국민은행', number: '123-456-789012',  name: '김민준' },
          { bank: '신한은행', number: '110-123-456789',  name: '김대호' },
        ]},
        { label: '신부 측', accounts: [
          { bank: '우리은행', number: '1002-123-456789', name: '이지수' },
          { bank: '하나은행', number: '333-890123-456',  name: '이성훈' },
        ]},
      ],
    } },
    // W-4 / C-10 — 역할명만 있던 카드에 실명을 넣고, 6명 전원 같은 예시 번호를 준다.
    // (예전엔 신랑·신부만 통화 아이콘이 살아 있고 부모 4명은 회색이라 버그처럼 보였다)
    { id: 'contact-1', type: 'contact', order: 14, required: false, config: {
      koreanTitle: '연락하기',
      koreanLabelVisible: true,
      englishTitle: 'Contact',
      labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '신랑 측', englishLabel: 'GROOM', contacts: [
          { name: '신랑 김민준',  phone: '010-0000-0000', bindTo: 'groomPhone' },
          { name: '아버지 김대호', phone: '010-0000-0000' },
          { name: '어머니 박정숙', phone: '010-0000-0000' },
        ]},
        { label: '신부 측', englishLabel: 'BRIDE', contacts: [
          { name: '신부 이지수',  phone: '010-0000-0000', bindTo: 'bridePhone' },
          { name: '아버지 이성훈', phone: '010-0000-0000' },
          { name: '어머니 최미래', phone: '010-0000-0000' },
        ]},
      ],
    } },
    { id: 'guestbook-1', type: 'guestbook', order: 15, required: false, config: {
      koreanTitle: '방명록',
      koreanLabelVisible: true,
      englishTitle: 'Guestbook',
      labelVisible: true,
      titleBigVisible: false,
      buttonLabel: '축하 글 남기기',
      modalTitle: '축하 글 남기기',
      namePlaceholder: '성함 또는 호칭',
      messagePlaceholder: '두 사람에게 전하고 싶은 말을 남겨 주세요.',
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

// ── 돌잔치 초대장 (baby-first-birthday-template-001) ────────────────────────
// 감사 문서 02-baby-first-birthday.md 의 B-1 ~ B-12 반영본.
//
// 핵심 시정
//  · B-1  greetingAuthor 명시 → '신랑 · 신부' 자동 서명 제거
//  · B-3  행사일을 상대 날짜(eventDay)로. 화면 문자열 전부 여기서 파생
//  · B-4  photo_share 라벨에서 웨딩 용어('하객') 제거
//  · B-5  계좌 섹션 제목 1줄로 축소
//  · B-6  연락처에 부모 실명 + 유효한 번호 (bindTo 는 커플 전용이라 제거)
//  · B-7  식순 · 돌잡이 · 식사/답례품 · 주차 안내를 tab 하나로 통합
//  · B-10 인사말을 '초대 → 감사' 순서로 재작성
//  · B-11 기본 ON 모듈 18개 → 15개 (midphoto · slide · interview 제거)
//  · B-12 주인공 소개에 구체 정보(생년월일·부모·좋아하는 것) 추가

// 돌잔치는 한 달 반 전 안내가 일반적이다.
const BABY_DAY = eventDayOn(45, 0)          // 돌잔치는 일요일 낮이 관례다
// 돌잔치 주인공은 '행사일 기준 만 1년 전'에 태어난 아이다.
// 화면에 찍히는 생년월일도 행사일에서 파생시켜 시드 실행 시점과 어긋나지 않게 한다.
const BABY_BIRTH_DAY = eventDay(45 - 365)
const BABY_BIRTH_TEXT = `${BABY_BIRTH_DAY.iso.replace(/-/g, '. ')}.` // 2025. 09. 13.

// 커버(main_img)를 갤러리·타임라인에 재탕하지 않는다.
// 전 컷 동일한 아기 한 명 — 성장 단계(신생아 / 3개월 / 8~10개월 / 12개월)만 달라진다.
const BABY_TIMELINE_IMAGES = [
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/01.jpg'), // 태어난 날 — 신생아
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/02.jpg'), // 100일 — 3개월
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/03.jpg'), // 첫 걸음마 — 8~10개월
  templateAssetUrl(BABY_TEMPLATE_ID, 'timeline/04.jpg'), // 첫 생일 — 12개월 + 돌상
]

// 안아 준 품 / 손 클로즈업 / 당일 돌상 세팅 — "어떤 자리인지" 가늠되는 3컷
const BABY_GALLERY_IMAGES = [
  templateAssetUrl(BABY_TEMPLATE_ID, 'gallery/01.jpg'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'gallery/02.jpg'),
  templateAssetUrl(BABY_TEMPLATE_ID, 'gallery/03.jpg'),
]

const BABY_FIRST_BIRTHDAY_TEMPLATE = {
  name: '돌잔치 초대장',
  description: '아기의 첫 생일을 함께하는 돌잔치 초대장. 성장 타임라인, 식순·돌잡이 안내, 참석 회신, 마음 전하실 곳, 방명록 포함.',
  thumbnail: templateAssetUrl(BABY_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(BABY_TEMPLATE_ID, 'main_img_v2.jpg'),
    invitationTitle: '시안이의 첫 생일에 초대합니다',
    // B-10 — 초대가 먼저, 감사는 뒤. 예전 문장은 무게가 '감사'에 실려 있었다.
    greetingMessage: '작은 손으로 세상을 처음 만지던 아이가\n어느새 첫 생일을 맞았습니다.\n\n시안이의 첫 생일 자리에\n귀한 걸음으로 함께해 주세요.\n\n지난 일 년, 마음으로 지켜봐 주신\n모든 분들께 깊이 감사드립니다.',
    // B-1 — 명시하지 않으면 서명이 아예 렌더되지 않는다(웨딩 fallback 제거됨)
    greetingAuthor: '아빠 이윤종 · 엄마 이다영 드림',
    // 인사말/일시/장소 라벨은 category-labels.ts 의 baby 프리셋
    // (인사말 / Greeting, 행사 일시 / Event Day, 행사 장소 / Location)을 그대로 쓴다.
    eventDate: BABY_DAY.iso,
    eventTime: '오전 11시',
    datetimeTitleBig: BABY_DAY.koFull,
    datetimeTitleSmall: '오전 11시',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '비비드바우스 파티룸',
      hall: '2층 라일락홀',
      address: '경기도 성남시 분당구 정자일로 95',
      lat: 37.3675,
      lng: 127.1086,
    },
    // 상세 주소는 VenueSection 이 venue.address 로 자동 렌더한다 — 여기 중복 기재 금지
    venueTitleBig: '비비드바우스 파티룸 2층 라일락홀',
    baby: {
      name: '시안',
      birthDate: BABY_BIRTH_DAY.iso,
      hashtags: ['웃음요정', '잠꾸러기'],
      description: `${BABY_BIRTH_TEXT} 태어난 이윤종 · 이다영의 첫째\n좋아하는 것 — 노란 오리 인형, 바나나\n요즘 특기 — 붙잡고 걷기, 손 흔들어 인사하기`,
      role: '주인공',
    },
    parents: {
      // 템플릿은 '완성된 결과물'을 보여주는 게 목적이라 실제로 눌리는 예약 대역 번호를 넣는다.
      father: { role: 'father' as const, name: '이윤종', phone: '010-0000-0000' },
      mother: { role: 'mother' as const, name: '이다영', phone: '010-0000-0000' },
    },
    babyFatherFirst: true,
    shareTitle: '시안이의 첫 생일에 초대합니다',
    shareText: `${BABY_DAY.koCompact} 오전 11시\n비비드바우스 파티룸 2층 라일락홀`,
  },
  defaultModules: [
    // 누구 →
    { id: 'baby-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'arch',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      textSlots: {
        yearText: BABY_DAY.iso.slice(0, 4),
        topAccent: 'HAPPY',
        mainTitle: '1st BIRTHDAY',
        dateText: BABY_DAY.iso.slice(5).replace('-', '.'),
        subjectFormatted: '+ 시안 +',
        bottomText: `${BABY_DAY.koShort} 오전 11시`,
        subText: '비비드바우스 파티룸 2층 라일락홀',
      },
    }},
    // 왜(인사) →
    { id: 'baby-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    // 소개 → B-12: 해시태그만 있고 정보가 0이던 소개에 생년월일·부모·취향을 넣는다
    { id: 'baby-profile-1', type: 'solo_profile', order: 3, required: false, config: {
      koreanTitle: '주인공 소개',
      koreanLabelVisible: true,
      englishTitle: 'About Baby',
      labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      persons: [
        {
          name: '이시안',
          image: templateAssetUrl(BABY_TEMPLATE_ID, 'profile_img.jpg'),
          title: BABY_BIRTH_TEXT,
          hashtags: ['웃음요정', '잠꾸러기'],
          description: '아빠 이윤종 · 엄마 이다영의 첫째\n좋아하는 것 — 노란 오리 인형, 바나나\n요즘 특기 — 붙잡고 걷기, 손 흔들어 인사하기',
          descriptionVisible: true,
        },
      ],
    }},
    // 언제 → 어디서 →
    { id: 'baby-datetime-1', type: 'datetime', order: 4, required: false, config: {} },
    { id: 'baby-venue-1', type: 'venue', order: 5, required: false, config: { showMap: true } },
    // 어떻게 가나 + 당일 무슨 일이 있나 — 지도 바로 다음에 둔다(갤러리를 사이에 끼우지 않는다).
    // B-7 — 돌잔치 하객이 실제로 궁금해하는 것: 돌잡이 시각, 식순, 답례품, 주차, 유아 의자.
    { id: 'baby-tab-1', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '행사 안내', koreanLabelVisible: true,
      englishTitle: 'Details', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '식순', imageVisible: false, content: '<p style="text-align: center">11:00 입장 · 인사</p><p style="text-align: center">11:30 돌잡이</p><p style="text-align: center">12:00 식사</p><p style="text-align: center">13:00 마무리</p>' },
        { label: '돌잡이', imageVisible: false, content: '<p style="text-align: center">11시 30분에 시작합니다.</p><p style="text-align: center">시안이가 무엇을 고를지 함께 응원해 주세요.</p><p style="text-align: center">사진·영상 촬영은 자유롭게 해주셔도 좋습니다.</p>' },
        { label: '식사', imageVisible: false, content: '<p style="text-align: center">돌잡이 후 뷔페 식사가 준비되어 있습니다.</p><p style="text-align: center">유아 의자와 수유실이 홀 옆에 마련되어 있습니다.</p><p style="text-align: center">돌아가실 때 답례 떡을 꼭 챙겨 가세요.</p>' },
        { label: '오시는 길', imageVisible: false, content: '<p style="text-align: center">수인분당선 정자역 4번 출구 도보 5분</p><p style="text-align: center">정자동 주민센터 정류장 하차 도보 3분</p>' },
        { label: '주차', imageVisible: false, content: '<p style="text-align: center">건물 지하 주차장 2시간 무료</p><p style="text-align: center">2층 안내데스크에서 차량 번호를 등록해 주세요.</p>' },
      ],
    }},
    { id: 'baby-dday-1', type: 'dday', order: 7, required: false, config: {
      koreanTitle: '첫 생일까지', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
      // showPastDays 는 켜지 않는다 — 지나면 '행사가 종료되었습니다' 가 기본값
    }},
    // 감상 — 갤러리 · 성장 타임라인
    { id: 'baby-gallery-1', type: 'gallery', order: 8, required: false, config: {
      koreanTitle: '갤러리', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: BABY_GALLERY_IMAGES,
      layout: 'grid',
    }},
    // B-2 — 네 컷 모두 같은 아기. 각 단계의 나이를 문구에도 못박아 이미지와 어긋나지 않게 한다.
    { id: 'baby-timeline-1', type: 'timeline', order: 9, required: false, config: {
      koreanTitle: '성장 이야기', koreanLabelVisible: true,
      englishTitle: 'Growth', labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      items: [
        { image: BABY_TIMELINE_IMAGES[0], title: '태어난 날',            content: `${BABY_BIRTH_TEXT}\n3.2kg으로 세상에 처음 인사했어요.`, titleVisible: true, contentVisible: true },
        { image: BABY_TIMELINE_IMAGES[1], title: '100일',                content: '생후 3개월.\n소리 내어 웃기 시작한 계절이었어요.', titleVisible: true, contentVisible: true },
        { image: BABY_TIMELINE_IMAGES[2], title: '첫 걸음마',            content: '생후 9개월.\n소파를 붙잡고 한 발씩 옮겼어요.', titleVisible: true, contentVisible: true },
        { image: BABY_TIMELINE_IMAGES[3], title: '첫 생일',              content: '열두 달이 지나 오늘.\n와주신 분들과 함께 돌상 앞에 섭니다.', titleVisible: true, contentVisible: true },
      ],
    }},
    // 행동 — 좌석·식사·답례품 수량 산정에 필요하므로 회신을 받는다
    { id: 'baby-rsvp-1', type: 'rsvp', order: 10, required: false, config: {
      koreanTitle: '참석 회신', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      buttonLabel: '참석 여부 알리기', modalTitle: '참석 여부 전달', submitLabel: '전달하기',
      questions: [
        { id: 'baby-rsvp-q-attendance', type: 'single-choice', label: '참석하시나요?',        required: true,  options: ['참석', '불참석'] },
        { id: 'baby-rsvp-q-name',       type: 'text-short',    label: '성함',                required: true,  placeholder: '성함을 입력하세요.' },
        { id: 'baby-rsvp-q-count',      type: 'number',        label: '참석 인원(본인 포함)',  required: false, placeholder: '예: 2' },
        { id: 'baby-rsvp-q-highchair',  type: 'single-choice', label: '유아 의자가 필요하신가요?', required: false, options: ['필요해요', '괜찮아요'], description: '아이와 함께 오시는 경우 미리 준비해 두겠습니다.' },
      ],
    }},
    // 마음 — B-5: '계좌 정보 / Account / 마음 전하실 곳' 3줄이던 것을 1줄로
    { id: 'baby-account-1', type: 'account', order: 11, required: false, config: {
      koreanTitle: '마음 전하실 곳', koreanLabelVisible: true,
      englishTitle: 'Account', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '축하해 주시는 마음만으로도 충분합니다.',
      groups: [
        { label: '아빠 이윤종', accounts: [{ bank: 'KB국민은행', number: '23123154-3232',  name: '이윤종' }] },
        { label: '엄마 이다영', accounts: [{ bank: '카카오뱅크', number: '8908-4019-21312', name: '이다영' }] },
      ],
    }},
    // 연락처 — B-6: 그룹 라벨과 이름이 똑같이 '아빠'/'엄마' 이던 것을 실명으로.
    // bindTo 는 groomPhone/bridePhone(웨딩) 전용이라 돌잔치에서는 쓰지 않고 phone 을 직접 넣는다.
    { id: 'baby-contact-1', type: 'contact', order: 12, required: false, config: {
      koreanTitle: '연락처', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '아빠', englishLabel: 'FATHER', contacts: [{ name: '이윤종', phone: '010-0000-0000' }] },
        { label: '엄마', englishLabel: 'MOTHER', contacts: [{ name: '이다영', phone: '010-0000-0000' }] },
      ],
    }},
    { id: 'baby-guestbook-1', type: 'guestbook', order: 13, required: false, config: {
      koreanTitle: '축하 한마디', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
    // B-4 — '하객'은 웨딩 용어. 돌잔치에서는 '오늘의 사진'.
    { id: 'baby-photo-share-1', type: 'photo_share', order: 14, required: false, config: {
      koreanTitle: '오늘의 사진', koreanLabelVisible: true,
      englishTitle: 'Photo Album', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '오늘 찍으신 사진을 함께 남겨 주세요.',
      previewPublic: true,
      // 미리보기 샘플 썸네일은 GuestAlbumSection 이 아직 지원하지 않는다(notes 참조).
      // 코드에 sampleImages 가 추가되면 아래를 살린다.
      // sampleImages: [
      //   templateAssetUrl(BABY_TEMPLATE_ID, 'photo_share/sample-01.jpg'),
      //   templateAssetUrl(BABY_TEMPLATE_ID, 'photo_share/sample-02.jpg'),
      //   templateAssetUrl(BABY_TEMPLATE_ID, 'photo_share/sample-03.jpg'),
      // ],
    }},
    { id: 'baby-ending-1', type: 'ending', order: 15, required: false, config: {
      image: templateAssetUrl(BABY_TEMPLATE_ID, 'ending_img.jpg'),
      message: '와주신 걸음 하나하나가\n시안이에게 큰 선물이 되었습니다.\n\n아빠 이윤종 · 엄마 이다영 드림',
    }},
    // 기본 OFF (에디터에서 추가) — midphoto(커버와 역할 중복),
    // slide(내용을 tab 으로 흡수), interview(solo_profile 과 성격 중복)
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

// ── 비즈 세미나 초대장 (business-seminar-template-001) ─────────────────────────
// 감사 문서: docs/template-audit/05-business-seminar.md
// 핵심 시정
//  S-1 커버 최대 글자가 'INVITATION' → 행사명으로. corp-headline variant 는 큰
//      'INVITATION' 이 렌더러에 하드코딩(main-screen-variants.tsx:697)돼 있어 시드로는
//      고칠 수 없다. 큰 글자가 textSlot(title)인 half-split 으로 교체한다.
//      같은 교체로 S-7(회색 웨이브 블롭)도 함께 사라진다 — 블롭은 corp-headline 전용 SVG.
//  S-2 세미나에 필요한 프로그램(timeline)·연사(profile)·참가 신청(rsvp)·문의(contact) 추가
//  S-3 서명이 '신랑 · 신부' → 주최 명시
//  S-4 절대 날짜 → eventDay(60)
//  S-5 갤러리가 커버 재탕 1장 → 지난 회차 현장 4장
//  S-6 인사말이 청첩장 어투('자리를 빛내 주시면') → 가치 제안형으로 재작성
//  S-8 방명록 → '사전 질문 / Q&A'. 섹션 라벨(초대의 말/행사 일정/행사 장소)은
//      category-labels.ts 의 business 프리셋과 동일하므로 시드에서 지정하지 않는다.

// 커버(main_img.png)를 갤러리에 재탕하지 않는다.
// 지난 회차가 어떤 자리였는지 가늠할 수 있는 4컷 — 전경 / 청중 / 네트워킹 / 등록 데스크.
const seminarGallery = [
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'gallery/01.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'gallery/02.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'gallery/03.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'gallery/04.jpg'),
]

// 프로그램 타임라인용 디테일 컷. timeline 아이템은 이미지가 없으면 회색 플레이스홀더가
// 그대로 렌더되므로 4개 전부 채운다.
const seminarProgramPhotos = [
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'timeline/01.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'timeline/02.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'timeline/03.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'timeline/04.jpg'),
]

// 연사 프로필 — profile 모듈은 persons 배열 길이만큼 좌우 교차로 렌더한다(2인 고정 아님).
const seminarSpeakerPhotos = [
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'speakers/01.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'speakers/02.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'speakers/03.jpg'),
  templateAssetUrl(SEMINAR_TEMPLATE_ID, 'speakers/04.jpg'),
]

// 세미나 리드타임 60일. 사전 등록 마감은 행사 7일 전.
const SEMINAR_DAY = eventDayOn(60, 4)   // 목요일 개최 (평일 오후 포럼)
const SEMINAR_YEAR = SEMINAR_DAY.iso.slice(0, 4)
const SEMINAR_NEXT_YEAR = String(Number(SEMINAR_YEAR) + 1)
const SEMINAR_RSVP_DEADLINE = daysBefore(SEMINAR_DAY, 7)

const BUSINESS_SEMINAR_TEMPLATE = {
  name: '비즈 세미나 초대장',
  description: '연사·프로그램·사전 등록까지 담은 세미나, 포럼, 컨퍼런스 초대장. 모노톤 그리드 페이퍼 무드.',
  thumbnail: templateAssetUrl(SEMINAR_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(SEMINAR_TEMPLATE_ID, 'main_img_v2.jpg'),
    // 커버에 행사명이 크게 들어가므로 인사말 큰제목은 행사명 반복이 아닌 태그라인으로 둔다.
    invitationTitle: '변화의 다음 장을 함께 씁니다',
    greetingMessage: `한 해의 데이터를 정리하고\n다음 해의 방향을 논의하는 자리,\n${SEMINAR_YEAR} Annual Business Forum에 초대합니다.\n\n금융·제조·테크 각 분야의 실무 리더 네 분이\n${SEMINAR_NEXT_YEAR}년의 변화와 대응 전략을 발표합니다.\n\n사전 등록하신 분께는 발표 자료집과\n세션 영상 다시보기 링크를 보내 드립니다.`,
    // 서명이 없으면 아무것도 렌더되지 않는다(예전 '신랑 · 신부' fallback 제거됨)
    greetingAuthor: '주최 · 오픈데이 파트너스',
    eventDate: SEMINAR_DAY.iso,
    eventTime: 'PM 1:30',
    datetimeTitleBig: SEMINAR_DAY.koFull,
    // 반차를 쓸지 판단하려면 종료 시각과 등록 시작 시각이 필요하다.
    datetimeTitleSmall: 'PM 1:30 ~ 5:30 · 등록 PM 1:00부터',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '서울 그랜드 호텔',
      hall: 'Grand Ballroom 3F',
      address: '서울특별시 중구 세종대로 80',
      lat: 37.5650,
      lng: 126.9784,
    },
    // 상세주소는 VenueSection 이 venue.address 로 자동 렌더하므로 중복 표기하지 않는다.
    venueTitleBig: '서울 그랜드 호텔 Grand Ballroom 3F',
    shareTitle: `${SEMINAR_YEAR} Annual Business Forum`,
    shareText: `${SEMINAR_DAY.koCompact} PM 1:30 · 서울 그랜드 호텔 Grand Ballroom`,
  },
  defaultModules: [
    // 가장 큰 글자는 행사명이어야 한다. half-split 은 상단 사진 + 작은 INVITATION 라벨 +
    // 큰 제목(title 슬롯) 구조라 시드만으로 S-1 이 해결된다.
    { id: 'sem-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'half-split',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'INVITATION',
        title: `${SEMINAR_YEAR} ANNUAL\nBUSINESS FORUM`,
        bottomText: `${SEMINAR_DAY.koShort} PM 1:30`,
        subText: '서울 그랜드 호텔 Grand Ballroom 3F',
      },
    }},
    { id: 'sem-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    // 세미나 참석 판단의 1순위는 '무엇을 몇 시간 동안 하는가'다. 프로그램을 인사말 바로 뒤에.
    { id: 'sem-timeline-1', type: 'timeline', order: 3, required: false, config: {
      koreanTitle: '프로그램', koreanLabelVisible: true,
      englishTitle: 'Program', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '등록 PM 1:00 · 종료 PM 5:30',
      titleSmallVisible: true,
      items: [
        { image: seminarProgramPhotos[0], title: '13:30 기조 발표', content: `${SEMINAR_NEXT_YEAR} 시장 전망 — 데이터로 읽는 세 가지 변화\n김도현 (40분)`, titleVisible: true, contentVisible: true },
        { image: seminarProgramPhotos[1], title: '14:20 세션 1 · 2', content: '금리 전환기의 리스크 관리\n공급망 재편, 무엇을 먼저 바꿀 것인가 (각 35분)', titleVisible: true, contentVisible: true },
        { image: seminarProgramPhotos[2], title: '15:40 패널 토론', content: '연사 전원 참여.\n사전에 받은 질문을 중심으로 진행합니다. (50분)', titleVisible: true, contentVisible: true },
        { image: seminarProgramPhotos[3], title: '16:40 네트워킹', content: '다과와 함께 자유롭게 명함을 나누는 시간입니다.\nPM 5:30 종료.', titleVisible: true, contentVisible: true },
      ],
    }},
    // '누가 말하는가'가 곧 참석 가치. 소속과 세션명을 함께 적는다.
    { id: 'sem-profile-1', type: 'profile', order: 4, required: false, config: {
      koreanTitle: '연사 소개', koreanLabelVisible: true,
      englishTitle: 'Speakers', labelVisible: true,
      titleBigVisible: false,
      persons: [
        { image: seminarSpeakerPhotos[0], name: '김도현', hashtags: ['기조발표'], description: `오픈데이 파트너스 대표\n${SEMINAR_NEXT_YEAR} 시장 전망 — 데이터로 읽는 세 가지 변화`, descriptionVisible: true },
        { image: seminarSpeakerPhotos[1], name: '이서연', hashtags: ['세션1'],   description: '한빛금융그룹 리스크관리본부장\n금리 전환기의 리스크 관리', descriptionVisible: true },
        { image: seminarSpeakerPhotos[2], name: '박준호', hashtags: ['세션2'],   description: '대성테크 SCM 총괄\n공급망 재편, 무엇을 먼저 바꿀 것인가', descriptionVisible: true },
        { image: seminarSpeakerPhotos[3], name: '정민아', hashtags: ['패널'],    description: '이음랩 CTO\nAI 도입 이후의 조직 운영', descriptionVisible: true },
      ],
      introText: '<p style="text-align: center">연사별 발표 요약은 등록하신 이메일로 행사 전날 보내 드립니다.</p>',
      introTextVisible: true,
    }},
    { id: 'sem-datetime-1', type: 'datetime', order: 5, required: false, config: {} },
    { id: 'sem-venue-1',    type: 'venue',    order: 6, required: false, config: { showMap: true } },
    // 교통·주차 안내는 지도 바로 다음에 온다 (갤러리를 사이에 두지 않는다)
    { id: 'sem-tab-directions-1', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">1·2호선 시청역 4번 출구 도보 3분</p>' },
        { label: '버스',   content: '<p style="text-align: center">간선 100, 152 · 시청앞 정류장 하차</p>' },
        { label: '주차',   content: '<p style="text-align: center">호텔 지하주차장 4시간 무료</p><p style="text-align: center">3F 등록 데스크에서 주차권을 받아 주세요.</p>' },
      ],
    }},
    { id: 'sem-gallery-1',  type: 'gallery',  order: 8, required: false, config: {
      koreanTitle: '지난 회차 현장', koreanLabelVisible: true,
      englishTitle: 'Highlights', labelVisible: true,
      titleBigVisible: false,
      images: seminarGallery,
      layout: 'grid',
    }},
    { id: 'sem-dday-1',     type: 'dday',     order: 9, required: false, config: {
      koreanTitle: '행사까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    // 참가비·대상·유의사항은 신청 버튼 직전에 둔다. 판단에 필요한 정보를 먼저 주고 행동을 청한다.
    { id: 'sem-tab-info-1', type: 'tab', order: 10, required: false, config: {
      koreanTitle: '참가 안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '참가 대상', content: '<p style="text-align: center">전략·기획·신사업 담당 실무자와 관리자</p><p style="text-align: center">금융·제조·테크 업계 재직자</p>' },
        { label: '참가비',   content: '<p style="text-align: center">무료 · 사전 등록제</p><p style="text-align: center">좌석 200석 한정, 등록 순으로 마감됩니다.</p>' },
        { label: '유의사항', content: '<p style="text-align: center">발표 자료집은 등록하신 이메일로 행사 전날 발송됩니다.</p><p style="text-align: center">현장 등록은 잔여 좌석이 있을 때만 가능합니다.</p><p style="text-align: center">중식은 제공되지 않으며, 휴식 시간에 다과가 준비됩니다.</p>' },
      ],
    }},
    // 좌석·자료집 수량이 정해져 있어 사전 등록이 필수다. 소속·이메일까지 함께 받는다.
    { id: 'sem-rsvp-1', type: 'rsvp', order: 11, required: false, config: {
      koreanTitle: '참가 신청', koreanLabelVisible: true,
      englishTitle: 'Registration', labelVisible: true,
      titleBigVisible: false,
      buttonLabel: '참가 신청하기',
      modalTitle: '참가 신청',
      submitLabel: '신청하기',
      deadline: SEMINAR_RSVP_DEADLINE.koShort,
      questions: [
        { id: 'sem-rsvp-attend',  type: 'single-choice', label: '참석하시나요?',          required: true,  options: ['참석', '불참석'] },
        { id: 'sem-rsvp-name',    type: 'text-short',    label: '성함',                   required: true,  placeholder: '성함을 입력하세요.' },
        { id: 'sem-rsvp-org',     type: 'text-short',    label: '소속 · 직함',            required: true,  placeholder: '예: 오픈데이 파트너스 / 전략기획팀 과장' },
        { id: 'sem-rsvp-email',   type: 'email',         label: '이메일 (자료집 발송용)', required: true,  placeholder: 'name@company.com' },
        { id: 'sem-rsvp-count',   type: 'number',        label: '동반 인원(본인 포함)',   required: false, placeholder: '예: 2' },
        { id: 'sem-rsvp-session', type: 'multi-choice',  label: '관심 세션 (복수 선택)',  required: false, options: ['기조 발표', '세션 1 · 금리 전환기의 리스크 관리', '세션 2 · 공급망 재편', '패널 토론', '네트워킹'] },
      ],
    }},
    // 등록이 안 될 때 연락할 곳이 없으면 신청 자체가 끊긴다.
    { id: 'sem-contact-1', type: 'contact', order: 12, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '등록 문의', englishLabel: 'REGISTRATION', contacts: [
          { name: '포럼 사무국', phone: '010-0000-0000' },
          { name: '단체 등록 · 제휴', phone: '010-0000-0000' },
        ]},
      ],
    }},
    // 세미나에서 축하 방명록은 쓸 데가 없다. 같은 모듈을 사전 질문 수집으로 돌린다.
    { id: 'sem-guestbook-1', type: 'guestbook', order: 13, required: false, config: {
      koreanTitle: '사전 질문', koreanLabelVisible: true,
      englishTitle: 'Q&A', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '패널 토론에서 다룰 질문을 미리 받습니다.',
      titleSmallVisible: true,
      buttonLabel: '사전 질문 남기기',
      modalTitle: '사전 질문 남기기',
      submitLabel: '질문 등록하기',
      namePlaceholder: '성함 · 소속을 입력해 주세요',
      messagePlaceholder: '연사에게 묻고 싶은 내용을 적어 주세요',
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

// ── 신제품 런칭 초대장 (business / launch) ───────────────────────────────────
// 감사 문서: docs/template-audit/06-business-launch.md
//
// 이번 개편의 핵심
//   L-1 계절 불일치(설산 향수컷) → 계절 중립 제품컷(대리석·실크·유리)으로 전량 교체
//   L-2 청첩장 어투 → 브랜드가 프레스·바이어·VIP 고객에게 보내는 어투 + 가치 제안형
//   L-5 커버 재탕 갤러리 → 제품 정면 / 디테일 / 패키지 / 원료 4컷
//   L-7 rsvp · contact 신설 (좌석·시향 키트·웰컴 기프트 수량이 정해진 행사)
//   L-10 tab 을 교통 전용에서 프로그램·드레스코드·웰컴 기프트까지 확장

// 커버(main_img.png)를 갤러리에 재탕하지 않는다.
// 제품 정면 / 캡·각인 디테일 / 패키지 박스 / 원료 무드컷 — 컬렉션이 어떤 물건인지 가늠되는 4컷.
const launchGallery = [
  templateAssetUrl(LAUNCH_TEMPLATE_ID, 'gallery/01.jpg'),
  templateAssetUrl(LAUNCH_TEMPLATE_ID, 'gallery/02.jpg'),
  templateAssetUrl(LAUNCH_TEMPLATE_ID, 'gallery/03.jpg'),
  templateAssetUrl(LAUNCH_TEMPLATE_ID, 'gallery/04.jpg'),
]

// 런칭쇼 권장 리드타임 40일. 회신 마감은 좌석·기프트 수량 확정을 위해 행사 7일 전.
const LAUNCH_DAY = eventDayOn(40, 4)    // 브랜드 런칭 행사는 평일 저녁 (목요일)
const LAUNCH_RSVP_DUE = daysBefore(LAUNCH_DAY, 7)
// 커버의 대형 세리프 숫자('06.15' 자리) — 반드시 행사일에서 파생시킨다
const LAUNCH_MONTH_DAY = LAUNCH_DAY.iso.slice(5).replace('-', '.')

const BUSINESS_LAUNCH_TEMPLATE = {
  name: '신제품 런칭 초대장',
  description: '럭셔리 미니멀 무드의 신제품·브랜드 런칭쇼 초대장. 프레스·바이어·VIP 고객 초청용. 골드와 베이지의 따뜻한 톤.',
  thumbnail: templateAssetUrl(LAUNCH_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(LAUNCH_TEMPLATE_ID, 'main_img_v2.jpg'),
    // 커버에는 영문 브랜드 라인이, 인사말 큰제목에는 한글 한 줄이 오도록 분리했다(중복 방지).
    invitationTitle: '새 컬렉션을 처음으로 공개합니다',
    // 청첩장 관용구('가장 가까운 분들', '빛나는 순간', '~청합니다') 제거.
    // 무엇을 볼 수 있고 무엇을 할 수 있는지를 명시하는 것이 런칭 초대장의 설득 장치다.
    greetingMessage: 'PRESTIGE의 새로운 컬렉션을 처음 공개합니다.\n\n3년의 개발과 열두 번의 시제품을 거쳐 완성한\n열 가지 향을\n가장 먼저 만나실 분들을 초대합니다.\n\n당일 현장에서 전 라인 시향과\n런칭 에디션 선구매가 가능합니다.',
    // 서명이 없으면 '신랑 · 신부' 가 조립되던 자리
    greetingAuthor: 'PRESTIGE',
    // 인사말 라벨(초대의 말 / Welcome)은 business 카테고리 프리셋과 동일하므로 지정하지 않는다.
    eventDate: LAUNCH_DAY.iso,
    eventTime: 'PM 7:00',
    // 카테고리 프리셋은 '행사 일정 / Schedule' 이지만, 여기서는 프로그램 탭과 혼동되지 않게
    // 브랜드 어휘인 '일시 / Date' 로 좁힌다.
    datetimeKoreanTitle: '일시',
    datetimeEnglishTitle: 'Date',
    datetimeTitleBig: LAUNCH_DAY.koFull,
    datetimeTitleSmall: 'PM 7:00 입장',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '청담 플래그십 라운지',
      hall: '2F',
      address: '서울특별시 강남구 압구정로 434',
      // 기존 좌표(도산대로 320)는 청담 웨딩홀 밀집 구간이라 지도에 'VIP웨딩홀', '더채플앳청담'
      // 이 크게 잡혔다. 압구정로 명품거리 쪽으로 옮겨 주변 POI 가 리테일/패션 브랜드로 잡히게 한다.
      lat: 37.5265,
      lng: 127.0422,
    },
    venueKoreanTitle: '장소',
    // venueEnglishTitle('Venue')은 business 프리셋과 같아 생략. 상세주소는 venue.address 로 자동 노출된다.
    venueTitleBig: '청담 플래그십 라운지 2F',
    shareTitle: 'PRESTIGE COLLECTION LAUNCH',
    shareText: `${LAUNCH_DAY.koCompact} PM 7:00 · 청담 플래그십 라운지`,
  },
  defaultModules: [
    { id: 'lan-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'prestige-product',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        monthDay: LAUNCH_MONTH_DAY,
        inviteLabel: 'INVITATION',
        title: 'PRESTIGE COLLECTION LAUNCH',
        bottomText: `${LAUNCH_DAY.enShort} · PM 7:00`,
        subText: 'Cheongdam Flagship Lounge · 2F',
      },
    }},
    { id: 'lan-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'lan-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'lan-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    // 교통·주차는 지도 바로 다음. 갤러리를 사이에 두지 않는다.
    { id: 'lan-tab-1', type: 'tab', order: 5, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '대중교통', content: '<p style="text-align: center">수인분당선 압구정로데오역 3번 출구 도보 6분</p><p style="text-align: center">마을버스 강남08 · 청담동 명품거리 정류장 하차</p>' },
        { label: '주차',     content: '<p style="text-align: center">건물 지하 1~3층 · 행사 당일 3시간 무료</p><p style="text-align: center">입구에서 발레파킹 이용 가능</p><p style="text-align: center">2F 안내데스크에서 주차 등록해 주세요.</p>' },
      ],
    }},
    // 런칭쇼에서 받는 사람이 실제로 궁금해하는 것 — 몇 시에 뭘 하는지, 뭘 입고 가는지, 뭘 받는지.
    // 탭 버튼이 flex-1 로 균등 분할되므로 한 모듈에 3개까지만 둔다(교통 탭과 분리한 이유).
    { id: 'lan-tab-2', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '행사 안내', koreanLabelVisible: true,
      englishTitle: 'Details', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '프로그램',   content: '<p style="text-align: center">19:00 입장 · 웰컴 드링크</p><p style="text-align: center">19:30 브랜드 프레젠테이션</p><p style="text-align: center">20:00 전 라인 시향 · 조향사 Q&amp;A</p><p style="text-align: center">20:30 네트워킹 · 런칭 에디션 선구매</p><p style="text-align: center">21:30 마무리</p>' },
        { label: '드레스 코드', content: '<p style="text-align: center">Smart Casual</p><p style="text-align: center">편안하되 단정한 차림으로 함께해 주세요.</p><p style="text-align: center">시향이 있는 자리라 향이 강한 제품은 자제 부탁드립니다.</p>' },
        { label: '웰컴 기프트', content: '<p style="text-align: center">참석자 전원께 런칭 미니어처 5종 세트를 드립니다.</p><p style="text-align: center">입구에서 초대장 화면을 보여 주세요.</p><p style="text-align: center">수량 관계로 회신하신 분에 한해 준비됩니다.</p>' },
      ],
    }},
    { id: 'lan-dday-1',     type: 'dday',     order: 7, required: false, config: {
      koreanTitle: '런칭까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    // 커버 재탕이 아니라 '컬렉션이 어떤 물건인지' 를 보여주는 자리
    { id: 'lan-gallery-1',  type: 'gallery',  order: 8, required: false, config: {
      koreanTitle: '컬렉션 미리보기', koreanLabelVisible: true,
      englishTitle: 'Preview', labelVisible: true,
      images: launchGallery,
      layout: 'grid',
    }},
    // 좌석·시향 키트·웰컴 기프트 수량이 정해진 초청 행사라 회신이 필수다.
    // 프레스 초대를 겸하므로 소속·매체명을 함께 받는다.
    { id: 'lan-rsvp-1', type: 'rsvp', order: 9, required: false, config: {
      koreanTitle: '참석 회신', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      titleSmall: '좌석과 웰컴 기프트 수량이 정해져 있어 회신을 부탁드립니다.',
      deadline: LAUNCH_RSVP_DUE.koShort,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 회신',
      submitLabel: '보내기',
      questions: [
        { id: 'lan-rsvp-q-attendance', type: 'single-choice', label: '참석 하시나요?',       required: true,  options: ['참석', '불참'] },
        { id: 'lan-rsvp-q-name',       type: 'text-short',    label: '성함',                 required: true,  placeholder: '성함을 입력하세요.' },
        { id: 'lan-rsvp-q-org',        type: 'text-short',    label: '소속 · 매체명',         required: true,  placeholder: '예: OPENDAY 매거진' },
        { id: 'lan-rsvp-q-phone',      type: 'phone',         label: '연락처',               required: true,  placeholder: '010-0000-0000', description: '입장 확인과 기프트 안내에만 사용합니다.' },
        { id: 'lan-rsvp-q-count',      type: 'number',        label: '참석 인원(본인 포함)',   required: false, placeholder: '예: 2', description: '동반은 1인까지 가능합니다.' },
      ],
    }},
    // 초대장에 문의처가 없으면 프레스·바이어가 되물을 곳이 없다.
    { id: 'lan-contact-1', type: 'contact', order: 10, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '초대 · 참석 문의', englishLabel: 'RSVP',  contacts: [{ name: 'PRESTIGE 브랜드팀', phone: '010-0000-0000' }] },
        { label: '프레스 · 취재 문의', englishLabel: 'PRESS', contacts: [{ name: 'PRESTIGE 커뮤니케이션', phone: '010-0000-0000' }] },
      ],
    }},
    { id: 'lan-guestbook-1', type: 'guestbook', order: 11, required: false, config: {
      koreanTitle: '메시지', koreanLabelVisible: true,
      englishTitle: 'Message', labelVisible: true,
      buttonLabel: '메시지 남기기',
      modalTitle: '메시지 남기기',
      submitLabel: '남기기',
      messagePlaceholder: '브랜드에 전하고 싶은 이야기를 남겨 주세요.',
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

// ── 오픈 테니스 컵 (sports-tennis-template-001) ──────────────────────────────
// 커버(main_img.png)를 갤러리에 재탕하던 것을 지난 대회 현장 4컷으로 교체.
// 코트 전경 / 스윙 순간 / 트로피 / 참가자 단체 — "이 대회가 어떤 분위기인가" 를
// 보여주는 컷들. 대회 갤러리는 참가 결정에 직접 영향을 준다.
const tennisGallery = [
  templateAssetUrl(TENNIS_TEMPLATE_ID, 'gallery/01.jpg'),
  templateAssetUrl(TENNIS_TEMPLATE_ID, 'gallery/02.jpg'),
  templateAssetUrl(TENNIS_TEMPLATE_ID, 'gallery/03.jpg'),
  templateAssetUrl(TENNIS_TEMPLATE_ID, 'gallery/04.jpg'),
]

// 대회일 · 접수 마감 · 우천 예비일을 모두 상대 날짜로 만든다.
// 화면에 찍히는 날짜 문자열은 전부 이 세 상수에서 파생시킨다(하드코딩 금지).
const TENNIS_DAY = eventDayOn(35, 6)       // 대회 당일 — 동호인 대회는 토요일
const TENNIS_ENTRY_DEADLINE = daysBefore(TENNIS_DAY, 14) // 접수 마감 — 대회 2주 전
const TENNIS_RAIN_DATE = eventDay(42)      // 우천 시 예비일 — 대회 1주 뒤
const TENNIS_YEAR = TENNIS_DAY.iso.slice(0, 4)

const SPORTS_TENNIS_TEMPLATE = {
  name: '오픈 테니스 컵 초대장',
  description: '오픈 테니스 토너먼트, 동호회 대회 초대장. 참가비·부문·경기 방식·시상까지 안내하고 참가 신청을 바로 받는 구성. 비비드한 청록 톤.',
  thumbnail: templateAssetUrl(TENNIS_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(TENNIS_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: `${TENNIS_YEAR} 오픈 테니스 컵`,
    // 규모(32팀) · 연혁(4회) · 대상 수준(구력 1~10년) · 부문 수를 넣어
    // "가벼운 대회다" 라는 톤은 유지하되 판단에 필요한 정보를 담는다.
    greetingMessage: '올해로 네 번째를 맞는 오픈 테니스 컵에 초대합니다.\n구력 1년차부터 10년차까지, 32팀이 함께합니다.\n\n실력보다 즐거움을 나누는 대회입니다.\n단식·복식 5개 부문으로 나누어 진행하고,\n경기가 끝나면 코트 옆에서 간단한 뒤풀이도 준비했습니다.\n\n라켓 하나만 챙겨서 편하게 신청해 주세요.',
    // 서명이 없으면 '신랑 · 신부' 가 조립되던 자리
    greetingAuthor: '오픈 테니스 컵 운영위원회',
    // 인사말/일시/장소 라벨은 sports 카테고리 프리셋(대회 소개·경기 일정·경기 장소)을 그대로 쓴다
    eventDate: TENNIS_DAY.iso,
    eventTime: 'AM 9:00',
    datetimeTitleBig: TENNIS_DAY.koFull,
    datetimeTitleSmall: 'AM 8:30 접수 · AM 9:00 개회 · PM 5:00 종료 예정',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '양재 시민의숲 테니스장',
      hall: '',
      address: '서울특별시 서초구 매헌로 99',
      lat: 37.4716,
      lng: 127.0387,
    },
    venueTitleBig: '양재 시민의숲 테니스장',
    // 공공 체육시설은 출입구가 여러 개라 게이트 안내가 주소만큼 중요하다.
    // (상세주소는 venue.address 에서 자동으로 렌더되므로 여기에 중복 기재하지 않는다)
    venueTitleSmall: '공원 1번 출입구 이용 · 하드코트 A~F 6면',
    venueTitleSmallVisible: true,
    shareTitle: `${TENNIS_YEAR} 오픈 테니스 컵`,
    shareText: `${TENNIS_DAY.koCompact} AM 9:00 · 양재 시민의숲 테니스장 · 선착순 32팀`,
  },
  defaultModules: [
    { id: 'ten-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'event-headline',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        // 대회 커버는 '초대장' 보다 '접수 중' 이 첫 정보로 유용하다
        inviteLabel: 'ENTRY OPEN',
        title: `${TENNIS_YEAR} OPEN\nTENNIS CUP`,
        dateLine: `${TENNIS_DAY.enShort} · AM 9:00`,
        subText: '양재 시민의숲 테니스장 · 하드코트 6면',
      },
    }},
    { id: 'ten-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    // 참가 여부를 결정하는 데 필요한 정보(참가비·마감·정원·부문·방식·시상)를
    // 인사말 바로 뒤에 둔다. 신청(RSVP) 전에 반드시 읽혀야 하는 내용이다.
    { id: 'ten-tab-1', type: 'tab', order: 3, required: false, config: {
      koreanTitle: '대회 안내', koreanLabelVisible: true,
      englishTitle: 'Tournament Info', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '참가 안내', content: `<p style="text-align: center">참가비 30,000원 · 볼과 점심 도시락, 기념 티셔츠 포함</p><p style="text-align: center">선착순 32팀 · 정원이 차면 조기 마감됩니다</p><p style="text-align: center">신청 마감 ${TENNIS_ENTRY_DEADLINE.koShort}</p><p style="text-align: center">참가비 입금까지 완료되어야 접수가 확정됩니다</p>` },
        { label: '부문',     content: '<p style="text-align: center">남자 단식 · 여자 단식</p><p style="text-align: center">남자 복식 · 여자 복식 · 혼합 복식</p><p style="text-align: center">한 사람이 최대 두 부문까지 신청할 수 있습니다</p>' },
        { label: '경기 방식', content: '<p style="text-align: center">4팀 조별 예선 리그 후 본선 토너먼트</p><p style="text-align: center">1세트 6게임 · 6-6 타이브레이크</p><p style="text-align: center">대진표는 마감 다음 날 문자로 보내드립니다</p>' },
        { label: '시상',     content: '<p style="text-align: center">부문별 1 · 2 · 3위 트로피와 상품</p><p style="text-align: center">우승 팀은 다음 대회 참가비 면제</p><p style="text-align: center">참가자 전원 대상 경품 추첨</p>' },
      ],
    }},
    { id: 'ten-datetime-1', type: 'datetime', order: 4, required: false, config: {} },
    // 당일 진행 순서·준비물·우천 시 대응. 야외 대회에서 우천 고지는 필수다.
    { id: 'ten-tab-2', type: 'tab', order: 5, required: false, config: {
      koreanTitle: '경기 당일', koreanLabelVisible: true,
      englishTitle: 'On the Day', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '진행 순서', content: '<p style="text-align: center">08:30 접수 · 대진 확인</p><p style="text-align: center">09:00 개회 · 예선 리그</p><p style="text-align: center">12:30 점심 (도시락 제공)</p><p style="text-align: center">13:30 본선 토너먼트</p><p style="text-align: center">16:30 시상식 · 뒤풀이</p>' },
        { label: '준비물',   content: '<p style="text-align: center">라켓 · 실내외 겸용 코트화 · 여벌 옷</p><p style="text-align: center">개인 음료와 수건</p><p style="text-align: center">공은 대회에서 제공합니다</p>' },
        { label: '우천 시',   content: `<p style="text-align: center">당일 오전 7시, 신청하신 번호로 진행 여부를 안내드립니다</p><p style="text-align: center">취소되면 ${TENNIS_RAIN_DATE.koShort} 같은 장소에서 진행합니다</p><p style="text-align: center">예비일 참가가 어려우시면 참가비는 전액 환불해 드립니다</p>` },
      ],
    }},
    { id: 'ten-venue-1', type: 'venue', order: 6, required: false, config: { showMap: true } },
    // 교통·주차 안내는 지도 바로 다음에 온다 (갤러리를 사이에 두지 않는다)
    { id: 'ten-tab-3', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">신분당선 양재시민의숲역 5번 출구 도보 7분</p><p style="text-align: center">출구에서 공원 안내판을 따라 테니스장 방향</p>' },
        { label: '버스',   content: '<p style="text-align: center">간선 470 · 지선 4432</p><p style="text-align: center">양재시민의숲 정류장 하차 후 도보 5분</p>' },
        { label: '주차',   content: '<p style="text-align: center">공원 공영주차장 이용 · 10분당 300원</p><p style="text-align: center">주말 오전에 만차되니 대중교통을 권합니다</p>' },
      ],
    }},
    { id: 'ten-dday-1', type: 'dday', order: 8, required: false, config: {
      koreanTitle: '대회까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    { id: 'ten-gallery-1', type: 'gallery', order: 9, required: false, config: {
      koreanTitle: '지난 대회', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: tennisGallery,
      layout: 'grid',
    }},
    // 대회의 존재 이유. 이름·연락처만 받는 참석 회신이 아니라
    // 부문·파트너·구력·티셔츠까지 받아야 대진표를 짤 수 있다.
    { id: 'ten-rsvp-1', type: 'rsvp', order: 10, required: false, config: {
      koreanTitle: '참가 신청', koreanLabelVisible: true,
      englishTitle: 'Entry', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '선착순 32팀 · 정원이 차면 조기 마감됩니다',
      titleSmallVisible: true,
      buttonLabel: '참가 신청하기',
      modalTitle: '참가 신청',
      submitLabel: '신청서 제출',
      deadline: TENNIS_ENTRY_DEADLINE.koShort,
      questions: [
        // 라벨은 RsvpModal 의 매핑 규칙(이름/참석/전화)에 맞춰 둔다.
        // 나머지 답변은 message 로 무손실 보존된다.
        { id: 'ten-q-name',    type: 'text-short',    label: '이름',        required: true,  placeholder: '홍길동' },
        { id: 'ten-q-phone',   type: 'phone',         label: '연락처',      required: true,  placeholder: '010-0000-0000', description: '대진표와 우천 시 공지를 이 번호로 보내드립니다' },
        { id: 'ten-q-attend',  type: 'single-choice', label: '참석 여부',    required: true,  options: ['참가합니다', '불참합니다'] },
        { id: 'ten-q-event',   type: 'single-choice', label: '참가 부문',    required: true,  options: ['남자 단식', '여자 단식', '남자 복식', '여자 복식', '혼합 복식'] },
        { id: 'ten-q-partner', type: 'text-short',    label: '복식 파트너',  required: false, placeholder: '복식 신청 시에만 입력', description: '파트너가 없으면 비워 두세요. 운영위에서 매칭해 드립니다' },
        { id: 'ten-q-career',  type: 'dropdown',      label: '구력',        required: true,  options: ['1년 미만', '1~3년', '3~5년', '5~10년', '10년 이상'] },
        { id: 'ten-q-shirt',   type: 'dropdown',      label: '티셔츠 사이즈', required: true,  options: ['S', 'M', 'L', 'XL', '2XL'] },
        { id: 'ten-q-note',    type: 'text-long',     label: '남기실 말',    required: false, placeholder: '문의나 요청 사항이 있으면 적어 주세요' },
      ],
    }},
    // 참가비 입금 계좌. 웨딩 관용구('마음 전하실 곳')가 나오지 않게 titleBig 은 끈다.
    { id: 'ten-account-1', type: 'account', order: 11, required: false, config: {
      koreanTitle: '참가비 입금', koreanLabelVisible: true,
      englishTitle: 'Entry Fee', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '신청 후 3일 안에 입금해 주세요',
      titleSmallVisible: true,
      groups: [
        { label: '참가비 계좌 (30,000원)', accounts: [
          { bank: '국민은행', number: '123-456-789012', name: '오픈테니스컵 운영위' },
        ]},
      ],
    }},
    // 대회는 문의가 반드시 발생한다 — 대진표, 우천, 주차, 파트너 매칭
    { id: 'ten-contact-1', type: 'contact', order: 12, required: false, config: {
      koreanTitle: '대회 문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '운영위원회', englishLabel: 'ORGANIZER', contacts: [
          { name: '접수 · 대진 문의', phone: '010-0000-0000' },
          { name: '당일 현장 문의',   phone: '010-0000-0000' },
        ]},
      ],
    }},
    { id: 'ten-guestbook-1', type: 'guestbook', order: 13, required: false, config: {
      koreanTitle: '참가자 한마디', koreanLabelVisible: true,
      englishTitle: 'Message', labelVisible: true,
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

// 커버 이미지를 갤러리에 재탕하지 않는다.
// 라운지 전경 / 디너 세팅 / 네트워킹 / 창밖 야경 — 받는 사람이 "어떤 자리인지" 가늠할 수 있는 4컷.
const vipNightGallery = [
  templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'gallery/01.jpg'),
  templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'gallery/02.jpg'),
  templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'gallery/03.jpg'),
  templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'gallery/04.jpg'),
]

// ── VIP 나이트 (선행 작업분 유지) ─────────────────────────────────────────────
const VIP_NIGHT_DAY = eventDayOn(50, 6)  // 나이트 파티는 토요일 밤

const SOCIAL_VIP_NIGHT_TEMPLATE = {
  name: 'VIP 나이트 초대장',
  description: '깊은 네이비와 골드의 다크 럭셔리 무드. VIP 모임, 네트워킹 디너, 프라이빗 파티 초대장.',
  thumbnail: templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'thumbnail.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(VIP_NIGHT_TEMPLATE_ID, 'main_img.png'),
    invitationTitle: 'VIP NIGHT',
    greetingMessage: '특별한 인연으로 맺어진 분들을 모시고\n뜻깊은 저녁을 함께 나누고자 합니다.\n\n바쁘신 일상 속 잠시,\n품격 있는 시간으로 모십니다.',
    // 서명이 없으면 '신랑 · 신부' 가 조립되던 자리
    greetingAuthor: '호스트 드림',
    // 커버의 INVITATION 과 겹치지 않게 인사말 라벨을 분리
    greetingKoreanTitle: '초대의 말',
    greetingEnglishTitle: 'Welcome',
    // 커버에 이미 'VIP NIGHT' 가 대문짝만하게 있으므로 인사말 큰제목은 숨긴다
    invitationTitleVisible: false,
    eventDate: VIP_NIGHT_DAY.iso,
    eventTime: 'PM 7:00',
    datetimeKoreanTitle: '행사 일시',
    datetimeEnglishTitle: 'When',
    datetimeTitleBig: VIP_NIGHT_DAY.koFull,
    datetimeTitleSmall: 'PM 7:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '강남 시그니처 라운지',
      hall: '23F',
      address: '서울특별시 강남구 테헤란로 511',
      lat: 37.5083,
      lng: 127.0635,
    },
    venueKoreanTitle: '행사 장소',
    venueEnglishTitle: 'Where',
    venueTitleBig: '강남 시그니처 라운지 23F',
    shareTitle: 'VIP NIGHT',
    shareText: `${VIP_NIGHT_DAY.koCompact} PM 7:00 · 강남 시그니처 라운지`,
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
        bottomText: `${VIP_NIGHT_DAY.enShort} · PM 7:00`,
        subText: 'Gangnam Signature Lounge · 23F',
      },
    }},
    { id: 'vip-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'vip-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'vip-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    // 교통·주차 안내는 지도 바로 다음에 온다 (갤러리를 사이에 두지 않는다)
    { id: 'vip-tab-1', type: 'tab', order: 5, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Details', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '프로그램',   content: '<p style="text-align: center">19:00 리셉션 · 웰컴 드링크</p><p style="text-align: center">19:30 디너</p><p style="text-align: center">20:30 네트워킹</p><p style="text-align: center">22:00 마무리</p>' },
        { label: '드레스 코드', content: '<p style="text-align: center">Cocktail Attire</p><p style="text-align: center">차분한 톤의 격식 있는 의상으로 함께해 주세요.</p><p style="text-align: center">청바지·운동화는 삼가 부탁드립니다.</p>' },
        // 지도 좌표(테헤란로 511)는 삼성역 인근이다. 강남역으로 안내하던 오류를 바로잡음
        { label: '오시는 길',   content: '<p style="text-align: center">2호선 삼성역 4번 출구 도보 3분</p><p style="text-align: center">9호선 봉은사역 7번 출구 도보 8분</p>' },
        { label: '주차',       content: '<p style="text-align: center">발레파킹 가능 · 빌딩 지하 1~3층</p><p style="text-align: center">23층 안내데스크에서 주차 등록해 주세요.</p>' },
      ],
    }},
    { id: 'vip-dday-1',     type: 'dday',     order: 6, required: false, config: {
      koreanTitle: '그날까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    { id: 'vip-gallery-1',  type: 'gallery',  order: 7, required: false, config: {
      koreanTitle: '공간 미리보기', koreanLabelVisible: true,
      englishTitle: 'The Venue', labelVisible: true,
      images: vipNightGallery,
      layout: 'grid',
    }},
    // 좌석·디너 수량이 정해진 자리라 참석 회신이 필수다
    { id: 'vip-rsvp-1', type: 'rsvp', order: 8, required: false, config: {
      koreanTitle: '참석 회신', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      buttonText: '참석 여부 알리기',
    }},
    // 누가 부르는 자리인지 + 문의처
    { id: 'vip-contact-1', type: 'contact', order: 9, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '행사 문의', englishLabel: 'HOST', contacts: [{ name: '이벤트 운영팀', phone: '010-0000-0000' }] },
      ],
    }},
    { id: 'vip-guestbook-1', type: 'guestbook', order: 10, required: false, config: {
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

// ─────────────────────────────────────────────────────────────────────────────
// 송년회 (seasonal-yearend-template-001)
//
// 재작성 배경 (docs/template-audit/10-seasonal-yearend.md)
//  Y-1 갤러리가 커버의 밀랍 봉인 그래픽 재탕 → 지난 송년회 사진 4컷으로 교체
//  Y-2 크림+골드+밀랍 봉인 = 청첩장과 구분 불가 → 딥 그린·버건디·골드로 팔레트 전환,
//      커버 variant 도 'seal-emblem'(봉투·봉인 = 청첩장 관습) → 'event-headline'(저조도 사진 + 오버레이)
//  Y-3 인사말 서명 '신랑 · 신부' → greetingAuthor 명시
//  Y-4 '따뜻한 발걸음 부탁드립니다'(경조사 관용구) 제거
//  Y-5 회비 · 참석 회신 · 진행 순서 · 주차/대리 · 2차 안내 신설
//  Y-6 '2026 SEASON FINALE'(드라마 용어) → '송년의 밤 / YEAR-END PARTY'
//  Y-7 섹션 라벨은 category-labels.ts 의 seasonal 프리셋(초대의 말 / 모임 일시·When / 모임 장소·Where)에
//      맡기고 시드에서 중복 지정하지 않는다
//  Y-9 팔레트가 어두워졌으므로 bgEffect 'paper' → 'none'
// ─────────────────────────────────────────────────────────────────────────────

// 지난 송년회 기록 사진 4컷. 커버(main_img.png)를 재사용하지 않는다.
const yearendGallery = [
  templateAssetUrl(YEAREND_TEMPLATE_ID, 'gallery/01.jpg'),
  templateAssetUrl(YEAREND_TEMPLATE_ID, 'gallery/02.jpg'),
  templateAssetUrl(YEAREND_TEMPLATE_ID, 'gallery/03.jpg'),
  templateAssetUrl(YEAREND_TEMPLATE_ID, 'gallery/04.jpg'),
]

// 송년회 권장 리드타임 70일. (12월 고정이 자연스럽다는 논의는 notes 참고 — 규약대로 eventDay(70) 유지)
const YEAREND_DAY = nextDecemberSaturday()   // 송년회는 12월 고정 행사다
// 회비 입금·참석 회신 마감 = 모임 10일 전
const YEAREND_DUE = daysBefore(YEAREND_DAY, 10)
const YEAREND_DUE_LABEL = `${Number(YEAREND_DUE.iso.slice(5, 7))}월 ${Number(YEAREND_DUE.iso.slice(8, 10))}일`
// 커버·공유 문구에 연도를 하드코딩하지 않는다
const YEAREND_YEAR = YEAREND_DAY.iso.slice(0, 4)

// 송년회 — 딥 포레스트 그린 · 버건디 · 캔들 골드 (크림+골드 웨딩 팔레트에서 이탈)
const YEAREND_THEME_CONFIG = {
  fonts: ['고운돋움', '제주명조', '나눔명조', 'KoPubWorld돋움'],
  // 1:딥 포레스트 그린(기본)  2:미드나잇 그린  3:밝은 모스 그린  4:딥 버건디  5:와인 브라운  6:라이트 아이보리(대안)
  bgColors:      ['#14261e', '#0f1c17', '#1d2b22', '#2a1519', '#3a2226', '#faf6ee'],
  // 캔들 골드 / 샴페인 / 앤티크 골드 / 버건디 / 밝은 버건디 / 아이보리
  accentColors:  ['#c9a24d', '#d9b978', '#a8813a', '#8c2f39', '#b5484f', '#e8dcc0'],
  spacingColors: ['#1b3227', '#14251e', '#24382c', '#361c21', '#472a2e', '#f0e6d3'],
  bgEffects:     ['none', 'dot', 'grid', 'paper'] as const,
}

const SEASONAL_YEAREND_TEMPLATE = {
  name: '송년회 초대장',
  description: '딥 그린과 캔들 골드의 겨울 저녁 무드. 회비·참석 회신·진행 순서까지 담은 송년회 초대장.',
  thumbnail: templateAssetUrl(YEAREND_TEMPLATE_ID, 'thumb_v2.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(YEAREND_TEMPLATE_ID, 'main_img_v2.jpg'),
    // 커버에 '송년의 밤' 이 크게 있으므로 인사말 큰제목은 다른 문장으로 — 어떤 모임인지 적는 자리
    invitationTitle: '한 해를 함께한 사람들과',
    greetingMessage:
      '함께해 주신 한 해에 감사드립니다.\n\n돌아보면 모든 순간이\n여러분 덕분에 빛났습니다.\n\n올해의 마지막 저녁,\n편하게 얼굴 보며 한 해를 정리하는 자리입니다.\n가벼운 마음으로 오세요.',
    // 서명이 없으면 '신랑 · 신부' 가 조립되던 자리
    greetingAuthor: '모임 총무 드림',
    // 인사말/일시/장소 섹션 라벨은 category-labels.ts 의 seasonal 프리셋을 그대로 쓴다
    // (초대의 말 / Greeting · 모임 일시 / When · 모임 장소 / Where)
    eventDate: YEAREND_DAY.iso,
    eventTime: 'PM 6:00',
    datetimeTitleBig: YEAREND_DAY.koFull,
    datetimeTitleSmall: 'PM 6:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '한남 빈티지 라운지',
      hall: '',
      address: '서울특별시 용산구 한남대로 27',
      lat: 37.5346,
      lng: 127.0046,
    },
    // 상세주소는 VenueSection 이 venue.address 로 자동 렌더한다 — 여기에 중복으로 넣지 않는다
    venueTitleBig: '한남 빈티지 라운지',
    shareTitle: `${YEAREND_YEAR} 송년의 밤`,
    shareText: `${YEAREND_DAY.koCompact} PM 6:00 · 한남 빈티지 라운지`,
  },
  defaultModules: [
    // 밀랍 봉인 원형 엠블렘(청첩장 관습) 대신 저조도 캔들 사진 + 오버레이 텍스트
    { id: 'yer-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'event-headline',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'YEAR-END PARTY',
        title: `${YEAREND_YEAR} 송년의 밤`,
        dateLine: `${YEAREND_DAY.koShort} PM 6:00`,
        subText: '한남 빈티지 라운지',
      },
    }},
    { id: 'yer-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'yer-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'yer-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    // 교통·주차 안내는 지도 바로 다음 (갤러리를 사이에 두지 않는다)
    // 술자리이므로 주차·대리운전 안내, 2차 여부까지 미리 알린다
    { id: 'yer-tab-1', type: 'tab', order: 5, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '진행 순서', content: '<p style="text-align: center">18:00 모임 · 웰컴 드링크</p><p style="text-align: center">18:30 저녁 식사</p><p style="text-align: center">20:00 올해의 시상 &amp; 경품 추첨</p><p style="text-align: center">21:30 마무리</p><p style="text-align: center">2차는 근처 펍에서 자유롭게 이어집니다.</p>' },
        { label: '드레스 코드', content: '<p style="text-align: center">Warm &amp; Cozy</p><p style="text-align: center">자유롭게, 편안한 차림으로 와주세요.</p>' },
        { label: '메뉴',       content: '<p style="text-align: center">코스 디너 + 와인 페어링</p><p style="text-align: center">알러지·못 드시는 음식은 참석 회신에 적어 주세요.</p>' },
        { label: '오시는 길',   content: '<p style="text-align: center">6호선 한강진역 1번 출구 도보 6분</p><p style="text-align: center">간선 401 · 405 한남오거리 정류장 하차</p>' },
        { label: '주차',       content: '<p style="text-align: center">건물 지하 주차장 2시간 무료</p><p style="text-align: center">술자리이니 대중교통이나 대리운전 이용을 권합니다.</p>' },
      ],
    }},
    { id: 'yer-dday-1',     type: 'dday',     order: 6, required: false, config: {
      koreanTitle: '송년회까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    // 커버 그래픽 재탕이 아니라 '지난 송년회' 기록 사진 4컷
    { id: 'yer-gallery-1',  type: 'gallery',  order: 7, required: false, config: {
      koreanTitle: '지난 송년회', koreanLabelVisible: true,
      englishTitle: 'Last Year', labelVisible: true,
      titleBigVisible: false,
      images: yearendGallery,
      layout: 'grid',
    }},
    // 인원에 따라 좌석·코스 수량이 달라지므로 회신이 필수다
    { id: 'yer-rsvp-1', type: 'rsvp', order: 8, required: false, config: {
      koreanTitle: '참석 회신', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      titleBigVisible: false,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      deadline: YEAREND_DUE_LABEL,
      questions: [
        { id: 'yer-rsvp-attend', type: 'single-choice', label: '참석하시나요?',            required: true,  options: ['참석', '불참석'] },
        { id: 'yer-rsvp-name',   type: 'text-short',    label: '성함',                     required: true,  placeholder: '성함을 입력하세요.' },
        { id: 'yer-rsvp-count',  type: 'number',        label: '참석 인원(본인 포함)',       required: false, placeholder: '예: 1' },
        { id: 'yer-rsvp-after',  type: 'single-choice', label: '2차도 함께하시나요?',        required: false, options: ['2차까지', '1차만'] },
        { id: 'yer-rsvp-food',   type: 'text-short',    label: '못 드시는 음식 · 알러지',    required: false, placeholder: '없으면 비워 두세요.' },
      ],
    }},
    // 송년회는 회비를 걷는 경우가 대다수 — 금액·계좌·마감을 한 자리에
    { id: 'yer-account-1', type: 'account', order: 9, required: false, config: {
      koreanTitle: '회비 안내', koreanLabelVisible: true,
      englishTitle: 'Fee', labelVisible: true,
      titleBigVisible: false,
      titleSmall: `1인 30,000원 · ${YEAREND_DUE_LABEL}까지 입금 부탁드립니다`,
      titleSmallVisible: true,
      groups: [
        { label: '회비 입금 계좌', accounts: [
          { bank: '국민은행', number: '123-45-6789012', name: '총무 김하늘' },
        ]},
      ],
    }},
    { id: 'yer-contact-1', type: 'contact', order: 10, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '모임 총무', englishLabel: 'HOST',  contacts: [{ name: '김하늘', phone: '010-0000-0000' }] },
        { label: '장소 문의', englishLabel: 'VENUE', contacts: [{ name: '한남 빈티지 라운지', phone: '010-0000-0000' }] },
      ],
    }},
    { id: 'yer-guestbook-1', type: 'guestbook', order: 11, required: false, config: {
      koreanTitle: '한 해 인사', koreanLabelVisible: true,
      englishTitle: 'Message', labelVisible: true,
      titleBigVisible: false,
      buttonLabel: '한마디 남기기',
      modalTitle: '한 해 인사 남기기',
      messagePlaceholder: '올 한 해 함께한 이야기를 남겨 주세요.',
    }},
  ],
  styles: {
    font: '고운돋움',
    // 캔들 골드 on 딥 포레스트 그린 — 크림(#faf6ee)+골드(#bf8c4d) 웨딩 팔레트에서 이탈
    accentColor: '#c9a24d',
    bgColor: '#14261e',
    spacingColor: '#1b3227',
    // 종이 질감은 다크 배경에서 가로 줄무늬로 보인다 (Y-9)
    bgEffect: 'none',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: YEAREND_THEME_CONFIG,
}

// ─────────────────────────────────────────────────────────────────────────────
// birthday-celebration-template-001 — 성인 홈파티 생일 초대장
//
// 이 블록은 prisma/seed.ts 의 기존 `BIRTHDAY_GALLERY_IMAGES`(282~284행) 와
// `BIRTHDAY_TEMPLATE`(1206~1310행) 를 통째로 대체한다.
// 상수명은 기존과 동일하게 유지 — upsert 쪽(1762행)은 손대지 않아도 된다.
//
// 정체성 확정: 아동 생일파티 톤 → **성인 홈파티**(D-6 안 A).
//   - 커버/갤러리 이미지 5장 전량 신규(차분한 파스텔 · 어른 손 · 유리잔 · 감성 케이크)
//   - 기존 아동 파티 이미지(gallery/01~04.jpg)는 birthday-kids-template-001 이
//     그대로 참조하므로 **덮어쓰지 않는다.** 신규 자산은 `adult/` 하위 경로에 올린다.
//   - 계좌(account) 모듈 제거 — 친구 생일에 계좌번호는 부담(D-3 안 A).
//     대신 tab '파티 안내'에 "선물은 사양합니다" 한 줄로 갈음.
// ─────────────────────────────────────────────────────────────────────────────

// 성인 홈파티용 신규 갤러리 4장. 아동용 gallery/01~04.jpg 와 경로를 분리한다.
const BIRTHDAY_GALLERY_IMAGES = [
  templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'adult/gallery/01.jpg'),
  templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'adult/gallery/02.jpg'),
  templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'adult/gallery/03.jpg'),
  templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'adult/gallery/04.jpg'),
]

// 생일은 리드타임이 짧다(초대장 받고 한 달 안쪽에 모이는 자리).
const BIRTHDAY_DAY = eventDayOn(28, 6)  // 홈파티는 토요일 저녁
// 회신 마감은 파티 1주 전 — 음식/좌석 수량을 잡아야 한다.
const BIRTHDAY_RSVP_DUE = daysBefore(BIRTHDAY_DAY, 7)

// 커버(arch variant)의 연도/월일 표기는 행사일에서 파생시킨다. 문자열 하드코딩 금지.
const BIRTHDAY_YEAR = BIRTHDAY_DAY.iso.slice(0, 4)          // '2026'
const BIRTHDAY_MMDD = BIRTHDAY_DAY.iso.slice(5).replace('-', '.') // '08.22'
const BIRTHDAY_TIME = 'PM 6:00'
const BIRTHDAY_VENUE = '더 가든 파티하우스 2F'

// 생일(성인 홈파티) — 크림 + 더스티 코럴, arch 커버
const BIRTHDAY_TEMPLATE = {
  name: '홈파티 생일 초대장',
  description: '어른들의 생일 홈파티 초대장. 주인공 이름과 나이를 커버에 담고, 오시는 길·주차·파티 안내까지 한 번에.',
  thumbnail: templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'thumb_v3.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(BIRTHDAY_TEMPLATE_ID, 'adult/main_img.jpg'),
    // 링크만 받은 사람이 "누구 생일인지" 를 첫 화면에서 알 수 있어야 한다(D-1)
    invitationTitle: '지우의 서른 번째 생일에 초대합니다',
    greetingMessage: '서른 번째 생일을 맞아\n좋아하는 사람들을 초대합니다.\n\n거창한 자리는 아니지만\n맛있는 음식과 음악을 준비해 두었어요.\n\n편한 차림으로 오셔서\n오래 이야기 나누다 가세요.',
    // 서명이 없으면 아무것도 안 나온다(코드에서 fallback 제거됨) → 반드시 명시
    greetingAuthor: '지우 드림',
    eventDate: BIRTHDAY_DAY.iso,
    eventTime: BIRTHDAY_TIME,
    // 섹션 라벨(인사말/행사 일시/행사 장소)은 category-labels.ts 의 birthday 프리셋을 그대로 쓴다
    datetimeTitleBig: BIRTHDAY_DAY.koFull,
    // 홈파티는 "몇 시까지 있어도 되는지" 가 실제로 중요한 정보다
    datetimeTitleSmall: 'PM 6:00 ~ 10:00',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '더 가든 파티하우스',
      hall: '2F 홀',
      address: '서울특별시 마포구 양화로 45',
      lat: 37.5511,
      lng: 126.9142,
    },
    // 상세주소는 VenueSection 이 venue.address 로 자동 렌더 — 여기에 중복 표기하지 않는다
    venueTitleBig: BIRTHDAY_VENUE,
    shareTitle: '지우의 서른 번째 생일',
    shareText: `${BIRTHDAY_DAY.koCompact} ${BIRTHDAY_TIME} · 더 가든 파티하우스`,
  },
  defaultModules: [
    // 커버 — 아동 톤의 'sticker-pop'(별·하트·구름 스티커) 대신 차분한 'arch'.
    // 주인공 이름과 나이를 커버에 명시한다(D-1).
    { id: 'bir-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'arch',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'arch',
      decorations: [],
      backgroundPattern: 'none',
      textSlots: {
        yearText: BIRTHDAY_YEAR,
        topAccent: 'HAPPY BIRTHDAY',
        mainTitle: "Jiwoo's 30th",
        dateText: BIRTHDAY_MMDD,
        subjectFormatted: '· 지우 ·',
        bottomText: `${BIRTHDAY_DAY.koShort} ${BIRTHDAY_TIME}`,
        subText: BIRTHDAY_VENUE,
      },
    }},
    { id: 'bir-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'bir-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'bir-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    // 오시는 길·주차는 지도 바로 다음(D-2, C-11). 소규모 파티룸은 찾아가기가 어렵다.
    { id: 'bir-tab-1', type: 'tab', order: 5, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '오시는 길', content: '<p style="text-align: center">2호선·6호선 합정역 5번 출구 도보 7분</p><p style="text-align: center">경의중앙선 서강대역 1번 출구 도보 12분</p><p style="text-align: center">택시 이용 시 "양화로 45, 가든빌딩" 으로 말씀해 주세요.</p>' },
        { label: '주차',     content: '<p style="text-align: center">건물 지하 주차장 2시간 무료</p><p style="text-align: center">도착하시면 2층 입구에서 차량 번호를 등록해 주세요.</p><p style="text-align: center">만차일 경우 인근 양화로 공영주차장을 이용하실 수 있습니다.</p>' },
        { label: '파티 안내', content: '<p style="text-align: center">핑거푸드와 음료, 케이크가 준비됩니다.</p><p style="text-align: center">따로 챙겨 오실 것은 없어요. 편한 차림으로 오세요.</p><p style="text-align: center">선물은 정중히 사양합니다. 오시는 것만으로 충분해요.</p>' },
      ],
    }},
    { id: 'bir-dday-1', type: 'dday', order: 6, required: false, config: {
      koreanTitle: '파티까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    // 주인공이 누구인지 알 수 있도록 섹션 제목에 이름을 넣는다(기존 '주인공 인터뷰' → '지우의 한마디')
    { id: 'bir-interview-1', type: 'interview', order: 7, required: false, config: {
      koreanTitle: '지우의 한마디', koreanLabelVisible: true,
      englishTitle: 'Interview', labelVisible: true,
      titleBigVisible: false, titleSmallVisible: false,
      items: [
        { question: '<p>서른, 지금 기분이 어때요?</p>', answer: '<p>생각보다 담담해요. 곁에 좋은 사람들이 있어서요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>요즘 가장 즐거운 일은?</p>', answer: '<p>주말마다 뭘 만들어 먹는 거요. 그날도 몇 가지 준비해 둘게요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>와주실 분들께 한마디!</p>', answer: '<p>바쁜 주말에 시간 내주셔서 고마워요. 그날은 실컷 웃다 가세요.</p>', questionVisible: true, answerVisible: true },
      ],
    }},
    { id: 'bir-gallery-1', type: 'gallery', order: 8, required: false, config: {
      koreanTitle: '이날의 분위기', koreanLabelVisible: true,
      englishTitle: 'Mood', labelVisible: true,
      images: BIRTHDAY_GALLERY_IMAGES,
      layout: 'grid',
    }},
    // 음식·좌석 수량이 걸려 있으므로 회신 마감을 함께 안내한다
    { id: 'bir-rsvp-1', type: 'rsvp', order: 9, required: false, config: {
      koreanTitle: '참석 여부', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      titleSmall: '음식과 자리를 준비해야 해서 미리 여쭤봅니다.',
      titleSmallVisible: true,
      deadline: BIRTHDAY_RSVP_DUE.koShort,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      questions: [
        { id: 'bir-rsvp-attend', type: 'single-choice', label: '참석하시나요?',            required: true,  options: ['참석', '불참석'] },
        { id: 'bir-rsvp-count',  type: 'number',        label: '함께 오는 인원(본인 포함)',   required: false, placeholder: '예: 2' },
        { id: 'bir-rsvp-name',   type: 'text-short',    label: '성함',                     required: true,  placeholder: '성함을 입력하세요.' },
        { id: 'bir-rsvp-food',   type: 'text-short',    label: '못 드시는 음식이 있나요?',    required: false, placeholder: '없으면 비워 두셔도 됩니다.' },
      ],
    }},
    // 길을 잃었을 때 연락할 곳(D-2)
    { id: 'bir-contact-1', type: 'contact', order: 10, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '호스트', englishLabel: 'HOST', contacts: [{ name: '지우', phone: '010-0000-0000' }] },
      ],
    }},
    { id: 'bir-guestbook-1', type: 'guestbook', order: 11, required: false, config: {
      koreanTitle: '축하 한마디', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: '고운돋움',
    // 아동 파티 톤의 비비드 코럴(#f2683c) → 같은 팔레트 안의 차분한 더스티 코럴
    accentColor: '#d1603f',
    bgColor: '#fff8f2',
    spacingColor: '#ffe4d3',
    // 도트 패턴은 아이 생일 느낌이 강해 종이결로 교체
    bgEffect: 'paper',
    fontSize: 'normal',
    zoomDisabled: true,
    // 통통 튀는 'pop' → 차분하게 올라오는 'reveal'
    scrollAnimation: 'reveal',
    showEnglishTitle: true,
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: BIRTHDAY_THEME_CONFIG,
}

// ─────────────────────────────────────────────────────────────────────────────
// birthday-kids-template-001 — 아동 생일 (신규 템플릿)
//
// 통합 방법
//   1) 파일 상단 ID 상수 블록에 아래 한 줄을 추가한다.
//        const BIRTHDAY_KIDS_TEMPLATE_ID = 'birthday-kids-template-001'
//   2) 이 블록 전체를 BIRTHDAY_TEMPLATE 선언 바로 뒤에 붙인다.
//   3) main() 의 birthdayCategory 분기에 upsert 를 하나 더 추가한다
//      (subcategory 는 birthday-general 공용 — notes 참고).
//
// 카테고리 slug 는 'birthday' 이므로 인사말/일시/장소 라벨과 샘플 방명록,
// 달력 주말색은 category-labels.ts 가 자동으로 채운다. 시드에서 중복 지정하지 않는다.
// ─────────────────────────────────────────────────────────────────────────────

// 갤러리는 birthday-celebration 의 아동 파티 컷 4장을 그대로 참조한다(재업로드 없음).
// 주의 — celebration 이 성인 홈파티로 전환되며 같은 경로를 덮어쓰면 이 템플릿이 깨진다.
// celebration 의 신규 이미지는 반드시 새 파일명으로 올려야 한다(notes 참고).
const BIRTHDAY_KIDS_GALLERY_IMAGES = Array.from({ length: 4 }, (_, i) =>
  templateAssetUrl(BIRTHDAY_TEMPLATE_ID, `gallery/${String(i + 1).padStart(2, '0')}.jpg`)
)

// 아동 생일은 한 달 전쯤 돌리는 것이 자연스럽다(부모끼리 일정 조율 기간).
const BIRTHDAY_KIDS_DAY = eventDayOn(30, 6) // 아이 생일파티는 토요일
// 음식·답례품 수량 때문에 회신 마감이 실제로 필요하다. 행사 일주일 전.
const BIRTHDAY_KIDS_RSVP_DUE = daysBefore(BIRTHDAY_KIDS_DAY, 7)

// 아동 생일 — 밝은 피치·코랄, sticker-pop 커버(폴라로이드 + 컨페티)
const BIRTHDAY_KIDS_TEMPLATE = {
  name: '아이 생일 초대장',
  description: '아이 생일파티를 위한 밝은 초대장. 주인공 이름과 나이, 파티 순서·주차·알레르기 안내, 아이 눈높이 인터뷰까지 포함.',
  // 별도 썸네일 컷이 없어 커버와 동일 파일을 사용한다.
  thumbnail: templateAssetUrl(BIRTHDAY_KIDS_TEMPLATE_ID, 'main_img.png'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(BIRTHDAY_KIDS_TEMPLATE_ID, 'main_img.png'),
    // 링크만 받은 사람이 '누구 생일인지' 를 첫 화면에서 알 수 있어야 한다
    invitationTitle: '지호의 일곱 번째 생일에 초대합니다',
    greetingMessage: '지호가 벌써 일곱 살이 되었습니다.\n\n케이크 초를 세느라 신이 난 아이 곁에\n고마운 분들과 함께이고 싶습니다.\n\n아이들과 편하게 놀다 가실 수 있도록\n작은 파티룸을 준비했습니다.',
    // 명시하지 않으면 서명이 아예 나오지 않는다 (PreviewPane 의 fallback 제거됨)
    greetingAuthor: '지호 엄마 · 아빠 드림',
    eventDate: BIRTHDAY_KIDS_DAY.iso,
    eventTime: 'PM 12:30',
    datetimeTitleBig: BIRTHDAY_KIDS_DAY.koFull,
    datetimeTitleSmall: 'PM 12:30',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '레인보우 키즈파티룸',
      hall: '2F 파티룸',
      // 주소는 VenueSection 이 자동으로 한 줄 노출한다 → venueTitleBig 에 중복 기재하지 않는다
      address: '서울특별시 마포구 월드컵북로 21',
      lat: 37.5563,
      lng: 126.9106,
    },
    venueTitleBig: '레인보우 키즈파티룸 2F',
    shareTitle: '지호의 일곱 번째 생일',
    shareText: `${BIRTHDAY_KIDS_DAY.koCompact} PM 12:30 · 레인보우 키즈파티룸`,
  },
  defaultModules: [
    { id: 'bkid-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'sticker-pop',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'rounded',
      photoTilt: -3,
      decorations: ['confetti'],
      backgroundPattern: 'dots',
      textSlots: {
        // sticker-pop 이 제공하는 슬롯은 mainTitle / bottomText / subText 세 개뿐이다.
        // 이름과 나이를 mainTitle 에 함께 싣는다.
        mainTitle: '지호는 일곱 살!\nHAPPY 7th BIRTHDAY',
        bottomText: `${BIRTHDAY_KIDS_DAY.koShort} PM 12:30`,
        subText: '레인보우 키즈파티룸 2F',
      },
    }},
    { id: 'bkid-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'bkid-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    { id: 'bkid-venue-1',    type: 'venue',    order: 4, required: false, config: { showMap: true } },
    // 교통·주차 안내는 지도 바로 다음. 아이를 데리고 오는 자리라 동선 정보가 특히 중요하다
    { id: 'bkid-tab-1', type: 'tab', order: 5, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '오시는 길', content: '<p style="text-align: center">2·6호선 합정역 1번 출구 도보 6분</p><p style="text-align: center">마을버스 마포08 · 서교동주민센터 앞 하차</p>' },
        { label: '주차',     content: '<p style="text-align: center">건물 지하 주차장 2시간 무료</p><p style="text-align: center">파티룸 입구에서 차량 번호를 등록해 주세요.</p>' },
        { label: '파티 순서', content: '<p style="text-align: center">12:30 입장 · 자유 놀이</p><p style="text-align: center">13:00 점심</p><p style="text-align: center">14:00 케이크 커팅 · 사진</p><p style="text-align: center">15:00 마무리</p>' },
        { label: '알아두세요', content: '<p style="text-align: center">실내 놀이방이라 양말을 꼭 챙겨 주세요.</p><p style="text-align: center">아이 간식과 음료는 준비되어 있습니다.</p><p style="text-align: center">선물은 준비하지 않으셔도 괜찮아요.</p>' },
      ],
    }},
    { id: 'bkid-dday-1', type: 'dday', order: 6, required: false, config: {
      koreanTitle: '파티까지', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    // 주인공이 누구인지 제목에서 바로 드러나게 한다(돌잔치의 '시안이의 한마디' 패턴)
    { id: 'bkid-interview-1', type: 'interview', order: 7, required: false, config: {
      koreanTitle: '지호의 한마디', koreanLabelVisible: true,
      englishTitle: 'Interview', labelVisible: true,
      titleBigVisible: false, titleSmallVisible: false,
      items: [
        { question: '<p>이제 몇 살이 되었어?</p>', answer: '<p>일곱 살이요! 이만큼 컸어요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>좋아하는 음식은?</p>', answer: '<p>치킨이랑 딸기요. 케이크는 꼭 초코맛!</p>', questionVisible: true, answerVisible: true },
        { question: '<p>커서 뭐가 되고 싶어?</p>', answer: '<p>공룡 박사요. 티라노사우루스를 제일 잘 알아요.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>파티에 와줄 친구들에게 한마디!</p>', answer: '<p>와줘서 고마워! 우리 같이 신나게 놀자.</p>', questionVisible: true, answerVisible: true },
      ],
    }},
    { id: 'bkid-gallery-1', type: 'gallery', order: 8, required: false, config: {
      koreanTitle: '지호의 순간들', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: BIRTHDAY_KIDS_GALLERY_IMAGES,
      layout: 'grid',
    }},
    // 음식·답례품 수량과 알레르기 확인 때문에 회신이 실제로 필요하다
    { id: 'bkid-rsvp-1', type: 'rsvp', order: 9, required: false, config: {
      koreanTitle: '참석 여부', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      buttonLabel: '참석 여부 알리기',
      modalTitle: '참석 여부 전달',
      submitLabel: '전달하기',
      deadline: BIRTHDAY_KIDS_RSVP_DUE.koShort,
      questions: [
        { id: 'bkid-rsvp-attend',   type: 'single-choice', label: '파티에 오시나요?',              required: true,  options: ['참석', '불참석'] },
        { id: 'bkid-rsvp-child',    type: 'text-short',    label: '아이 이름',                    required: true,  placeholder: '예: 이서연' },
        { id: 'bkid-rsvp-count',    type: 'number',        label: '함께 오는 인원(보호자 포함)',    required: false, placeholder: '예: 2' },
        { id: 'bkid-rsvp-allergy',  type: 'text-short',    label: '못 먹는 음식이나 알레르기가 있나요?', required: false, placeholder: '없으면 비워 두셔도 됩니다.' },
      ],
    }},
    // 길을 헤매거나 늦을 때 연락할 곳
    { id: 'bkid-contact-1', type: 'contact', order: 10, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '지호 부모', englishLabel: 'HOST', contacts: [
          { name: '엄마 김서연', phone: '010-0000-0000' },
          { name: '아빠 이준호', phone: '010-0000-0000' },
        ]},
      ],
    }},
    { id: 'bkid-guestbook-1', type: 'guestbook', order: 11, required: false, config: {
      koreanTitle: '축하 한마디', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
    }},
  ],
  styles: {
    font: '고운돋움',
    // BIRTHDAY_THEME_CONFIG 팔레트 안에서 성인 홈파티(celebration)보다 한 톤 밝게 잡는다
    accentColor: '#f2683c',
    bgColor: '#fff1e8',
    spacingColor: '#ffddc9',
    bgEffect: 'dot',
    fontSize: 'normal',
    zoomDisabled: true,
    scrollAnimation: 'pop',
    showEnglishTitle: true,
    // 아이 파티용 CC BY 프리셋 트랙 (baby 카테고리 번들)
    bgm: {
      source: 'preset',
      trackId: 'baby-its-your-birthday',
      url: presetBgmUrl('baby', 'its-your-birthday.mp3'),
      title: "It's Your Birthday!",
      artist: 'Monk Turner + Fascinoma',
      loopEnabled: false,
    },
  },
  infoConfig: COMMON_EVENT_INFO_CONFIG,
  themeConfig: BIRTHDAY_THEME_CONFIG,
}

// ── 교육/기관 · 졸업식 ───────────────────────────────────────────────────────
// 포지션: **기관 발송**. 학교(한빛대학교 경영대학)가 학부모·내빈에게 보내는 안내장이다.
// 따라서 커버에는 주최 기관과 단과대만 넣고 개인 졸업생 이름은 넣지 않는다.
// (개인 발송용은 별도 템플릿으로 분리하는 편이 맞다 — notes 참조)

// 타임라인(식순) 이미지 — 좌우 교차 배치라 항목마다 1장씩 필요하다
const GRADUATION_TIMELINE_IMAGES = Array.from({ length: 5 }, (_, i) =>
  templateAssetUrl(GRADUATION_TEMPLATE_ID, `timeline/${String(i + 1).padStart(2, '0')}.jpg`)
)

// 갤러리 — 커버(main_img)를 재사용하지 않는다.
// `_v2` 접미사는 캐시 무효화용. objectstore 앞단 Cloudflare 가 max-age 1년으로 캐싱하므로
// 같은 키를 덮어쓰면 새 이미지가 반영되지 않는다. 이미지를 교체할 때는 항상 키를 새로 판다.
const GRADUATION_GALLERY_IMAGES = Array.from({ length: 4 }, (_, i) =>
  templateAssetUrl(GRADUATION_TEMPLATE_ID, `gallery/${String(i + 1).padStart(2, '0')}_v2.jpg`)
)

// 학위수여식은 학사일정으로 미리 공지되므로 리드타임을 길게 잡는다
const GRADUATION_DAY = eventDayOn(120, 5)   // 학위수여식은 평일(금)이 일반적
// 참석 인원 집계용 회신 마감 — 행사 7일 전
const GRADUATION_RSVP_DUE = daysBefore(GRADUATION_DAY, 7)
// 커버 제목의 연도는 행사일에서 파생시킨다 (하드코딩 금지)
const GRADUATION_YEAR = GRADUATION_DAY.iso.slice(0, 4)

const GRADUATION_TEMPLATE = {
  name: '졸업식 초대장',
  description: '학교·기관이 학부모와 내빈에게 보내는 학위수여식 안내장. 네이비 톤의 격식 있는 레이아웃에 식순·좌석·촬영·주차 안내 포함.',
  thumbnail: templateAssetUrl(GRADUATION_TEMPLATE_ID, 'thumb_v3.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(GRADUATION_TEMPLATE_ID, 'main_img_v2.jpg'),
    // 커버에 '학위수여식' 이 이미 크게 있으므로 인사말 큰제목은 수신자 호칭으로 분리한다
    invitationTitle: '학부모님과 내빈 여러분께',
    greetingMessage:
      '한빛대학교 경영대학은\n제52회 학위수여식을 아래와 같이 거행합니다.\n\n네 해의 배움을 마치고\n각자의 자리로 나아가는 졸업생들에게\n여러분의 축하가 가장 큰 격려가 됩니다.\n\n바쁘시더라도 함께 자리하시어\n졸업생들의 새로운 출발을 지켜봐 주시기 바랍니다.',
    // 서명을 명시하지 않으면 서명이 아예 렌더되지 않는다 (PreviewPane 의 커플 fallback 제거됨)
    greetingAuthor: '한빛대학교 경영대학장 드림',
    // 인사말 라벨('초대의 글' / 'Greeting')은 education 카테고리 프리셋과 같으므로 생략

    eventDate: GRADUATION_DAY.iso,
    eventTime: 'AM 10:00',
    // 카테고리 프리셋('행사 일시' / 'Event Day')보다 학사 어휘가 정확하다
    datetimeKoreanTitle: '학위수여식 일시',
    datetimeEnglishTitle: 'Ceremony',
    datetimeTitleBig: GRADUATION_DAY.koFull,
    // 개식 시각만 적으면 몇 시에 도착해야 하는지 알 수 없다
    datetimeTitleSmall: 'AM 10:00 개식 · 09:30 입장 시작',
    datetimeTitleSmallVisible: true,

    venue: {
      name: '한빛대학교 대강당',
      hall: '',
      address: '서울특별시 성북구 안암로 145',
      lat: 37.5894,
      lng: 127.0326,
    },
    // 장소 라벨('식장' / 'Venue')도 education 프리셋과 동일 — 생략
    venueTitleBig: '한빛대학교 대강당',
    // 캠퍼스가 넓어 건물명만으로는 못 찾는다. 주소는 VenueSection 이 자동으로 한 줄 더 렌더한다
    venueTitleSmall: '정문에서 도보 7분 · 인문관 맞은편',
    venueTitleSmallVisible: true,

    shareTitle: `한빛대학교 경영대학 ${GRADUATION_YEAR} 학위수여식`,
    shareText: `${GRADUATION_DAY.koCompact} AM 10:00 · 한빛대학교 대강당`,
  },
  defaultModules: [
    // 누가 여는 행사인지 — 기관명(HANBIT UNIVERSITY)과 단과대를 커버에서 못박는다
    { id: 'grad-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'half-split',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'HANBIT UNIVERSITY',
        title: `${GRADUATION_YEAR}\n경영대학 학위수여식`,
        bottomText: `${GRADUATION_DAY.koShort} AM 10:00`,
        subText: '한빛대학교 대강당',
      },
    }},
    { id: 'grad-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'grad-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    // 식순 — "몇 시에 가야 우리 아이 순서를 보나" 가 참석자의 첫 질문이다.
    // 한 줄로 압축된 탭 대신 시각을 붙인 타임라인으로 보여준다.
    { id: 'grad-timeline-1', type: 'timeline', order: 4, required: false, config: {
      koreanTitle: '식순', koreanLabelVisible: true,
      englishTitle: 'Program', labelVisible: true,
      titleBigVisible: false,
      titleSmallVisible: false,
      items: [
        { image: GRADUATION_TIMELINE_IMAGES[0], title: '09:30 · 입장 시작',
          content: '대강당 1층 로비에서 안내를 받으실 수 있습니다.\n좌석은 선착순이며 초대권은 필요하지 않습니다.',
          titleVisible: true, contentVisible: true },
        { image: GRADUATION_TIMELINE_IMAGES[1], title: '10:00 · 개식 · 학사보고',
          content: '국민의례와 학사보고로 식을 시작합니다.',
          titleVisible: true, contentVisible: true },
        { image: GRADUATION_TIMELINE_IMAGES[2], title: '10:20 · 학위수여',
          content: '학사 · 석사 · 박사 순으로 진행하며\n학과별 가나다순으로 호명합니다.',
          titleVisible: true, contentVisible: true },
        { image: GRADUATION_TIMELINE_IMAGES[3], title: '11:00 · 학장 축사 · 졸업생 답사',
          content: '재학생 송사와 졸업생 답사가 이어집니다.',
          titleVisible: true, contentVisible: true },
        { image: GRADUATION_TIMELINE_IMAGES[4], title: '11:30 · 기념 촬영 후 폐식',
          content: '폐식 후 12시부터 본관 앞 잔디광장에서\n학과별 단체 촬영이 있습니다.',
          titleVisible: true, contentVisible: true },
      ],
    }},
    { id: 'grad-venue-1', type: 'venue', order: 5, required: false, config: { showMap: true } },
    // 좌석·입장·촬영·주차·교통 안내는 지도 바로 다음. 갤러리를 사이에 두지 않는다.
    // 탭은 flex-1 균등 분할이라 라벨이 길면 줄바꿈된다 — 4개 / 5자 이내로 유지할 것.
    { id: 'grad-tab-1', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '참석 안내', koreanLabelVisible: true,
      englishTitle: 'Information', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '좌석·입장', content: '<p style="text-align: center">09:30부터 입장하실 수 있습니다.</p><p style="text-align: center">1층 중앙과 2층 발코니가 학부모·내빈석입니다.</p><p style="text-align: center">졸업생은 09:00까지 학과별 집결지로 모여 주세요.</p><p style="text-align: center">휠체어석과 유아 동반석은 1층 좌측에 마련되어 있습니다.</p>' },
        { label: '사진 촬영', content: '<p style="text-align: center">식중에는 통로 촬영과 플래시 사용을 삼가 주세요.</p><p style="text-align: center">단체 촬영은 12:00부터 본관 앞 잔디광장에서 진행합니다.</p><p style="text-align: center">꽃다발은 정문 앞 임시 판매대에서 구입하실 수 있으며,</p><p style="text-align: center">화환은 대강당 내 반입이 어렵습니다.</p><p style="text-align: center">가족 식사는 교내 교직원식당(중앙관 2층)을 이용하실 수 있습니다.</p>' },
        { label: '주차', content: '<p style="text-align: center">교내 주차장 이용 · 행사 당일 4시간 무료</p><p style="text-align: center">09:00~10:00 정문이 혼잡하니 후문 주차장을 권해 드립니다.</p><p style="text-align: center">후문 주차장에서 대강당까지 셔틀버스가 10분 간격으로 운행합니다.</p>' },
        { label: '오시는 길', content: '<p style="text-align: center">6호선 안암역 1번 출구 도보 10분</p><p style="text-align: center">간선버스 273 · 143 안암동 정류장 하차 도보 5분</p><p style="text-align: center">정문 진입 후 직진, 인문관 맞은편 대강당</p>' },
      ],
    }},
    { id: 'grad-dday-1', type: 'dday', order: 7, required: false, config: {
      koreanTitle: '학위수여식까지', koreanLabelVisible: true,
      englishTitle: 'Countdown', labelVisible: true,
    }},
    { id: 'grad-gallery-1', type: 'gallery', order: 8, required: false, config: {
      koreanTitle: '지난 학위수여식', koreanLabelVisible: true,
      englishTitle: 'Gallery', labelVisible: true,
      images: GRADUATION_GALLERY_IMAGES,
      layout: 'grid',
    }},
    // 좌석과 단체 촬영 인원을 미리 파악해야 해서 참석 인원 집계가 목적이다
    { id: 'grad-rsvp-1', type: 'rsvp', order: 9, required: false, config: {
      koreanTitle: '참석 회신', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      titleBigVisible: false,
      buttonLabel: '참석 인원 알리기',
      modalTitle: '참석 회신',
      submitLabel: '보내기',
      deadline: GRADUATION_RSVP_DUE.koShort,
      questions: [
        { id: 'grad-rsvp-name',    type: 'text-short',    label: '작성자 성함',        required: true,  placeholder: '성함을 입력해 주세요.' },
        { id: 'grad-rsvp-student', type: 'text-short',    label: '졸업생 학과 · 성명', required: true,  placeholder: '예: 경영학과 김서준', description: '어느 졸업생의 가족·지인이신지 알려 주세요.' },
        { id: 'grad-rsvp-attend',  type: 'single-choice', label: '참석 여부',          required: true,  options: ['참석', '불참'] },
        { id: 'grad-rsvp-count',   type: 'number',        label: '참석 인원(본인 포함)', required: true,  placeholder: '예: 3', description: '좌석 배치와 단체 촬영 준비에 사용합니다.' },
        { id: 'grad-rsvp-support', type: 'multi-choice',  label: '필요한 편의 지원',    required: false, options: ['휠체어석', '유아 동반석', '수어통역', '해당 없음'] },
      ],
    }},
    { id: 'grad-contact-1', type: 'contact', order: 10, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        // 번호가 비면 통화/문자 아이콘이 회색 죽은 버튼으로 남는다 — 예약 대역을 넣는다
        { label: '행사 문의', englishLabel: 'OFFICE', contacts: [
          { name: '경영대학 교학팀', phone: '010-0000-0000' },
        ]},
        { label: '주차 · 시설 문의', englishLabel: 'CAMPUS', contacts: [
          { name: '시설관리팀', phone: '010-0000-0000' },
        ]},
      ],
    }},
    { id: 'grad-guestbook-1', type: 'guestbook', order: 11, required: false, config: {
      koreanTitle: '축하 방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
      buttonLabel: '축하 남기기',
      modalTitle: '축하 방명록',
      messagePlaceholder: '졸업생에게 전할 축하 인사를 남겨 주세요.',
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

// ── 아트/문화 · 전시회 ───────────────────────────────────────────────────────
// 개인전 초대장. 핵심 시정 사항은 "이 초대장의 주인공은 오프닝 하루가 아니라 전시 기간"이다.
// 커버 · 인사말 · 일시 · 관람 안내 네 곳에서 기간을 반복해 노출한다.
//
// 갤러리 이미지 4장은 objectstore 기준 1080×1080 정사각.
// 02 만 이번에 재생성했다. `_v2` 접미사는 캐시 무효화용 — objectstore 앞단 Cloudflare 가
// max-age 1년으로 캐싱하므로 같은 키를 덮어쓰면 새 이미지가 반영되지 않는다.
const EXHIBITION_GALLERY_IMAGES = ['01.jpg', '02_v2.jpg', '03.jpg', '04.jpg'].map((f) =>
  templateAssetUrl(EXHIBITION_TEMPLATE_ID, `gallery/${f}`)
)

// 슬라이드 모듈의 기본 비율은 16/9 라서 정사각 작품이 위아래로 잘린다.
// 원본 전체를 1:1 로 보여주도록 크롭 메타를 명시한다(zoom 1, 전체 영역).
const EXHIBITION_SQUARE_CROP = {
  aspectRatio: '1/1',
  zoom: 1,
  crop: { x: 0, y: 0 },
  croppedAreaPercentage: { x: 0, y: 0, width: 100, height: 100 },
}

// 오프닝 리셉션 = D-day 기준일(권장 리드타임 55일).
// 요일이 의미를 가지므로 상대 날짜를 그대로 쓰지 않고 요일을 맞춘다.
//  - 오프닝은 금요일 저녁  (전시 오프닝 관례)
//  - 폐막일은 일요일       (월요일 휴관이라 종료일이 월요일이면 안내가 모순된다)
const EXHIBITION_OPEN_OFFSET = (() => {
  let off = 55
  while (!eventDay(off).koShort.endsWith('(금)')) off += 1
  return off
})()
const EXHIBITION_CLOSE_OFFSET = (() => {
  let off = EXHIBITION_OPEN_OFFSET + 21
  while (!eventDay(off).koShort.endsWith('(일)')) off += 1
  return off
})()
const EXHIBITION_OPEN = eventDay(EXHIBITION_OPEN_OFFSET)
const EXHIBITION_CLOSE = eventDay(EXHIBITION_CLOSE_OFFSET)
// 회신 마감 — 오프닝 3일 전
const EXHIBITION_RSVP_BY = eventDay(EXHIBITION_OPEN_OFFSET - 3)

// koShort 는 '2026. 09. 18. (금)'. slice(6) 으로 연도를 떼어 '09. 18. (금)' 을 얻는다.
// 기간 표기에서 연도를 두 번 반복하지 않기 위한 것.
const EXHIBITION_OPEN_MD = EXHIBITION_OPEN.koShort.slice(6)
const EXHIBITION_CLOSE_MD = EXHIBITION_CLOSE.koShort.slice(6)
const EXHIBITION_RSVP_MD = EXHIBITION_RSVP_BY.koShort.slice(6)
// 예: '2026. 09. 18. (금) — 10. 11. (일)'
const EXHIBITION_PERIOD = `${EXHIBITION_OPEN.koShort} — ${EXHIBITION_CLOSE_MD}`
// 작품 제작연도도 시드 실행 연도에서 파생시킨다(고정 연도를 박으면 해가 바뀔 때 낡는다).
const EXHIBITION_YEAR = Number(EXHIBITION_OPEN.iso.slice(0, 4))

// 출품작 캡션 — 제목 · 제작연도 · 재료 · 크기.
// 관람객에게는 기본 정보이고 컬렉터·기자에게는 필수 정보다.
const EXHIBITION_WORKS = [
  { title: '《고요한 시간 I》',  caption: `${EXHIBITION_YEAR} · 캔버스에 유채 · 130 × 130 cm` },
  { title: '《고요한 시간 II》', caption: `${EXHIBITION_YEAR} · 캔버스에 유채 · 116 × 91 cm` },
  { title: '《머무는 자리》',    caption: `${EXHIBITION_YEAR - 1} · 도자에 유약 · 45 × 30 × 30 cm` },
  { title: '《결》',            caption: `${EXHIBITION_YEAR} · 캔버스에 혼합재료 · 91 × 73 cm (부분)` },
]

const EXHIBITION_TEMPLATE = {
  name: '전시회 초대장',
  description: '개인전·기획전을 위한 미니멀 초대장. 전시 기간, 관람 안내, 작품 캡션까지 담은 오프화이트 레이아웃.',
  thumbnail: templateAssetUrl(EXHIBITION_TEMPLATE_ID, 'thumb_v3.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(EXHIBITION_TEMPLATE_ID, 'main_img_v2.jpg'),
    // 인사말 큰제목 — 작가명을 여기서 처음 문장으로 밝힌다
    invitationTitle: '김하린 개인전에 초대합니다',
    greetingMessage:
      '오랜 시간 담아 온 작업을\n조심스레 선보이는 자리입니다.\n\n' +
      '느린 걸음으로 둘러보시며\n각자의 이야기를 만나 가시길 바랍니다.\n\n' +
      `전시는 ${EXHIBITION_PERIOD} 동안 이어집니다.`,
    // 서명이 없으면 인사말 하단이 비어버린다(웨딩 fallback 제거 이후). 작가 이름으로 명시.
    greetingAuthor: '작가 김하린',
    // 섹션 라벨(초대의 글 / 전시 기간 / 전시 장소)은 category-labels.ts 의 culture 프리셋을 그대로 쓴다.
    eventDate: EXHIBITION_OPEN.iso,     // D-day·캘린더 기준 = 오프닝 당일
    eventTime: 'PM 6:00',
    // '전시 기간' 라벨 아래에는 하루가 아니라 기간이 와야 한다
    datetimeTitleBig: EXHIBITION_PERIOD,
    datetimeTitleSmall: `오프닝 리셉션 ${EXHIBITION_OPEN_MD} PM 6:00 – 8:00`,
    datetimeTitleSmallVisible: true,
    venue: {
      name: '더 화이트 갤러리',
      hall: 'B1',
      address: '서울특별시 종로구 삼청로 30',
      lat: 37.5820,
      lng: 126.9816,
    },
    venueTitleBig: '더 화이트 갤러리 B1',
    // 상세주소는 VenueSection 이 venue.address 로 자동 렌더하므로 중복 지정하지 않는다.
    shareTitle: '김하린 개인전 《고요한 시간들》',
    shareText: `${EXHIBITION_PERIOD} · 더 화이트 갤러리`,
  },
  defaultModules: [
    // 커버 — 하단 정렬 + 강한 그라데이션 variant. 밝은 갤러리 사진 위 흰 글씨가
    // 읽히지 않던 문제(오버레이 타이틀 variant)를 구조적으로 해결한다.
    // 전시명 · 기간 · 작가 · 장소가 한 화면에 모두 들어간다.
    { id: 'exh-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'event-headline',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'square',
      textSlots: {
        inviteLabel: 'SOLO EXHIBITION',
        title: '고요한\n시간들',
        dateLine: EXHIBITION_PERIOD,
        subText: '김하린 · 더 화이트 갤러리 B1',
      },
    }},
    { id: 'exh-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    // 작가가 누구인지 — 개인전에서는 전시명만큼 중요한 정보다
    { id: 'exh-profile-1', type: 'solo_profile', order: 3, required: false, config: {
      koreanTitle: '작가 소개', koreanLabelVisible: true,
      englishTitle: 'Artist', labelVisible: true,
      titleBigVisible: false, titleSmallVisible: false,
      persons: [
        {
          image: templateAssetUrl(EXHIBITION_TEMPLATE_ID, 'profile_img.jpg'),
          name: '김하린',
          description:
            '회화와 도자를 오가며 일상의 정적을 기록합니다.\n\n' +
            `${EXHIBITION_YEAR - 8} 홍익대학교 회화과 졸업\n` +
            `${EXHIBITION_YEAR - 4} 개인전 《머무는 빛》 · 서울\n` +
            `${EXHIBITION_YEAR - 2} 단체전 《사이의 결》 · 파주`,
          descriptionVisible: true,
        },
      ],
    }},
    { id: 'exh-datetime-1', type: 'datetime', order: 4, required: false, config: {} },
    { id: 'exh-venue-1',    type: 'venue',    order: 5, required: false, config: { showMap: true } },
    // 교통·주차는 지도 바로 다음. 갤러리는 주차가 어려운 경우가 많아 주차 탭이 반드시 필요하다.
    { id: 'exh-tab-1', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '오시는 길', koreanLabelVisible: true,
      englishTitle: 'Directions', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '지하철', content: '<p style="text-align: center">3호선 안국역 1번 출구 도보 8분</p><p style="text-align: center">3호선 경복궁역 4번 출구 도보 12분</p>' },
        { label: '버스',   content: '<p style="text-align: center">마을버스 종로11 · 종로02</p><p style="text-align: center">삼청동주민센터 하차 도보 3분</p>' },
        { label: '주차',   content: '<p style="text-align: center">갤러리 전용 주차장이 없습니다.</p><p style="text-align: center">삼청동 공영주차장(도보 4분)을 이용해 주세요.</p><p style="text-align: center">주말에는 대중교통을 권해 드립니다.</p>' },
      ],
    }},
    // 관람 안내 — 기간·오프닝 상세·입장·문의. 탭 라벨은 2글자로 맞춰 한 줄에 4개가 들어가게 한다.
    { id: 'exh-tab-2', type: 'tab', order: 7, required: false, config: {
      koreanTitle: '관람 안내', koreanLabelVisible: true,
      englishTitle: 'Visit', labelVisible: true,
      titleBigVisible: false,
      tabs: [
        { label: '관람', content:
          `<p style="text-align: center">${EXHIBITION_PERIOD}</p>` +
          '<p style="text-align: center">11:00 – 19:00 (입장 마감 18:30)</p>' +
          '<p style="text-align: center">매주 월요일 휴관</p>' },
        { label: '오프닝', content:
          `<p style="text-align: center">${EXHIBITION_OPEN_MD} PM 6:00 – 8:00</p>` +
          '<p style="text-align: center">PM 7:00 작가와의 대화 (약 30분)</p>' +
          '<p style="text-align: center">간단한 다과가 준비되어 있습니다.</p>' },
        { label: '입장', content:
          '<p style="text-align: center">무료 관람 · 예약 없이 입장하실 수 있습니다.</p>' +
          '<p style="text-align: center">사진 촬영은 가능하나 플래시와 삼각대는 삼가 주세요.</p>' +
          '<p style="text-align: center">전시장 내 음료 반입은 어렵습니다.</p>' },
        { label: '문의', content:
          '<p style="text-align: center">작품 구매 · 프레스 자료 문의는 갤러리로 연락 주세요.</p>' +
          '<p style="text-align: center">작품 상세 이미지와 가격 정보를 보내 드립니다.</p>' },
      ],
    }},
    { id: 'exh-dday-1', type: 'dday', order: 8, required: false, config: {
      koreanTitle: '오프닝까지', koreanLabelVisible: true,
      englishTitle: 'D-day', labelVisible: true,
    }},
    // 출품작 — 이미지만 나열하던 갤러리 그리드를 캡션이 붙는 슬라이드로 교체.
    // 제목·연도·재료·크기가 없으면 작품 이미지는 장식으로만 기능한다.
    { id: 'exh-works-1', type: 'slide', order: 9, required: false, config: {
      koreanTitle: '출품작', koreanLabelVisible: true,
      englishTitle: 'Works', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '전시장에서는 20여 점을 만나실 수 있습니다.', titleSmallVisible: true,
      slides: EXHIBITION_WORKS.map((work, i) => ({
        image: EXHIBITION_GALLERY_IMAGES[i],
        imageCrop: EXHIBITION_SQUARE_CROP,
        imageVisible: true,
        title: work.title,
        titleVisible: true,
        content: work.caption,
        contentVisible: true,
      })),
    }},
    // 작가의 말 — 작품을 본 다음에 읽히도록 출품작 뒤에 둔다.
    // interview 모듈에는 작성자 필드가 없어 titleSmall 로 작가를 밝힌다.
    { id: 'exh-interview-1', type: 'interview', order: 10, required: false, config: {
      koreanTitle: '작가의 말', koreanLabelVisible: true,
      englishTitle: 'Artist Note', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '김하린 · 회화, 서울 작업', titleSmallVisible: true,
      items: [
        { question: '<p>이번 전시는 어떤 이야기를 담고 있나요?</p>', answer: '<p>매일의 고요한 시간들, 그 안에 머무는 감정의 결을 담았습니다.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>회화와 도자를 함께 내놓은 이유가 있나요?</p>', answer: '<p>같은 정적을 평면과 입체로 각각 옮겨 보고 싶었습니다. 두 작업은 한 쌍으로 읽히길 바랍니다.</p>', questionVisible: true, answerVisible: true },
        { question: '<p>관람객이 어떻게 봐주었으면 하나요?</p>', answer: '<p>정답을 찾기보다, 각자의 속도로 천천히 머물다 가시길 바랍니다.</p>', questionVisible: true, answerVisible: true },
      ],
    }},
    // 전시 관람 자체는 예약이 필요 없다. 회신은 다과·좌석이 걸린 오프닝 리셉션에 한정한다.
    { id: 'exh-rsvp-1', type: 'rsvp', order: 11, required: false, config: {
      koreanTitle: '오프닝 참석', koreanLabelVisible: true,
      englishTitle: 'RSVP', labelVisible: true,
      titleBigVisible: false,
      titleSmall: '전시 관람은 회신 없이 오셔도 됩니다.', titleSmallVisible: true,
      deadline: EXHIBITION_RSVP_MD,
      buttonLabel: '오프닝 참석 알리기',
      modalTitle: '오프닝 리셉션 참석 회신',
      submitLabel: '보내기',
      questions: [
        { id: 'exh-rsvp-attend', type: 'single-choice', label: '오프닝 리셉션에 참석하시나요?', required: true, options: ['참석', '불참석'] },
        { id: 'exh-rsvp-count',  type: 'number',        label: '동반 인원(본인 포함)', required: false, placeholder: '예: 2' },
        { id: 'exh-rsvp-name',   type: 'text-short',    label: '성함',               required: true,  placeholder: '성함을 입력하세요.' },
      ],
    }},
    // 관람 예약·작품 문의가 실제로 들어오는 채널이라 번호가 비어 있으면 안 된다.
    { id: 'exh-contact-1', type: 'contact', order: 12, required: false, config: {
      koreanTitle: '문의', koreanLabelVisible: true,
      englishTitle: 'Contact', labelVisible: true,
      titleBigVisible: false,
      groups: [
        { label: '관람 문의', englishLabel: 'GALLERY', contacts: [
          { name: '더 화이트 갤러리', phone: '010-0000-0000' },
        ]},
        { label: '작품 문의', englishLabel: 'ARTWORK', contacts: [
          { name: '전시 담당 큐레이터', phone: '010-0000-0000' },
        ]},
      ],
    }},
    { id: 'exh-guestbook-1', type: 'guestbook', order: 13, required: false, config: {
      koreanTitle: '방명록', koreanLabelVisible: true,
      englishTitle: 'Guestbook', labelVisible: true,
      messagePlaceholder: '전시를 보고 남은 이야기를 적어 주세요.',
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

// ── 부고/추모 — 절제된 세이지·차콜, 국화 커버 ───────────────────────────────
// 부고는 "누가 · 언제 별세했는가" 를 알리는 것이 존재 이유다.
// 고인 성함 / 별세일시 / 향년 을 커버에 두고, 장례 일정(빈소·입관·발인·장지)은
// timeline 으로 시간순 제공한다.

// 장례 일정용 정물 컷(4). 인물·기념사진이 아니라 절제된 스틸라이프다.
// 부고에 gallery 모듈은 부적절하므로 timeline 전용으로만 쓴다.
const memorialTimeline = [
  templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'timeline/01.jpg'),
  templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'timeline/02.jpg'),
  templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'timeline/03.jpg'),
  templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'timeline/04.jpg'),
]

// 3일장 기준. eventDate 는 발인일(오늘 +4일 — 부고는 임박이 자연스럽다).
// 3일장. 별세는 이미 일어난 일이므로 반드시 과거(어제)여야 한다 —
// 미래 날짜로 두면 "이틀 뒤에 별세하셨습니다" 로 읽힌다.
const MEMORIAL_PASSING_DAY = eventDay(-1)  // 별세 · 빈소 개시 (어제)
const MEMORIAL_COFFIN_DAY = eventDay(0)    // 입관 (오늘)
const MEMORIAL_DAY = eventDay(1)           // 발인 (내일)

const MEMORIAL_TEMPLATE = {
  name: '부고 · 추모 안내',
  description: '고인의 성함과 별세일시, 장례 일정(빈소·입관·발인·장지), 유가족과 빈소 안내를 담은 절제된 부고. 차분한 세이지·차콜 톤.',
  thumbnail: templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'thumb_v3.jpeg'),
  isPublic: true,
  defaultContent: {
    coverImage: templateAssetUrl(MEMORIAL_TEMPLATE_ID, 'main_img_v2.jpg'),
    invitationTitle: '삼가 고인의 별세를 알려드립니다',
    // 부고의 표준 형식 — 성함 · 별세일 · 향년을 본문 첫 문단에서 명시한다.
    greetingMessage: `故 홍○○ 님께서\n${MEMORIAL_PASSING_DAY.koShort} 향년 82세로\n별세하셨기에 삼가 알려 드립니다.\n\n평소 고인께서 베풀어 주신\n따뜻한 정에 깊이 감사드립니다.\n\n갑작스러운 비보를 전하게 되어\n송구한 마음뿐입니다.\n\n부디 오시어 고인의\n마지막 길을 함께해 주시면\n감사하겠습니다.`,
    // 서명을 명시하지 않으면 아예 렌더되지 않는다(웨딩 fallback 제거됨)
    greetingAuthor: '상주 일동',
    // greetingKoreanTitle('부고') / datetimeKoreanTitle('발인 일시') / venueKoreanTitle('빈소')
    // 는 category-labels.ts 의 memorial 프리셋과 동일하므로 지정하지 않는다.
    eventDate: MEMORIAL_DAY.iso,
    eventTime: '오전 7시',
    datetimeTitleBig: MEMORIAL_DAY.koFull,
    datetimeTitleSmall: '오전 7시',
    datetimeTitleSmallVisible: true,
    venue: {
      name: '한빛장례식장',
      hall: '3층 특7호실',
      address: '서울특별시 서대문구 연세로 50',
      lat: 37.5623,
      lng: 126.9376,
    },
    // 상세주소(venue.address)는 VenueSection 이 자동으로 렌더하므로 중복 기재하지 않는다.
    venueTitleBig: '한빛장례식장 3층 특7호실',
    shareTitle: '故 홍○○ 님 부고',
    shareText: `발인 ${MEMORIAL_DAY.koCompact} 오전 7시 · 한빛장례식장 3층 특7호실`,
  },
  defaultModules: [
    // 커버 — classic variant 는 textSlots 3개(topText/bottomText/subText)만 렌더한다.
    // topText: 고인 성함(강조, accent)  bottomText: 별세일시·향년  subText: 발인·빈소
    { id: 'mem-main-1', type: 'main', order: 1, required: true, config: {
      variant: 'classic',
      koreanLabelVisible: false, labelVisible: false,
      koreanTitle: '', englishTitle: '',
      photoShape: 'arch',
      showNames: true,
      decorations: [],          // 부고에 장식 반짝임은 결례다 — 명시적으로 비운다
      backgroundPattern: 'none',
      textSlots: {
        topText: '삼가 고인의 명복을 빕니다\n\n故 홍○○',
        bottomText: `${MEMORIAL_PASSING_DAY.koShort} 별세 · 향년 82세`,
        subText: `발인 ${MEMORIAL_DAY.koShort} 오전 7시\n한빛장례식장 3층 특7호실`,
      },
    }},
    { id: 'mem-greeting-1', type: 'greeting', order: 2, required: false, config: {} },
    { id: 'mem-datetime-1', type: 'datetime', order: 3, required: false, config: {} },
    // 조문객이 정말 알아야 하는 것은 발인 시각이 아니라 "언제 가면 되는가" 다.
    // 빈소 개시 → 입관 → 발인 → 장지 도착을 시간순으로 제공한다.
    { id: 'mem-timeline-1', type: 'timeline', order: 4, required: false, config: {
      koreanTitle: '장례 일정', koreanLabelVisible: true,
      labelVisible: false,
      titleBigVisible: false,
      titleSmallVisible: false,
      items: [
        { image: memorialTimeline[0], title: '빈소 개시',
          content: `${MEMORIAL_PASSING_DAY.koShort} 오후 3시\n한빛장례식장 3층 특7호실\n이후 24시간 조문 가능합니다.`,
          titleVisible: true, contentVisible: true },
        { image: memorialTimeline[1], title: '입관',
          content: `${MEMORIAL_COFFIN_DAY.koShort} 오후 2시\n유가족과 가까운 분들께서 함께합니다.`,
          titleVisible: true, contentVisible: true },
        { image: memorialTimeline[2], title: '발인',
          content: `${MEMORIAL_DAY.koShort} 오전 7시\n빈소 앞에서 출발합니다.`,
          titleVisible: true, contentVisible: true },
        { image: memorialTimeline[3], title: '장지 도착',
          content: `${MEMORIAL_DAY.koShort} 오전 9시\n하늘추모공원 (경기도 파주시)`,
          titleVisible: true, contentVisible: true },
      ],
    }},
    { id: 'mem-venue-1', type: 'venue', order: 5, required: false, config: { showMap: true } },
    // 조문 예법·조화·장지·교통은 지도 바로 다음에 온다.
    // 탭은 flex-1 한 줄 배치라 4개를 넘기면 라벨이 깨진다 — 주차는 '오시는 길'에 포함.
    { id: 'mem-tab-1', type: 'tab', order: 6, required: false, config: {
      koreanTitle: '안내', koreanLabelVisible: true,
      labelVisible: false,
      titleBigVisible: false,
      tabs: [
        { label: '조문 안내', content: '<p style="text-align: center">조문은 24시간 가능합니다.</p><p style="text-align: center">고인의 뜻에 따라 기독교식으로 진행하며,</p><p style="text-align: center">헌화로 조의를 표해 주시면 됩니다.</p><p style="text-align: center">매일 오후 8시 위로예배가 있습니다.</p><p style="text-align: center">식사는 빈소 옆 접객실에 준비되어 있습니다.</p>' },
        { label: '조화 안내', content: '<p style="text-align: center">조화·근조기는 빈소로 보내주시기 바랍니다.</p><p style="text-align: center">한빛장례식장 3층 특7호실 (홍○○ 빈소)</p><p style="text-align: center">1층 화환 접수처에서 접수를 도와드립니다.</p><p style="text-align: center">부의금은 빈소 접수처 또는 아래 계좌로 받고 있습니다.</p>' },
        { label: '장지',     content: '<p style="text-align: center">하늘추모공원 (경기도 파주시 광탄면)</p><p style="text-align: center">발인 후 오전 9시경 도착 예정입니다.</p><p style="text-align: center">동행 버스 1대가 빈소 앞에서 오전 7시에 출발합니다.</p><p style="text-align: center">탑승은 상주에게 미리 말씀해 주세요.</p>' },
        { label: '오시는 길', content: '<p style="text-align: center">2호선 신촌역 2번 출구 도보 8분</p><p style="text-align: center">택시 이용 시 "한빛장례식장"으로 말씀해 주세요.</p><p style="text-align: center">주차 — 장례식장 지하 1~3층, 조문객 3시간 무료</p><p style="text-align: center">1층 안내데스크에서 주차 등록해 주세요.</p>' },
      ],
    }},
    // 섹션 제목이 이미 '마음 전하실 곳' 이므로 titleBig 는 끈다(중복 방지)
    { id: 'mem-account-1', type: 'account', order: 7, required: false, config: {
      koreanTitle: '마음 전하실 곳', koreanLabelVisible: true,
      labelVisible: false,
      titleBigVisible: false,
      titleSmall: '계좌번호를 누르면 복사됩니다.',
      titleSmallVisible: true,
      groups: [
        { label: '장남 홍길동', accounts: [
          { bank: '농협', number: '302-1234-5678-91', name: '홍길동' },
        ]},
        { label: '차남 홍길서', accounts: [
          { bank: '국민', number: '123456-04-567890', name: '홍길서' },
        ]},
      ],
    }},
    // 유가족 구성 — 조문객이 "누구와의 관계로 가는지" 판단하는 기준이다.
    // 전화번호는 관습대로 상주(연락 담당)에게만. 나머지는 phone 키를 아예 생략한다
    // (빈 문자열이면 죽은 회색 버튼이 아니라 아이콘 자체가 안 그려지지만, 키를 두지 않는 편이 명확하다)
    { id: 'mem-contact-1', type: 'contact', order: 8, required: false, config: {
      koreanTitle: '유가족', koreanLabelVisible: true,
      labelVisible: false,
      titleBigVisible: false,
      groups: [
        // '미망인'(아직 죽지 않은 사람)은 국립국어원이 사용을 권하지 않는 표현이다.
        // 부고는 결례가 곧 사고이므로 중립적인 '배우자'로 둔다.
        { label: '배우자', contacts: [{ name: '김○○' }] },
        { label: '아들',   contacts: [
          { name: '홍길동 (상주)', phone: '010-0000-0000' },
          { name: '홍길서', phone: '010-0000-0000' },
        ]},
        { label: '며느리', contacts: [{ name: '이○○' }, { name: '박○○' }] },
        { label: '딸',     contacts: [{ name: '홍길순' }] },
        { label: '사위',   contacts: [{ name: '최○○' }] },
      ],
    }},
    // 방명록 기본 문구("축하 메시지를 남겨주세요")는 부고에 쓸 수 없다 — 전부 덮어쓴다
    { id: 'mem-guestbook-1', type: 'guestbook', order: 9, required: false, config: {
      koreanTitle: '추모의 글', koreanLabelVisible: true,
      labelVisible: false,
      titleBigVisible: false,
      buttonLabel: '추모의 글 남기기',
      modalTitle: '추모의 글',
      submitLabel: '남기기',
      namePlaceholder: '성함 또는 고인과의 관계',
      messagePlaceholder: '고인을 기리는 마음을 남겨 주세요.',
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
      update: templateUpdate(WEDDING_TEMPLATE, {
        categoryId: weddingCategory.id,
        subcategoryId: weddingMainSub?.id ?? null,
      }),
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
      update: templateUpdate(BABY_FIRST_BIRTHDAY_TEMPLATE, {
        categoryId: babyCategory.id,
        subcategoryId: babyFirstBirthdaySub?.id ?? null,
      }),
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
      update: templateUpdate(BUSINESS_SEMINAR_TEMPLATE, { categoryId: businessCategory.id, subcategoryId: seminarSub?.id ?? null }),
      create: { id: 'business-seminar-template-001', ...BUSINESS_SEMINAR_TEMPLATE, categoryId: businessCategory.id, subcategoryId: seminarSub?.id ?? null },
    })
    await prisma.template.upsert({
      where: { id: 'business-launch-template-001' },
      update: templateUpdate(BUSINESS_LAUNCH_TEMPLATE, { categoryId: businessCategory.id, subcategoryId: launchSub?.id ?? null }),
      create: { id: 'business-launch-template-001', ...BUSINESS_LAUNCH_TEMPLATE, categoryId: businessCategory.id, subcategoryId: launchSub?.id ?? null },
    })
  }

  if (sportsCategory) {
    await prisma.template.upsert({
      where: { id: 'sports-tennis-template-001' },
      update: templateUpdate(SPORTS_TENNIS_TEMPLATE, { categoryId: sportsCategory.id, subcategoryId: tennisSub?.id ?? null }),
      create: { id: 'sports-tennis-template-001', ...SPORTS_TENNIS_TEMPLATE, categoryId: sportsCategory.id, subcategoryId: tennisSub?.id ?? null },
    })
  }

  if (socialCategory) {
    await prisma.template.upsert({
      where: { id: 'social-vip-night-template-001' },
      update: templateUpdate(SOCIAL_VIP_NIGHT_TEMPLATE, { categoryId: socialCategory.id, subcategoryId: regularMeetingSub?.id ?? null }),
      create: { id: 'social-vip-night-template-001', ...SOCIAL_VIP_NIGHT_TEMPLATE, categoryId: socialCategory.id, subcategoryId: regularMeetingSub?.id ?? null },
    })
  }

  if (seasonalCategory) {
    await prisma.template.upsert({
      where: { id: 'seasonal-yearend-template-001' },
      update: templateUpdate(SEASONAL_YEAREND_TEMPLATE, { categoryId: seasonalCategory.id, subcategoryId: yearEndSub?.id ?? null }),
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
    // 성인 홈파티용
    await prisma.template.upsert({
      where: { id: BIRTHDAY_TEMPLATE_ID },
      update: templateUpdate(BIRTHDAY_TEMPLATE, { categoryId: birthdayCategory.id, subcategoryId: birthdaySub?.id ?? null }),
      create: { id: BIRTHDAY_TEMPLATE_ID, ...BIRTHDAY_TEMPLATE, categoryId: birthdayCategory.id, subcategoryId: birthdaySub?.id ?? null },
    })
    // 아동 생일용 — 인터뷰 문항과 안내 문구가 아이 눈높이로 따로 구성된다
    await prisma.template.upsert({
      where: { id: BIRTHDAY_KIDS_TEMPLATE_ID },
      update: templateUpdate(BIRTHDAY_KIDS_TEMPLATE, { categoryId: birthdayCategory.id, subcategoryId: birthdaySub?.id ?? null }),
      create: { id: BIRTHDAY_KIDS_TEMPLATE_ID, ...BIRTHDAY_KIDS_TEMPLATE, categoryId: birthdayCategory.id, subcategoryId: birthdaySub?.id ?? null },
    })
  }

  if (educationCategory) {
    await prisma.template.upsert({
      where: { id: GRADUATION_TEMPLATE_ID },
      update: templateUpdate(GRADUATION_TEMPLATE, { categoryId: educationCategory.id, subcategoryId: graduationSub?.id ?? null }),
      create: { id: GRADUATION_TEMPLATE_ID, ...GRADUATION_TEMPLATE, categoryId: educationCategory.id, subcategoryId: graduationSub?.id ?? null },
    })
  }

  if (cultureCategory) {
    await prisma.template.upsert({
      where: { id: EXHIBITION_TEMPLATE_ID },
      update: templateUpdate(EXHIBITION_TEMPLATE, { categoryId: cultureCategory.id, subcategoryId: exhibitionSub?.id ?? null }),
      create: { id: EXHIBITION_TEMPLATE_ID, ...EXHIBITION_TEMPLATE, categoryId: cultureCategory.id, subcategoryId: exhibitionSub?.id ?? null },
    })
  }

  if (memorialCategory) {
    await prisma.template.upsert({
      where: { id: MEMORIAL_TEMPLATE_ID },
      update: templateUpdate(MEMORIAL_TEMPLATE, { categoryId: memorialCategory.id, subcategoryId: obituarySub?.id ?? null }),
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
