'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { distributeProfits } from '@/lib/actions/profit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDateForInput, formatRupiah } from '@/lib/utils'
import type { BusinessMemberWithProfile } from '@/types'

const distributionSchema = z.object({
  period_start: z.string().min(1, 'Tanggal mulai wajib diisi'),
  period_end: z.string().min(1, 'Tanggal akhir wajib diisi'),
  distribution_percentage: z
    .number()
    .min(0, 'Minimal 0%')
    .max(100, 'Maksimal 100%'),
})

type DistributionFormData = z.infer<typeof distributionSchema>

interface ProfitDistributionFormProps {
  businessId: string
  members: BusinessMemberWithProfile[]
}

export function ProfitDistributionForm({
  businessId,
  members,
}: ProfitDistributionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [preview, setPreview] = useState<{
    total_profit: number
    distributed_amount: number
    allocations: { member_name: string; equity: number; amount: number }[]
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DistributionFormData>({
    resolver: zodResolver(distributionSchema),
    defaultValues: {
      distribution_percentage: 100,
    },
  })

  const periodStart = watch('period_start')
  const periodEnd = watch('period_end')
  const distributionPercentage = watch('distribution_percentage')

  async function calculatePreview() {
    if (!periodStart || !periodEnd) {
      toast.error('Pilih periode terlebih dahulu')
      return
    }

    setCalculating(true)

    try {
      const response = await fetch('/api/profit/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          periodStart,
          periodEnd,
          distributionPercentage: distributionPercentage || 100,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to calculate')
      }

      const data = await response.json()
      setPreview(data.preview)
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghitung preview')
      setPreview(null)
    } finally {
      setCalculating(false)
    }
  }

  async function onSubmit(data: DistributionFormData) {
    setLoading(true)

    try {
      const result = await distributeProfits(businessId, data)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Laba berhasil didistribusikan!')
        setPreview(null)
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
      <div className="grid gap-4 md:grid-cols-3">
        {/* Period Start */}
        <div className="space-y-2">
          <Label htmlFor="period_start">Tanggal Mulai *</Label>
          <Input
            id="period_start"
            type="date"
            {...register('period_start')}
            disabled={loading}
          />
          {errors.period_start && (
            <p className="text-sm text-red-600">{errors.period_start.message}</p>
          )}
        </div>

        {/* Period End */}
        <div className="space-y-2">
          <Label htmlFor="period_end">Tanggal Akhir *</Label>
          <Input
            id="period_end"
            type="date"
            {...register('period_end')}
            disabled={loading}
          />
          {errors.period_end && (
            <p className="text-sm text-red-600">{errors.period_end.message}</p>
          )}
        </div>

        {/* Distribution Percentage */}
        <div className="space-y-2">
          <Label htmlFor="distribution_percentage">Persentase Distribusi (%) *</Label>
          <Input
            id="distribution_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('distribution_percentage', { valueAsNumber: true })}
            disabled={loading}
          />
          {errors.distribution_percentage && (
            <p className="text-sm text-red-600">
              {errors.distribution_percentage.message}
            </p>
          )}
        </div>
      </div>

      {/* Preview Button */}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={calculatePreview}
          disabled={calculating || loading}
          className="w-full"
        >
          {calculating ? 'Menghitung...' : 'Hitung Preview Distribusi'}
        </Button>
      </div>

      {/* Preview Results */}
      {preview && (
        <div className="space-y-4">
          <Separator />

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Preview Distribusi</h3>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <p className="text-sm text-muted-foreground mb-1">Total Laba Bersih</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatRupiah(preview.total_profit)}
                </p>
              </div>
              <div className="bg-white p-4 rounded border">
                <p className="text-sm text-muted-foreground mb-1">
                  Akan Didistribusikan ({distributionPercentage}%)
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatRupiah(preview.distributed_amount)}
                </p>
              </div>
            </div>

            {/* Allocations */}
            <div>
              <h4 className="font-semibold mb-3">Alokasi Per Mitra</h4>
              <div className="space-y-2">
                {preview.allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded border"
                  >
                    <div>
                      <p className="font-medium">{allocation.member_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Ekuitas: {allocation.equity}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {formatRupiah(allocation.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {preview.total_profit <= 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-red-800">
                  Tidak ada laba untuk periode ini. Total laba: {formatRupiah(preview.total_profit)}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || preview.total_profit <= 0}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Konfirmasi Distribusi'}
          </Button>
        </div>
      )}
    </form>
  )
}
