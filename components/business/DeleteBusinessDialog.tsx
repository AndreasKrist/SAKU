'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteBusiness } from '@/lib/actions/business'
import { toast } from 'sonner'

interface DeleteBusinessDialogProps {
  businessId: string
  businessName: string
  stats: {
    memberCount: number
    transactionCount: number
    contributionCount: number
    distributionCount: number
  }
}

export function DeleteBusinessDialog({
  businessId,
  businessName,
  stats,
}: DeleteBusinessDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isConfirmed = confirmText === businessName

  async function handleDelete() {
    if (!isConfirmed) {
      toast.error('Nama bisnis tidak sesuai')
      return
    }

    setDeleting(true)

    try {
      const result = await deleteBusiness(businessId)

      if (result?.error) {
        toast.error(result.error)
        setDeleting(false)
      } else {
        toast.success('Bisnis berhasil dihapus')
        // deleteBusiness will redirect to /dashboard
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Bisnis
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Hapus Bisnis Permanen
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-semibold text-foreground">
              Tindakan ini TIDAK DAPAT dibatalkan. Ini akan menghapus secara permanen:
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-red-900">Data yang akan dihapus:</p>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>{stats.memberCount} anggota bisnis</li>
                <li>{stats.transactionCount} transaksi</li>
                <li>{stats.contributionCount} kontribusi modal</li>
                <li>{stats.distributionCount} distribusi laba</li>
                <li>Semua laporan dan aktivitas log</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                Ketik <span className="font-bold text-foreground">{businessName}</span> untuk konfirmasi:
              </Label>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Nama bisnis"
                disabled={deleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Menghapus...' : 'Hapus Permanen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
