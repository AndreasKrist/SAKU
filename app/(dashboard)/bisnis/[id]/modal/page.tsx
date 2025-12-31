import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import {
  getBusinessById,
  getBusinessMembers,
  getPartnerCapitalAccounts,
  getCapitalContributions,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CapitalAccountSummary } from '@/components/capital/CapitalAccountSummary'
import { ContributionForm } from '@/components/capital/ContributionForm'
import { WithdrawalForm } from '@/components/capital/WithdrawalForm'
import { GroupWithdrawalForm } from '@/components/capital/GroupWithdrawalForm'
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
  const isOwner = userMember.role === 'owner'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Modal & Ekuitas</h1>
        <p className="text-muted-foreground mt-1">
          Kelola kontribusi modal dan penarikan ekuitas
        </p>
      </div>

      {/* Capital Summary */}
      <CapitalAccountSummary accounts={capitalAccounts} />

      {/* Forms and History */}
      <Tabs defaultValue="contributions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contributions">Kontribusi</TabsTrigger>
          <TabsTrigger value="withdrawals">Tarik Sendiri</TabsTrigger>
          <TabsTrigger value="group">Tarik Bersama</TabsTrigger>
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

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarik Ekuitas</CardTitle>
              <CardDescription>
                Tarik bagian ekuitas Anda (kontribusi + laba - penarikan sebelumnya)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const userAccount = capitalAccounts.find((acc) => acc.user_id === user.id)
                return (
                  <WithdrawalForm
                    businessId={params.id}
                    userId={user.id}
                    currentBalance={userAccount?.current_balance || 0}
                    totalContributions={userAccount?.total_contributions || 0}
                    totalProfitShare={userAccount?.total_profit_allocated || 0}
                    totalWithdrawals={userAccount?.total_withdrawals || 0}
                    equityPercentage={userAccount?.equity_percentage || 0}
                  />
                )
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penarikan Sendiri</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const individualWithdrawals = withdrawalsList.filter(w =>
                  !w.notes?.toLowerCase().includes('penarikan bersama')
                )
                return individualWithdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada penarikan sendiri
                  </p>
                ) : (
                  <div className="space-y-3">
                    {individualWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{withdrawal.profile?.full_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(withdrawal.withdrawal_date)}
                          </p>
                          {withdrawal.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {withdrawal.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            -{formatRupiah(Number(withdrawal.amount))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Penarikan Bersama</CardTitle>
              <CardDescription>
                Tarik ekuitas untuk semua mitra sekaligus dengan persentase yang sama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupWithdrawalForm
                businessId={params.id}
                accounts={capitalAccounts}
                isOwner={isOwner}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penarikan Bersama</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const groupWithdrawals = withdrawalsList.filter(w =>
                  w.notes?.includes('Penarikan bersama') || w.notes?.includes('penarikan bersama')
                )
                return groupWithdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada penarikan bersama
                  </p>
                ) : (
                  <div className="space-y-3">
                    {groupWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{withdrawal.profile?.full_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(withdrawal.withdrawal_date)}
                          </p>
                          {withdrawal.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {withdrawal.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">
                            -{formatRupiah(Number(withdrawal.amount))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
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
