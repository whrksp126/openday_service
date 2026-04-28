export type ModuleType =
  // Cover / main
  | 'main'          // 메인 화면 (커버) — 한 초대장에 1개, 항상 첫번째 고정
  | 'photo_frame'   // 추가 사진 액자 (자체 image/imageCrop 필드 보유)
  | 'couple_names'  // 신랑·신부 이름 헤더
  // Wedding core (always present, required=true in module config)
  | 'greeting'      // 인사말
  | 'datetime'      // 예식 일시
  | 'venue'         // 예식 장소 + 교통수단
  // Wedding optional sections
  | 'profile'       // 2인 프로필 (공통)
  | 'solo_profile'  // 1인 프로필 (공통)
  | 'timeline'      // 타임라인 (좌우 교차)
  | 'timeline_polaroid' // 타임라인 (폴라로이드)
  | 'interview'     // 인터뷰
  | 'midphoto'      // 중간 사진
  | 'tab'           // 범용 탭 (그룹화된 텍스트·이미지 콘텐츠)
  | 'slide'         // 슬라이드 (이미지·제목·내용을 좌우 슬라이드로)
  | 'gallery'       // 갤러리
  | 'guestbook'     // 방명록
  | 'account'       // 계좌 정보
  | 'rsvp'          // RSVP · 참석 의사
  | 'dday'          // D+Day
  | 'video'         // 동영상
  | 'guestalbum'    // 하객 앨범
  | 'ending'        // 엔딩 사진, 문구
  | 'opening'       // 오프닝 애니메이션
  | 'bgm'           // 배경음악
  | 'share'         // 공유하기 설정
  | 'contact'       // 연락처 (그룹별 이름·전화번호 카드)
  // Generic
  | 'poll' | 'qna' | 'payment' | 'seal'
  | 'parking' | 'weather' | 'map'
  | 'dresscode' | 'attachment' | 'lucky_draw' | 'quiz'
  | 'photo_feed' | 'privacy' | 'refund'

export interface InvitationModule {
  id: string
  type: ModuleType
  order: number
  required?: boolean
  config: Record<string, unknown>
}

// 이미지 비율 + 크롭 메타데이터 (CSS-only 렌더링용)
export interface ImageCropData {
  aspectRatio: string              // '1/1' | '4/5' | '4/3' | '3/4' | '16/9'
  zoom: number                     // 1 ~ 3 (재오픈 시 복원)
  crop: { x: number; y: number }   // react-easy-crop 픽셀 오프셋 (재오픈 시 복원)
  croppedAreaPercentage: { x: number; y: number; width: number; height: number }
}

// 프로필 모듈(가로형/세로형 공통) — 인물 한 명의 정보
export interface ProfilePerson {
  image?: string
  imageCrop?: ImageCropData
  name?: string
  title?: string
  hashtags?: string[]
  description?: string
  descriptionVisible?: boolean
}

export interface WeddingPerson {
  last?: string
  first?: string
  role?: string
  fatherName?: string
  motherName?: string
  fatherDeceased?: boolean
  motherDeceased?: boolean
}

export interface BabyPerson {
  name?: string
  birthDate?: string
  hashtags?: string[]
  description?: string
  role?: string
}

export interface ParentPerson {
  role?: 'father' | 'mother'
  name?: string
  phone?: string
}

