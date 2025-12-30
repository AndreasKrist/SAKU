import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/supabase/queries'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone } from 'lucide-react'

export default async function AccountSettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const businesses = (await getUserBusinesses(user.id)) as any[]
  const userMetadata = user.user_metadata || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar user={user as any} businesses={businesses} />
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pengaturan Akun</h1>
          <p className="text-muted-foreground">
            Kelola informasi profil dan preferensi akun Anda
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Informasi dasar tentang akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nama Lengkap
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={userMetadata.full_name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor Telepon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userMetadata.phone || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Untuk mengubah informasi profil Anda, silakan hubungi administrator.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>
                Detail akun dan keamanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID Pengguna</Label>
                <Input
                  value={user.id}
                  disabled
                  className="bg-gray-50 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Dibuat</Label>
                <Input
                  value={new Date(user.created_at || '').toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Terakhir Login</Label>
                <Input
                  value={new Date(user.last_sign_in_at || '').toLocaleString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Memberships */}
          <Card>
            <CardHeader>
              <CardTitle>Keanggotaan Bisnis</CardTitle>
              <CardDescription>
                Bisnis yang Anda ikuti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {businesses && businesses.length > 0 ? (
                  businesses.map((member) => {
                    const business = member.business as any
                    return (
                      <div
                        key={business.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{business.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.role === 'owner' ? 'Pemilik' : 'Anggota'} • Ekuitas: {Number(member.equity_percentage)}%
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <a href={`/bisnis/${business.id}`}>Buka</a>
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Anda belum tergabung dalam bisnis apa pun.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
