'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createTransaction } from '@/lib/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatDateForInput } from '@/lib/utils'
import type { TransactionCategory, BusinessMemberWithProfile } from '@/types'
import { QUANTITY_UNITS } from '@/types'

const transactionSchema = z.object({
  type: z.enum(['revenue', 'expense']),
  category_id: z.string().optional(),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  payment_source: z.string().min(1, 'Sumber pembayaran wajib dipilih'),
  item_name: z.string().optional(),
  quantity: z.number().optional(),
  quantity_unit: z.string().optional(),
  notes: z.string().optional(),
  transaction_date: z.string().min(1, 'Tanggal wajib diisi'),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  businessId: string
  categories: TransactionCategory[]
  members: BusinessMemberWithProfile[]
}

export function TransactionForm({
  businessId,
  categories,
  members,
}: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [transactionType, setTransactionType] = useState<'revenue' | 'expense'>('expense')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      payment_source: 'business',
      transaction_date: formatDateForInput(new Date()),
    },
  })

  const selectedType = watch('type')
  const selectedPaymentSource = watch('payment_source')

  async function onSubmit(data: TransactionFormData) {
    setLoading(true)

    try {
      const result = await createTransaction(businessId, data)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Transaksi berhasil ditambahkan!')
        reset({
          type: 'expense',
          payment_source: 'business',
          transaction_date: formatDateForInput(new Date()),
        })
        router.refresh()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  // Filter categories by type
  const filteredCategories = categories.filter((cat) => cat.type === selectedType)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Jenis Transaksi *</Label>
          <Select
            value={selectedType}
            onValueChange={(value: 'revenue' | 'expense') => {
              setTransactionType(value)
              setValue('type', value)
              setValue('category_id', '')
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Pendapatan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category_id">Kategori</Label>
          <Select
            value={watch('category_id') || ''}
            onValueChange={(value) => setValue('category_id', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori (opsional)" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Jumlah (Rp) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            disabled={loading}
            placeholder="100000"
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Transaction Date */}
        <div className="space-y-2">
          <Label htmlFor="transaction_date">Tanggal *</Label>
          <Input
            id="transaction_date"
            type="date"
            {...register('transaction_date')}
            disabled={loading}
          />
          {errors.transaction_date && (
            <p className="text-sm text-red-600">{errors.transaction_date.message}</p>
          )}
        </div>

        {/* Payment Source - CRITICAL for auto capital contribution */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="payment_source">
            Sumber Pembayaran *
            {selectedType === 'expense' && selectedPaymentSource !== 'business' && (
              <span className="text-xs text-blue-600 ml-2">
                (Otomatis mencatat kontribusi modal)
              </span>
            )}
          </Label>
          <Select
            value={selectedPaymentSource}
            onValueChange={(value) => setValue('payment_source', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Kas Bisnis</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profile?.full_name || 'Unknown User'} (Pribadi)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.payment_source && (
            <p className="text-sm text-red-600">{errors.payment_source.message}</p>
          )}
          {selectedType === 'expense' && selectedPaymentSource !== 'business' && (
            <p className="text-xs text-blue-600">
              Pengeluaran yang dibayar mitra akan otomatis dicatat sebagai kontribusi modal
            </p>
          )}
        </div>

        {/* Item Name */}
        <div className="space-y-2">
          <Label htmlFor="item_name">Nama Item</Label>
          <Input
            id="item_name"
            type="text"
            {...register('item_name')}
            disabled={loading}
            placeholder="Misal: Bahan baku, Biaya sewa, dll"
          />
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Jumlah/Kuantitas</Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            {...register('quantity', { valueAsNumber: true })}
            disabled={loading}
            placeholder="1"
          />
        </div>

        {/* Quantity Unit */}
        <div className="space-y-2">
          <Label htmlFor="quantity_unit">Satuan</Label>
          <Select
            value={watch('quantity_unit') || ''}
            onValueChange={(value) => setValue('quantity_unit', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih satuan" />
            </SelectTrigger>
            <SelectContent>
              {QUANTITY_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            disabled={loading}
            placeholder="Catatan tambahan (opsional)"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={loading}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}
