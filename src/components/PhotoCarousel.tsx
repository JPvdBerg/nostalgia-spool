import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, ImageOff, Images, ListMusic } from 'lucide-react'
import type { Track } from '../types'

interface PhotoCarouselProps {
  track: Track
  onBackToPlaylist: () => void
}

/** Milliseconds each photo stays on screen before auto-advancing. */
const AUTOPLAY_INTERVAL = 4000
/** Horizontal drag distance (px) needed to count as a swipe. */
const SWIPE_THRESHOLD = 60

export default function PhotoCarousel({ track, onBackToPlaylist }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const photoCount = track.photos.length

  // Reset to the first photo whenever the track changes.
  useEffect(() => {
    setIndex(0)
  }, [track.id])

  const goTo = useCallback(
    (next: number) => {
      if (photoCount === 0) return
      setIndex((next + photoCount) % photoCount)
    },
    [photoCount],
  )

  // Auto-advance with a soft cross-fade — paused while the user interacts.
  useEffect(() => {
    if (photoCount <= 1 || isPaused) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photoCount)
    }, AUTOPLAY_INTERVAL)
    return () => window.clearInterval(timer)
  }, [photoCount, index, isPaused])

  // Keyboard navigation for desktop accessibility.
  useEffect(() => {
    if (photoCount <= 1) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photoCount, goTo])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsPaused(false)
    if (info.offset.x <= -SWIPE_THRESHOLD) goTo(index + 1)
    else if (info.offset.x >= SWIPE_THRESHOLD) goTo(index - 1)
  }

  return (
    <div className="flex h-full flex-col rounded-3xl bg-sand p-5 shadow-soft sm:p-7">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-brown-med">
            Now Playing · {track.era}
          </p>
          <h2 className="truncate text-xl font-semibold text-brown-dark">
            {track.title}
          </h2>
        </div>
        <motion.button
          type="button"
          onClick={onBackToPlaylist}
          whileTap={{ scale: 0.95 }}
          className="flex shrink-0 touch-manipulation items-center gap-2 rounded-full bg-brown-dark px-3.5 py-2 text-sm font-semibold text-cream shadow-soft transition-colors hover:bg-brown-med"
        >
          <ListMusic className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Playlist</span>
          <span className="sm:hidden">Playlist</span>
        </motion.button>
      </header>

      {/* Stage */}
      <div
        className="relative flex-1 select-none overflow-hidden rounded-2xl bg-beige-dark shadow-inner-warm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {photoCount === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brown-dark/70">
            <Images className="h-10 w-10" strokeWidth={1.5} />
            <p className="px-6 text-center text-sm">
              No photos for this memory yet — add some to{' '}
              <code className="font-mono">src/data.ts</code>.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              drag={photoCount > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={() => setIsPaused(true)}
              onDragEnd={handleDragEnd}
            >
              <Photo src={track.photos[index]} alt={`${track.title} — photo ${index + 1}`} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Warm vignette so any photo feels cosy */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(58,42,29,0.35)]" />

        {/* Prev / next controls */}
        {photoCount > 1 && (
          <>
            <CarouselArrow side="left" onClick={() => goTo(index - 1)} />
            <CarouselArrow side="right" onClick={() => goTo(index + 1)} />
          </>
        )}
      </div>

      {/* Dots */}
      {photoCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {track.photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={[
                'h-2.5 rounded-full transition-all',
                i === index ? 'w-7 bg-brown-dark' : 'w-2.5 bg-brown-med/50 hover:bg-brown-med',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Photo({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-beige-dark text-brown-dark/70">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} />
        <p className="px-6 text-center text-sm">
          Drop a photo at <code className="font-mono">{src}</code>
        </p>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setErrored(true)}
      className="h-full w-full object-cover"
    />
  )
}

function CarouselArrow({
  side,
  onClick,
}: {
  side: 'left' | 'right'
  onClick: () => void
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={[
        'absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-cream/85 text-brown-dark shadow-soft backdrop-blur transition-colors hover:bg-cream',
        side === 'left' ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
