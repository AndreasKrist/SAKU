'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils'
import type { PartnerCapitalAccount } from '@/types'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface CapitalAccountSummaryProps {
  accounts: PartnerCapitalAccount[]
}

export function CapitalAccountSummary({ accounts }: CapitalAccountSummaryProps) {
  const totalContributions = accounts.reduce(
    (sum, acc) => sum + acc.total_contributions,
    0
  )
  const totalProfitAllocated = accounts.reduce(
    (sum, acc) => sum + acc.total_profit_allocated,
    0
  )
  const totalWithdrawals = accounts.reduce(
    (sum, acc) => sum + acc.total_withdrawals,
    0
  )
  const totalCapital = accounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kontribusi</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(totalContributions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laba</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatRupiah(totalProfitAllocated)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatRupiah(totalWithdrawals)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Laba Tersedia</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatRupiah(totalCapital)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bisa ditarik</p>
          </CardContent>
        </Card>
      </div>

      {/* Per Partner */}
      <Card>
        <CardHeader>
          <CardTitle>Ekuitas Per Mitra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.user_id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{account.user_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Ekuitas: {account.equity_percentage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo Laba (Bisa Ditarik)</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatRupiah(account.current_balance)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Kontribusi</p>
                    <p className="font-semibold text-green-600">
                      {formatRupiah(account.total_contributions)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Laba</p>
                    <p className="font-semibold text-blue-600">
                      {formatRupiah(account.total_profit_allocated)}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Penarikan</p>
                    <p className="font-semibold text-red-600">
                      {formatRupiah(account.total_withdrawals)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
