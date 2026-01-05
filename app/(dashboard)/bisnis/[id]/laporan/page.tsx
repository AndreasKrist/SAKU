import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getBusinessById, getBusinessMembers } from '@/lib/supabase/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfitLossReport } from '@/components/reports/ProfitLossReport'
import { CashFlowReport } from '@/components/reports/CashFlowReport'

export default async function LaporanPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const business = (await getBusinessById(params.id)) as any
  if (!business) {
    redirect('/dashboard')
  }

  const members = (await getBusinessMembers(params.id)) as any[]
  const userMember = members.find((m) => m.user_id === user.id)

  if (!userMember) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Laporan Keuangan</h1>
        <p className="text-muted-foreground mt-1">
          Laporan laba rugi dan arus kas
        </p>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="profit-loss" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profit-loss">Laba Rugi</TabsTrigger>
          <TabsTrigger value="cash-flow">Arus Kas</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss" className="space-y-4">
          <ProfitLossReport businessId={params.id} />
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <CashFlowReport businessId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
