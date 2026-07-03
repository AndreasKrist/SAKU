'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'
import { Download, RefreshCw, CheckCircle2, X } from 'lucide-react'
import type { CapitalAccountsReport as CapitalAccountsReportType } from '@/types'

interface CapitalAccountsReportProps {
  businessId: string
}

export function CapitalAccountsReport({ businessId }: CapitalAccountsReportProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<CapitalAccountsReportType | null>(null)
  const [downloadedFile, setDownloadedFile] = useState<{ format: string; date: string } | null>(null)

  function downloadCSV() {
    if (!report) return

    const lines: string[] = []
    lines.push('LAPORAN EKUITAS MITRA')
    lines.push(`Per tanggal: ${new Date(report.period_end).toLocaleDateString('id-ID')}`)
    lines.push('')
    lines.push(`Total Saldo Laba Tersedia,${report.total_capital}`)
    lines.push('')
    lines.push('Mitra,Ekuitas (%),Kontribusi,Hak Laba,Penarikan,Saldo Laba')
    report.accounts.forEach((acc) => {
      lines.push(`${acc.user_name},${acc.equity_percentage},${acc.total_contributions},${acc.total_profit_allocated},${acc.total_withdrawals},${acc.current_balance}`)
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan-ekuitas-${report.period_end}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Laporan berhasil diunduh')
    setDownloadedFile({ format: 'CSV', date: new Date(report.period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) })
  }

  async function generateReport() {
    setLoading(true)

    try {
      const response = await fetch('/api/reports/capital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
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
  }, [])

  return (
    <div className="space-y-4">
      {/* Report */}
      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Laporan Ekuitas Mitra</CardTitle>
              <CardDescription>
                Per tanggal:{' '}
                {new Date(report.period_end).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generateReport} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardHeader>
          {downloadedFile && (
            <div className="mx-6 mb-0 flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <div className="flex-1 text-sm text-green-800">
                <span className="font-medium">File berhasil diunduh</span>
                <p className="text-xs text-green-700">Format: {downloadedFile.format} • Per tanggal: {downloadedFile.date}</p>
              </div>
              <button type="button" onClick={() => setDownloadedFile(null)} className="text-green-600 hover:text-green-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <CardContent className="space-y-6">
            {/* Total Capital Summary */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Saldo Laba Tersedia</p>
                <p className="text-4xl font-bold text-purple-600">
                  {formatRupiah(report.total_capital)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Per Partner Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Rincian Ekuitas Per Mitra</h3>

              {report.accounts.map((account) => (
                <div key={account.user_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{account.user_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Ekuitas: {account.equity_percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Saldo Laba</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatRupiah(account.current_balance)}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-xs text-muted-foreground mb-1">Kontribusi</p>
                      <p className="font-semibold text-green-600">
                        {formatRupiah(account.total_contributions)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-xs text-muted-foreground mb-1">Hak Laba</p>
                      <p className="font-semibold text-blue-600">
                        {formatRupiah(account.total_profit_allocated)}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded text-center">
                      <p className="text-xs text-muted-foreground mb-1">Penarikan</p>
                      <p className="font-semibold text-red-600">
                        {formatRupiah(account.total_withdrawals)}
                      </p>
                    </div>
                  </div>

                  {/* Formula */}
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <p className="text-muted-foreground">
                      Saldo laba ={' '}
                      <span className="text-blue-600">
                        {formatRupiah(account.total_profit_allocated)}
                      </span>{' '}
                      -{' '}
                      <span className="text-red-600">
                        {formatRupiah(account.total_withdrawals)}
                      </span>{' '}
                      ={' '}
                      <span className="font-semibold text-purple-600">
                        {formatRupiah(account.current_balance)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Kontribusi</p>
                <p className="text-lg font-bold text-green-600">
                  {formatRupiah(
                    report.accounts.reduce((sum, acc) => sum + acc.total_contributions, 0)
                  )}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Hak Laba</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatRupiah(
                    report.accounts.reduce(
                      (sum, acc) => sum + acc.total_profit_allocated,
                      0
                    )
                  )}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Penarikan</p>
                <p className="text-lg font-bold text-red-600">
                  {formatRupiah(
                    report.accounts.reduce((sum, acc) => sum + acc.total_withdrawals, 0)
                  )}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Saldo Laba</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatRupiah(report.total_capital)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
