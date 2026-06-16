import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Images,
  ListMusic,
  Maximize2,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react'
import type { Track } from '../types'
import Swiper from './Swiper'
import { useMediaQuery } from '../hooks/useMediaQuery'

interface PhotoCarouselProps {
  track: Track
  onBackToPlaylist: () => void
  onPrevTrack?: () => void
  prevTrackTitle?: string
  onNextTrack?: () => void
  nextTrackTitle?: string
}

/** Milliseconds each photo stays on screen before auto-advancing. */
const AUTOPLAY_INTERVAL = 4000

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n))

export default function PhotoCarousel({
  track,
  onBackToPlaylist,
  onPrevTrack,
  prevTrackTitle,
  onNextTrack,
  nextTrackTitle,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const photoCount = track.photos.length

  // Inline carousel is always horizontal so the page can still scroll
  // vertically on mobile. The fullscreen lightbox swipes vertically on phones.
  const isMobile = useMediaQuery('(max-width: 640px)')
  const lightboxAxis = isMobile ? 'y' : 'x'

  useEffect(() => {
    setIndex(0)
    setLightboxOpen(false)
  }, [track.id])

  const goTo = useCallback(
    (next: number) => {
      if (photoCount === 0) return
      setIndex(clamp(next, photoCount - 1))
    },
    [photoCount],
  )

  // Auto-advance while a memory plays — loops back to the first photo, and
  // pauses while the user interacts or the lightbox is open.
  useEffect(() => {
    if (photoCount <= 1 || isPaused || lightboxOpen) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photoCount)
    }, AUTOPLAY_INTERVAL)
    return () => window.clearInterval(timer)
  }, [photoCount, index, isPaused, lightboxOpen])

  // Preload the neighbouring photos so a swipe never reveals a blank frame.
  useEffect(() => {
    const preload = (i: number) => {
      if (i >= 0 && i < photoCount) {
        const img = new Image()
        img.src = track.photos[i]
      }
    }
    preload(index + 1)
    preload(index - 1)
  }, [index, photoCount, track.photos])

  // Arrow-key navigation for the inline carousel (desktop).
  useEffect(() => {
    if (photoCount <= 1 || lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(index - 1)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photoCount, goTo, lightboxOpen])

  return (
    <div className="flex h-full flex-col rounded-3xl border border-cocoa/15 bg-gradient-to-b from-sand to-beige-dark/70 p-5 shadow-card sm:p-7">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">
            Now Playing · {track.era}
          </p>
          <h2 className="truncate text-xl font-semibold text-espresso">{track.title}</h2>
        </div>
        <motion.button
          type="button"
          onClick={onBackToPlaylist}
          whileTap={{ scale: 0.95 }}
          className="flex shrink-0 touch-manipulation items-center gap-2 rounded-full bg-espresso px-3.5 py-2 text-sm font-semibold text-cream shadow-soft transition-colors hover:bg-cocoa"
        >
          <ListMusic className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Playlist</span>
          <span className="sm:hidden">Playlist</span>
        </motion.button>
      </header>

      {/* Stage */}
      <div
        className="group relative flex-1 select-none overflow-hidden rounded-2xl bg-espresso shadow-inner-warm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {photoCount === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-cream/70">
            <Images className="h-10 w-10" strokeWidth={1.5} />
            <p className="px-6 text-center text-sm">
              No photos for this memory yet — add some to{' '}
              <code className="font-mono">src/data.ts</code>.
            </p>
          </div>
        ) : (
          <Swiper
            count={photoCount}
            index={index}
            axis="x"
            onIndexChange={setIndex}
            onTap={() => setLightboxOpen(true)}
            onInteractStart={() => setIsPaused(true)}
            onInteractEnd={() => setIsPaused(false)}
            renderSlide={(i) => (
              <Photo src={track.photos[i]} alt={`${track.title} — photo ${i + 1}`} cover />
            )}
          />
        )}

        {/* Warm vignette so any photo feels cosy */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(20,12,4,0.45)]" />

        {/* Expand affordance */}
        {photoCount > 0 && (
          <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-espresso/70 px-2.5 py-1 text-xs font-medium text-cream transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
            Tap to expand
          </span>
        )}

        {/* Desktop prev/next (vertical swipe handles mobile) */}
        {photoCount > 1 && (
          <>
            <CarouselArrow side="left" disabled={index === 0} onClick={() => goTo(index - 1)} />
            <CarouselArrow
              side="right"
              disabled={index === photoCount - 1}
              onClick={() => goTo(index + 1)}
            />
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
                'h-2.5 rounded-full transition-all duration-300',
                i === index ? 'w-7 bg-clay' : 'w-2.5 bg-cocoa/30 hover:bg-cocoa/60',
              ].join(' ')}
            />
          ))}
        </div>
      )}

      {/* Prev / next track — each hidden at the ends of the playlist */}
      {(onPrevTrack || onNextTrack) && (
        <div className="mt-4 flex items-stretch gap-3">
          {onPrevTrack && (
            <motion.button
              type="button"
              onClick={onPrevTrack}
              whileTap={{ scale: 0.97 }}
              className="flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-cocoa/15 bg-cream/60 px-4 py-3 text-sm font-semibold text-espresso transition-colors hover:bg-clay hover:text-cream"
            >
              <SkipBack className="h-4 w-4 shrink-0" />
              <span className="truncate">
                <span className="opacity-60">Prev</span>
                {prevTrackTitle ? ` · ${prevTrackTitle}` : ''}
              </span>
            </motion.button>
          )}
          {onNextTrack && (
            <motion.button
              type="button"
              onClick={onNextTrack}
              whileTap={{ scale: 0.97 }}
              className="flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-cocoa/15 bg-cream/60 px-4 py-3 text-sm font-semibold text-espresso transition-colors hover:bg-clay hover:text-cream"
            >
              <span className="truncate">
                <span className="opacity-60">Next</span>
                {nextTrackTitle ? ` · ${nextTrackTitle}` : ''}
              </span>
              <SkipForward className="h-4 w-4 shrink-0" />
            </motion.button>
          )}
        </div>
      )}

      <AnimatePresence>
        {lightboxOpen && photoCount > 0 && (
          <Lightbox
            photos={track.photos}
            title={track.title}
            index={index}
            axis={lightboxAxis}
            onIndexChange={setIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fullscreen lightbox — self-paced, Instagram-style swiping.          */
/* ------------------------------------------------------------------ */

interface LightboxProps {
  photos: string[]
  title: string
  index: number
  axis: 'x' | 'y'
  onIndexChange: (i: number) => void
  onClose: () => void
}

function Lightbox({ photos, title, index, axis, onIndexChange, onClose }: LightboxProps) {
  const count = photos.length
  const dialogRef = useRef<HTMLDivElement>(null)
  const go = useCallback(
    (dir: number) => onIndexChange(Math.max(0, Math.min(count - 1, index + dir))),
    [count, index, onIndexChange],
  )

  // Lock scroll, manage focus (trap Tab), and wire Esc / arrow keys.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null

    const getFocusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
    getFocusable()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return go(-1)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return go(1)
      if (e.key === 'Tab') {
        const items = getFocusable()
        if (items.length === 0) return
        const i = items.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          items[items.length - 1].focus()
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault()
          items[0].focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [onClose, go])

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      className="fixed inset-0 z-50 flex flex-col bg-[#160f08]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
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
        <Swiper
          count={count}
          index={index}
          axis={axis}
          onIndexChange={onIndexChange}
          renderSlide={(i) => (
            <div className="flex h-full items-center justify-center p-4">
              <LightboxImage src={photos[i]} alt={`${title} — photo ${i + 1}`} />
            </div>
          )}
        />

        {/* Desktop arrows (mobile uses vertical swipe) */}
        {count > 1 && (
          <>
            <LightboxArrow side="left" disabled={index === 0} onClick={() => go(-1)} />
            <LightboxArrow side="right" disabled={index === count - 1} onClick={() => go(1)} />
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
              onClick={() => onIndexChange(i)}
              className={[
                'h-2.5 rounded-full transition-all duration-300',
                i === index ? 'w-7 bg-clay' : 'w-2.5 bg-cream/40 hover:bg-cream/70',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Image helpers                                                       */
/* ------------------------------------------------------------------ */

function Shimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-cocoa/40">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-cream/15 to-transparent" />
    </div>
  )
}

function LightboxImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-cream/70">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} />
        <p className="text-sm">Couldn’t load this photo.</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {state === 'loading' && <Shimmer />}
      <img
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className="pointer-events-none relative max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl"
      />
    </div>
  )
}

function Photo({ src, alt, cover }: { src: string; alt: string; cover?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  if (state === 'error') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-cocoa/40 text-cream/70">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} />
        <p className="px-6 text-center text-sm">
          Drop a photo at <code className="font-mono">{src}</code>
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {state === 'loading' && <Shimmer />}
      <img
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={[
          'pointer-events-none relative h-full w-full select-none',
          cover ? 'object-cover' : 'object-contain',
        ].join(' ')}
      />
    </div>
  )
}

function CarouselArrow({
  side,
  onClick,
  disabled,
}: {
  side: 'left' | 'right'
  onClick: () => void
  disabled?: boolean
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={[
        'absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-espresso shadow-soft transition-all hover:bg-cream disabled:pointer-events-none disabled:opacity-0 sm:flex',
        side === 'left' ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function LightboxArrow({
  side,
  onClick,
  disabled,
}: {
  side: 'left' | 'right'
  onClick: () => void
  disabled?: boolean
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={[
        'absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 text-cream transition-all hover:bg-cream/20 disabled:pointer-events-none disabled:opacity-0 sm:flex',
        side === 'left' ? 'left-3' : 'right-3',
      ].join(' ')}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}
