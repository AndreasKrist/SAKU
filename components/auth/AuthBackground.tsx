'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

export function AuthBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const [threeLoaded, setThreeLoaded] = useState(false)
  const [vantaLoaded, setVantaLoaded] = useState(false)

  useEffect(() => {
    if (!threeLoaded || !vantaLoaded || !vantaRef.current || vantaEffect.current) return

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
      <div ref={vantaRef} className="absolute inset-0 z-0" />
    </>
  )
}
