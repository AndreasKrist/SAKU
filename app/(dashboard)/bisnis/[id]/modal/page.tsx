import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import {
  getBusinessById,
  getBusinessMembers,
  getPartnerCapitalAccounts,
  getCapitalContributions,
  getBusinessCash,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CapitalAccountSummary } from '@/components/capital/CapitalAccountSummary'
import { ContributionForm } from '@/components/capital/ContributionForm'
import { formatRupiah, formatDate } from '@/lib/utils'

export default async function ModalPage({ params }: { params: { id: string } }) {
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

  const capitalAccounts = (await getPartnerCapitalAccounts(params.id)) as any[]
  const contributions = (await getCapitalContributions(params.id)) as any[]
  const businessCash = await getBusinessCash(params.id)

  // Get withdrawals
  const supabase = await createClient()
  const { data: withdrawals, error: withdrawalsError } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('business_id', params.id)
    .order('withdrawal_date', { ascending: false })

  if (withdrawalsError) {
    console.error('Error fetching withdrawals:', withdrawalsError)
  }

  // Get profile names for withdrawals
  const withdrawalUserIds = [...new Set((withdrawals || []).map(w => w.user_id))]
  const { data: withdrawalProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', withdrawalUserIds.length > 0 ? withdrawalUserIds : ['none'])

  const profileMap = new Map((withdrawalProfiles || []).map(p => [p.id, p]))

  const withdrawalsList = (withdrawals || []).map(w => ({
    ...w,
    profile: profileMap.get(w.user_id) || { full_name: 'Unknown User' }
  })) as any[]

  const totalCapital = capitalAccounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Modal & Ekuitas</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Kelola kontribusi modal dan lihat informasi penting
        </p>
      </div>

      {/* Business Cash Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Kas Bisnis</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">{formatRupiah(businessCash)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Uang liquid yang tersedia untuk operasional dan penarikan
              </p>
            </div>
            <div className="sm:text-right">
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">Formula</p>
                <p className="text-xs font-mono">Kontribusi + Revenue</p>
                <p className="text-xs font-mono">- Expense (kas bisnis)</p>
                <p className="text-xs font-mono">- Penarikan</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital Summary */}
      <CapitalAccountSummary accounts={capitalAccounts} />

      {/* Forms and History */}
      <Tabs defaultValue="contributions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contributions">Kontribusi</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Kontribusi Modal</CardTitle>
              <CardDescription>
                Catat kontribusi modal dari mitra bisnis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionForm businessId={params.id} members={members} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Kontribusi</CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada kontribusi modal
                </p>
              ) : (
                <div className="space-y-3">
                  {contributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{contribution.profile?.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(contribution.contribution_date)} •{' '}
                          {contribution.type === 'initial' ? 'Modal Awal' : 'Tambahan'}
                        </p>
                        {contribution.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {contribution.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{formatRupiah(Number(contribution.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Semua Aktivitas Modal</CardTitle>
              <CardDescription>
                Riwayat lengkap kontribusi dan penarikan modal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Merge and sort contributions and withdrawals */}
                {[
                  ...contributions.map((c) => ({
                    ...c,
                    type: 'contribution' as const,
                    date: c.contribution_date,
                  })),
                  ...withdrawalsList.map((w) => ({
                    ...w,
                    type: 'withdrawal' as const,
                    date: w.withdrawal_date,
                  })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((item, index) => (
                    <div
                      key={`${item.type}-${item.id}-${index}`}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.profile?.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(item.date)} •{' '}
                          {item.type === 'contribution'
                            ? 'contribution' in item && item.type === 'initial'
                              ? 'Modal Awal'
                              : 'Tambahan Modal'
                            : 'Penarikan Modal'}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${item.type === 'contribution' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {item.type === 'contribution' ? '+' : '-'}
                          {formatRupiah(Number(item.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
