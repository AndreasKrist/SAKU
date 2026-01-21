'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTransaction } from '@/lib/actions/transactions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import type {
  TransactionWithCategory,
  TransactionCategory,
  BusinessMemberWithProfile,
} from '@/types'

interface TransactionListProps {
  businessId: string
  transactions: TransactionWithCategory[]
  categories: TransactionCategory[]
  members: BusinessMemberWithProfile[]
  userRole: string
}

export function TransactionList({
  businessId,
  transactions,
  categories,
  members,
  userRole,
}: TransactionListProps) {
  const router = useRouter()
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false
    return true
  })

  async function handleDelete(transactionId: string) {
    setDeletingId(transactionId)

    try {
      const result = await deleteTransaction(transactionId, businessId)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Transaksi berhasil dihapus')
        router.refresh()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  const totalRevenue = filteredTransactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="revenue">Pendapatan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filter kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <div className="text-center flex sm:block items-center justify-between sm:justify-center">
          <p className="text-xs sm:text-sm text-muted-foreground">Pendapatan</p>
          <p className="text-base sm:text-lg font-bold text-green-600">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
        <div className="text-center flex sm:block items-center justify-between sm:justify-center">
          <p className="text-xs sm:text-sm text-muted-foreground">Pengeluaran</p>
          <p className="text-base sm:text-lg font-bold text-red-600">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="text-center flex sm:block items-center justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0">
          <p className="text-xs sm:text-sm text-muted-foreground">Saldo</p>
          <p
            className={`text-base sm:text-lg font-bold ${totalRevenue - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatRupiah(totalRevenue - totalExpense)}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Tidak ada transaksi yang sesuai filter
        </p>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {filteredTransactions.map((transaction) => {
              const paidByMember = members.find(
                (m) => m.user_id === transaction.paid_by_user_id
              )

              return (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {transaction.item_name || transaction.category?.name || 'Transaksi'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.transaction_date)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-bold text-sm ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {transaction.type === 'revenue' ? '+' : '-'}
                        {formatRupiah(Number(transaction.amount))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={transaction.type === 'revenue' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {transaction.type === 'revenue' ? 'Masuk' : 'Keluar'}
                      </Badge>
                      {transaction.payment_source === 'business' ? (
                        <Badge variant="secondary" className="text-xs">Kas</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {paidByMember?.profile?.full_name?.split(' ')[0] || 'Mitra'}
                        </Badge>
                      )}
                    </div>

                    {userRole === 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={deletingId === transaction.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak dapat dibatalkan. Transaksi akan
                              dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {(transaction.quantity || transaction.notes) && (
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      {transaction.quantity && (
                        <span>{transaction.quantity} {transaction.quantity_unit || 'unit'}</span>
                      )}
                      {transaction.quantity && transaction.notes && <span> • </span>}
                      {transaction.notes && <span>{transaction.notes}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Item/Kategori</TableHead>
                  <TableHead>Sumber Bayar</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  {userRole === 'owner' && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const paidByMember = members.find(
                    (m) => m.user_id === transaction.paid_by_user_id
                  )

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === 'revenue' ? 'default' : 'destructive'
                          }
                        >
                          {transaction.type === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.item_name || transaction.category?.name || '-'}
                          </p>
                          {transaction.quantity && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.quantity} {transaction.quantity_unit || 'unit'}
                            </p>
                          )}
                          {transaction.notes && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.payment_source === 'business' ? (
                          <Badge variant="secondary">Kas Bisnis</Badge>
                        ) : (
                          <div>
                            <Badge variant="outline">
                              {paidByMember?.profile?.full_name || 'Mitra'}
                            </Badge>
                            {transaction.type === 'expense' && (
                              <p className="text-xs text-blue-600 mt-1">
                                + Kontribusi Modal
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {transaction.type === 'revenue' ? '+' : '-'}
                          {formatRupiah(Number(transaction.amount))}
                        </span>
                      </TableCell>
                      {userRole === 'owner' && (
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deletingId === transaction.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Transaksi akan
                                  dihapus permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(transaction.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
