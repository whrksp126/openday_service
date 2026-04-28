import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import EditorClient from './EditorClient'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ templateId?: string }>
}

export default async function EditorPage({ params, searchParams }: Props) {
  // CVE-2025-29927 대응: 미들웨어 대신 서버 컴포넌트에서 직접 검증
  const session = await auth()
  if (!session?.user?.id) redirect('/?auth=required')

  const { id } = await params
  const { templateId } = await searchParams

  return <EditorClient id={id} templateId={templateId ?? null} />
}
