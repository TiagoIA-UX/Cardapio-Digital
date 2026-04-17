'use client'

import { useEffect } from 'react'

export function HomeHeroAnimation() {
  useEffect(() => {
    const track = document.querySelector('.hero-track') as HTMLElement | null
    const frames = document.querySelectorAll('.hero-frame')
    if (!track || !frames.length) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let currentFrame = 0
    const totalFrames = frames.length
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let startTimeoutId: ReturnType<typeof setTimeout> | null = null
    let idleId: number | null = null

    const frameTimings = [2500, 2500, 3500, 2500, 2500, 4000]

    const showFrame = (frameIndex: number) => {
      track.style.transform = `translateX(-${frameIndex * 100}%)`
    }

    const nextFrame = () => {
      showFrame(currentFrame)
      const delay = frameTimings[currentFrame] || 2000
      currentFrame = (currentFrame + 1) % totalFrames
      timeoutId = setTimeout(nextFrame, delay)
    }

    showFrame(0)
    const scheduleStart = () => {
      timeoutId = setTimeout(nextFrame, frameTimings[0])
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(
        () => {
          scheduleStart()
        },
        { timeout: 1500 }
      )
    } else {
      startTimeoutId = setTimeout(() => {
        scheduleStart()
      }, 1200)
    }

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (startTimeoutId) clearTimeout(startTimeoutId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return null
}
