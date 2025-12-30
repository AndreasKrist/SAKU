import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { getBusinessById, getBusinessMembers, getUserBusinesses } from '@/lib/supabase/queries'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get business
  const business = await getBusinessById(params.id)

  if (!business) {
    redirect('/dashboard')
  }

  // Verify user is member
  const members = (await getBusinessMembers(params.id)) as any[]
  const userMember = members.find((m) => m.user_id === user.id)

  if (!userMember) {
    redirect('/dashboard')
  }

  // Get all user's businesses for TopBar
  const allBusinesses = await getUserBusinesses(user.id)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar businessId={params.id} />
      <div className="flex-1 flex flex-col">
        <TopBar user={user} currentBusiness={business} businesses={allBusinesses} businessId={params.id} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
