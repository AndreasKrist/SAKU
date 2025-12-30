'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Chrome } from 'lucide-react'
import { toast } from 'sonner'

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function handleGoogleSignIn() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error('Gagal login dengan Google')
        console.error(error)
      }
      // Browser will redirect to Google, no need to handle success here
    } catch (error) {
      toast.error('Terjadi kesalahan')
      console.error(error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      <Chrome className="mr-2 h-4 w-4" />
      {isLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}
    </Button>
  )
}
