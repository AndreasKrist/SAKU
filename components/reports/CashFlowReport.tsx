'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { formatRupiah, formatDateForInput, formatDate } from '@/lib/utils'
import { Download, Building2, User } from 'lucide-react'
import type { CashFlowReport as CashFlowReportType } from '@/types'

interface CashFlowReportProps {
  businessId: string
}

export function CashFlowReport({ businessId }: CashFlowReportProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<CashFlowReportType | null>(null)
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  // Default to current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [periodStart, setPeriodStart] = useState(formatDateForInput(firstDay))
  const [periodEnd, setPeriodEnd] = useState(formatDateForInput(lastDay))

  async function generateReport() {
    setLoading(true)

    try {
      const response = await fetch('/api/reports/cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, periodStart, periodEnd, showAllExpenses }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllExpenses])

  return (
    <div className="space-y-4">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Periode Laporan</CardTitle>
          <CardDescription>Pilih periode untuk laporan arus kas</CardDescription>
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
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="space-y-0.5">
              <Label htmlFor="show-all">Tampilkan semua pengeluaran</Label>
              <p className="text-xs text-muted-foreground">
                Termasuk pengeluaran yang dibayar mitra dari uang pribadi
              </p>
            </div>
            <Switch
              id="show-all"
              checked={showAllExpenses}
              onCheckedChange={setShowAllExpenses}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report */}
      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Laporan Arus Kas</CardTitle>
              <CardDescription>
                Periode: {new Date(report.period_start).toLocaleDateString('id-ID')} -{' '}
                {new Date(report.period_end).toLocaleDateString('id-ID')}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                {report.show_all_expenses
                  ? '* Menampilkan semua pengeluaran (kas bisnis + pribadi mitra)'
                  : '* Hanya transaksi yang dibayar dari kas bisnis'
                }
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Unduh
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Opening Balance */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Saldo Awal</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatRupiah(report.opening_balance)}
                </span>
              </div>
            </div>

            {/* Cash In */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-green-600">Kas Masuk</h3>
              <div className="space-y-2">
                {report.revenue_items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada kas masuk</p>
                ) : (
                  report.revenue_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.item_name || 'Pendapatan'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.transaction_date)}
                        </p>
                      </div>
                      <span className="font-medium text-green-600">
                        +{formatRupiah(Number(item.amount))}
                      </span>
                    </div>
                  ))
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total Kas Masuk</span>
                  <span className="text-green-600">{formatRupiah(report.cash_in)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cash Out */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-red-600">Kas Keluar</h3>
              <div className="space-y-2">
                {report.expense_items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada kas keluar</p>
                ) : (
                  report.expense_items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.item_name || 'Pengeluaran'}</p>
                          {report.show_all_expenses && (
                            <Badge
                              variant={item.payment_source === 'business' ? 'default' : 'secondary'}
                              className="text-xs px-1.5 py-0"
                            >
                              {item.payment_source === 'business' ? (
                                <><Building2 className="w-3 h-3 mr-1" />Kas</>
                              ) : (
                                <><User className="w-3 h-3 mr-1" />Pribadi</>
                              )}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.transaction_date)}
                        </p>
                      </div>
                      <span className={`font-medium ${item.payment_source === 'business' ? 'text-red-600' : 'text-orange-500'}`}>
                        -{formatRupiah(Number(item.amount))}
                      </span>
                    </div>
                  ))
                )}
                <Separator className="my-2" />
                {report.show_all_expenses && report.cash_out_partner > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> Dari Kas Bisnis
                      </span>
                      <span className="text-red-600">{formatRupiah(report.cash_out_business)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" /> Dari Pribadi Mitra
                      </span>
                      <span className="text-orange-500">{formatRupiah(report.cash_out_partner)}</span>
                    </div>
                    <Separator className="my-2" />
                  </>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total Pengeluaran</span>
                  <span className="text-red-600">{formatRupiah(report.cash_out)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Closing Balance */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold">Saldo Akhir Kas Bisnis</span>
                  {report.show_all_expenses && report.cash_out_partner > 0 && (
                    <p className="text-xs text-muted-foreground">
                      * Hanya memperhitungkan kas bisnis
                    </p>
                  )}
                </div>
                <span
                  className={`text-2xl font-bold ${report.closing_balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}
                >
                  {formatRupiah(report.closing_balance)}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Saldo Awal</p>
                <p className="font-semibold text-blue-600">
                  {formatRupiah(report.opening_balance)}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Arus Kas Bersih</p>
                <p className={`font-semibold ${(report.cash_in - report.cash_out_business) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(report.cash_in - report.cash_out_business) >= 0 ? '+' : ''}{formatRupiah(report.cash_in - report.cash_out_business)}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Saldo Akhir</p>
                <p className="font-semibold text-purple-600">
                  {formatRupiah(report.closing_balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
