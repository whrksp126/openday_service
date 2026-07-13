import type { LucideIcon } from 'lucide-react'
import {
  Settings, Paintbrush, Heart, LayoutGrid, MessageSquare,
  Phone, Users, AlignLeft, MessageCircle,
  Image, CalendarDays, MapPin, Images,
  BookOpen, CreditCard, CheckSquare, Timer,
  Film, Camera, GalleryHorizontal,
  Share2, Link as LinkIcon, MessageCircleMore, QrCode,
  UserRound, FileText, Sparkles, Users2, Star,
  User, Baby,
} from 'lucide-react'
import type { ModuleType } from '@/types/invitation'
import type { TemplateInfoConfig } from '@/types/template'

export type NavModuleItem = {
  id: string
  label: string
  icon: LucideIcon
  moduleType?: ModuleType
  panelType?: string
  defaultConfig?: Record<string, unknown>
}

export type NavGroup = {
  id: string
  label: string
  icon: LucideIcon
  solo?: boolean
  modules?: NavModuleItem[]
}

// iconName(string) → LucideIcon 매핑. 템플릿 시드 데이터는 문자열로 아이콘을
// 지정하므로 여기서 실제 컴포넌트로 변환한다.
export const ICON_MAP: Record<string, LucideIcon> = {
  Heart, CalendarDays, Baby, MapPin, Star, Users, Phone,
}

