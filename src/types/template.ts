export type CategorySlug =
  | 'wedding' | 'baby' | 'birthday' | 'education'
  | 'business' | 'social' | 'sports' | 'culture'
  | 'seasonal' | 'memorial'

export interface TemplateCategory {
  id: string
  name: string
  slug: CategorySlug
  icon: string | null
  order: number
}

export interface TemplateSubcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

// ── 템플릿별 "정보 그룹" 정의 ──────────────────────────────────────────────
// 청첩장은 "혼주", 돌잔치는 "주인공" 같은 식으로 템플릿마다 다른 항목을
// 데이터로 표현하기 위한 구조. NAV_GROUPS의 'required' 그룹을 이 데이터로 대체.
export interface InfoItemDef {
  id: string
  label: string
  iconName: string
  panelType: string
}

export interface TemplateInfoConfig {
  label?: string
  items: InfoItemDef[]
}

// ── 템플릿별 테마 팔레트 ──────────────────────────────────────────────────
export type ThemeBgEffect = 'none' | 'paper' | 'grid' | 'cloud' | 'hanji' | 'dot'

export interface TemplateThemeConfig {
  fonts?: string[]
  bgColors: string[]
  accentColors: string[]
  spacingColors: string[]
  bgEffects?: ThemeBgEffect[]
}

export interface TemplateConfig {
  info: TemplateInfoConfig
  theme: TemplateThemeConfig
}
