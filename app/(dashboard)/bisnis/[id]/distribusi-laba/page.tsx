import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getBusinessById, getBusinessMembers } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfitDistributionForm } from '@/components/profit/ProfitDistributionForm'
import { DistributionHistory } from '@/components/profit/DistributionHistory'
import { formatRupiah, formatDate } from '@/lib/utils'

export default async function DistribusiLabaPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const business = (await getBusinessById(params.id)) as any
  if (!business) {
    redirect('/dashboard')
  }

  const members = (await getBusinessMembers(params.id)) as any[]
  const userMember = members.find((m) => m.user_id === user.id)

  if (!userMember) {
    redirect('/dashboard')
  }

  // Get distribution history
  const supabase = await createClient()
  const { data: distributions } = await supabase
    .from('profit_distributions')
    .select(`
      *,
      allocations:profit_allocations(
        *,
        profile:profiles(full_name)
      )
    `)
    .eq('business_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Distribusi Laba</h1>
        <p className="text-muted-foreground mt-1">
          Distribusikan laba bersih kepada mitra sesuai ekuitas
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Cara Kerja Distribusi Laba
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Pilih periode untuk menghitung laba bersih</li>
            <li>Tentukan persentase laba yang akan didistribusikan (0-100%)</li>
            <li>Laba akan dibagi secara otomatis sesuai persentase ekuitas masing-masing mitra</li>
            <li>Hasil distribusi akan masuk ke saldo modal mitra</li>
          </ul>
        </CardContent>
      </Card>

      {/* Distribution Form - Only Owner */}
      {userMember.role === 'owner' ? (
        <Card>
          <CardHeader>
            <CardTitle>Buat Distribusi Laba</CardTitle>
            <CardDescription>
              Hitung laba bersih dan distribusikan ke mitra
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitDistributionForm businessId={params.id} members={members} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-orange-900">
              Hanya pemilik bisnis yang dapat membuat distribusi laba.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribution History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Distribusi</CardTitle>
          <CardDescription>
            Daftar distribusi laba yang telah dilakukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DistributionHistory
            distributions={distributions || []}
            userRole={userMember.role}
            businessId={params.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
