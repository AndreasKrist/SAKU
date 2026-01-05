import { ReactNode } from 'react'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-3">
            <Image
              src="/saku.webp"
              alt="SAKU Logo"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-1">SAKU</h1>
          <p className="text-muted-foreground text-sm">
            Sistem Aplikasi Keuangan UMKM
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-lg border">
          {children}
        </div>
      </div>
    </div>
  )
}
