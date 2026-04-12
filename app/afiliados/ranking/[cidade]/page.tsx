import { redirect } from 'next/navigation'

export default async function AfiliadosRankingCidadePage({
  params,
}: {
  params: Promise<{ cidade: string }>
}) {
  const { cidade } = await params
  redirect(`/afiliados/ranking?cidade=${encodeURIComponent(cidade)}`)
}
