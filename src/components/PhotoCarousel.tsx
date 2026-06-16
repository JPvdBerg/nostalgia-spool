import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Images,
  ListMusic,
  Maximize2,
  X,
} from 'lucide-react'
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const photoCount = track.photos.length

  // Reset to the first photo whenever the track changes.
  useEffect(() => {
    setIndex(0)
    setLightboxOpen(false)
  }, [track.id])

  const goTo = useCallback(
    (next: number) => {
      if (photoCount === 0) return
      setIndex((next + photoCount) % photoCount)
    },
    [photoCount],
  )

  // Auto-advance — paused while the user interacts or the lightbox is open.
  useEffect(() => {
    if (photoCount <= 1 || isPaused || lightboxOpen) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photoCount)
    }, AUTOPLAY_INTERVAL)
    return () => window.clearInterval(timer)
  }, [photoCount, index, isPaused, lightboxOpen])

  // Keyboard navigation for the inline carousel (desktop).
  useEffect(() => {
    if (photoCount <= 1 || lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photoCount, goTo, lightboxOpen])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsPaused(false)
    if (info.offset.x <= -SWIPE_THRESHOLD) goTo(index + 1)
    else if (info.offset.x >= SWIPE_THRESHOLD) goTo(index - 1)
  }

  return (
    <div className="flex h-full flex-col rounded-3xl bg-gradient-to-b from-sand to-beige-dark/60 p-5 shadow-soft sm:p-7">
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
        className="group relative flex-1 select-none overflow-hidden rounded-2xl bg-beige-dark shadow-inner-warm"
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
          <AnimatePresence initial={false}>
            <motion.div
              key={index}
              className="absolute inset-0 transform-gpu cursor-pointer will-change-transform"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              drag={photoCount > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={() => setIsPaused(true)}
              onDragEnd={handleDragEnd}
              onTap={() => setLightboxOpen(true)}
            >
              <Photo
                src={track.photos[index]}
                alt={`${track.title} — photo ${index + 1}`}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Warm vignette so any photo feels cosy */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(58,42,29,0.35)]" />

        {/* Tap-to-expand affordance */}
        {photoCount > 0 && (
          <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-brown-dark/55 px-2.5 py-1 text-xs font-medium text-cream backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
            Tap to expand
          </span>
        )}

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

      <AnimatePresence>
        {lightboxOpen && photoCount > 0 && (
          <Lightbox
            photos={track.photos}
            title={track.title}
            index={index}
            onIndexChange={setIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fullscreen lightbox — free, self-paced swiping through the photos. */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

interface LightboxProps {
  photos: string[]
  title: string
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}

function Lightbox({ photos, title, index, onIndexChange, onClose }: LightboxProps) {
  const [direction, setDirection] = useState(0)
  const count = photos.length

  const paginate = useCallback(
    (dir: number) => {
      if (count <= 1) return
      setDirection(dir)
      onIndexChange((index + dir + count) % count)
    },
    [count, index, onIndexChange],
  )

  // Lock body scroll + wire up Esc / arrow keys while open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') paginate(-1)
      if (e.key === 'ArrowRight') paginate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, paginate])

  return (
    <motion.div
      // Solid background (no backdrop-blur): blurring a fullscreen layer while
      // a large image animates over it is the #1 cause of choppy mobile swipes.
      className="fixed inset-0 z-50 flex flex-col bg-[#160f08]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] text-cream">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-cream/70">
            {index + 1} / {count}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close fullscreen"
          className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Swipeable stage */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0 flex transform-gpu touch-pan-y items-center justify-center p-4 will-change-transform"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.18 },
            }}
            drag={count > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const power = info.offset.x + info.velocity.x * 0.2
              if (power < -SWIPE_THRESHOLD) paginate(1)
              else if (power > SWIPE_THRESHOLD) paginate(-1)
            }}
          >
            <LightboxImage
              src={photos[index]}
              alt={`${title} — photo ${index + 1}`}
            />
          </motion.div>
        </AnimatePresence>

        {/* Desktop arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 sm:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20 sm:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => {
                setDirection(i > index ? 1 : -1)
                onIndexChange(i)
              }}
              className={[
                'h-2.5 rounded-full transition-all',
                i === index ? 'w-7 bg-cream' : 'w-2.5 bg-cream/40 hover:bg-cream/70',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

function LightboxImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-cream/70">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} />
        <p className="text-sm">Couldn’t load this photo.</p>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setErrored(true)}
      className="max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl"
    />
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
        'absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-cream/90 text-brown-dark shadow-soft transition-colors hover:bg-cream',
        side === 'left' ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