export interface InvitationContent {
  title?: string
  coverImage?: string
  coverImageCrop?: ImageCropData
  hosts?: Array<{ role: string; name: string; phone?: string }>
  eventDate?: string
  eventTime?: string
  venue?: {
    name: string
    hall?: string
    address: string
    lat?: number
    lng?: number
  }
  // Wedding specific
  groom?: WeddingPerson
  bride?: WeddingPerson
  groomFirst?: boolean
  deceasedStyle?: 'hanja' | 'chrysanthemum' | 'ribbon'
  // Baby specific (돌잔치/백일/베이비샤워 등)
  baby?: BabyPerson
  parents?: { father?: ParentPerson; mother?: ParentPerson }
  babyFatherFirst?: boolean
  invitationTitle?: string
  greetingMessage?: string
  greetingAuthor?: string
  greetingEnglishTitle?: string
  datetimeEnglishTitle?: string
  venueEnglishTitle?: string
  // Share
  shareTitle?: string
  shareText?: string
  shareExtra?: string
  // Nickname / contact (optional extras)
  groomNickname?: string
  brideNickname?: string
  groomPhone?: string
  bridePhone?: string
  // Label styles (content-based modules) - Korean labels
  greetingKoreanTitle?: string
  greetingKoreanLabelVisible?: boolean
  greetingKoreanLabelBold?: boolean
  greetingKoreanLabelItalic?: boolean
  greetingKoreanLabelAlign?: string
  datetimeKoreanTitle?: string
  datetimeKoreanLabelVisible?: boolean
  datetimeKoreanLabelBold?: boolean
  datetimeKoreanLabelItalic?: boolean
  datetimeKoreanLabelAlign?: string
  venueKoreanTitle?: string
  venueKoreanLabelVisible?: boolean
  venueKoreanLabelBold?: boolean
  venueKoreanLabelItalic?: boolean
  venueKoreanLabelAlign?: string
  // Label styles (content-based modules) - English labels
  greetingLabelVisible?: boolean
  greetingLabelBold?: boolean
  greetingLabelItalic?: boolean
  greetingLabelAlign?: string
  datetimeLabelVisible?: boolean
  datetimeLabelBold?: boolean
  datetimeLabelItalic?: boolean
  datetimeLabelAlign?: string
  datetimeTitleBig?: string
  datetimeTitleBigVisible?: boolean
  datetimeTitleBigBold?: boolean
  datetimeTitleBigItalic?: boolean
  datetimeTitleBigAlign?: string
  datetimeTitleSmall?: string
  datetimeTitleSmallVisible?: boolean
  datetimeTitleSmallBold?: boolean
  datetimeTitleSmallItalic?: boolean
  datetimeTitleSmallAlign?: string
  venueLabelVisible?: boolean
  venueLabelBold?: boolean
  venueLabelItalic?: boolean
  venueLabelAlign?: string
  // Venue title (제목 큰/작은 글씨) visibility & style
  venueTitleBigVisible?: boolean
  venueTitleBigBold?: boolean
  venueTitleBigItalic?: boolean
  venueTitleBigAlign?: string
  venueTitleSmallVisible?: boolean
  venueTitleSmallBold?: boolean
  venueTitleSmallItalic?: boolean
  venueTitleSmallAlign?: string
  // Venue title text (user-editable, separate from venue.name/address map data)
  venueTitleBig?: string
  venueTitleSmall?: string
  // Content field visibility & style
  invitationTitleVisible?: boolean
  invitationTitleBold?: boolean
  invitationTitleItalic?: boolean
  invitationTitleAlign?: string
  greetingTitleSmall?: string
  greetingTitleSmallVisible?: boolean
  greetingTitleSmallBold?: boolean
  greetingTitleSmallItalic?: boolean
  greetingTitleSmallAlign?: string
  greetingMessageVisible?: boolean
  greetingAuthorVisible?: boolean
  greetingAuthorBold?: boolean
  greetingAuthorItalic?: boolean
  greetingAuthorAlign?: string
}

export interface VenueModuleConfig {
  showMap?: boolean
  mapVenue?: { name?: string; address?: string; lat?: number; lng?: number }
}

