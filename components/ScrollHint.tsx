'use client'

import { useEffect, useCallback } from 'react'

export function ScrollHint() {
  const runAnimation = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 60, behavior: 'smooth' })
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }, 500)
    return timeout
  }, [])

  useEffect(() => {
    const timeout = runAnimation()

    // Replay on bfcache restore (back/forward navigation)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) runAnimation()
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [runAnimation])

  return null
}
