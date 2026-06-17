import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  type MotionValue,
} from 'framer-motion'
import { Pause, Play, Disc3, Music2, Loader2 } from 'lucide-react'
import type { Track } from '../types'

interface VinylPlayerProps {
  track: Track | null
  isPlaying: boolean
  isLoading?: boolean
  /** Whether playback can be started at all (there is at least one track). */
  canPlay?: boolean
  /** Playback position (MotionValue — drives the scrubber without re-renders). */
  time: MotionValue<number>
  duration?: number
  onSeek?: (time: number) => void
  /** Live frequency analyser for the reactive glow. */
  analyser?: MutableRefObject<AnalyserNode | null>
  onToggle: () => void
  /** Tonearm dragged onto the record. */
  onEngage?: () => void
  /** Tonearm lifted off the record. */
  onDisengage?: () => void
  /** 3-second long-press on vinyl centre (easter egg). */
  onLongPressCentre?: () => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VinylPlayer({
  track,
  isPlaying,
  isLoading = false,
  canPlay = true,
  time,
  duration = 0,
  onSeek,
  analyser,
  onToggle,
  onEngage,
  onDisengage,
  onLongPressCentre,
}: VinylPlayerProps) {
  // The record spins via a pure CSS animation (compositor-only, no per-frame JS)
  // and freezes in place when paused via `animation-play-state`.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Long-press handler for the centre label (easter egg).
  const handleCentreLabelDown = useCallback(() => {
    if (!onLongPressCentre) return
    longPressTimer.current = setTimeout(() => {
      onLongPressCentre()
      longPressTimer.current = null
    }, 3000)
  }, [onLongPressCentre])

  const handleCentreLabelUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Audio-reactive glow: read the analyser in a rAF loop and push the intensity
  // into a CSS custom property via a ref. NO React state, NO layout thrash —
  // only `opacity`/`transform` on a composited layer change.
  const glowRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = glowRef.current
    if (!el) return
    if (!isPlaying || !analyser) {
      el.style.setProperty('--glow', '0')
      return
    }
    let raf = 0
    let data: Uint8Array<ArrayBuffer> | null = null
    const tick = () => {
      const node = analyser.current
      if (node) {
        if (!data || data.length !== node.frequencyBinCount) {
          data = new Uint8Array(new ArrayBuffer(node.frequencyBinCount))
        }
        node.getByteFrequencyData(data)
        // Average the bass/low-mid bins (first third of the spectrum).
        const bins = Math.max(1, Math.floor(data.length / 3))
        let sum = 0
        for (let i = 0; i < bins; i++) sum += data[i]
        const avg = sum / bins / 255 // 0..1
        const intensity = Math.min(1, avg * 1.45)
        el.style.setProperty('--glow', intensity.toFixed(3))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.style.setProperty('--glow', '0')
    }
  }, [isPlaying, analyser])

  return (
    <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
      {/* Turntable plinth — record size capped by viewport height on desktop */}
      <div className="relative w-full max-w-[17rem] rounded-[2rem] border border-cocoa/15 bg-gradient-to-br from-sand to-beige-dark p-6 shadow-card sm:max-w-sm sm:p-7 lg:max-w-[min(15rem,36vh)] xl:max-w-[min(18rem,40vh)]">
        {/*
          Reactive glow — opacity & scale bound to the `--glow` CSS variable that
          the rAF loop mutates. Composited transform/opacity only.
        */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_45%,rgba(194,149,110,0.85),transparent_72%)] will-change-[opacity]"
          style={{ opacity: 'calc(var(--glow, 0) * 0.8)' }}
        />

        {/* Tonearm — pinned at its pivot; drag onto the record to play, off to pause */}
        <Tonearm
          isPlaying={isPlaying}
          canPlay={canPlay}
          onEngage={onEngage}
          onDisengage={onDisengage}
        />

        {/* The record + cover (one rotating, GPU-composited element) */}
        <div className="relative mx-auto aspect-square w-full">
          <div className="absolute inset-0 rounded-full bg-espresso/25 blur-md" />

