import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getBusinessById, getBusinessMembers, getActivityLogs } from '@/lib/supabase/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import {
  Receipt,
  Wallet,
  TrendingUp,
  Users,
  Building2,
  Activity as ActivityIcon,
} from 'lucide-react'

const ACTION_ICONS: { [key: string]: any } = {
  transaction_revenue: Receipt,
  transaction_expense: Receipt,
  transaction_updated: Receipt,
  transaction_deleted: Receipt,
  capital_contribution: Wallet,
  capital_contribution_auto: Wallet,
  capital_withdrawal: Wallet,
  profit_distributed: TrendingUp,
  equity_updated: Users,
  business_created: Building2,
  member_joined: Users,
}

const ACTION_COLORS: { [key: string]: string } = {
  transaction_revenue: 'text-green-600 bg-green-50',
  transaction_expense: 'text-red-600 bg-red-50',
  transaction_updated: 'text-blue-600 bg-blue-50',
  transaction_deleted: 'text-gray-600 bg-gray-50',
  capital_contribution: 'text-green-600 bg-green-50',
  capital_contribution_auto: 'text-blue-600 bg-blue-50',
  capital_withdrawal: 'text-red-600 bg-red-50',
  profit_distributed: 'text-purple-600 bg-purple-50',
  equity_updated: 'text-orange-600 bg-orange-50',
  business_created: 'text-blue-600 bg-blue-50',
  member_joined: 'text-green-600 bg-green-50',
}

export default async function AktivitasPage({ params }: { params: { id: string } }) {
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

  const activities = (await getActivityLogs(params.id, 100)) as any[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Log Aktivitas</h1>
        <p className="text-muted-foreground mt-1">
          Riwayat semua aktivitas bisnis
        </p>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>
            Semua perubahan dan transaksi tercatat di sini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada aktivitas
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = ACTION_ICONS[activity.action] || ActivityIcon
                const colorClass =
                  ACTION_COLORS[activity.action] || 'text-gray-600 bg-gray-50'

                return (
                  <div key={activity.id}>
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">
                              {activity.details?.description || activity.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              oleh {activity.user?.full_name || 'Sistem'} •{' '}
                              {formatDate(activity.created_at)}
                            </p>

                            {/* Metadata */}
                            {activity.details &&
                              Object.keys(activity.details).length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                                  {JSON.stringify(activity.details, null, 2)}
                                </div>
                              )}
                          </div>

                          {/* Type Badge */}
                          <Badge variant="outline" className="ml-2">
                            {activity.action.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {index < activities.length - 1 && <Separator className="my-4" />}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
