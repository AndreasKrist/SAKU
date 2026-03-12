'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export function VantaBackground({ children }: { children?: React.ReactNode }) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const [threeLoaded, setThreeLoaded] = useState(false)
  const [vantaLoaded, setVantaLoaded] = useState(false)

  // Check if scripts are already loaded on mount (client-side navigation back)
  useEffect(() => {
    const W = window as any
    if (W.THREE) setThreeLoaded(true)
    if (W.VANTA?.WAVES) setVantaLoaded(true)
  }, [])

  useEffect(() => {
    if (!threeLoaded || !vantaLoaded || !vantaRef.current) return

    // Destroy previous if exists
    if (vantaEffect.current) {
      vantaEffect.current.destroy()
      vantaEffect.current = null
    }

    const W = window as any
    if (!W.VANTA?.WAVES) return

    try {
      vantaEffect.current = W.VANTA.WAVES({
        el: vantaRef.current,
        THREE: W.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x644A40,
        shininess: 56.0,
        waveHeight: 40.0,
        waveSpeed: 0.85,
        zoom: 0.65,
      })
    } catch (e) {
      console.error('Vanta init error:', e)
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [threeLoaded, vantaLoaded])

  return (
    <>
      <Script
        src="/three.r134.min.js"
        strategy="afterInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      {threeLoaded && (
        <Script
          src="/vanta.waves.min.js"
          strategy="afterInteractive"
          onLoad={() => setVantaLoaded(true)}
        />
      )}
      <div ref={vantaRef} className="relative overflow-hidden" style={{ backgroundColor: '#644A40' }}>
        <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />
        {children}
      </div>
    </>
  )
}
