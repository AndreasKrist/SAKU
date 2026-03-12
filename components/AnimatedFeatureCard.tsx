'use client'

import { useEffect, useRef, useState } from 'react'

export function AnimatedFeatureCard({
  children,
  direction,
  delay = 0,
}: {
  children: React.ReactNode
  direction: 'left' | 'right'
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const translateX = direction === 'left' ? '-200px' : '200px'

  return (
    <div
      ref={ref}
      style={{
        transform: isVisible
          ? 'translateX(0) scale(1) rotate(0deg)'
          : `translateX(${translateX}) scale(0.8) rotate(${direction === 'left' ? '-5' : '5'}deg)`,
        opacity: isVisible ? 1 : 0,
        transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, opacity 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
