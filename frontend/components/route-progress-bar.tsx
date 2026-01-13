"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function RouteProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Reset and start progress on route change
    setProgress(0)
    setVisible(true)

    // Simulate YouTube-style progress: quick start, slow finish
    const timer1 = setTimeout(() => setProgress(30), 100)
    const timer2 = setTimeout(() => setProgress(60), 300)
    const timer3 = setTimeout(() => setProgress(80), 600)
    const timer4 = setTimeout(() => setProgress(95), 1200)

    // Complete after page load
    const timer5 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setVisible(false), 200)
    }, 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[1px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-white transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
