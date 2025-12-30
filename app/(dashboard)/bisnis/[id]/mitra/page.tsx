import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { getBusinessById, getBusinessMembers, getPartnerCapitalAccounts } from '@/lib/supabase/queries'
import { getBusinessStats } from '@/lib/actions/business'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/CopyButton'
import { DeleteBusinessDialog } from '@/components/business/DeleteBusinessDialog'
import { formatRupiah } from '@/lib/utils'
import { Users, Settings, Copy, CheckCircle, AlertTriangle } from 'lucide-react'

export default async function MitraPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const business = (await getBusinessById(params.id)) as any
  if (!business) {
    redirect('/dashboard')
  }

  const members = (await getBusinessMembers(params.id)) as any[]
  const userMember = members.find((m) => m.user_id === user.id)

  if (!userMember) {
    redirect('/dashboard')
  }

  const capitalAccounts = (await getPartnerCapitalAccounts(params.id)) as any[]

  // Check equity total
  const totalEquity = members.reduce((sum, m) => sum + Number(m.equity_percentage), 0)
  const needsEquitySetup = Math.abs(totalEquity - 100) > 0.01

  // Get business stats for delete confirmation
  const stats = (await getBusinessStats(params.id)) as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mitra Bisnis</h1>
          <p className="text-muted-foreground mt-1">
            Kelola anggota dan distribusi ekuitas
          </p>
        </div>
        {userMember.role === 'owner' && (
          <Button asChild>
            <Link href={`/bisnis/${params.id}/setup-mitra`}>
              <Settings className="mr-2 h-4 w-4" />
              Atur Ekuitas
            </Link>
          </Button>
        )}
      </div>

      {/* Equity Warning */}
      {needsEquitySetup && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-900">
                  Distribusi Ekuitas Belum Diatur
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Total ekuitas saat ini: {totalEquity.toFixed(2)}%. Harus tepat 100%.
                </p>
              </div>
              {userMember.role === 'owner' && (
                <Button asChild>
                  <Link href={`/bisnis/${params.id}/setup-mitra`}>Atur Sekarang</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Link */}
      {userMember.role === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle>Undang Mitra Baru</CardTitle>
            <CardDescription>
              Bagikan kode atau link ini untuk mengundang mitra bergabung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Kode Bisnis</p>
              <div className="flex gap-2">
                <code className="flex-1 px-4 py-2 bg-gray-100 rounded font-mono text-lg">
                  {business.business_code}
                </code>
                <CopyButton text={business.business_code} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Link Undangan</p>
              <div className="flex gap-2">
                <code className="flex-1 px-4 py-2 bg-gray-100 rounded text-sm break-all">
                  {business.invite_link}
                </code>
                <CopyButton text={business.invite_link || ''} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Mitra ({members.length})</CardTitle>
          <CardDescription>
            Informasi ekuitas dan modal setiap mitra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const capitalAccount = capitalAccounts.find(
                (acc) => acc.user_id === member.user_id
              )

              return (
                <div
                  key={member.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {member.profile?.full_name || 'Unknown User'}
                        </h3>
                        {member.role === 'owner' && (
                          <Badge variant="default">Pemilik</Badge>
                        )}
                        {member.user_id === user.id && (
                          <Badge variant="secondary">Anda</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {member.profile?.email || 'No email'}
                      </p>

                      {/* Equity */}
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Persentase Ekuitas
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${member.equity_percentage}%` }}
                            />
                          </div>
                          <p className="font-semibold text-sm">
                            {Number(member.equity_percentage).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Capital Summary */}
                      {capitalAccount && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Kontribusi</p>
                            <p className="font-semibold text-green-600">
                              {formatRupiah(capitalAccount.total_contributions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Laba</p>
                            <p className="font-semibold text-blue-600">
                              {formatRupiah(capitalAccount.total_profit_allocated)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Penarikan</p>
                            <p className="font-semibold text-red-600">
                              {formatRupiah(capitalAccount.total_withdrawals)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Saldo</p>
                            <p className="font-semibold text-purple-600">
                              {formatRupiah(capitalAccount.current_balance)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Modal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Kontribusi</p>
              <p className="text-2xl font-bold text-green-600">
                {formatRupiah(
                  capitalAccounts.reduce((sum, acc) => sum + acc.total_contributions, 0)
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Laba</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatRupiah(
                  capitalAccounts.reduce((sum, acc) => sum + acc.total_profit_allocated, 0)
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Penarikan</p>
              <p className="text-2xl font-bold text-red-600">
                {formatRupiah(
                  capitalAccounts.reduce((sum, acc) => sum + acc.total_withdrawals, 0)
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Modal</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatRupiah(
                  capitalAccounts.reduce((sum, acc) => sum + acc.current_balance, 0)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Only for Owner */}
      {userMember.role === 'owner' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona Berbahaya
            </CardTitle>
            <CardDescription>
              Tindakan di zona ini bersifat permanen dan tidak dapat dibatalkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h3 className="font-semibold text-red-900">Hapus Bisnis</h3>
                <p className="text-sm text-red-700 mt-1">
                  Menghapus bisnis ini secara permanen beserta semua data terkait (transaksi, anggota, laporan, dll).
                </p>
              </div>
              <DeleteBusinessDialog
                businessId={params.id}
                businessName={business.name}
                stats={stats}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
