'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signup(formData: {
  email: string
  password: string
  fullName: string
  phone?: string
}) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        phone: formData.phone || '',
      },
    },
  })

  if (authError) {
    const msg = authError.message.toLowerCase()
    if (msg.includes('user already registered') || msg.includes('already been registered')) {
      return { error: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.' }
    }
    if (msg.includes('password')) {
      return { error: 'Password tidak memenuhi syarat. Minimal 8 karakter.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Gagal membuat akun' }
  }

  revalidatePath('/', 'layout')
  return { success: true, user: authData.user }
}

export async function login(formData: { email: string; password: string }) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
      return { error: 'Email atau password salah. Silakan coba lagi.' }
    }
    if (msg.includes('email not confirmed')) {
      return { error: 'Email belum diverifikasi. Silakan cek kotak masuk email Anda.' }
    }
    if (msg.includes('too many requests')) {
      return { error: 'Terlalu banyak percobaan login. Silakan coba lagi beberapa saat.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, user: data.user }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data.url }
}
