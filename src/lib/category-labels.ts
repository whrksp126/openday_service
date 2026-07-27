// 카테고리별 기본 문구 프리셋.
// 우선순위: 모듈 config / content.*Title  >  카테고리 프리셋  >  전역 기본값
// 템플릿 seed 가 라벨을 지정하지 않아도 웨딩 어휘("행사 일시", "청첩장 주소 복사하기")가
// 다른 카테고리로 새지 않게 하는 것이 목적이다.

export interface CategoryLabels {
  /** 인사말 섹션 한글 제목 */
  greeting: string
  /** 인사말 섹션 영문 제목 */
  greetingEn: string
  /** 일시 섹션 한글 제목 */
  datetime: string
  /** 일시 섹션 영문 제목 */
  datetimeEn: string
  /** 장소 섹션 한글 제목 */
  venue: string
  /** 장소 섹션 영문 제목 */
  venueEn: string
  /** 하단 링크 복사 버튼 */
  copyShare: string
  /** 하단 카카오 공유 버튼 */
  kakaoShare: string
  /** 미리보기용 샘플 방명록 작성자 */
  sampleGuestName: string
  /** 미리보기용 샘플 방명록 본문 */
  sampleGuestMessage: string
  /** 달력 주말 색 (null 이면 평일과 동일 — 비즈니스·부고 등) */
  weekendColors: { sun: string; sat: string } | null
}

const DEFAULTS: CategoryLabels = {
  greeting: '인사말',
  greetingEn: 'Greeting',
  datetime: '행사 일시',
  datetimeEn: 'Event Day',
  venue: '행사 장소',
  venueEn: 'Location',
  copyShare: '초대장 주소 복사하기',
  kakaoShare: '카카오톡으로 공유하기',
  sampleGuestName: '준영',
  sampleGuestMessage: '초대 고마워요. 그날 봬요!',
  weekendColors: { sun: '#d97c74', sat: '#668eaa' },
}

const OVERRIDES: Record<string, Partial<CategoryLabels>> = {
  wedding: {
    greeting: '인사말',
    greetingEn: 'Invitation',
    datetime: '예식 일시',
    venue: '예식 장소',
    copyShare: '청첩장 주소 복사하기',
    sampleGuestName: '대학 동기 지원',
    sampleGuestMessage: '두 분 결혼 진심으로 축하해!\n오래오래 행복하길 :)',
  },
  baby: {
    sampleGuestName: '이모',
    sampleGuestMessage: '벌써 한 살이라니.\n건강하게만 자라렴!',
  },
  birthday: {
    sampleGuestName: '민수',
    sampleGuestMessage: '생일 축하해!\n그날 꼭 갈게 :)',
  },
  education: {
    greeting: '초대의 글',
    datetime: '행사 일시',
    venue: '식장',
    venueEn: 'Venue',
    sampleGuestName: '담임 선생님',
    sampleGuestMessage: '졸업 축하합니다.\n앞날에 좋은 일만 가득하길.',
    weekendColors: null,
  },
  business: {
    greeting: '초대의 말',
    greetingEn: 'Welcome',
    datetime: '행사 일정',
    datetimeEn: 'Schedule',
    venue: '행사 장소',
    venueEn: 'Venue',
    sampleGuestName: '김지훈 팀장',
    sampleGuestMessage: '초대 감사합니다.\n당일 참석하겠습니다.',
    weekendColors: null,
  },
  sports: {
    greeting: '대회 소개',
    greetingEn: 'About',
    datetime: '경기 일정',
    datetimeEn: 'Schedule',
    venue: '경기 장소',
    venueEn: 'Court',
    sampleGuestName: '코트 메이트',
    sampleGuestMessage: '올해도 참가합니다!\n좋은 경기 해요.',
    weekendColors: null,
  },
  social: {
    greeting: '초대의 말',
    greetingEn: 'Welcome',
    datetime: '행사 일시',
    datetimeEn: 'When',
    venue: '행사 장소',
    venueEn: 'Where',
    sampleGuestName: '준영',
    sampleGuestMessage: '초대 고마워요.\n그날 봬요!',
    weekendColors: null,
  },
  culture: {
    greeting: '초대의 글',
    greetingEn: 'Invitation',
    datetime: '전시 기간',
    datetimeEn: 'Dates',
    venue: '전시 장소',
    venueEn: 'Venue',
    sampleGuestName: '관람객',
    sampleGuestMessage: '조용히 오래 머물다 갑니다.\n좋은 전시 감사합니다.',
    weekendColors: null,
  },
  seasonal: {
    greeting: '초대의 말',
    datetime: '모임 일시',
    datetimeEn: 'When',
    venue: '모임 장소',
    venueEn: 'Where',
    sampleGuestName: '준영',
    sampleGuestMessage: '초대 고마워요.\n올 한 해 고생 많았어요!',
  },
  memorial: {
    greeting: '부고',
    datetime: '발인 일시',
    venue: '빈소',
    copyShare: '부고 주소 복사하기',
    kakaoShare: '카카오톡으로 알리기',
    sampleGuestName: '고인의 벗',
    sampleGuestMessage: '삼가 고인의 명복을 빕니다.\n유가족께 깊은 위로의 말씀을 전합니다.',
    weekendColors: null,
  },
}

export function categoryLabels(slug?: string | null): CategoryLabels {
  if (!slug) return DEFAULTS
  return { ...DEFAULTS, ...(OVERRIDES[slug] ?? {}) }
}
