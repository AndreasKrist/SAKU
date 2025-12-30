import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, UserPlus } from 'lucide-react'

export default async function OnboardingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Selamat Datang di SAKU!</h1>
          <p className="text-xl text-muted-foreground">
            Mulai kelola keuangan bisnis Anda dengan transparan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Buat Bisnis Baru</CardTitle>
              <CardDescription>
                Mulai dari awal dengan membuat bisnis baru. Anda akan menjadi
                pemilik dan dapat mengundang mitra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/bisnis/buat">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Bisnis
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Gabung Bisnis</CardTitle>
              <CardDescription>
                Sudah ada bisnis? Bergabung menggunakan kode undangan yang
                diberikan oleh pemilik bisnis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/bisnis/gabung">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Gabung dengan Kode
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
