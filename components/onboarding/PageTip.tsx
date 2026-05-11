'use client'

import { useState, useEffect } from 'react'
import { X, Lightbulb } from 'lucide-react'

interface PageTipProps {
  tipKey: string
  message: string
}

export function PageTip({ tipKey, message }: PageTipProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(`saku_tip_${tipKey}`)
    if (!dismissed) setVisible(true)
  }, [tipKey])

  function dismiss() {
    localStorage.setItem(`saku_tip_${tipKey}`, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
      <p className="flex-1 leading-relaxed">{message}</p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="Tutup tips"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
