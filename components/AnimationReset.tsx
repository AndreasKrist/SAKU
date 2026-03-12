'use client'

import { useState, useEffect } from 'react'

export function AnimationReset({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState(0)

  useEffect(() => {
    // Re-trigger animations when page becomes visible (tab switch, back navigation)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setKey((k) => k + 1)
      }
    }

    // Re-trigger on focus (covers client-side navigation back to this page)
    const handleFocus = () => {
      setKey((k) => k + 1)
    }

    // Re-trigger on bfcache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setKey((k) => k + 1)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  return <div key={key}>{children}</div>
}
