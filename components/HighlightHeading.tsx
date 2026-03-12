'use client'

import { useEffect, useState, useCallback } from 'react'

const words = ['Kelola', 'Keuangan', 'Usaha', 'Bersama', 'Mitra']

export function HighlightHeading() {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [done, setDone] = useState(false)
  const [pop, setPop] = useState(false)
  const [key, setKey] = useState(0)

  const resetAndPlay = useCallback(() => {
    setActiveIndex(-1)
    setDone(false)
    setPop(false)
    setKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetAndPlay()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [resetAndPlay])

  useEffect(() => {
    const startDelay = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        setActiveIndex(i)
        i++
        if (i >= words.length) {
          clearInterval(interval)
          setTimeout(() => {
            setDone(true)
            setTimeout(() => {
              setPop(true)
            }, 300)
          }, 800)
        }
      }, 600)

      return () => clearInterval(interval)
    }, 1200)

    return () => clearTimeout(startDelay)
  }, [key])

  return (
    <h1
      className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6"
      style={{
        transform: pop ? 'scale(1)' : 'scale(0.95)',
        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {words.map((word, i) => {
        const isActive = !done && activeIndex === i
        const wasActive = !done && activeIndex > i
        const showHighlight = isActive

        return (
          <span key={i}>
            <span className="relative inline-block">
              <span
                className="absolute rounded-md"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transform: showHighlight ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: isActive ? 'left' : wasActive ? 'right' : 'left',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease',
                  opacity: showHighlight ? 1 : 0,
                  top: '0.05em',
                  bottom: '0.05em',
                  left: '-4px',
                  right: '-4px',
                }}
              />
              <span className="relative">{word}</span>
            </span>
            {i === 2 ? <br className="hidden sm:block" /> : ' '}
          </span>
        )
      })}
    </h1>
  )
}
