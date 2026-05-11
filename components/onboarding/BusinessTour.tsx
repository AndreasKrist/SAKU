'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

interface BusinessTourProps {
  businessId: string
}

export function BusinessTour({ businessId }: BusinessTourProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const isNew = searchParams.get('new') === '1'
    const storageKey = `saku_biz_tour_${businessId}`
    const seen = localStorage.getItem(storageKey)

    if (!isNew || seen) return

    // Small delay so page elements are fully rendered
    const timeout = setTimeout(() => {
      const isMobile = window.innerWidth < 768

      const sidebarSteps = isMobile ? [] : [
        {
          element: '#tour-menu-transaksi',
          popover: {
            title: '🧾 Transaksi',
            description: 'Catat setiap pemasukan dan pengeluaran bisnis kamu di sini.',
            side: 'right' as const,
            align: 'start' as const,
          },
        },
        {
          element: '#tour-menu-modal',
          popover: {
            title: '🏦 Modal & Ekuitas',
            description: 'Kelola kontribusi modal mitra dan atur persentase kepemilikan (ekuitas) masing-masing.',
            side: 'right' as const,
            align: 'start' as const,
          },
        },
        {
          element: '#tour-menu-penarikan',
          popover: {
            title: '💸 Penarikan Laba',
            description: 'Distribusikan laba ke mitra dan tarik bagian laba masing-masing. Pemilik bisa tarik semua mitra sekaligus.',
            side: 'right' as const,
            align: 'start' as const,
          },
        },
        {
          element: '#tour-menu-laporan',
          popover: {
            title: '📊 Laporan',
            description: 'Lihat laporan keuangan lengkap: laba rugi, arus kas, dan modal ekuitas. Bisa diekspor ke PDF.',
            side: 'right' as const,
            align: 'start' as const,
          },
        },
        {
          element: '#tour-menu-mitra',
          popover: {
            title: '👥 Mitra',
            description: 'Kelola anggota bisnis, lihat kode undangan untuk mitra baru, dan atur distribusi ekuitas.',
            side: 'right' as const,
            align: 'start' as const,
          },
        },
      ]

      const driverObj = driver({
        showProgress: true,
        smoothScroll: true,
        allowClose: true,
        stagePadding: 6,
        popoverClass: 'saku-tour-popover',
        nextBtnText: 'Lanjut →',
        prevBtnText: '← Kembali',
        doneBtnText: '✓ Selesai',
        progressText: '{{current}} dari {{total}}',
        onDestroyed: () => {
          localStorage.setItem(storageKey, 'true')
          // Clean up ?new=1 from URL
          const params = new URLSearchParams(searchParams.toString())
          params.delete('new')
          const newUrl = params.toString() ? `${pathname}?${params}` : pathname
          router.replace(newUrl)
        },
        steps: [
          {
            popover: {
              title: '👋 Selamat datang di bisnis kamu!',
              description: 'Yuk kenali menu dan fitur yang tersedia. Klik <b>Lanjut</b> untuk mulai tur singkat ini.',
              align: 'center' as const,
            },
          },
          {
            element: '#tour-period-filter',
            popover: {
              title: '📅 Filter Periode',
              description: 'Pilih rentang waktu data yang ingin kamu lihat — bulan ini, 3 bulan terakhir, tahun ini, atau custom tanggal sendiri. Default-nya menampilkan semua data.',
              side: 'bottom' as const,
              align: 'start' as const,
            },
          },
          {
            element: '#tour-stat-cards',
            popover: {
              title: '📈 Ringkasan Keuangan',
              description: 'Lihat total pendapatan, pengeluaran, dan laba bersih sesuai periode yang dipilih. <b>Klik salah satu kartu</b> untuk melihat grafik tren-nya.',
              side: 'bottom' as const,
              align: 'start' as const,
            },
          },
          {
            element: '#tour-quick-actions',
            popover: {
              title: '⚡ Akses Cepat',
              description: 'Tombol pintas ke menu-menu utama bisnis. Dari sini kamu langsung bisa catat transaksi, lihat penarikan, laporan, atau kelola mitra.',
              side: 'top' as const,
              align: 'start' as const,
            },
          },
          {
            element: '#tour-recent-transactions',
            popover: {
              title: '🕐 Transaksi Terbaru',
              description: '5 transaksi terakhir ditampilkan di sini agar kamu bisa pantau aktivitas bisnis dengan cepat.',
              side: 'top' as const,
              align: 'start' as const,
            },
          },
          ...sidebarSteps,
        ],
      })

      driverObj.drive()
    }, 500)

    return () => clearTimeout(timeout)
  }, [businessId, searchParams, pathname, router])

  return null
}
