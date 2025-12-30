'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatRupiah, formatDateForInput } from '@/lib/utils'
import { Download } from 'lucide-react'
import type { ProfitLossReport as ProfitLossReportType } from '@/types'

interface ProfitLossReportProps {
  businessId: string
}

export function ProfitLossReport({ businessId }: ProfitLossReportProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ProfitLossReportType | null>(null)

  // Default to current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [periodStart, setPeriodStart] = useState(formatDateForInput(firstDay))
  const [periodEnd, setPeriodEnd] = useState(formatDateForInput(lastDay))

  async function generateReport() {
    setLoading(true)

    try {
      const response = await fetch('/api/reports/profit-loss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, periodStart, periodEnd }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      const data = await response.json()
      setReport(data.report)
    } catch (error: any) {
      toast.error(error.message || 'Gagal membuat laporan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateReport()
  }, [])

  return (
    <div className="space-y-4">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Periode Laporan</CardTitle>
          <CardDescription>Pilih periode untuk laporan laba rugi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? 'Memuat...' : 'Tampilkan Laporan'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Laporan Laba Rugi</CardTitle>
              <CardDescription>
                Periode: {new Date(report.period_start).toLocaleDateString('id-ID')} -{' '}
                {new Date(report.period_end).toLocaleDateString('id-ID')}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Unduh
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Pendapatan</h3>
              <div className="space-y-2">
                {report.revenue_by_category.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada pendapatan</p>
                ) : (
                  report.revenue_by_category.map((item) => (
                    <div key={item.category_id} className="flex justify-between text-sm">
                      <span>{item.category_name}</span>
                      <span className="font-medium text-green-600">
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ))
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Pendapatan</span>
                  <span className="text-green-600">
                    {formatRupiah(report.total_revenue)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Expense Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Pengeluaran</h3>
              <div className="space-y-2">
                {report.expense_by_category.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada pengeluaran</p>
                ) : (
                  report.expense_by_category.map((item) => (
                    <div key={item.category_id} className="flex justify-between text-sm">
                      <span>{item.category_name}</span>
                      <span className="font-medium text-red-600">
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ))
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Pengeluaran</span>
                  <span className="text-red-600">
                    {formatRupiah(report.total_expense)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Net Profit */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Laba Bersih</span>
                <span
                  className={`text-2xl font-bold ${report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatRupiah(report.net_profit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
