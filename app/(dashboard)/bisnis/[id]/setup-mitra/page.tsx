'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'
import { Calculator, Users } from 'lucide-react'
import { calculateEquityFromContributions, applyEquityFromContributions, splitEquityEvenly } from '@/lib/actions/equity'
import { AutoUpdateEquityToggle } from '@/components/business/AutoUpdateEquityToggle'

interface Member {
  id: string
  user_id: string
  equity_percentage: number
  profile: {
    full_name: string
    email: string
  }
}

export default function SetupMitraPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [distributions, setDistributions] = useState<{ [userId: string]: number }>({})
  const [total, setTotal] = useState(0)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const sum = Object.values(distributions).reduce((acc, val) => acc + val, 0)
    setTotal(sum)
  }, [distributions])

  async function fetchMembers() {
    try {
      // Fetch members
      const membersResponse = await fetch(`/api/businesses/${params.id}/members`)
      if (!membersResponse.ok) throw new Error('Failed to fetch members')
      const membersData = await membersResponse.json()
      setMembers(membersData)

      // Initialize distributions with current values
      const initial: { [userId: string]: number } = {}
      membersData.forEach((member: Member) => {
        initial[member.user_id] = Number(member.equity_percentage)
      })
      setDistributions(initial)

      // Fetch business settings
      const businessResponse = await fetch(`/api/businesses/${params.id}`)
      if (businessResponse.ok) {
        const businessData = await businessResponse.json()
        setAutoUpdateEnabled(businessData.auto_update_equity_on_contribution ?? true)
      }
    } catch (error) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(userId: string, value: string) {
    const numValue = parseFloat(value) || 0
    setDistributions((prev) => ({
      ...prev,
      [userId]: numValue,
    }))
  }

  async function handleAutoCalculate() {
    setLoading(true)
    try {
      const result = await calculateEquityFromContributions(params.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (!result.distributions) {
        toast.error('Gagal menghitung distribusi ekuitas')
        return
      }

      // Update distributions state with calculated values
      const newDistributions: { [userId: string]: number } = {}
      result.distributions.forEach((dist) => {
        newDistributions[dist.userId] = dist.percentage
      })
      setDistributions(newDistributions)

      // Show different message based on method
      if (result.method === 'even_split') {
        toast.success(
          `Ekuitas dibagi rata karena belum ada kontribusi modal (${result.distributions.length} anggota)`
        )
      } else {
        toast.success(
          `Ekuitas dihitung berdasarkan kontribusi modal total ${formatRupiah(result.totalContributions || 0)}`
        )
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoApply() {
    setSaving(true)
    try {
      const result = await applyEquityFromContributions(params.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Ekuitas otomatis dihitung dan diterapkan!')
      router.push(`/bisnis/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  async function handleSplitEvenly() {
    setSaving(true)
    try {
      const result = await splitEquityEvenly(params.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`Ekuitas dibagi rata: ${result.distributions?.length} anggota @ ${result.distributions?.[0]?.percentage}%`)
      router.push(`/bisnis/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (Math.abs(total - 100) > 0.01) {
      toast.error('Total ekuitas harus tepat 100%')
      return
    }

    setSaving(true)

    try {
      const distributionArray = Object.entries(distributions).map(([userId, percentage]) => ({
        userId,
        percentage,
      }))

      const response = await fetch(`/api/businesses/${params.id}/equity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributions: distributionArray }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update')
      }

      toast.success('Distribusi ekuitas berhasil diperbarui!')
      router.push(`/bisnis/${params.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Memuat...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Auto-Update Toggle */}
      <AutoUpdateEquityToggle
        businessId={params.id}
        initialEnabled={autoUpdateEnabled}
      />

      {/* Auto Calculate Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Auto Calculate from Contributions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Hitung dari Kontribusi Modal
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Sistem akan menghitung ekuitas berdasarkan proporsi kontribusi modal setiap mitra. Jika belum ada kontribusi, dibagi rata otomatis.
                </p>
                {autoUpdateEnabled && (
                  <p className="text-xs text-green-700 mt-2 font-medium bg-green-100 px-2 py-1 rounded inline-block">
                    ✅ Mode Otomatis: Saat ada kontribusi modal baru atau dihapus, ekuitas semua anggota akan langsung dihitung ulang berdasarkan proporsi kontribusi. Tidak perlu lagi klik "Terapkan" manual!
                  </p>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {autoUpdateEnabled ? (
                  <Button
                    type="button"
                    onClick={handleAutoApply}
                    disabled={loading || saving}
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700"
                  >
                    Sync Sekarang
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAutoCalculate}
                      disabled={loading || saving}
                      className="flex-1 sm:flex-initial"
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAutoApply}
                      disabled={loading || saving}
                      className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700"
                    >
                      Terapkan
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-blue-300"></div>

            {/* Split Evenly */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bagi Rata ke Semua Anggota
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Bagikan ekuitas secara merata tanpa melihat kontribusi modal.
                </p>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  💡 {members.length} anggota = {(100 / members.length).toFixed(2)}% per orang
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSplitEvenly}
                disabled={loading || saving}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                Bagi Rata Sekarang
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atur Distribusi Ekuitas Manual</CardTitle>
          <CardDescription>
            Atau tentukan persentase kepemilikan secara manual. Total harus tepat 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Total Display */}
            <div
              className={`p-4 rounded-lg ${
                Math.abs(total - 100) < 0.01
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-red-50 border-2 border-red-500'
              }`}
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Ekuitas</p>
                <p
                  className={`text-3xl font-bold ${
                    Math.abs(total - 100) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {total.toFixed(2)}%
                </p>
                {Math.abs(total - 100) >= 0.01 && (
                  <p className="text-sm text-red-600 mt-1">
                    {total < 100
                      ? `Kurang ${(100 - total).toFixed(2)}%`
                      : `Lebih ${(total - 100).toFixed(2)}%`}
                  </p>
                )}
              </div>
            </div>

            {/* Member Distributions */}
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{member.profile?.full_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.profile?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`equity-${member.user_id}`}>
                      Persentase Ekuitas (%)
                    </Label>
                    <Input
                      id={`equity-${member.user_id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={distributions[member.user_id] || 0}
                      onChange={(e) => handleChange(member.user_id, e.target.value)}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || Math.abs(total - 100) >= 0.01}
              >
                {saving ? 'Menyimpan...' : 'Simpan Distribusi'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