// ── 메인 화면 모듈 ────────────────────────────────────────
// variant 필드로 디자인 변형을 식별. 각 variant 렌더러가 config에서 필요한 필드만 읽는다.
export interface MainModuleConfig {
  variant?: string
  // 텍스트 캡션 토글
  showTitle?: boolean
  showSubText?: boolean
  bottomText?: string
  subText?: string
  // 이름 표시 (classic, two-photo)
  showNames?: boolean
  // 큰 숫자 날짜 (date-big)
  showDateBig?: boolean
  // 캘리그래피 (our-wedding-day, just-married, better-together, save-the-date)
  calligraphyText?: string
  calligraphyEnglish?: string
  // 모서리/세로 텍스트 (just-married 상단 띠, two-photo 세로)
  cornerText?: string
  verticalText?: string
  verticalTextRight?: string
  // 두 번째 사진 (two-photo)
  secondImage?: string
  secondImageCrop?: ImageCropData
  // 영상 URL (video)
  videoUrl?: string
  // 라벨 필드 (LabelField 호환 — 기존 패턴 그대로)
  koreanTitle?: string
  englishTitle?: string
  titleBig?: string
  titleSmall?: string
  koreanLabelVisible?: boolean
  koreanLabelBold?: boolean
  koreanLabelItalic?: boolean
  koreanLabelAlign?: string
  labelVisible?: boolean
  labelBold?: boolean
  labelItalic?: boolean
  labelAlign?: string
  titleBigVisible?: boolean
  titleBigBold?: boolean
  titleBigItalic?: boolean
  titleBigAlign?: string
  titleSmallVisible?: boolean
  titleSmallBold?: boolean
  titleSmallItalic?: boolean
  titleSmallAlign?: string
  // 시각 옵션 (v3.1) ─ 사진 모양/프레임/데코/배경/타이틀 폰트
  photoShape?: string                // PhotoShapeId — photo-shapes.tsx 참조
  frameStyle?: string                // FrameStyleId — main-decorations.tsx 참조
  decorations?: string[]             // DecorationId[] — multi
  backgroundPattern?: string         // BackgroundPatternId
  titleFont?: 'sans' | 'serif' | 'script' | 'calligraphy'
  photoTilt?: number                 // -8 ~ 8 (deg)
  // 자유 텍스트 슬롯 — variant별 키로 사용 (variant.textSlots 참고)
  textSlots?: Record<string, string>
}

// ── 추가 사진 액자 모듈 ──────────────────────────────────
// 메인 화면(main)과 분리되어, 사용자가 본문 중간에 액자 사진을 추가할 때 사용한다.
// 자체 image/imageCrop을 모듈 config에 저장 (content.coverImage와 분리).
export interface PhotoFrameModuleConfig {
  image?: string
  imageCrop?: ImageCropData
  bottomText?: string
  subText?: string
  showTitle?: boolean
  showSubText?: boolean
  showNames?: boolean
  noSideMargin?: boolean
  koreanTitle?: string
  englishTitle?: string
  titleBig?: string
  titleSmall?: string
  koreanLabelVisible?: boolean
  koreanLabelBold?: boolean
  koreanLabelItalic?: boolean
  koreanLabelAlign?: string
  labelVisible?: boolean
  labelBold?: boolean
  labelItalic?: boolean
  labelAlign?: string
  titleBigVisible?: boolean
  titleBigBold?: boolean
  titleBigItalic?: boolean
  titleBigAlign?: string
  titleSmallVisible?: boolean
  titleSmallBold?: boolean
  titleSmallItalic?: boolean
  titleSmallAlign?: string
}

// ── 탭 모듈 ───────────────────────────────────────────────
export interface TabItem {
  label: string
  image?: string
  imageCrop?: ImageCropData
  imageVisible?: boolean
  content?: string
  contentVisible?: boolean
}

export interface TabModuleConfig {
  koreanTitle?: string
  koreanLabelVisible?: boolean
  koreanLabelBold?: boolean
  koreanLabelItalic?: boolean
  koreanLabelAlign?: string
  englishTitle?: string
  labelVisible?: boolean
  labelBold?: boolean
  labelItalic?: boolean
  labelAlign?: string
  titleBig?: string
  titleBigVisible?: boolean
  titleBigBold?: boolean
  titleBigItalic?: boolean
  titleBigAlign?: string
  titleSmall?: string
  titleSmallVisible?: boolean
  titleSmallBold?: boolean
  titleSmallItalic?: boolean
  titleSmallAlign?: string
  tabs?: TabItem[]
}

// ── 슬라이드 모듈 ─────────────────────────────────────────
export interface SlideItem {
  image?: string
  imageCrop?: ImageCropData
  imageVisible?: boolean
  title?: string
  titleVisible?: boolean
  content?: string
  contentVisible?: boolean
}

