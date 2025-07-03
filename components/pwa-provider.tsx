"use client"

import * as React from "react"

export function PWAProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration)
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError)
          })
      })
    }

    // Handle app updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload()
      })
    }

    // Prevent default touch behaviors on iOS
    document.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length > 1) {
          e.preventDefault()
        }
      },
      { passive: false },
    )

    let lastTouchEnd = 0
    document.addEventListener(
      "touchend",
      (e) => {
        const now = new Date().getTime()
        if (now - lastTouchEnd <= 300) {
          e.preventDefault()
        }
        lastTouchEnd = now
      },
      false,
    )

    // Prevent context menu on long press
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault()
    })

    // Handle viewport changes
    const handleViewportChange = () => {
      const viewport = document.querySelector("meta[name=viewport]")
      if (viewport) {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
        )
      }
    }

    handleViewportChange()
    window.addEventListener("orientationchange", handleViewportChange)

    return () => {
      window.removeEventListener("orientationchange", handleViewportChange)
    }
  }, [])

  return <>{children}</>
}
