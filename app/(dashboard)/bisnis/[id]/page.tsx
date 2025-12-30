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

  const business = await getBusinessById(params.id)
  if (!business) {
    redirect('/dashboard')
  }

  const members = await getBusinessMembers(params.id)
  const userMember = members.find((m) => m.user_id === user.id)

  if (!userMember) {
    redirect('/dashboard')
  }

  // Get transactions for current month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const transactions = await getBusinessTransactions(params.id, {
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: lastDayOfMonth.toISOString().split('T')[0],
  })

  // Calculate totals
  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netProfit = totalRevenue - totalExpense

  // Get capital accounts
  const capitalAccounts = await getPartnerCapitalAccounts(params.id)
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{business.name}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {business.description || 'Dashboard bisnis Anda'}
        </p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendapatan Bulan Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.type === 'revenue').length} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengeluaran Bulan Ini
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatRupiah(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions.filter((t) => t.type === 'expense').length} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatRupiah(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Periode {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modal</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatRupiah(totalCapital)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {members.length} mitra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="w-full">
            <Link href={`/bisnis/${params.id}/transaksi`}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/bisnis/${params.id}/modal`}>
              <Wallet className="mr-2 h-4 w-4" />
              Kelola Modal
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/bisnis/${params.id}/laporan`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Lihat Laporan
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/bisnis/${params.id}/mitra`}>
              <Users className="mr-2 h-4 w-4" />
              Kelola Mitra
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaksi Terbaru</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/bisnis/${params.id}/transaksi`}>
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Belum ada transaksi bulan ini
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {transaction.item_name || transaction.category?.name || 'Transaksi'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {transaction.type === 'revenue' ? '+' : '-'}
                      {formatRupiah(Number(transaction.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.type === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mitra Bisnis</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/bisnis/${params.id}/mitra`}>
              Kelola
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const capitalAccount = capitalAccounts.find(
                (acc) => acc.user_id === member.user_id
              )
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{member.profile?.full_name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role === 'owner' ? 'Pemilik' : 'Anggota'} •{' '}
                      {Number(member.equity_percentage)}% Ekuitas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatRupiah(capitalAccount?.current_balance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo Modal</p>
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
