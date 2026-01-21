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
import { Download, Building2, User, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  function downloadCSV() {
    if (!report) return

    // Build CSV content
    const lines: string[] = []

    // Header
    lines.push('LAPORAN ARUS KAS')
    lines.push(`Periode: ${new Date(report.period_start).toLocaleDateString('id-ID')} - ${new Date(report.period_end).toLocaleDateString('id-ID')}`)
    lines.push('')

    // Opening Balance
    lines.push('SALDO AWAL')
    lines.push(`Saldo Awal,${report.opening_balance}`)
    lines.push('')

    // Cash In
    lines.push('KAS MASUK')
    lines.push('Tanggal,Keterangan,Jumlah')
    report.revenue_items.forEach((item) => {
      lines.push(`${formatDate(item.transaction_date)},${item.item_name || 'Pendapatan'},${item.amount}`)
    })
    lines.push(`,,Total Kas Masuk,${report.cash_in}`)
    lines.push('')

    // Cash Out
    lines.push('KAS KELUAR')
    lines.push('Tanggal,Keterangan,Sumber,Jumlah')
    report.expense_items.forEach((item) => {
      lines.push(`${formatDate(item.transaction_date)},${item.item_name || 'Pengeluaran'},${item.payment_source === 'business' ? 'Kas Bisnis' : 'Pribadi'},${item.amount}`)
    })
    lines.push(`,,,Total Pengeluaran,${report.cash_out}`)
    lines.push('')

    // Financing
    lines.push('ARUS KAS PENDANAAN')
    if (report.contribution_items.length > 0) {
      lines.push('Kontribusi Modal:')
      report.contribution_items.forEach((item) => {
        lines.push(`${formatDate(item.contribution_date)},Kontribusi modal,${item.amount}`)
      })
    }
    if (report.withdrawal_items.length > 0) {
      lines.push('Penarikan Laba:')
      report.withdrawal_items.forEach((item) => {
        lines.push(`${formatDate(item.withdrawal_date)},Penarikan laba,${item.amount}`)
      })
    }
    lines.push(`Arus Kas Bersih Pendanaan,${report.contributions_in - report.withdrawals_out}`)
    lines.push('')

    // Closing Balance
    lines.push('SALDO AKHIR')
    lines.push(`Saldo Akhir Kas Bisnis,${report.closing_balance}`)

    // Create and download file
    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan-arus-kas-${periodStart}-${periodEnd}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Laporan berhasil diunduh')
  }

  function downloadPDF() {
    if (!report) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN ARUS KAS', pageWidth / 2, 20, { align: 'center' })

    // Period
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Periode: ${new Date(report.period_start).toLocaleDateString('id-ID')} - ${new Date(report.period_end).toLocaleDateString('id-ID')}`,
      pageWidth / 2,
      28,
      { align: 'center' }
    )

    // Opening Balance
    doc.setFillColor(219, 234, 254)
    doc.rect(14, 36, pageWidth - 28, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Saldo Awal', 20, 44)
    doc.text(formatRupiah(report.opening_balance), pageWidth - 20, 44, { align: 'right' })

    // Cash In Table
    let currentY = 56
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(34, 197, 94)
    doc.text('KAS MASUK', 14, currentY)
    doc.setTextColor(0, 0, 0)

    if (report.revenue_items.length > 0) {
      const cashInData = report.revenue_items.map((item) => [
        formatDate(item.transaction_date),
        item.item_name || 'Pendapatan',
        formatRupiah(Number(item.amount)),
      ])
      cashInData.push(['', 'Total Kas Masuk', formatRupiah(report.cash_in)])

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Tanggal', 'Keterangan', 'Jumlah']],
        body: cashInData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        columnStyles: { 2: { halign: 'right' } },
      })
      currentY = (doc as any).lastAutoTable.finalY + 10
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Tidak ada kas masuk', 14, currentY + 8)
      currentY += 16
    }

    // Cash Out Table
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(239, 68, 68)
    doc.text('KAS KELUAR', 14, currentY)
    doc.setTextColor(0, 0, 0)

    if (report.expense_items.length > 0) {
      const cashOutData = report.expense_items.map((item) => [
        formatDate(item.transaction_date),
        item.item_name || 'Pengeluaran',
        item.payment_source === 'business' ? 'Kas Bisnis' : 'Pribadi',
        formatRupiah(Number(item.amount)),
      ])
      cashOutData.push(['', 'Total Pengeluaran', '', formatRupiah(report.cash_out)])

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Tanggal', 'Keterangan', 'Sumber', 'Jumlah']],
        body: cashOutData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        columnStyles: { 3: { halign: 'right' } },
      })
      currentY = (doc as any).lastAutoTable.finalY + 10
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Tidak ada kas keluar', 14, currentY + 8)
      currentY += 16
    }

    // Check if we need a new page
    if (currentY > 220) {
      doc.addPage()
      currentY = 20
    }

    // Financing Activities
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('ARUS KAS PENDANAAN', 14, currentY)
    doc.setTextColor(0, 0, 0)

    const financingData: string[][] = []
    report.contribution_items.forEach((item) => {
      financingData.push([
        formatDate(item.contribution_date),
        'Kontribusi Modal',
        '+' + formatRupiah(Number(item.amount)),
      ])
    })
    report.withdrawal_items.forEach((item) => {
      financingData.push([
        formatDate(item.withdrawal_date),
        'Penarikan Laba',
        '-' + formatRupiah(Number(item.amount)),
      ])
    })

    if (financingData.length > 0) {
      financingData.push(['', 'Arus Kas Bersih Pendanaan', formatRupiah(report.contributions_in - report.withdrawals_out)])

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Tanggal', 'Keterangan', 'Jumlah']],
        body: financingData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: { 2: { halign: 'right' } },
      })
      currentY = (doc as any).lastAutoTable.finalY + 10
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Tidak ada aktivitas pendanaan', 14, currentY + 8)
      currentY += 16
    }

    // Closing Balance
    doc.setFillColor(243, 232, 255)
    doc.rect(14, currentY, pageWidth - 28, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Saldo Akhir Kas Bisnis', 20, currentY + 8)
    doc.setTextColor(147, 51, 234)
    doc.text(formatRupiah(report.closing_balance), pageWidth - 20, currentY + 8, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, doc.internal.pageSize.getHeight() - 10)

    // Save
    doc.save(`laporan-arus-kas-${periodStart}-${periodEnd}.pdf`)
    toast.success('PDF berhasil diunduh')
  }

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
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
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
            <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <Label className="hidden md:block">&nbsp;</Label>
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
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Laporan Arus Kas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="default" size="sm" className="flex-1 sm:flex-none" onClick={downloadPDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Opening Balance */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="font-semibold text-sm sm:text-base">Saldo Awal</span>
                <span className="text-lg sm:text-xl font-bold text-blue-600">
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

            {/* Financing Activities */}
            <div>
              <h3 className="font-semibold text-lg mb-3 text-blue-600">Arus Kas Pendanaan</h3>
              <div className="space-y-2">
                {/* Contributions */}
                {report.contribution_items.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Kontribusi Modal:</p>
                    {report.contribution_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm border-b pb-2 ml-4">
                        <div className="flex-1">
                          <p className="font-medium">Kontribusi dari mitra</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.contribution_date)} • {item.notes || 'Modal'}
                          </p>
                        </div>
                        <span className="font-medium text-green-600">
                          +{formatRupiah(Number(item.amount))}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* Withdrawals */}
                {report.withdrawal_items.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mb-2 mt-3">Penarikan Laba:</p>
                    {report.withdrawal_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm border-b pb-2 ml-4">
                        <div className="flex-1">
                          <p className="font-medium">Penarikan laba</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.withdrawal_date)} • {item.notes || 'Penarikan'}
                          </p>
                        </div>
                        <span className="font-medium text-red-600">
                          -{formatRupiah(Number(item.amount))}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {report.contribution_items.length === 0 && report.withdrawal_items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada aktivitas pendanaan</p>
                )}

                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Arus Kas Bersih dari Pendanaan</span>
                  <span className={report.contributions_in - report.withdrawals_out >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {report.contributions_in - report.withdrawals_out >= 0 ? '+' : ''}
                    {formatRupiah(report.contributions_in - report.withdrawals_out)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Closing Balance */}
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <span className="text-base sm:text-lg font-semibold">Saldo Akhir Kas Bisnis</span>
                  {report.show_all_expenses && report.cash_out_partner > 0 && (
                    <p className="text-xs text-muted-foreground">
                      * Hanya memperhitungkan kas bisnis
                    </p>
                  )}
                </div>
                <span
                  className={`text-xl sm:text-2xl font-bold ${report.closing_balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}
                >
                  {formatRupiah(report.closing_balance)}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Saldo Awal</p>
                <p className="font-semibold text-blue-600 text-sm sm:text-base">
                  {formatRupiah(report.opening_balance)}
                </p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Arus Kas Operasional</p>
                <p className={`font-semibold text-sm sm:text-base ${(report.cash_in - report.cash_out_business) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(report.cash_in - report.cash_out_business) >= 0 ? '+' : ''}{formatRupiah(report.cash_in - report.cash_out_business)}
                </p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Arus Kas Pendanaan</p>
                <p className={`font-semibold text-sm sm:text-base ${(report.contributions_in - report.withdrawals_out) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(report.contributions_in - report.withdrawals_out) >= 0 ? '+' : ''}{formatRupiah(report.contributions_in - report.withdrawals_out)}
                </p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-purple-50 rounded">
                <p className="text-xs text-muted-foreground mb-1">Saldo Akhir</p>
                <p className="font-semibold text-purple-600 text-sm sm:text-base">
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
