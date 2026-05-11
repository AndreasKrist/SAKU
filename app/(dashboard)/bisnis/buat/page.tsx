'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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

const createBusinessSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama bisnis wajib diisi')
    .min(3, 'Nama bisnis minimal 3 karakter')
    .max(100, 'Nama bisnis maksimal 100 karakter'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
})

type CreateBusinessFormData = z.infer<typeof createBusinessSchema>

export default function CreateBusinessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBusinessFormData>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      start_date: formatDateForInput(new Date()),
    },
  })

  async function onSubmit(data: CreateBusinessFormData) {
    setLoading(true)
    try {
      const result = await createBusiness({
        name: data.name,
        description: data.description,
        startDate: data.start_date,
      })

      if (result?.error) {
        toast.error(result.error)
      } else if (result?.businessId) {
        toast.success('Bisnis berhasil dibuat!')
        router.push(`/bisnis/${result.businessId}?new=1`)
      } else {
        toast.error('Tidak ada hasil dari pembuatan bisnis')
      }
    } catch (error) {
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Bisnis *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Toko Bunga Mawar"
                  disabled={loading}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang bisnis..."
                  rows={3}
                  disabled={loading}
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai *</Label>
                <Input
                  id="start_date"
                  type="date"
                  disabled={loading}
                  {...register('start_date')}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-600">{errors.start_date.message}</p>
                )}
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
