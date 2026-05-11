'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Metric = 'revenue' | 'expense' | 'profit'

interface Transaction {
  id: string
  type: 'revenue' | 'expense'
  amount: number | string
  transaction_date: string
  item_name?: string
  category?: { name: string }
}

interface DashboardStatsProps {
  transactions: Transaction[]
  totalCapital: number
  memberCount: number
  filterStart?: string
  filterEnd?: string
}

type GroupBy = 'day' | 'week' | 'month'

function getDefaultGroupBy(filterStart?: string, filterEnd?: string): GroupBy {
  const start = filterStart ? new Date(filterStart) : null
  const end = filterEnd ? new Date(filterEnd) : null
  const diffDays = start && end
    ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    : 9999
  if (diffDays <= 60) return 'day'
  if (diffDays <= 180) return 'week'
  return 'month'
}

function groupByPeriod(transactions: Transaction[], groupBy: GroupBy) {
  // Sort ascending by date first so map preserves chronological order
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  )

  const map = new Map<string, { revenue: number; expense: number }>()

  for (const t of sorted) {
    const d = new Date(t.transaction_date)
    let key: string

    if (groupBy === 'day') {
      key = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
    } else if (groupBy === 'week') {
      const weekNum = Math.ceil(d.getDate() / 7)
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' })
      const year = String(d.getFullYear()).slice(-2)
      key = `W${weekNum} ${monthLabel} '${year}`
    } else {
      key = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    }

    const existing = map.get(key) ?? { revenue: 0, expense: 0 }
    if (t.type === 'revenue') {
      existing.revenue += Number(t.amount)
    } else {
      existing.expense += Number(t.amount)
    }
    map.set(key, existing)
  }

  return Array.from(map.entries()).map(([label, v]) => ({
    label,
    pendapatan: v.revenue,
    pengeluaran: v.expense,
    laba: v.revenue - v.expense,
  }))
}

const METRIC_CONFIG = {
  revenue: {
    label: 'Pendapatan',
    color: '#10b981',
    dataKey: 'pendapatan',
    chartType: 'bar' as const,
  },
  expense: {
    label: 'Pengeluaran',
    color: '#f43f5e',
    dataKey: 'pengeluaran',
    chartType: 'bar' as const,
  },
  profit: {
    label: 'Laba Bersih',
    color: '#3b82f6',
    dataKey: 'laba',
    chartType: 'line' as const,
  },
}

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
  return String(value)
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  )
}

export function DashboardStats({
  transactions,
  totalCapital,
  memberCount,
  filterStart,
  filterEnd,
}: DashboardStatsProps) {
  const [activeMetric, setActiveMetric] = useState<Metric | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>(() => getDefaultGroupBy(filterStart, filterEnd))

  const totalRevenue = transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netProfit = totalRevenue - totalExpense

  const chartData = useMemo(
    () => groupByPeriod(transactions, groupBy),
    [transactions, groupBy]
  )

  function toggleMetric(metric: Metric) {
    setActiveMetric((prev) => (prev === metric ? null : metric))
  }

  const cfg = activeMetric ? METRIC_CONFIG[activeMetric] : null

  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Pendapatan */}
        <button
          onClick={() => toggleMetric('revenue')}
          className={`text-left relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl p-0 ${
            activeMetric === 'revenue' ? 'ring-2 ring-emerald-500' : 'hover:scale-[1.02]'
          }`}
        >
          <Card className="border-0 shadow-none h-full">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pendapatan</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-base sm:text-lg md:text-2xl font-bold text-emerald-600 truncate">{formatRupiah(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                {transactions.filter((t) => t.type === 'revenue').length} transaksi
                {activeMetric === 'revenue' && <span className="ml-1 text-emerald-600">▼</span>}
              </p>
            </CardContent>
          </Card>
        </button>

        {/* Pengeluaran */}
        <button
          onClick={() => toggleMetric('expense')}
          className={`text-left relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl p-0 ${
            activeMetric === 'expense' ? 'ring-2 ring-rose-500' : 'hover:scale-[1.02]'
          }`}
        >
          <Card className="border-0 shadow-none h-full">
            <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-rose-500/20 to-transparent rounded-bl-full pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-100">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-base sm:text-lg md:text-2xl font-bold text-rose-600 truncate">{formatRupiah(totalExpense)}</div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                {transactions.filter((t) => t.type === 'expense').length} transaksi
                {activeMetric === 'expense' && <span className="ml-1 text-rose-600">▼</span>}
              </p>
            </CardContent>
          </Card>
        </button>

        {/* Laba Bersih */}
        <button
          onClick={() => toggleMetric('profit')}
          className={`text-left relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl p-0 ${
            activeMetric === 'profit' ? 'ring-2 ring-blue-500' : 'hover:scale-[1.02]'
          }`}
        >
          <Card className="border-0 shadow-none h-full">
            <div className={`absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl ${netProfit >= 0 ? 'from-blue-500/20' : 'from-orange-500/20'} to-transparent rounded-bl-full pointer-events-none`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Laba Bersih</CardTitle>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${netProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <TrendingUp className={`h-4 w-4 sm:h-5 sm:w-5 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className={`text-base sm:text-lg md:text-2xl font-bold truncate ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatRupiah(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 sm:mt-2 flex items-center gap-1">
                {filterStart && filterEnd ? `${filterStart} – ${filterEnd}` : 'Semua waktu'}
                {activeMetric === 'profit' && <span className="ml-1 text-blue-600">▼</span>}
              </p>
            </CardContent>
          </Card>
        </button>

        {/* Laba Ditarik — not clickable */}
        <Card className="relative overflow-hidden border-0 shadow-md">
          <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Laba Ditarik</CardTitle>
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-100">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-base sm:text-lg md:text-2xl font-bold text-violet-600 truncate">{formatRupiah(totalCapital)}</div>
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount} mitra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Panel */}
      {activeMetric && cfg && (
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                Grafik {cfg.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {filterStart && filterEnd ? `${filterStart} – ${filterEnd}` : 'Semua waktu'}
              </p>
            </div>
            {/* Group by toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 flex-shrink-0">
              {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    groupBy === g
                      ? 'bg-background text-foreground shadow-sm font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {g === 'day' ? 'Hari' : g === 'week' ? 'Minggu' : 'Bulan'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveMetric(null)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="pt-0 pr-2">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Tidak ada data untuk periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                {cfg.chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={formatYAxis}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey={cfg.dataKey}
                      name={cfg.label}
                      fill={cfg.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={formatYAxis}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      dataKey={cfg.dataKey}
                      name={cfg.label}
                      stroke={cfg.color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: cfg.color }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
