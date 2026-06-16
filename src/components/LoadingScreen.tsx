import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface LoadingScreenProps {
  onReady: () => void
  coverArt: string[]
  firstPhotos: string[]
  firstAudioSrc: string
}

/**
 * "Velvet Rope" loading screen — preloads critical first-render assets with a
 * strict 5-second timeout to prevent trapping the user on poor connections.
 * Fades out gracefully via Framer Motion.
 */
export default function LoadingScreen({
  onReady,
  coverArt,
  firstPhotos,
  firstAudioSrc,
}: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const preloadAssets = async () => {
      const imagesToLoad = [...coverArt.slice(0, 2), ...firstPhotos.slice(0, 3)]
      const imagePromises = imagesToLoad.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => resolve() // Don't fail on image 404
            img.src = src
          }),
      )

      const audioPromise = new Promise<void>((resolve) => {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.oncanplay = () => resolve()
        audio.onerror = () => resolve() // Don't fail on audio 404
        audio.src = firstAudioSrc
      })

      // Use allSettled so one failure doesn't block the whole load.
      await Promise.allSettled([...imagePromises, audioPromise])
    }

    // Preload assets, but force resolution after 5 seconds regardless.
    const loadPromise = Promise.race([
      preloadAssets(),
      new Promise<void>((resolve) =>
        setTimeout(() => resolve(), 5000),
      ),
    ])

    void loadPromise.then(() => {
      setIsVisible(false)
      // Give the fade-out animation time to complete before calling onReady.
      timeoutId = setTimeout(() => {
        onReady()
      }, 400)
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [coverArt, firstPhotos, firstAudioSrc, onReady])

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