          <div
            className="relative h-full w-full rounded-full bg-[radial-gradient(circle_at_center,#3a2a1d_0%,#140c04_55%,#241809_100%)] shadow-soft-lg will-change-transform animate-spin-slow"
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          >
            {/* Concentric grooves */}
            {[0.92, 0.82, 0.72, 0.62].map((scale) => (
              <span
                key={scale}
                className="absolute left-1/2 top-1/2 rounded-full border border-white/5"
                style={{
                  width: `${scale * 100}%`,
                  height: `${scale * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {/* Subtle sheen */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.12)_35deg,transparent_90deg,transparent_260deg,rgba(255,255,255,0.07)_310deg,transparent_360deg)]" />

            {/* Centre label / cover art (child → spins with the record) */}
            <div
              className="absolute left-1/2 top-1/2 aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-cream/80 bg-beige-dark shadow-inner-warm cursor-pointer select-none"
              onPointerDown={handleCentreLabelDown}
              onPointerUp={handleCentreLabelUp}
              onPointerCancel={handleCentreLabelUp}
            >
              {track ? (
                <CoverArt key={track.id} src={track.coverArt} title={track.title} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cocoa/70">
                  <Music2 className="h-1/3 w-1/3" strokeWidth={1.5} />
                </div>
              )}
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream shadow-inner-warm" />
            </div>
          </div>

          {/* Fixed specular glint (outside the spinning layer → reads as light) */}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.22),transparent_42%)]" />
          <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]" />
        </div>
      </div>

      {/* Now-playing info + transport control */}
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <div className="text-center">
          {track ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">
                {isLoading ? 'Loading…' : `Side A · ${track.era}`}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-espresso">{track.title}</h2>
              <p className="text-sm text-cocoa">{track.artist}</p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-cocoa">
              <Disc3 className="h-5 w-5" />
              Pick a memory to start spinning
            </p>
          )}
        </div>

        {/* Play button — hidden on mobile until a track is queued */}
        <div
          className={[
            'relative items-center justify-center',
            track ? 'flex' : 'hidden sm:flex',
          ].join(' ')}
        >
          {isPlaying && (
            <motion.span
              className="pointer-events-none absolute h-16 w-16 rounded-full bg-clay/30"
              // Fade in → expand → fade out within each cycle so the loop point is
              // invisible (opacity 0 at both ends) — no abrupt snap-back pop.
              animate={{ scale: [1, 1.25, 2], opacity: [0, 0.55, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeOut',
                times: [0, 0.25, 1],
              }}
            />
          )}
          <motion.button
            type="button"
            onClick={onToggle}
            disabled={isLoading || (!track && !canPlay)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: (track || canPlay) && !isLoading ? 1.05 : 1 }}
            aria-label={isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
            aria-busy={isLoading}
            className="relative flex h-16 w-16 touch-manipulation select-none items-center justify-center rounded-full bg-clay text-cream shadow-soft transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:bg-beige-dark disabled:text-cream/70"
          >
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            )}
          </motion.button>
        </div>

        {/* Custom scrubber — only once a track is loaded */}
        {track && onSeek && <Scrubber time={time} duration={duration} onSeek={onSeek} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Scrubber — ref-driven (no per-timeupdate React state), drag-decoupled */
/* ------------------------------------------------------------------ */

function Scrubber({
  time,
  duration,
  onSeek,
}: {
  time: MotionValue<number>
  duration: number
  onSeek: (time: number) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef<HTMLSpanElement>(null)
  const durationRef = useRef(duration)
  durationRef.current = duration
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const paint = useCallback((pct: number) => {
    const p = Math.max(0, Math.min(100, pct))
    if (fillRef.current) fillRef.current.style.width = `${p}%`
    if (thumbRef.current) thumbRef.current.style.left = `${p}%`
  }, [])

  // Music position → bar, straight to the DOM. Ignored while the user drags so
  // the thumb never fights the pointer.
  useMotionValueEvent(time, 'change', (t) => {
    if (elapsedRef.current) elapsedRef.current.textContent = formatTime(t)
    if (!draggingRef.current && durationRef.current > 0) {
      paint((t / durationRef.current) * 100)
    }
  })

  const pctFromPointer = useCallback((clientX: number) => {
    const el = barRef.current
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return ((clientX - r.left) / r.width) * 100
  }, [])

  const previewAt = useCallback(
    (pct: number) => {
      paint(pct)
      if (elapsedRef.current && durationRef.current > 0) {
        elapsedRef.current.textContent = formatTime((pct / 100) * durationRef.current)
      }
    },
    [paint],
  )

  const handleDown = useCallback(
    (e: React.PointerEvent) => {
      if (durationRef.current <= 0) return
      draggingRef.current = true
      setDragging(true)
      barRef.current?.setPointerCapture(e.pointerId)
      previewAt(pctFromPointer(e.clientX))
    },
    [pctFromPointer, previewAt],
  )

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return
      previewAt(pctFromPointer(e.clientX))
    },
    [pctFromPointer, previewAt],
  )

  const handleUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      setDragging(false)
      barRef.current?.releasePointerCapture?.(e.pointerId)
      if (durationRef.current > 0) {
        onSeek((pctFromPointer(e.clientX) / 100) * durationRef.current)
      }
    },
    [onSeek, pctFromPointer],
  )

  return (
    <div className="w-full select-none px-1">
      <div
        ref={barRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        className="relative flex h-4 cursor-pointer touch-none items-center"
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cocoa/25">
          <div ref={fillRef} className="h-full rounded-full bg-clay" style={{ width: '0%' }} />
        </div>
        <div
          ref={thumbRef}
          style={{ left: '0%' }}
          className={[
            'absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-clay shadow transition-transform',
            dragging ? 'scale-125' : '',
          ].join(' ')}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-cocoa">
        <span ref={elapsedRef}>0:00</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

/** Centre cover art with a per-instance error fallback (resets per track). */
function CoverArt({ src, title }: { src: string; title: string }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div className="flex h-full w-full items-center justify-center text-cocoa/70">
        <Music2 className="h-1/3 w-1/3" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${title} cover art`}
      className="h-full w-full object-cover"
      draggable={false}
      decoding="async"
      onError={() => setErrored(true)}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Tonearm — rotational drag pinned to its pivot, smoothed with a spring */
/* ------------------------------------------------------------------ */

const ARM_OFF = -6
const ARM_ON = 28
const ARM_MID = (ARM_OFF + ARM_ON) / 2

function Tonearm({
  isPlaying,
  canPlay = true,
  onEngage,
  onDisengage,
}: {
  isPlaying: boolean
  canPlay?: boolean
  onEngage?: () => void
  onDisengage?: () => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const target = useMotionValue(isPlaying ? ARM_ON : ARM_OFF)
  const rotation = useSpring(target, { stiffness: 240, damping: 26, mass: 0.5 })

  const interacting = useRef(false)
  const pivot = useRef({ x: 0, y: 0 })
  const startAngle = useRef(0)
  const startRot = useRef(0)

  const computePivot = useCallback(() => {
    const el = boxRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    pivot.current = { x: r.left + r.width * 0.8, y: r.top + r.height * 0.12 }
  }, [])

  // Pivot is re-measured at the start of every drag (handlePointerDown), so we
  // only need an initial measure here. No scroll listener — calling
  // getBoundingClientRect on every scroll tick forces a synchronous layout and
  // is a real mobile scroll-jank source.
  useEffect(() => {
    computePivot()
  }, [computePivot])

  useEffect(() => {
    if (interacting.current) return
    target.set(isPlaying ? ARM_ON : ARM_OFF)
  }, [isPlaying, target])

  useEffect(() => {
    if (isPlaying) return
    const id = window.setInterval(() => {
      if (interacting.current) return
      target.set(ARM_OFF + 7)
      window.setTimeout(() => {
        if (!interacting.current) target.set(ARM_OFF)
      }, 420)
    }, 3200)
    return () => window.clearInterval(id)
  }, [isPlaying, target])

  const angleTo = useCallback(
    (x: number, y: number) =>
      (Math.atan2(y - pivot.current.y, x - pivot.current.x) * 180) / Math.PI,
    [],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      computePivot()
      interacting.current = true
      startAngle.current = angleTo(e.clientX, e.clientY)
      startRot.current = target.get()
      boxRef.current?.setPointerCapture(e.pointerId)
    },
    [angleTo, computePivot, target],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!interacting.current) return
      const delta = angleTo(e.clientX, e.clientY) - startAngle.current
      const next = Math.min(ARM_ON, Math.max(ARM_OFF, startRot.current + delta))
      target.set(next)
    },
    [angleTo, target],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!interacting.current) return
      interacting.current = false
      boxRef.current?.releasePointerCapture?.(e.pointerId)
      const engaged = target.get() >= ARM_MID
      target.set(engaged ? ARM_ON : ARM_OFF)
      if (engaged && !isPlaying && canPlay) onEngage?.()
      else if (!engaged && isPlaying) onDisengage?.()
    },
    [target, isPlaying, canPlay, onEngage, onDisengage],
  )

  return (
    <div
      ref={boxRef}
      className="absolute -right-2 -top-4 z-20 select-none sm:-right-3"
      style={{ width: '38%' }}
    >
      <motion.div
        className="transform-gpu cursor-grab touch-none select-none drop-shadow will-change-transform active:cursor-grabbing"
        style={{ rotate: rotation, transformOrigin: '80% 12%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg viewBox="0 0 120 200" className="h-auto w-full">
          <circle cx="96" cy="24" r="16" fill="#A23F1C" />
          <circle cx="96" cy="24" r="7" fill="#F6EAD2" />
          <rect
            x="90"
            y="22"
            width="8"
            height="150"
            rx="4"
            fill="#5A3C22"
            transform="rotate(18 96 24)"
          />
          <rect
            x="36"
            y="150"
            width="26"
            height="16"
            rx="5"
            fill="#34210F"
            transform="rotate(18 49 158)"
          />
        </svg>
      </motion.div>
    </div>
  )
}
