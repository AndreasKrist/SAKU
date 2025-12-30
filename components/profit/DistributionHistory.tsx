'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProfitDistribution } from '@/lib/actions/profit'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Distribution {
  id: string
  period_start: string
  period_end: string
  total_profit: number
  distributed_amount: number
  distribution_percentage: number
  created_at: string
  allocations: {
    user_id: string
    allocated_amount: number
    profile: {
      full_name: string
    }
  }[]
}

interface DistributionHistoryProps {
  distributions: Distribution[]
  userRole: string
  businessId: string
}

export function DistributionHistory({
  distributions,
  userRole,
  businessId,
}: DistributionHistoryProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(distributionId: string) {
    setDeletingId(distributionId)

    try {
      const result = await deleteProfitDistribution(distributionId, businessId)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Distribusi laba berhasil dihapus')
        router.refresh()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingId(null)
    }
  }

  if (distributions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Belum ada distribusi laba
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {distributions.map((distribution) => {
        const isExpanded = expandedId === distribution.id

        return (
          <div key={distribution.id} className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      Distribusi{' '}
                      {new Date(distribution.period_start).toLocaleDateString('id-ID', {
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(distribution.period_end).toLocaleDateString('id-ID', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </h3>
                    <Badge variant="secondary">
                      {distribution.distribution_percentage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dibuat: {formatDate(distribution.created_at)}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Laba</p>
                      <p className="font-semibold text-green-600">
                        {formatRupiah(Number(distribution.total_profit))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Didistribusikan</p>
                      <p className="font-semibold text-blue-600">
                        {formatRupiah(Number(distribution.distributed_amount))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : distribution.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {userRole === 'owner' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === distribution.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Hapus Distribusi Laba?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Distribusi laba
                            akan dihapus dan alokasi modal akan dikembalikan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(distribution.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="p-4 border-t">
                <h4 className="font-semibold mb-3">Alokasi Per Mitra</h4>
                <div className="space-y-2">
                  {distribution.allocations.map((allocation) => (
                    <div
                      key={allocation.user_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium">{allocation.profile?.full_name || 'Unknown User'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {formatRupiah(Number(allocation.allocated_amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="font-semibold">Total Didistribusikan</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatRupiah(Number(distribution.distributed_amount))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