// 모든 템플릿이 공통으로 쓰는 그룹들. 'theme'와 'required'(정보)는 제외 —
// templateConfig.info / templateConfig.theme로 각 템플릿이 정의한다.
const COMMON_NAV_GROUPS: NavGroup[] = [
  {
    id: 'image', label: '이미지', icon: Images,
    modules: [
      { id: 'photo_frame',       label: '액자',     icon: LayoutGrid, moduleType: 'photo_frame' },
      { id: 'midphoto',          label: '단독',     icon: Image,      moduleType: 'midphoto' },
      { id: 'gallery',           label: '갤러리',   icon: Images,     moduleType: 'gallery',           defaultConfig: { images: [] } },
      { id: 'profile',           label: '가로형 프로필', icon: Users,      moduleType: 'profile',           defaultConfig: { persons: [{ name: '이름 자리 입니다.', hashtags: ['해시태그자리입니다.'], description: '설명 자리 입니다.' }] } },
      { id: 'solo_profile',      label: '세로형 프로필', icon: User,       moduleType: 'solo_profile',      defaultConfig: { persons: [{ name: '이름 자리 입니다.', hashtags: ['해시태그자리입니다.'], description: '설명 자리 입니다.' }] } },
      { id: 'timeline',          label: '타임라인', icon: AlignLeft,  moduleType: 'timeline',          defaultConfig: { items: [{ title: '제목 자리입니다.', content: '내용 자리입니다.', image: '' }] } },
      { id: 'timeline_polaroid', label: '폴라로이드', icon: Camera,    moduleType: 'timeline_polaroid', defaultConfig: { items: [{ title: '제목 자리입니다.', content: '내용 자리입니다.', image: '' }] } },
    ],
  },
  {
    id: 'text', label: '텍스트', icon: FileText,
    modules: [
      { id: 'greeting',     label: '인사말',  icon: MessageSquare, moduleType: 'greeting' },
      { id: 'interview',    label: '인터뷰',  icon: MessageCircle, moduleType: 'interview', defaultConfig: { items: [{ question: '질문 자리입니다.', answer: '답변 자리입니다.' }] } },
    ],
  },
  {
    id: 'host', label: '개인 정보', icon: UserRound,
    modules: [
      { id: 'contact', label: '연락처',     icon: Phone,      moduleType: 'contact', defaultConfig: { groups: [{ label: '그룹명 자리입니다.', contacts: [{ name: '이름 자리입니다.', phone: '010-0000-0000' }] }] } },
      { id: 'account', label: '계좌 정보',  icon: CreditCard, moduleType: 'account', defaultConfig: { groups: [{ label: '그룹명 자리 입니다.', accounts: [{ bank: '은행명', number: '000-000-000000', name: '예금주' }] }] } },
    ],
  },
  {
    id: 'calendar', label: '날짜·시간', icon: CalendarDays,
    modules: [
      { id: 'datetime', label: '달력 표현', icon: CalendarDays, moduleType: 'datetime' },
      { id: 'dday',     label: 'D+Day',    icon: Timer,         moduleType: 'dday' },
    ],
  },
  {
    id: 'location', label: '위치 정보', icon: MapPin,
    modules: [
      { id: 'venue', label: '지도', icon: MapPin, moduleType: 'venue' },
    ],
  },
  {
    id: 'social', label: '소통', icon: Users2,
    modules: [
      { id: 'guestbook',   label: '방명록',    icon: BookOpen,    moduleType: 'guestbook' },
      { id: 'rsvp',        label: 'RSVP',     icon: CheckSquare, moduleType: 'rsvp' },
      { id: 'photo_share', label: '사진 공유', icon: Camera,      moduleType: 'photo_share', defaultConfig: { previewPublic: true, koreanTitle: '사진 공유', englishTitle: 'Photo Share' } },
    ],
  },
  {
    id: 'extra', label: '부가기능', icon: Sparkles,
    modules: [
      { id: 'tab',   label: '탭',     icon: LayoutGrid,        moduleType: 'tab',   defaultConfig: {
        tabs: [
          { label: '탭1 이름 자리입니다.', content: '탭1 내용 자리입니다.', imageVisible: true },
          { label: '탭2 이름 자리입니다.', content: '탭2 내용 자리입니다.', imageVisible: true },
        ],
      } },
      { id: 'slide', label: '슬라이드', icon: GalleryHorizontal, moduleType: 'slide', defaultConfig: {
        slides: [
          { title: '슬라이드1 제목 자리입니다.', content: '슬라이드1 내용 자리입니다.', imageVisible: true },
          { title: '슬라이드2 제목 자리입니다.', content: '슬라이드2 내용 자리입니다.', imageVisible: true },
        ],
      } },
    ],
  },
  {
    id: 'media', label: '미디어', icon: Film,
    modules: [
      { id: 'video_single_card',       label: '단일 카드',     icon: Film,              moduleType: 'video_single_card',       defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
      { id: 'video_cinema',            label: '시네마',         icon: Film,              moduleType: 'video_cinema',            defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
      { id: 'video_polaroid',          label: '폴라로이드',     icon: Camera,            moduleType: 'video_polaroid',          defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
      { id: 'video_floating_bordered', label: '카드 인 카드',   icon: LayoutGrid,        moduleType: 'video_floating_bordered', defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
      { id: 'video_fullbleed',         label: '풀 블리드',      icon: Image,             moduleType: 'video_fullbleed',         defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
      { id: 'video_carousel',          label: '캐러셀',         icon: GalleryHorizontal, moduleType: 'video_carousel',          defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
      { id: 'video_thumbnail_row',     label: '썸네일 로우',    icon: Images,            moduleType: 'video_thumbnail_row',     defaultConfig: { koreanTitle: '영상', englishTitle: 'Video' } },
    ],
  },
  {
    id: 'share', label: '공유', icon: Share2,
    modules: [
      { id: 'linkshare',  label: '링크 공유',     icon: LinkIcon,          panelType: 'share-link' },
      { id: 'kakaoshare', label: '카카오톡 공유', icon: MessageCircleMore, panelType: 'share-kakao' },
      { id: 'qrshare',    label: 'QR',           icon: QrCode,            panelType: 'share-qr' },
    ],
  },
]

const THEME_GROUP: NavGroup = { id: 'theme', label: '테마', icon: Paintbrush, solo: true }
const MAIN_SCREEN_GROUP: NavGroup = { id: 'main_screen', label: '메인 화면', icon: LayoutGrid, solo: true }
const SETTINGS_GROUP: NavGroup = { id: 'settings', label: '설정', icon: Settings, solo: true }
// admin 전용. share 그룹과 같은 id 'share' 를 유지해 GroupPanel 의 ThumbnailUpdater 분기를 재활용.
// modules 가 비어 있어 카탈로그(linkshare/kakaoshare/qrshare)는 표시되지 않고 캡처 버튼만 노출된다.
const ADMIN_THUMBNAIL_GROUP: NavGroup = { id: 'share', label: '썸네일', icon: Camera, modules: [] }

// templateConfig.info(템플릿별 "정보" 그룹 정의)를 NAV_GROUPS 형태로 변환한다.
// info가 null이면 청첩장 기본값(혼주 + 일시 장소)으로 fallback.
function buildInfoGroup(info: TemplateInfoConfig | null | undefined): NavGroup {
  const items = info?.items ?? [
    { id: 'required-host',           label: '혼주',     iconName: 'Heart',        panelType: 'wedding-host' },
    { id: 'required-datetime-venue', label: '일시 장소', iconName: 'CalendarDays', panelType: 'datetime-venue' },
  ]
  return {
    id: 'required',
    label: info?.label ?? '정보',
    icon: Star,
    modules: items.map(item => ({
      id: item.id,
      label: item.label,
      icon: ICON_MAP[item.iconName] ?? Heart,
      panelType: item.panelType,
    })),
  }
}

export function buildNavGroups(
  info: TemplateInfoConfig | null | undefined,
  mode: 'invitation' | 'template' = 'invitation',
): NavGroup[] {
  const groups: NavGroup[] = [
    THEME_GROUP,
    buildInfoGroup(info),
    MAIN_SCREEN_GROUP,
    ...COMMON_NAV_GROUPS,
    SETTINGS_GROUP,
  ]
  // template 모드에서는 share 그룹(발행/공유/도메인)을 admin 전용 '썸네일' 그룹으로 치환한다.
  // 그룹 id 는 'share' 를 그대로 유지 — GroupPanel 의 ThumbnailUpdater 분기를 재활용한다.
  if (mode === 'template') return groups.map((g) => (g.id === 'share' ? ADMIN_THUMBNAIL_GROUP : g))
  return groups
}

export function findParentGroup(navGroups: NavGroup[], navId: string): string | null {
  for (const group of navGroups) {
    if (!group.solo && group.modules?.some(m => m.id === navId)) {
      return group.id
    }
  }
  return null
}

export function getGroupIds(navGroups: NavGroup[]): Set<string> {
  return new Set(navGroups.filter(g => !g.solo).map(g => g.id))
}
