import { useCallback, useEffect, useState } from 'react'
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

interface PhotoCarouselProps {
  track: Track
  onBackToPlaylist: () => void
  /** Go to the previous track. Omitted when this is the first track. */
  onPrevTrack?: () => void
  /** Title of the previous track, shown on the button. */
  prevTrackTitle?: string
  /** Advance to the next track. Omitted when this is the last track. */
  onNextTrack?: () => void
  /** Title of the next track, shown on the button. */
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

  // Reset whenever the track changes.
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

  // Auto-advance while a memory plays; stops at the last photo (no jarring
  // rewind), and pauses while the user interacts or the lightbox is open.
  useEffect(() => {
    if (photoCount <= 1 || isPaused || lightboxOpen) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1 >= photoCount ? prev : prev + 1))
    }, AUTOPLAY_INTERVAL)
    return () => window.clearInterval(timer)
  }, [photoCount, index, isPaused, lightboxOpen])

  // Arrow-key navigation for the inline carousel (desktop).
  useEffect(() => {
    if (photoCount <= 1 || lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photoCount, goTo, lightboxOpen])

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
          <Swiper
            count={photoCount}
            index={index}
            onIndexChange={setIndex}
            onTap={() => setLightboxOpen(true)}
            onInteractStart={() => setIsPaused(true)}
            onInteractEnd={() => setIsPaused(false)}
            renderSlide={(i) => (
              <Photo
                src={track.photos[i]}
                alt={`${track.title} — photo ${i + 1}`}
                cover
              />
            )}
          />
        )}

        {/* Warm vignette so any photo feels cosy */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(58,42,29,0.35)]" />

        {/* Tap-to-expand affordance */}
        {photoCount > 0 && (
          <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-brown-dark/55 px-2.5 py-1 text-xs font-medium text-cream transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
            Tap to expand
          </span>
        )}

        {/* Prev / next controls (desktop convenience) */}
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
                i === index ? 'w-7 bg-brown-dark' : 'w-2.5 bg-brown-med/50 hover:bg-brown-med',
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
              className="flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-brown-dark/10 px-4 py-3 text-sm font-semibold text-brown-dark transition-colors hover:bg-brown-dark hover:text-cream"
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
              className="flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl bg-brown-dark/10 px-4 py-3 text-sm font-semibold text-brown-dark transition-colors hover:bg-brown-dark hover:text-cream"
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
  onIndexChange: (i: number) => void
  onClose: () => void
}

function Lightbox({ photos, title, index, onIndexChange, onClose }: LightboxProps) {
  const count = photos.length
  const go = useCallback(
    (dir: number) => onIndexChange(Math.max(0, Math.min(count - 1, index + dir))),
    [count, index, onIndexChange],
  )

  // Lock body scroll + wire up Esc / arrow keys while open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, go])

  return (
    <motion.div
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
          onIndexChange={onIndexChange}
          renderSlide={(i) => (
            <div className="flex h-full items-center justify-center p-4">
              <LightboxImage src={photos[i]} alt={`${title} — photo ${i + 1}`} />
            </div>
          )}
        />

        {/* Desktop arrows */}
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
      className="pointer-events-none max-h-full max-w-full select-none rounded-xl object-contain shadow-2xl"
    />
  )
}

function Photo({ src, alt, cover }: { src: string; alt: string; cover?: boolean }) {
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
      className={[
        'pointer-events-none h-full w-full select-none',
        cover ? 'object-cover' : 'object-contain',
      ].join(' ')}
    />
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
        'absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-brown-dark shadow-soft transition-all hover:bg-cream disabled:pointer-events-none disabled:opacity-0 sm:flex',
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
