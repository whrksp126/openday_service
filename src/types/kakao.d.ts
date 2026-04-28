declare global {
  interface Window {
    Kakao?: KakaoSdk
  }
}

interface KakaoSdk {
  init: (key: string) => void
  isInitialized: () => boolean
  Share: {
    sendDefault: (params: KakaoShareDefaultParams) => void
    sendCustom: (params: KakaoShareCustomParams) => void
  }
}

export interface KakaoShareCustomParams {
  templateId: number
  templateArgs?: Record<string, string>
  serverCallbackArgs?: Record<string, string> | string
  installTalk?: boolean
}

interface KakaoShareLink {
  mobileWebUrl?: string
  webUrl?: string
}

interface KakaoFeedContent {
  title: string
  description?: string
  imageUrl?: string
  link: KakaoShareLink
}

interface KakaoShareButton {
  title: string
  link: KakaoShareLink
}

export interface KakaoShareDefaultParams {
  objectType: 'feed'
  content: KakaoFeedContent
  itemContent?: {
    profileText?: string
    profileImageUrl?: string
    titleImageText?: string
    titleImageCategory?: string
    items?: Array<{ item: string; itemOp: string }>
  }
  buttons?: KakaoShareButton[]
  installTalk?: boolean
}

export {}
