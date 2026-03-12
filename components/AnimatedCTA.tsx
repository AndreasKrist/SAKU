'use client'

import { useEffect, useRef, useState } from 'react'

export function AnimatedCTA({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        transform: isVisible ? 'scaleX(1) scaleY(1)' : 'scaleX(0.05) scaleY(0.3)',
        opacity: isVisible ? 1 : 0.6,
        transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
      }}
    >
      {children}
    </div>
  )
}
