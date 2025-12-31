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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDateForInput, formatRupiah } from '@/lib/utils'
import { Calculator, TrendingUp, Wallet, ArrowRight } from 'lucide-react'

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
  totalContributions: number
  totalProfitShare: number
  totalWithdrawals: number
  equityPercentage: number
}

export function WithdrawalForm({
  businessId,
  userId,
  currentBalance,
  totalContributions,
  totalProfitShare,
  totalWithdrawals,
  equityPercentage,
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

  const amount = watch('amount') || 0

  // Calculate preview after withdrawal
  const previewBalance = currentBalance - amount

  async function onSubmit(data: WithdrawalFormData) {
    if (data.amount > currentBalance) {
      toast.error('Saldo tidak mencukupi. Saldo Anda: ' + formatRupiah(currentBalance))
      return
    }

    setLoading(true)

    try {
      const result = await createWithdrawal(businessId, data)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Penarikan berhasil dicatat!')
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Equity Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-purple-600" />
            <p className="text-sm text-muted-foreground">Saldo Ekuitas Anda</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatRupiah(currentBalance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ekuitas: {equityPercentage}%
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-muted-foreground">Bagian Laba Anda</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatRupiah(totalProfitShare)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dari total profit bisnis
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm">
        <p className="font-medium mb-2">Rincian Ekuitas:</p>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kontribusi Modal</span>
            <span className="text-green-600">+{formatRupiah(totalContributions)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bagian Laba ({equityPercentage}%)</span>
            <span className="text-blue-600">+{formatRupiah(totalProfitShare)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Penarikan</span>
            <span className="text-red-600">-{formatRupiah(totalWithdrawals)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Saldo Ekuitas</span>
            <span className="text-purple-600">{formatRupiah(currentBalance)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Withdrawal Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Kalkulator Penarikan</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Penarikan (Rp) *</Label>
            <Input
              id="amount"
              type="number"
              step="1000"
              {...register('amount', { valueAsNumber: true })}
              disabled={loading}
              placeholder="500000"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
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
      </div>

      {/* Preview Calculator */}
      {amount > 0 && (
        <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
          <p className="font-medium mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Preview Setelah Penarikan
          </p>

          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Saldo Sekarang</p>
              <p className="text-lg font-semibold text-purple-600">
                {formatRupiah(currentBalance)}
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Penarikan</p>
              <p className="text-lg font-semibold text-red-600">
                -{formatRupiah(amount)}
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-xs text-muted-foreground">Saldo Akhir</p>
              <p className={'text-lg font-semibold ' + (previewBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatRupiah(previewBalance)}
              </p>
            </div>
          </div>

          {amount > currentBalance && (
            <p className="text-center text-sm text-red-600 mt-3">
              Jumlah penarikan melebihi saldo ekuitas Anda!
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || currentBalance <= 0 || (amount > 0 && amount > currentBalance)}
          className="flex-1"
        >
          {loading ? 'Memproses...' : 'Konfirmasi Penarikan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={loading}>
          Reset
        </Button>
      </div>
    </form>
  )
}
