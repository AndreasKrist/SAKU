import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/actions/auth'
import { getUserBusinesses } from '@/lib/supabase/queries'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, Plus, UserPlus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const businesses = (await getUserBusinesses(user.id)) as any[]

  // If no businesses, redirect to onboarding
  if (!businesses || businesses.length === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar user={user as any} businesses={businesses} />
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bisnis Anda</h1>
          <p className="text-muted-foreground">
            Pilih bisnis untuk melihat dashboard
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {businesses.map((member) => {
            const business = member.business as any
            return (
              <Link key={business.id} href={`/bisnis/${business.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Building2 className="w-10 h-10 text-primary" />
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {member.role === 'owner' ? 'Pemilik' : 'Anggota'}
                      </span>
                    </div>
                    <CardTitle className="mt-4">{business.name}</CardTitle>
                    <CardDescription>
                      {business.description || 'Tidak ada deskripsi'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Ekuitas Anda: {Number(member.equity_percentage)}%
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/bisnis/buat">
              <Plus className="mr-2 h-4 w-4" />
              Buat Bisnis Baru
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bisnis/gabung">
              <UserPlus className="mr-2 h-4 w-4" />
              Gabung Bisnis
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
