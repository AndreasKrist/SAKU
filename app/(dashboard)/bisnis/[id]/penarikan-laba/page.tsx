import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import {
  getBusinessById,
  getBusinessMembers,
  getPartnerCapitalAccounts,
  getBusinessCash,
  getBusinessTransactions,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WithdrawalForm } from '@/components/capital/WithdrawalForm'
import { GroupWithdrawalForm } from '@/components/capital/GroupWithdrawalForm'
import { formatRupiah, formatDate } from '@/lib/utils'
import { TrendingUp, Wallet, DollarSign, Banknote, ArrowDown } from 'lucide-react'

export default async function PenarikanLabaPage({ params }: { params: { id: string } }) {
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
  const businessCash = await getBusinessCash(params.id)

  // Calculate totals from capital accounts
  const totalContributions = capitalAccounts.reduce(
    (sum, acc) => sum + acc.total_contributions,
    0
  )
  const totalProfitAllocated = capitalAccounts.reduce(
    (sum, acc) => sum + acc.total_profit_allocated,
    0
  )
  const totalWithdrawals = capitalAccounts.reduce(
    (sum, acc) => sum + acc.total_withdrawals,
    0
  )

  // Saldo Laba Tersedia = Total Kontribusi + Total Laba - Total Penarikan
  // (sama seperti di Modal & Ekuitas)
  const availableProfit = capitalAccounts.reduce(
    (sum, acc) => sum + acc.current_balance,
    0
  )

  // Get all transactions to calculate total profit
  const transactions = (await getBusinessTransactions(params.id, {})) as any[]
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalProfit = totalRevenue - totalExpense

  // Get withdrawals
  const supabase = await createClient()
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('business_id', params.id)
    .order('withdrawal_date', { ascending: false })

  // Get user's capital account
  const userAccount = capitalAccounts.find((acc) => acc.user_id === user.id)

  // Get profile names for withdrawals
  const withdrawalUserIds = [...new Set((withdrawals || []).map((w) => w.user_id))]
  const { data: withdrawalProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', withdrawalUserIds.length > 0 ? withdrawalUserIds : ['none'])

  const profileMap = new Map((withdrawalProfiles || []).map((p) => [p.id, p]))

  const withdrawalsList = (withdrawals || []).map((w) => ({
    ...w,
    profile: profileMap.get(w.user_id) || { full_name: 'Unknown User' },
  })) as any[]

  const isOwner = userMember.role === 'owner'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Penarikan Laba</h1>
        <p className="text-muted-foreground mt-1">
          Tarik bagian modal dan laba Anda dari bisnis
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kas Bisnis
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatRupiah(businessCash)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dana tersedia untuk operasional
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/20 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Laba Dialokasikan
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(totalProfitAllocated)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Laba yang sudah dibagikan ke mitra
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/20 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Penarikan
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100">
              <ArrowDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatRupiah(totalWithdrawals)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total penarikan modal & laba
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/30 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              Saldo Laba Tersedia
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-200">
              <Banknote className="h-5 w-5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {formatRupiah(availableProfit)}
            </div>
            <p className="text-xs text-purple-700 mt-2 font-medium">
              Total modal mitra yang bisa ditarik
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equity Per Partner */}
      <Card>
        <CardHeader>
          <CardTitle>Ekuitas Per Mitra</CardTitle>
          <CardDescription>
            Rincian modal dan laba setiap mitra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {capitalAccounts.map((account) => (
              <div
                key={account.user_id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{account.user_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ekuitas: {account.equity_percentage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo Laba (Bisa Ditarik)</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatRupiah(account.current_balance)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Kontribusi</p>
                    <p className="font-semibold text-green-600">
                      {formatRupiah(account.total_contributions)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Laba</p>
                    <p className="font-semibold text-blue-600">
                      {formatRupiah(account.total_profit_allocated)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Penarikan</p>
                    <p className="font-semibold text-red-600">
                      {formatRupiah(account.total_withdrawals)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Tabs */}
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Tarik Sendiri</TabsTrigger>
          <TabsTrigger value="group">Tarik Bersama</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarik Bagian Laba Anda</CardTitle>
              <CardDescription>
                Tarik sebagian dari saldo modal Anda (kontribusi + laba yang sudah dialokasikan)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WithdrawalForm
                businessId={params.id}
                userId={user.id}
                currentBalance={userAccount?.current_balance || 0}
                totalContributions={userAccount?.total_contributions || 0}
                totalProfitShare={userAccount?.total_profit_allocated || 0}
                totalWithdrawals={userAccount?.total_withdrawals || 0}
                equityPercentage={userAccount?.equity_percentage || 0}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penarikan Sendiri</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const individualWithdrawals = withdrawalsList.filter(
                  (w) => !w.notes?.toLowerCase().includes('penarikan bersama')
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
                          <p className="font-medium">
                            {withdrawal.profile?.full_name || 'Unknown User'}
                          </p>
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
                Tarik laba untuk semua mitra sekaligus dengan persentase yang sama
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
                const groupWithdrawals = withdrawalsList.filter((w) =>
                  w.notes?.toLowerCase().includes('penarikan bersama')
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
                          <p className="font-medium">
                            {withdrawal.profile?.full_name || 'Unknown User'}
                          </p>
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
      </Tabs>
    </div>
  )
}
