import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthBackground } from '@/components/auth/AuthBackground'
import { Users, PieChart, FileText, Shield } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      {/* Full page Vanta background */}
      <div className="fixed inset-0 z-0">
        <AuthBackground />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Left side - Branding */}
      <div className="relative z-10 lg:w-1/3 lg:min-h-screen p-8 lg:p-12 flex flex-col justify-between bg-black/20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/saku.webp"
            alt="SAKU"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-white">SAKU</span>
        </Link>

        {/* Hero content - hidden on mobile */}
        <div className="hidden lg:block">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Kelola Keuangan Usaha<br />Bersama Mitra
          </h2>
          <p className="text-white/70 text-base mb-10 max-w-md">
            Platform pencatatan keuangan dan manajemen multi-mitra
            untuk UMKM Indonesia.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { icon: Users, label: 'Multi-Mitra' },
              { icon: PieChart, label: 'Distribusi Laba' },
              { icon: FileText, label: 'Laporan PDF' },
              { icon: Shield, label: 'Aman & Transparan' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-white/80" />
                </div>
                <span className="text-sm text-white/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile tagline */}
        <p className="lg:hidden text-white/70 text-sm mt-4">
          Sistem Aplikasi Keuangan UMKM
        </p>

        {/* Footer */}
        <p className="hidden lg:block text-white/40 text-xs">
          &copy; {new Date().getFullYear()} SAKU. Dibuat untuk UMKM Indonesia.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-black/40">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 p-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
