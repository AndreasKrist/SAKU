'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Info } from 'lucide-react'
import { toggleAutoUpdateEquity } from '@/lib/actions/business'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AutoUpdateEquityToggleProps {
  businessId: string
  initialEnabled: boolean
}

export function AutoUpdateEquityToggle({
  businessId,
  initialEnabled,
}: AutoUpdateEquityToggleProps) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function handleToggle(checked: boolean) {
    setLoading(true)
    try {
      const result = await toggleAutoUpdateEquity(businessId, checked)

      if (result.error) {
        toast.error(result.error)
        return
      }

      setEnabled(checked)
      toast.success(
        checked
          ? 'Auto-update ekuitas diaktifkan! Ekuitas akan otomatis update saat ada kontribusi modal baru.'
          : 'Auto-update ekuitas dinonaktifkan. Anda perlu manual update ekuitas.'
      )
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`h-5 w-5 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
              <Label
                htmlFor="auto-update-equity"
                className={`text-base font-semibold cursor-pointer ${
                  enabled ? 'text-green-900' : 'text-gray-900'
                }`}
              >
                Auto-Update Ekuitas
              </Label>
            </div>
            <p className={`text-sm ${enabled ? 'text-green-700' : 'text-muted-foreground'}`}>
              {enabled
                ? 'Aktif: Ekuitas otomatis update setiap ada kontribusi modal baru atau dihapus'
                : 'Nonaktif: Anda perlu manual klik "Terapkan" untuk update ekuitas'}
            </p>
            <div
              className={`flex items-start gap-2 mt-3 p-3 rounded-lg ${
                enabled ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs">
                {enabled ? (
                  <>
                    <strong>Mode Otomatis:</strong> Saat ada kontribusi modal baru, ekuitas
                    semua anggota akan langsung dihitung ulang berdasarkan proporsi kontribusi.
                    Tidak perlu lagi klik "Terapkan" manual!
                  </>
                ) : (
                  <>
                    <strong>Mode Manual:</strong> Ekuitas tidak akan berubah meskipun ada
                    kontribusi baru. Anda harus manual ke halaman "Atur Ekuitas" dan klik
                    "Terapkan" untuk update.
                  </>
                )}
              </p>
            </div>
          </div>
          <Switch
            id="auto-update-equity"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  )
}
