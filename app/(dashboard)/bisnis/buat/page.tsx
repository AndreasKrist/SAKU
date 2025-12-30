'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBusiness } from '@/lib/actions/business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDateForInput } from '@/lib/utils'

export default function CreateBusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const start_date = formData.get('start_date') as string

    try {
      const result = await createBusiness({ name, description, startDate: start_date })

      if (result?.error) {
        console.error('Business creation error:', result.error)
        toast.error(result.error)
      } else if (result?.businessId) {
        toast.success('Bisnis berhasil dibuat!')
        router.push(`/bisnis/${result.businessId}`)
      } else {
        console.error('Unknown result:', result)
        toast.error('Tidak ada hasil dari pembuatan bisnis')
      }
    } catch (error) {
      console.error('Exception during business creation:', error)
      toast.error(`Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Buat Bisnis Baru</CardTitle>
            <CardDescription>
              Isi informasi bisnis Anda. Kode bisnis akan dibuat otomatis untuk
              mengundang mitra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Bisnis *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Toko Bunga Mawar"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Deskripsi singkat tentang bisnis..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={formatDateForInput(new Date())}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Memproses...' : 'Buat Bisnis'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
