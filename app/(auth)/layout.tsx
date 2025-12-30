import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">SAKU</h1>
          <p className="text-slate-400 text-sm">
            Sistem Aplikasi Keuangan UMKM
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
