'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Receipt,
  BarChart3,
  Users,
  Wallet,
  TrendingUp,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  PartyPopper,
  Coins,
} from 'lucide-react'

const slides = [
  {
    icon: <PartyPopper className="w-12 h-12 text-primary" />,
    title: 'Bisnis Siap Digunakan!',
    description: 'Selamat! Bisnis kamu sudah aktif. Yuk kenali menu-menu yang tersedia — semuanya bisa diakses dari sidebar di kiri.',
    bg: 'from-primary/10 to-primary/5',
    detail: null,
  },
  {
    icon: <LayoutDashboard className="w-12 h-12 text-slate-600" />,
    title: 'Dashboard',
    description: 'Halaman utama yang kamu lihat sekarang. Berisi ringkasan keuangan bisnis secara real-time.',
    bg: 'from-slate-100 to-slate-50',
    detail: [
      '📊 Kartu Pendapatan, Pengeluaran, Laba Bersih — klik untuk lihat grafiknya',
      '📅 Filter periode: semua waktu, bulan ini, custom tanggal',
      '🔗 Akses cepat ke semua menu utama',
      '📋 5 transaksi terbaru langsung terlihat',
    ],
  },
  {
    icon: <Receipt className="w-12 h-12 text-emerald-600" />,
    title: 'Menu: Transaksi',
    description: 'Tempat mencatat semua pemasukan dan pengeluaran bisnis.',
    bg: 'from-emerald-100 to-emerald-50',
    detail: [
      '💰 Catat pendapatan (uang masuk ke bisnis)',
      '🧾 Catat pengeluaran bisnis',
      '👤 Pengeluaran dibayar mitra pribadi → otomatis jadi kontribusi modal',
      '🗂️ Bisa dikategorikan dan ditambah catatan',
    ],
  },
  {
    icon: <Coins className="w-12 h-12 text-amber-600" />,
    title: 'Menu: Modal & Ekuitas',
    description: 'Kelola kontribusi modal dan persentase kepemilikan setiap mitra.',
    bg: 'from-amber-100 to-amber-50',
    detail: [
      '🏦 Catat setoran modal awal atau tambahan dari mitra',
      '⚖️ Atur % ekuitas (kepemilikan) setiap mitra — total harus 100%',
      '📈 Lihat saldo modal masing-masing mitra',
    ],
  },
  {
    icon: <TrendingUp className="w-12 h-12 text-blue-600" />,
    title: 'Menu: Distribusi & Penarikan Laba',
    description: 'Bagi laba ke mitra dan tarik hasilnya.',
    bg: 'from-blue-100 to-blue-50',
    detail: [
      '📤 Distribusi Laba — pemilik pilih periode, laba dibagi otomatis sesuai ekuitas',
      '💸 Penarikan Laba — setiap mitra tarik bagian labanya sendiri',
      '👥 Penarikan Bersama — pemilik tarik laba semua mitra sekaligus',
    ],
  },
  {
    icon: <BarChart3 className="w-12 h-12 text-rose-600" />,
    title: 'Menu: Laporan',
    description: 'Laporan keuangan bisnis yang lengkap dan bisa diekspor.',
    bg: 'from-rose-100 to-rose-50',
    detail: [
      '📑 Laporan Laba Rugi — pendapatan vs pengeluaran per periode',
      '💧 Arus Kas — aliran uang masuk dan keluar',
      '🏛️ Modal & Ekuitas — rekap kontribusi semua mitra',
      '📥 Export ke PDF untuk laporan resmi',
    ],
  },
  {
    icon: <Users className="w-12 h-12 text-violet-600" />,
    title: 'Menu: Mitra',
    description: 'Kelola anggota bisnis dan undang mitra baru.',
    bg: 'from-violet-100 to-violet-50',
    detail: [
      '🔑 Lihat kode unik bisnis untuk undang mitra baru',
      '👥 Lihat daftar semua mitra beserta ekuitas dan saldo mereka',
      '⚙️ Atur ulang distribusi ekuitas kapan saja',
      '🗑️ Pemilik bisa hapus bisnis jika perlu',
    ],
  },
]

interface BusinessTutorialModalProps {
  businessId: string
}

export function BusinessTutorialModal({ businessId }: BusinessTutorialModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Show if URL has ?new=1 AND this business hasn't been seen before
    const isNew = searchParams.get('new') === '1'
    const storageKey = `saku_biz_welcome_${businessId}`
    const seen = localStorage.getItem(storageKey)
    if (isNew && !seen) {
      setOpen(true)
    }
  }, [searchParams, businessId])

  function handleDismiss() {
    localStorage.setItem(`saku_biz_welcome_${businessId}`, 'true')
    setOpen(false)
    // Clean up ?new=1 from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('new')
    const newUrl = params.toString() ? `${pathname}?${params}` : pathname
    router.replace(newUrl)
  }

  function handleNext() {
    if (step < slides.length - 1) {
      setStep(step + 1)
    } else {
      handleDismiss()
    }
  }

  const current = slides[step]
  const isLast = step === slides.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss() }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Top section */}
        <div className={`bg-gradient-to-br ${current.bg} px-6 pt-6 pb-4 flex items-start gap-4`}>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm flex-shrink-0">
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {step + 1} / {slides.length}
            </p>
            <h2 className="text-lg font-bold leading-tight">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        {/* Detail bullets */}
        {current.detail && (
          <div className="px-6 py-4 bg-background border-t border-border/50">
            <ul className="space-y-2">
              {current.detail.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 flex flex-col gap-3 border-t border-border/50">
          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/25'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {isLast ? 'Oke, Mengerti!' : (
                <>
                  Lanjut
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {!isLast && (
            <button
              onClick={handleDismiss}
              className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Lewati tutorial
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