export interface SlideModuleConfig {
  koreanTitle?: string
  koreanLabelVisible?: boolean
  koreanLabelBold?: boolean
  koreanLabelItalic?: boolean
  koreanLabelAlign?: string
  englishTitle?: string
  labelVisible?: boolean
  labelBold?: boolean
  labelItalic?: boolean
  labelAlign?: string
  titleBig?: string
  titleBigVisible?: boolean
  titleBigBold?: boolean
  titleBigItalic?: boolean
  titleBigAlign?: string
  titleSmall?: string
  titleSmallVisible?: boolean
  titleSmallBold?: boolean
  titleSmallItalic?: boolean
  titleSmallAlign?: string
  slides?: SlideItem[]
}

export interface BgmConfig {
  source?: 'preset' | 'upload'
  trackId?: string
  url?: string
  title?: string
  artist?: string
  loopEnabled?: boolean   // upload일 때만 의미
  loopStart?: number
  loopEnd?: number
}

export interface InvitationStyles {
  font?: string
  fontSize?: 'normal' | 'large' | 'xlarge'
  primaryColor?: string
  accentColor?: string
  bgColor?: string
  spacingColor?: string
  bgEffect?: 'none' | 'paper' | 'grid' | 'cloud' | 'hanji' | 'dot'
  zoomDisabled?: boolean
  scrollAnimation?: boolean
  showEnglishTitle?: boolean
  bgm?: BgmConfig
}

// ── RSVP 모듈 ─────────────────────────────────────────────
export type RsvpQuestionType =
  | 'text-short'      // 단답형
  | 'text-long'       // 장문형
  | 'single-choice'   // 객관식 (단일 선택)
  | 'multi-choice'    // 체크박스 (다중 선택)
  | 'dropdown'        // 드롭다운
  | 'number'          // 숫자
  | 'date'            // 날짜
  | 'email'           // 이메일
  | 'phone'           // 전화번호

export interface RsvpQuestion {
  id: string
  type: RsvpQuestionType
  label: string
  required?: boolean
  options?: string[]        // single-choice / multi-choice / dropdown 전용
  placeholder?: string      // 텍스트 계열(단답/장문/숫자/이메일/전화) 전용
  description?: string      // 질문 보조 설명
}

export interface RsvpModuleConfig {
  buttonLabel?: string     // 청첩장의 RSVP 버튼 이름
  modalTitle?: string      // 모달 헤더 제목
  submitLabel?: string     // 모달 제출 버튼 이름
  questions?: RsvpQuestion[]
  // 기존 LabelField 필드 (koreanTitle, englishTitle 등)는 그대로 유지됨
  deadline?: string
}

// ── 방명록 모듈 ───────────────────────────────────────────
// 작성된 방명록 엔트리 (에디터에선 로컬 state, 추후 DB 연동 시 passwordHash 로 교체)
export interface GuestbookEntry {
  id: string
  name: string
  message: string
  password: string    // 작성자 본인 확인용
  createdAt: string   // ISO 문자열
}

// ── 연락처 모듈 ───────────────────────────────────────────
export interface ContactItem {
  name: string
  phone: string
  bindTo?: 'groomPhone' | 'bridePhone'
}

export interface ContactGroup {
  label: string
  englishLabel?: string
  contacts: ContactItem[]
}

export interface ContactModuleConfig {
  koreanTitle?: string
  koreanLabelVisible?: boolean
  koreanLabelBold?: boolean
  koreanLabelItalic?: boolean
  koreanLabelAlign?: string
  englishTitle?: string
  labelVisible?: boolean
  labelBold?: boolean
  labelItalic?: boolean
  labelAlign?: string
  titleBig?: string
  titleBigVisible?: boolean
  titleBigBold?: boolean
  titleBigItalic?: boolean
  titleBigAlign?: string
  titleSmall?: string
  titleSmallVisible?: boolean
  titleSmallBold?: boolean
  titleSmallItalic?: boolean
  titleSmallAlign?: string
  groups?: ContactGroup[]
}

export interface GuestbookModuleConfig {
  buttonLabel?: string          // 작성하기 버튼 이름
  modalTitle?: string           // 모달 헤더 제목
  submitLabel?: string          // 모달 제출 버튼 이름
  namePlaceholder?: string
  messagePlaceholder?: string
  passwordPlaceholder?: string
  pageSize?: number             // 더보기 단위 (기본 3)
  // LabelField 필드 (koreanTitle, englishTitle, titleBig, titleSmall ...)는 그대로 유지됨
}
