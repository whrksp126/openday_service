import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-gray-400 mb-6">주소가 잘못되었거나 삭제된 페이지일 수 있어요.</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-primary text-white text-sm">
          메인으로
        </Link>
      </div>
    </main>
  )
}
