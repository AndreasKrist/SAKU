'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Business, Profile } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronDown, LogOut, Building2, Settings, User } from 'lucide-react'
import { MobileNav } from './MobileNav'

interface TopBarProps {
  user: any
  currentBusiness?: Business
  businesses: { business: Business }[]
  businessId?: string
}

export function TopBar({ user, currentBusiness, businesses, businessId }: TopBarProps) {
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U' // Default to 'U' for User if name is undefined
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Navigation */}
        {businessId && <MobileNav businessId={businessId} />}

        {currentBusiness && (
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-sm md:text-base truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">{currentBusiness.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Business Selector */}
        {businesses.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Ganti Bisnis
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Bisnis Anda</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {businesses.map((b) => (
                <DropdownMenuItem key={b.business.id} asChild>
                  <Link href={`/bisnis/${b.business.id}`}>
                    {b.business.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 md:px-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">{user.full_name || user.email || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user.full_name || user.email || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <Building2 className="mr-2 h-4 w-4" />
                Semua Bisnis
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan Akun
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/logout" className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
