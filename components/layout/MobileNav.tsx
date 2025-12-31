'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  FileText,
  Activity,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  businessId: string
}

const menuItems = [
  {
    href: '',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/mitra',
    label: 'Mitra',
    icon: Users,
  },
  {
    href: '/transaksi',
    label: 'Transaksi',
    icon: Receipt,
  },
  {
    href: '/modal',
    label: 'Modal & Ekuitas',
    icon: Wallet,
  },
  {
    href: '/laporan',
    label: 'Laporan',
    icon: FileText,
  },
  {
    href: '/aktivitas',
    label: 'Aktivitas',
    icon: Activity,
  },
]

export function MobileNav({ businessId }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>
            <div>
              <h2 className="text-2xl font-bold text-primary">SAKU</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Sistem Aplikasi Keuangan UMKM
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const href = `/bisnis/${businessId}${item.href}`
            const isActive = pathname === href
            const Icon = item.icon

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
