'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroupWithdrawal } from '@/lib/actions/capital'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDateForInput, formatRupiah } from '@/lib/utils'
import { Users, Calculator, Percent, CheckCircle } from 'lucide-react'
import type { PartnerCapitalAccount } from '@/types'

interface GroupWithdrawalFormProps {
  businessId: string
  accounts: PartnerCapitalAccount[]
  isOwner: boolean
}

export function GroupWithdrawalForm({
  businessId,
  accounts,
  isOwner,
}: GroupWithdrawalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [percentage, setPercentage] = useState(50)
  const [withdrawalDate, setWithdrawalDate] = useState(formatDateForInput(new Date()))
  const [notes, setNotes] = useState('')

  // Filter accounts with positive balance
  const eligibleAccounts = accounts.filter((acc) => acc.current_balance > 0)

  // Calculate withdrawal amounts for each partner
  const withdrawalPreview = eligibleAccounts.map((acc) => ({
    ...acc,
    withdrawal_amount: Math.floor(acc.current_balance * (percentage / 100)),
    remaining_balance: acc.current_balance - Math.floor(acc.current_balance * (percentage / 100)),
  }))

  const totalWithdrawal = withdrawalPreview.reduce(
    (sum, acc) => sum + acc.withdrawal_amount,
    0
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isOwner) {
      toast.error('Hanya pemilik bisnis yang dapat melakukan penarikan bersama')
      return
    }

    if (eligibleAccounts.length === 0) {
      toast.error('Tidak ada mitra dengan saldo positif')
      return
    }

    if (totalWithdrawal <= 0) {
      toast.error('Total penarikan harus lebih dari 0')
      return
    }

    setLoading(true)

    try {
      const result = await createGroupWithdrawal(businessId, {
        percentage,
        withdrawal_date: withdrawalDate,
        notes: notes || `Penarikan bersama ${percentage}%`,
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Penarikan bersama ${percentage}% berhasil dicatat untuk ${result.count} mitra!`)
        setPercentage(50)
        setNotes('')
        router.refresh()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Hanya pemilik bisnis yang dapat melakukan penarikan bersama.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-blue-600" />
          <p className="font-medium text-blue-800">Penarikan Bersama</p>
        </div>
        <p className="text-sm text-blue-700">
          Tarik ekuitas untuk semua mitra sekaligus dengan persentase yang sama.
          Setiap mitra akan mendapat bagian sesuai saldo ekuitas masing-masing.
        </p>
      </div>

      {/* Percentage Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Persentase Penarikan
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(Math.min(100, Math.max(1, Number(e.target.value))))}
              min={1}
              max={100}
              className="w-20 text-right"
            />
            <span className="text-lg font-bold">%</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[25, 50, 75, 100].map((val) => (
            <Button
              key={val}
              type="button"
              variant={percentage === val ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPercentage(val)}
            >
              {val}%
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Preview Penarikan</h3>
        </div>

        {eligibleAccounts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Tidak ada mitra dengan saldo positif
          </p>
        ) : (
          <div className="space-y-2">
            {withdrawalPreview.map((acc) => (
              <div
                key={acc.user_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{acc.user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: {formatRupiah(acc.current_balance)} → {formatRupiah(acc.remaining_balance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">
                    -{formatRupiah(acc.withdrawal_amount)}
                  </p>
                </div>
              </div>
            ))}

            <Separator className="my-3" />

            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <p className="font-semibold">Total Penarikan</p>
              <p className="text-xl font-bold text-primary">
                {formatRupiah(totalWithdrawal)}
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Date and Notes */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="withdrawal_date">Tanggal Penarikan *</Label>
          <Input
            id="withdrawal_date"
            type="date"
            value={withdrawalDate}
            onChange={(e) => setWithdrawalDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Catatan tambahan (opsional)"
            rows={2}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || eligibleAccounts.length === 0 || totalWithdrawal <= 0}
          className="flex-1"
        >
          {loading ? (
            'Memproses...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Konfirmasi Penarikan Bersama
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPercentage(50)
            setNotes('')
          }}
          disabled={loading}
        >
          Reset
        </Button>
      </div>
    </form>
  )
}
