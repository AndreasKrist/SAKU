'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Receipt,
  BarChart3,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

const STORAGE_KEY = 'saku_welcome_seen'

const slides = [
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    title: 'Selamat Datang di SAKU!',
    description:
      'Aplikasi manajemen keuangan bisnis bersama yang transparan dan mudah digunakan. Semua mitra bisa pantau keuangan secara real-time.',
    bg: 'from-primary/10 to-primary/5',
  },
  {
    icon: <Building2 className="w-12 h-12 text-blue-600" />,
    title: 'Buat atau Gabung Bisnis',
    description:
      'Buat bisnis baru dan undang mitra dengan kode unik, atau gabung ke bisnis yang sudah ada menggunakan kode dari pemilik.',
    bg: 'from-blue-100 to-blue-50',
  },
  {
    icon: <Receipt className="w-12 h-12 text-emerald-600" />,
    title: 'Catat Transaksi',
    description:
      'Catat setiap pemasukan dan pengeluaran bisnis. SAKU otomatis menghitung laba dan melacak kontribusi modal setiap mitra.',
    bg: 'from-emerald-100 to-emerald-50',
  },
  {
    icon: <BarChart3 className="w-12 h-12 text-violet-600" />,
    title: 'Laporan & Distribusi Laba',
    description:
      'Lihat laporan laba rugi, arus kas, dan distribusikan laba ke mitra sesuai persentase ekuitas masing-masing secara otomatis.',
    bg: 'from-violet-100 to-violet-50',
  },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      setOpen(true)
    }
  }, [])

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  function handleNext() {
    if (step < slides.length - 1) {
      setStep(step + 1)
    } else {
      handleDismiss()
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  const current = slides[step]
  const isLast = step === slides.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss() }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Slide content */}
        <div className={`bg-gradient-to-br ${current.bg} p-8 flex flex-col items-center text-center gap-4`}>
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-sm">
            {current.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 flex flex-col gap-4">
          {/* Dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {isLast ? 'Mulai Sekarang' : (
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
