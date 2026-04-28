import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <p className="font-bold text-primary">OpenDay</p>
            <p className="text-xs text-gray-400 mt-1">세상의 모든 초대장을 오픈데이로 완성</p>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <Link href="#" className="hover:text-gray-600 transition-colors">이용약관</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">개인정보 처리방침</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">저작권 안내</Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-gray-300">© 2025 OpenDay. All rights reserved.</p>
      </div>
    </footer>
  )
}
