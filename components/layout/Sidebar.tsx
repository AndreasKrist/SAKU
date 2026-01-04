'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  FileText,
  Activity,
} from 'lucide-react'

interface SidebarProps {
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

export function Sidebar({ businessId }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Image
            src="/saku.webp"
            alt="SAKU Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold text-primary">SAKU</h1>
            <p className="text-xs text-muted-foreground">
              Keuangan UMKM
            </p>
          </div>
        </div>
      </div>

      <nav className="px-3 space-y-1">
        {menuItems.map((item) => {
          const href = `/bisnis/${businessId}${item.href}`
          const isActive = pathname === href
          const Icon = item.icon

          return (
            <Link
              key={href}
              href={href}
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
    </aside>
  )
}
