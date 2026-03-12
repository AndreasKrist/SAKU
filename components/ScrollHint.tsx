'use client'

import { useEffect } from 'react'

export function ScrollHint() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 60, behavior: 'smooth' })
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  return null
}
