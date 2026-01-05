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
  ChevronRight,
  Banknote,
} from 'lucide-react'

interface SidebarProps {
  businessId: string
}

const menuItems = [
  { href: '', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mitra', label: 'Mitra', icon: Users },
  { href: '/transaksi', label: 'Transaksi', icon: Receipt },
  { href: '/modal', label: 'Modal & Ekuitas', icon: Wallet },
  { href: '/penarikan-laba', label: 'Penarikan Laba', icon: Banknote },
  { href: '/laporan', label: 'Laporan', icon: FileText },
  { href: '/aktivitas', label: 'Aktivitas', icon: Activity },
]

export function Sidebar({ businessId }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-card to-background border-r border-border min-h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md"></div>
            <Image
              src="/saku.webp"
              alt="SAKU Logo"
              width={44}
              height={44}
              className="rounded-xl relative shadow-sm"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
              SAKU
            </h1>
            <p className="text-xs text-muted-foreground">
              Keuangan UMKM
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Menu
        </p>
        {menuItems.map((item) => {
          const href = `/bisnis/${businessId}${item.href}`
          const isActive = pathname === href
          const Icon = item.icon

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                isActive ? 'bg-primary-foreground/20' : 'bg-secondary'
              )}>
                <Icon className={cn('w-4 h-4', isActive ? 'text-primary-foreground' : 'text-primary')} />
              </div>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Kelola keuangan bisnis
          </p>
          <p className="text-xs text-muted-foreground">
            dengan mudah & transparan
          </p>
        </div>
      </div>
    </aside>
  )
}
