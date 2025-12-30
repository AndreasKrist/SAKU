import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getBusinessById, getBusinessMembers, getBusinessTransactions, getTransactionCategories } from '@/lib/supabase/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionList } from '@/components/transactions/TransactionList'

export default async function TransaksiPage({ params }: { params: { id: string } }) {
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

  // Get current month transactions by default
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const transactions = await getBusinessTransactions(params.id, {
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: lastDayOfMonth.toISOString().split('T')[0],
  })

  const categories = await getTransactionCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Transaksi</h1>
        <p className="text-muted-foreground mt-1">
          Kelola pemasukan dan pengeluaran bisnis
        </p>
      </div>

      {/* Add Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Transaksi</CardTitle>
          <CardDescription>
            Catat transaksi pendapatan atau pengeluaran bisnis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm
            businessId={params.id}
            categories={categories}
            members={members}
          />
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            Daftar transaksi bulan {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionList
            businessId={params.id}
            transactions={transactions}
            categories={categories}
            members={members}
            userRole={userMember.role}
          />
        </CardContent>
      </Card>
    </div>
  )
}
