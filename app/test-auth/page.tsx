import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TestAuthPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">❌ NOT AUTHENTICATED</h1>
        <p className="mb-4">You are not logged in to the application.</p>
        <p>User: null</p>
        <a href="/login" className="text-blue-600 underline">Go to Login</a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ AUTHENTICATED</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Created:</strong> {user.created_at}</p>
      </div>
      <div className="mt-4">
        <a href="/bisnis/buat" className="text-blue-600 underline">Try creating business</a>
      </div>
    </div>
  )
}
