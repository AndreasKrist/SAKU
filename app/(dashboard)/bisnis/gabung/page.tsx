'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { joinBusiness } from '@/lib/actions/business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function JoinBusinessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const code = formData.get('code') as string

    try {
      const result = await joinBusiness(code)

      if (result?.error) {
        toast.error(result.error)
      } else if (result?.success && result.business) {
        toast.success('Berhasil bergabung dengan bisnis!')
        router.push(`/bisnis/${result.business.id}`)
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
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
            <CardTitle>Gabung Bisnis</CardTitle>
            <CardDescription>
              Masukkan kode bisnis yang diberikan oleh pemilik bisnis untuk bergabung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Bisnis *</Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="BIZ-XXXXXX"
                  defaultValue={codeFromUrl || ''}
                  required
                  disabled={loading}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Format: BIZ-XXXXXX
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Memproses...' : 'Gabung Bisnis'}
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
