'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarRange, ChevronDown, X } from 'lucide-react'

const PRESETS = [
  { label: 'Semua', value: 'all' },
  { label: 'Bulan Ini', value: 'this_month' },
  { label: 'Bulan Lalu', value: 'last_month' },
  { label: '3 Bulan', value: '3_months' },
  { label: 'Tahun Ini', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
]

function getPresetDates(preset: string): { start: string; end: string } | null {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  switch (preset) {
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start: fmt(start), end: fmt(end) }
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: fmt(start), end: fmt(end) }
    }
    case '3_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start: fmt(start), end: fmt(end) }
    }
    case 'this_year': {
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      }
    }
    default:
      return null
  }
}

interface PeriodFilterProps {
  currentStart?: string
  currentEnd?: string
}

export function PeriodFilter({ currentStart, currentEnd }: PeriodFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const hasFilter = !!currentStart || !!currentEnd
  const isCustom = hasFilter && !PRESETS.some((p) => {
    if (p.value === 'all' || p.value === 'custom') return false
    const dates = getPresetDates(p.value)
    return dates?.start === currentStart && dates?.end === currentEnd
  })

  const activePreset = hasFilter
    ? isCustom
      ? 'custom'
      : (PRESETS.find((p) => {
          if (p.value === 'all' || p.value === 'custom') return false
          const dates = getPresetDates(p.value)
          return dates?.start === currentStart && dates?.end === currentEnd
        })?.value ?? 'custom')
    : 'all'

  const [showCustom, setShowCustom] = useState(activePreset === 'custom')
  const [customStart, setCustomStart] = useState(isCustom ? (currentStart ?? '') : '')
  const [customEnd, setCustomEnd] = useState(isCustom ? (currentEnd ?? '') : '')

  function navigate(start?: string, end?: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (start && end) {
      params.set('start', start)
      params.set('end', end)
    } else {
      params.delete('start')
      params.delete('end')
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handlePreset(value: string) {
    if (value === 'all') {
      setShowCustom(false)
      navigate()
    } else if (value === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
      const dates = getPresetDates(value)
      if (dates) navigate(dates.start, dates.end)
    }
  }

  function handleCustomApply() {
    if (customStart && customEnd) navigate(customStart, customEnd)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarRange className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            disabled={isPending}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              activePreset === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
        {hasFilter && (
          <button
            onClick={() => { setShowCustom(false); navigate() }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
        {isPending && (
          <span className="text-xs text-muted-foreground animate-pulse">Memuat...</span>
        )}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="w-auto text-sm h-8"
          />
          <span className="text-sm text-muted-foreground">s/d</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="w-auto text-sm h-8"
          />
          <Button
            size="sm"
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd || isPending}
            className="h-8 text-xs"
          >
            Terapkan
          </Button>
        </div>
      )}

      {/* Active filter label */}
      {hasFilter && (
        <p className="text-xs text-muted-foreground">
          Menampilkan:{' '}
          <span className="font-medium text-foreground">
            {currentStart} — {currentEnd}
          </span>
        </p>
      )}
    </div>
  )
}
