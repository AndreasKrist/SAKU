'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { signup } from '@/lib/actions/auth'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

// Validation schema
const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Nama lengkap wajib diisi')
      .min(3, 'Nama lengkap minimal 3 karakter'),
    email: z
      .string()
      .min(1, 'Email wajib diisi')
      .email('Format email tidak valid'),
    phone: z
      .string()
      .min(1, 'Nomor telepon wajib diisi')
      .regex(/^08\d{7,11}$/, 'Nomor telepon harus dimulai dengan 08'),
    password: z
      .string()
      .min(1, 'Password wajib diisi')
      .min(6, 'Password minimal 6 karakter')
      .min(8, 'Password minimal 8 karakter untuk keamanan lebih baik'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignupFormData) {
    setIsLoading(true)
    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Pendaftaran berhasil! Silakan login.')
        router.push('/login')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat pendaftaran')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-white">Daftar Akun Baru</CardTitle>
        <CardDescription className="text-white/60">
          Isi data di bawah untuk membuat akun SAKU
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="fullName" className="text-white/90">Nama Lengkap</Label>
                  <FormControl>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email" className="text-white/90">Email</Label>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="phone" className="text-white/90">Nomor Telepon</Label>
                  <FormControl>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="08123456789"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="password" className="text-white/90">Password</Label>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="confirmPassword" className="text-white/90">Konfirmasi Password</Label>
                  <FormControl>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full shadow-[0_8px_30px_rgba(0,0,0,0.3)]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang memproses...
                </>
              ) : (
                'Daftar'
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-sm text-white/50">atau</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <GoogleSignInButton />

          <div className="text-center text-sm text-white/60">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-white hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
