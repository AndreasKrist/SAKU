'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatRupiah, formatDateForInput } from '@/lib/utils'
import { Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

  function downloadCSV() {
    if (!report) return

    // Build CSV content
    const lines: string[] = []

    // Header
    lines.push('LAPORAN LABA RUGI')
    lines.push(`Periode: ${new Date(report.period_start).toLocaleDateString('id-ID')} - ${new Date(report.period_end).toLocaleDateString('id-ID')}`)
    lines.push('')

    // Revenue section
    lines.push('PENDAPATAN')
    lines.push('Kategori,Jumlah')
    report.revenue_by_category.forEach((item) => {
      lines.push(`${item.category_name},${item.amount}`)
    })
    lines.push(`Total Pendapatan,${report.total_revenue}`)
    lines.push('')

    // Expense section
    lines.push('PENGELUARAN')
    lines.push('Kategori,Jumlah')
    report.expense_by_category.forEach((item) => {
      lines.push(`${item.category_name},${item.amount}`)
    })
    lines.push(`Total Pengeluaran,${report.total_expense}`)
    lines.push('')

    // Net profit
    lines.push('RINGKASAN')
    lines.push(`Laba Bersih,${report.net_profit}`)

    // Create and download file
    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan-laba-rugi-${periodStart}-${periodEnd}.csv`)
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
    doc.text('LAPORAN LABA RUGI', pageWidth / 2, 20, { align: 'center' })

    // Period
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Periode: ${new Date(report.period_start).toLocaleDateString('id-ID')} - ${new Date(report.period_end).toLocaleDateString('id-ID')}`,
      pageWidth / 2,
      28,
      { align: 'center' }
    )

    // Revenue Table
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PENDAPATAN', 14, 42)

    const revenueData = report.revenue_by_category.map((item) => [
      item.category_name,
      formatRupiah(item.amount),
    ])
    revenueData.push(['Total Pendapatan', formatRupiah(report.total_revenue)])

    autoTable(doc, {
      startY: 46,
      head: [['Kategori', 'Jumlah']],
      body: revenueData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      footStyles: { fillColor: [220, 252, 231], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    })

    // Expense Table
    const revenueTableEnd = (doc as any).lastAutoTable.finalY + 10
    doc.setFont('helvetica', 'bold')
    doc.text('PENGELUARAN', 14, revenueTableEnd)

    const expenseData = report.expense_by_category.map((item) => [
      item.category_name,
      formatRupiah(item.amount),
    ])
    expenseData.push(['Total Pengeluaran', formatRupiah(report.total_expense)])

    autoTable(doc, {
      startY: revenueTableEnd + 4,
      head: [['Kategori', 'Jumlah']],
      body: expenseData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      footStyles: { fillColor: [254, 226, 226], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    })

    // Net Profit
    const expenseTableEnd = (doc as any).lastAutoTable.finalY + 10
    doc.setFillColor(243, 244, 246)
    doc.rect(14, expenseTableEnd, pageWidth - 28, 16, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('LABA BERSIH', 20, expenseTableEnd + 10)
    doc.setTextColor(report.net_profit >= 0 ? 34 : 239, report.net_profit >= 0 ? 197 : 68, report.net_profit >= 0 ? 94 : 68)
    doc.text(formatRupiah(report.net_profit), pageWidth - 20, expenseTableEnd + 10, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, doc.internal.pageSize.getHeight() - 10)

    // Save
    doc.save(`laporan-laba-rugi-${periodStart}-${periodEnd}.pdf`)
    toast.success('PDF berhasil diunduh')
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        </CardContent>
      </Card>

      {/* Report */}
      {report && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Laporan Laba Rugi</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Periode: {new Date(report.period_start).toLocaleDateString('id-ID')} -{' '}
                {new Date(report.period_end).toLocaleDateString('id-ID')}
              </CardDescription>
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
