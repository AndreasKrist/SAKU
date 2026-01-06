import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import {
  getBusinessById,
  getBusinessMembers,
  getBusinessTransactions,
  getPartnerCapitalAccounts,
} from '@/lib/supabase/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRupiah, formatDate } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Plus,
  ArrowRight,
  Receipt,
  Crown,
} from 'lucide-react'

export default async function BusinessDashboardPage({
  params,
}: {
  params: { id: string }
}) {
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

  // Get transactions for current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const transactions = (await getBusinessTransactions(params.id, {
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: lastDayOfMonth.toISOString().split('T')[0],
  })) as any[]

  // Calculate totals
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netProfit = totalRevenue - totalExpense

  // Get capital accounts
  const capitalAccounts = (await getPartnerCapitalAccounts(params.id)) as any[]
  const totalCapital = capitalAccounts.reduce(
    (sum, acc) => sum + acc.current_balance,
    0
  )

  // Check if equity setup is needed
  const totalEquity = members.reduce(
    (sum, m) => sum + Number(m.equity_percentage),
    0
  )
  const needsEquitySetup = Math.abs(totalEquity - 100) > 0.01

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {business.name}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {business.description || 'Dashboard bisnis Anda'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Equity Setup Warning */}
      {needsEquitySetup && userMember.role === 'owner' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  Distribusi Ekuitas Belum Diatur
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Total ekuitas saat ini: {totalEquity.toFixed(2)}%. Harus tepat 100%.
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/bisnis/${params.id}/setup-mitra`}>
                  Atur Ekuitas
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan Bulan Ini
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatRupiah(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {transactions.filter((t) => t.type === 'revenue').length} transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/20 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pengeluaran Bulan Ini
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100">
              <TrendingDown className="h-5 w-5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatRupiah(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
              {transactions.filter((t) => t.type === 'expense').length} transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${netProfit >= 0 ? 'from-blue-500/20' : 'from-orange-500/20'} to-transparent rounded-bl-full`}></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Laba Bersih</CardTitle>
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${netProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <TrendingUp className={`h-5 w-5 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
            >
              {formatRupiah(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Laba Bisa Ditarik</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100">
              <Wallet className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {formatRupiah(totalCapital)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {members.length} mitra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/bisnis/${params.id}/transaksi`}
          className="group flex items-center gap-4 p-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-primary-foreground/20 rounded-xl">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Tambah Transaksi</p>
            <p className="text-xs opacity-80">Catat pemasukan/pengeluaran</p>
          </div>
        </Link>

        <Link
          href={`/bisnis/${params.id}/penarikan-laba`}
          className="group flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl">
            <Wallet className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Penarikan Laba</p>
            <p className="text-xs text-muted-foreground">Kalkulator Distribusi Profit</p>
          </div>
        </Link>

        <Link
          href={`/bisnis/${params.id}/laporan`}
          className="group flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-xl">
            <TrendingUp className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Lihat Laporan</p>
            <p className="text-xs text-muted-foreground">Laba rugi & arus kas</p>
          </div>
        </Link>

        <Link
          href={`/bisnis/${params.id}/mitra`}
          className="group flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-violet-100 rounded-xl">
            <Users className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Kelola Mitra</p>
            <p className="text-xs text-muted-foreground">Partner & ekuitas</p>
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
            <p className="text-sm text-muted-foreground">Aktivitas bulan ini</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/bisnis/${params.id}/transaksi`}>
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Belum ada transaksi bulan ini</p>
              <Button asChild className="mt-4" size="sm">
                <Link href={`/bisnis/${params.id}/transaksi`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Transaksi
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${transaction.type === 'revenue' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {transaction.type === 'revenue' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {transaction.item_name || transaction.category?.name || 'Transaksi'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${transaction.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {transaction.type === 'revenue' ? '+' : '-'}
                      {formatRupiah(Number(transaction.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Mitra Bisnis</CardTitle>
            <p className="text-sm text-muted-foreground">{members.length} partner aktif</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/bisnis/${params.id}/mitra`}>
              Kelola
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member, index) => {
              const capitalAccount = capitalAccounts.find(
                (acc) => acc.user_id === member.user_id
              )
              const colors = ['bg-violet-100 text-violet-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600']
              const colorClass = colors[index % colors.length]

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${colorClass.split(' ')[0]}`}>
                    <span className={`text-lg font-bold ${colorClass.split(' ')[1]}`}>
                      {(member.profile?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.profile?.full_name || 'Unknown User'}</p>
                      {member.role === 'owner' && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Number(member.equity_percentage)}% Ekuitas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-violet-600">
                      {formatRupiah(capitalAccount?.current_balance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Laba Bisa Ditarik</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
