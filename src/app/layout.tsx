import type { Metadata } from 'next'
import Script from 'next/script'
import SessionProvider from '@/components/shared/SessionProvider'
import KakaoBootstrap from '@/components/shared/KakaoBootstrap'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OpenDay — 세상의 모든 초대장',
    template: '%s | OpenDay',
  },
  description: '청첩장부터 컨퍼런스까지 템플릿으로 쉽고 간편하게 초대장을 만들어보세요.',
  openGraph: {
    title: 'OpenDay',
    description: '세상의 모든 초대장을 오픈데이로 완성',
    siteName: 'OpenDay',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
        />
        <KakaoBootstrap />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
