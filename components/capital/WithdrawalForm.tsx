'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createWithdrawal } from '@/lib/actions/capital'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDateForInput, formatRupiah } from '@/lib/utils'

const withdrawalSchema = z.object({
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  notes: z.string().optional(),
  withdrawal_date: z.string().min(1, 'Tanggal wajib diisi'),
})

type WithdrawalFormData = z.infer<typeof withdrawalSchema>

interface WithdrawalFormProps {
  businessId: string
  userId: string
  currentBalance: number
}

export function WithdrawalForm({
  businessId,
  userId,
  currentBalance,
}: WithdrawalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      withdrawal_date: formatDateForInput(new Date()),
    },
  })

  const amount = watch('amount')

  async function onSubmit(data: WithdrawalFormData) {
    if (data.amount > currentBalance) {
      toast.error(`Saldo tidak mencukupi. Saldo Anda: ${formatRupiah(currentBalance)}`)
      return
    }

    setLoading(true)

    try {
      const result = await createWithdrawal(businessId, data)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Penarikan modal berhasil dicatat!')
        reset({
          withdrawal_date: formatDateForInput(new Date()),
        })
        router.refresh()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Balance Info */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Saldo Modal Anda</p>
        <p className="text-2xl font-bold text-purple-600">
          {formatRupiah(currentBalance)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Jumlah Penarikan (Rp) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            disabled={loading}
            placeholder="500000"
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
          {amount > 0 && amount <= currentBalance && (
            <p className="text-xs text-green-600">
              Sisa saldo: {formatRupiah(currentBalance - amount)}
            </p>
          )}
          {amount > currentBalance && (
            <p className="text-xs text-red-600">Jumlah melebihi saldo!</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="withdrawal_date">Tanggal *</Label>
          <Input
            id="withdrawal_date"
            type="date"
            {...register('withdrawal_date')}
            disabled={loading}
          />
          {errors.withdrawal_date && (
            <p className="text-sm text-red-600">{errors.withdrawal_date.message}</p>
          )}
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
        <Button
          type="submit"
          disabled={loading || currentBalance === 0 || (amount > 0 && amount > currentBalance)}
          className="flex-1"
        >
          {loading ? 'Memproses...' : 'Tarik Modal'}
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={loading}>
          Reset
        </Button>
      </div>
    </form>
  )
}
