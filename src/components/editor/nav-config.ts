import type { LucideIcon } from 'lucide-react'
import {
  Settings, Paintbrush, Heart, LayoutGrid, MessageSquare,
  Phone, Users, AlignLeft, MessageCircle,
  Image, CalendarDays, MapPin, Images,
  BookOpen, CreditCard, CheckSquare, Timer,
  Film, Camera, GalleryHorizontal,
  Share2, Link, MessageCircleMore,
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
      { id: 'profile',           label: '가로형 프로필', icon: Users,      moduleType: 'profile' },
      { id: 'solo_profile',      label: '세로형 프로필', icon: User,       moduleType: 'solo_profile' },
      { id: 'timeline',          label: '타임라인', icon: AlignLeft,  moduleType: 'timeline',          defaultConfig: { items: [] } },
      { id: 'timeline_polaroid', label: '폴라로이드', icon: Camera,    moduleType: 'timeline_polaroid', defaultConfig: { items: [] } },
    ],
  },
  {
    id: 'text', label: '텍스트', icon: FileText,
    modules: [
      { id: 'greeting',     label: '인사말',  icon: MessageSquare, moduleType: 'greeting' },
      { id: 'interview',    label: '인터뷰',  icon: MessageCircle, moduleType: 'interview', defaultConfig: { items: [] } },
    ],
  },
  {
    id: 'host', label: '개인 정보', icon: UserRound,
    modules: [
      { id: 'contact', label: '연락처',     icon: Phone,      moduleType: 'contact', defaultConfig: { groups: [] } },
      { id: 'account', label: '계좌 정보',  icon: CreditCard, moduleType: 'account', defaultConfig: { accounts: [] } },
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
      { id: 'guestbook',  label: '방명록',    icon: BookOpen,    moduleType: 'guestbook' },
      { id: 'rsvp',       label: 'RSVP',     icon: CheckSquare, moduleType: 'rsvp' },
      { id: 'guestalbum', label: '하객 앨범',  icon: Camera,      moduleType: 'guestalbum' },
    ],
  },
  {
    id: 'extra', label: '부가기능', icon: Sparkles,
    modules: [
      { id: 'tab',   label: '탭',     icon: LayoutGrid,        moduleType: 'tab',   defaultConfig: { tabs: [] } },
      { id: 'slide', label: '슬라이드', icon: GalleryHorizontal, moduleType: 'slide', defaultConfig: { slides: [] } },
    ],
  },
  {
    id: 'media', label: '미디어', icon: Film,
    modules: [
      { id: 'video', label: '동영상',  icon: Film,  moduleType: 'video' },
    ],
  },
  {
    id: 'share', label: '공유', icon: Share2,
    modules: [
      { id: 'share',      label: '공유하기',   icon: Share2 },
      { id: 'linkshare',  label: '링크 공유',  icon: Link },
      { id: 'kakaoshare', label: '카카오톡',  icon: MessageCircleMore },
    ],
  },
]

const THEME_GROUP: NavGroup = { id: 'theme', label: '테마', icon: Paintbrush, solo: true }
const MAIN_SCREEN_GROUP: NavGroup = { id: 'main_screen', label: '메인 화면', icon: LayoutGrid, solo: true }
const SETTINGS_GROUP: NavGroup = { id: 'settings', label: '설정', icon: Settings, solo: true }

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

export function buildNavGroups(info: TemplateInfoConfig | null | undefined): NavGroup[] {
  return [
    THEME_GROUP,
    buildInfoGroup(info),
    MAIN_SCREEN_GROUP,
    ...COMMON_NAV_GROUPS,
    SETTINGS_GROUP,
  ]
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
