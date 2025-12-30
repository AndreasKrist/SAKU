'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createCapitalContribution } from '@/lib/actions/capital'
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
import type { BusinessMemberWithProfile } from '@/types'

const contributionSchema = z.object({
  user_id: z.string().min(1, 'Mitra wajib dipilih'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  type: z.enum(['initial', 'additional']),
  notes: z.string().optional(),
  contribution_date: z.string().min(1, 'Tanggal wajib diisi'),
})

type ContributionFormData = z.infer<typeof contributionSchema>

interface ContributionFormProps {
  businessId: string
  members: BusinessMemberWithProfile[]
}

export function ContributionForm({ businessId, members }: ContributionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      type: 'additional',
      contribution_date: formatDateForInput(new Date()),
    },
  })

  async function onSubmit(data: ContributionFormData) {
    setLoading(true)

    try {
      const result = await createCapitalContribution(businessId, data)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Kontribusi modal berhasil dicatat!')
        reset({
          type: 'additional',
          contribution_date: formatDateForInput(new Date()),
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Member Select */}
        <div className="space-y-2">
          <Label htmlFor="user_id">Mitra *</Label>
          <Select
            value={watch('user_id') || ''}
            onValueChange={(value) => setValue('user_id', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih mitra" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profile?.full_name || 'Unknown User'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.user_id && (
            <p className="text-sm text-red-600">{errors.user_id.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Jenis Kontribusi *</Label>
          <Select
            value={watch('type')}
            onValueChange={(value: 'initial' | 'additional') => setValue('type', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Modal Awal</SelectItem>
              <SelectItem value="additional">Tambahan</SelectItem>
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
            placeholder="1000000"
          />
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="contribution_date">Tanggal *</Label>
          <Input
            id="contribution_date"
            type="date"
            {...register('contribution_date')}
            disabled={loading}
          />
          {errors.contribution_date && (
            <p className="text-sm text-red-600">{errors.contribution_date.message}</p>
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
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Menyimpan...' : 'Simpan Kontribusi'}
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={loading}>
          Reset
        </Button>
      </div>
    </form>
  )
}
