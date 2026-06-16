import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import {
  ChevronDown,
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
        className="group relative min-h-0 flex-1 select-none overflow-hidden rounded-2xl bg-espresso shadow-inner-warm"
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
            onIndexChange={setIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fullscreen lightbox — vertical "tossed scrapbook" scroll.           */
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(index)
  const [showHint, setShowHint] = useState(count > 1)

  // Stable, slightly-random resting tilt per photo (recomputed only if count
  // changes) — the "tossed on a table" look.
  const rests = useMemo(
    () => photos.map(() => (Math.random() * 8 - 4) + (Math.random() > 0.5 ? 1.5 : -1.5)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  )

  const scrollToIndex = useCallback((i: number, smooth = true) => {
    const root = scrollRef.current
    const el = root?.querySelector<HTMLElement>(`[data-index="${i}"]`)
    el?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }, [])

  // Jump to the photo the user tapped, on open (instant).
  useEffect(() => {
    scrollToIndex(index, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track the centred photo with an IntersectionObserver (fires on snap, not
  // per frame) — drives the dots, counter, and hint without onScroll state.
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const i = Number((e.target as HTMLElement).dataset.index)
            setActive(i)
            onIndexChange(i)
            if (i !== 0) setShowHint(false)
          }
        }
      },
      { root, threshold: [0.6] },
    )
    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [count, onIndexChange])

  // Auto-retire the hint after a few seconds even if untouched.
  useEffect(() => {
    if (!showHint) return
    const id = window.setTimeout(() => setShowHint(false), 4500)
    return () => window.clearTimeout(id)
  }, [showHint])

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
  }, [onClose])

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
      <div className="z-10 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] text-cream">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-cream/70">
            {active + 1} / {count}
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

      {/* Vertical scroll-snap scrapbook */}
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none]"
      >
        {photos.map((src, i) => (
          <ScrapbookPhoto
            key={i}
            index={i}
            src={src}
            alt={`${title} — photo ${i + 1}`}
            rest={rests[i]}
            container={scrollRef}
          />
        ))}
      </div>

      {/* Scroll affordance — bouncing chevron, fades once you move */}
      <AnimatePresence>
        {showHint && count > 1 && (
          <motion.div
            key="hint"
            className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex flex-col items-center gap-1 text-cream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="rounded-full bg-cream/10 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur-sm">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-6 w-6 drop-shadow" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dots — click to jump */}
      {count > 1 && (
        <div className="z-10 flex items-center justify-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={[
                'h-2.5 rounded-full transition-all duration-300',
                i === active ? 'w-7 bg-clay' : 'w-2.5 bg-cream/40 hover:bg-cream/70',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

/** One scrapbook photo: scroll-linked tilt + scale, flat & large at centre. */
function ScrapbookPhoto({
  index,
  src,
  alt,
  rest,
  container,
}: {
  index: number
  src: string
  alt: string
  rest: number
  container: RefObject<HTMLElement>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    container,
    offset: ['start end', 'end start'],
  })
  // 0 = entering from below, 0.5 = dead centre, 1 = leaving up top.
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [rest, 0, -rest])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.88, 1.04, 0.88])

  return (
    <div
      ref={ref}
      data-index={index}
      className="flex h-full snap-center items-center justify-center p-6"
    >
      <motion.div
        style={{ rotate, scale }}
        className="flex h-full w-full transform-gpu items-center justify-center will-change-transform"
      >
        <LightboxImage src={src} alt={alt} />
      </motion.div>
    </div>
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
