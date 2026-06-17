import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface LoadingScreenProps {
  onReady: () => void
  /** Every image used anywhere in the app (covers + all photos). */
  images: string[]
  /** First track's audio, warmed so playback starts instantly. */
  firstAudioSrc: string
}

/**
 * Persistent, in-memory cache of decoded images. Holding the HTMLImageElement
 * references at module scope keeps them alive for the whole session, so the
 * browser keeps both the decoded bitmap and its HTTP-cache entry — every later
 * `<img src>` with the same URL renders instantly, with no re-fetch or flash.
 *
 * (We intentionally do NOT use localStorage here: it caps at ~5 MB, only stores
 * strings — forcing wasteful base64 — and its synchronous reads/writes would
 * jank the main thread, which is exactly what we're trying to avoid. The
 * browser's own image cache, kept warm by this preload, is the right tool.)
 */
const imageCache = new Map<string, HTMLImageElement>()

function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      imageCache.set(src, img)
      resolve()
    }
    img.onerror = () => resolve() // a 404 shouldn't block the whole app
    img.src = src
  })
}

/**
 * "Velvet Rope" loading screen. Preloads EVERY image and waits for all of them
 * before revealing the app, so the experience is flash-free once it opens. A
 * generous hard cap guarantees we never trap the user if a request stalls on a
 * flaky connection. Fades out gracefully via Framer Motion.
 */
const MAX_WAIT_MS = 15000

export default function LoadingScreen({ onReady, images, firstAudioSrc }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let revealTimer: ReturnType<typeof setTimeout> | null = null
    let settled = false

    const reveal = () => {
      if (settled) return
      settled = true
      setIsVisible(false)
      // Let the fade-out finish before handing control to the app.
      revealTimer = setTimeout(onReady, 400)
    }

    // Wait for every image. `allSettled` means a 404 resolves rather than hangs.
    const imagePromises = images.map(preloadImage)

    const audioPromise = new Promise<void>((resolve) => {
      if (!firstAudioSrc) return resolve()
      const audio = new Audio()
      audio.preload = 'auto'
      audio.oncanplay = () => resolve()
      audio.onerror = () => resolve()
      audio.src = firstAudioSrc
    })

    void Promise.allSettled([...imagePromises, audioPromise]).then(reveal)

    // Safety net: a single stalled request can never brick the page.
    const cap = setTimeout(reveal, MAX_WAIT_MS)

    return () => {
      clearTimeout(cap)
      if (revealTimer) clearTimeout(revealTimer)
    }
  }, [images, firstAudioSrc, onReady])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-cream via-cream to-beige-dark/70"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Warm, minimalist pulsing element */}
            <motion.div
              className="h-12 w-12 rounded-full bg-gradient-to-br from-clay to-clay-dark shadow-soft"
              animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="text-sm font-medium text-cocoa">Spinning up…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
