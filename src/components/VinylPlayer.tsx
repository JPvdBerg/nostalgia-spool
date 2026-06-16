import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { Pause, Play, Disc3, Music2, Loader2 } from 'lucide-react'
import type { Track } from '../types'

interface VinylPlayerProps {
  track: Track | null
  isPlaying: boolean
  isLoading?: boolean
  /** Whether playback can be started at all (there is at least one track). */
  canPlay?: boolean
  currentTime?: number
  duration?: number
  onSeek?: (time: number) => void
  onToggle: () => void
  /** Tonearm dragged onto the record. */
  onEngage?: () => void
  /** Tonearm lifted off the record. */
  onDisengage?: () => void
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
  currentTime = 0,
  duration = 0,
  onSeek,
  onToggle,
  onEngage,
  onDisengage,
}: VinylPlayerProps) {
  return (
    <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
      {/* Turntable plinth */}
      <div className="relative w-full max-w-[17rem] rounded-[2rem] border border-cocoa/15 bg-gradient-to-br from-sand to-beige-dark p-6 shadow-card sm:max-w-sm sm:p-8 lg:max-w-[17rem] xl:max-w-[19rem]">
        {/* Soft warm glow that intensifies while playing — pure opacity, cheap */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_45%,rgba(194,84,43,0.30),transparent_70%)] blur-xl transition-opacity duration-700"
          style={{ opacity: isPlaying ? 1 : 0 }}
        />

        {/* Tonearm — draggable: drop it on the record to play, lift it off to pause */}
        <Tonearm
          isPlaying={isPlaying}
          canPlay={canPlay}
          onEngage={onEngage}
          onDisengage={onDisengage}
        />

        {/* The record itself */}
        <div className="relative mx-auto aspect-square w-full">
          {/* Spindle shadow / platter base */}
          <div className="absolute inset-0 rounded-full bg-espresso/25 blur-md" />

          {/*
            Rotation is a pure CSS animation on its own compositor layer
            (transform-gpu + will-change). The browser paints the record once
            and just spins the cached texture, so it stays smooth even with the
            gradients/shadows. `animation-play-state: paused` freezes it exactly
            where it is — no snap back to 0deg. The centre label/cover art lives
            inside this element, so it spins with the record.
          */}
          <div
            className="transform-gpu will-change-transform relative h-full w-full animate-[spin_3.5s_linear_infinite] rounded-full bg-[radial-gradient(circle_at_center,#3a2a1d_0%,#140c04_55%,#241809_100%)] shadow-soft-lg"
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

            {/* Subtle sheen so the vinyl reads as glossy while spinning */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.12)_35deg,transparent_90deg,transparent_260deg,rgba(255,255,255,0.07)_310deg,transparent_360deg)]" />

            {/* Centre label / cover art */}
            <div className="absolute left-1/2 top-1/2 aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-cream/80 bg-beige-dark shadow-inner-warm">
              {track ? (
                <CoverArt key={track.id} src={track.coverArt} title={track.title} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cocoa/70">
                  <Music2 className="h-1/3 w-1/3" strokeWidth={1.5} />
                </div>
              )}
              {/* Spindle hole */}
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream shadow-inner-warm" />
            </div>
          </div>

          {/*
            Fixed specular glint — sits OUTSIDE the spinning layer so the light
            stays put while the record turns beneath it. This sells the spin
            (grooves/label sweep past a stationary highlight) and adds depth.
          */}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.22),transparent_42%)]" />
          <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]" />
        </div>
      </div>

      {/* Now-playing info + transport control */}
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
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
              Press play to start, or pick a memory
            </p>
          )}
        </div>

        <div className="relative flex items-center justify-center">
          {/* Soft pulsing ring while playing — transform/opacity only (cheap) */}
          {isPlaying && (
            <motion.span
              className="pointer-events-none absolute h-16 w-16 rounded-full bg-clay/30"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
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

        {/* Seek bar — only meaningful once a track is loaded */}
        {track && onSeek && (
          <div className="w-full px-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={!duration}
              aria-label="Seek"
              className="h-1.5 w-full cursor-pointer touch-manipulation appearance-none rounded-full bg-cocoa/25 accent-clay"
            />
            <div className="mt-1.5 flex justify-between text-xs tabular-nums text-cocoa">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
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

/** Resting angle when off the record, and engaged angle resting on it. */
const ARM_OFF = -6
const ARM_ON = 28
const ARM_MID = (ARM_OFF + ARM_ON) / 2
const SPRING = { type: 'spring' as const, stiffness: 130, damping: 15 }

/**
 * A draggable tonearm pinned at its pivot. Grabbing it rotates the arm *around
 * that pivot* (the centre of the pivot disc), clamped to the arc between
 * ARM_OFF (lifted) and ARM_ON (resting on the record). Release past the midpoint
 * engages playback; release before it disengages. When idle it gives a gentle
 * periodic nudge to hint that it can be grabbed.
 */
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
  const rotation = useMotionValue(isPlaying ? ARM_ON : ARM_OFF)
  const animRef = useRef<ReturnType<typeof animate> | null>(null)
  const interacting = useRef(false)
  const pivot = useRef({ x: 0, y: 0 })
  const startAngle = useRef(0)
  const startRot = useRef(0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runAnim = (to: number | number[], opts: any) => {
    animRef.current?.stop()
    animRef.current = animate(rotation, to, opts)
    return animRef.current
  }

  // Keep the arm in sync with playback when the user isn't holding it.
  useEffect(() => {
    if (interacting.current) return
    runAnim(isPlaying ? ARM_ON : ARM_OFF, SPRING)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  // Idle nudge — a small periodic wiggle while paused to signal interactivity.
  useEffect(() => {
    if (isPlaying) return
    const id = window.setInterval(() => {
      if (interacting.current) return
      runAnim([ARM_OFF, ARM_OFF + 6, ARM_OFF], { duration: 0.9, ease: 'easeInOut' })
    }, 3200)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  // The pivot disc centre sits at ~80% across / ~12% down the arm box.
  const angleTo = (clientX: number, clientY: number) =>
    (Math.atan2(clientY - pivot.current.y, clientX - pivot.current.x) * 180) / Math.PI

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = boxRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    pivot.current = { x: rect.left + rect.width * 0.8, y: rect.top + rect.height * 0.12 }
    animRef.current?.stop()
    interacting.current = true
    startAngle.current = angleTo(e.clientX, e.clientY)
    startRot.current = rotation.get()
    el.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interacting.current) return
    const delta = angleTo(e.clientX, e.clientY) - startAngle.current
    const next = Math.max(ARM_OFF, Math.min(ARM_ON, startRot.current + delta))
    rotation.set(next)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!interacting.current) return
    interacting.current = false
    boxRef.current?.releasePointerCapture?.(e.pointerId)
    const engaged = rotation.get() >= ARM_MID
    runAnim(engaged ? ARM_ON : ARM_OFF, SPRING)
    if (engaged && !isPlaying && canPlay) onEngage?.()
    else if (!engaged && isPlaying) onDisengage?.()
  }

  return (
    <div
      ref={boxRef}
      className="absolute -right-2 -top-4 z-20 sm:-right-3"
      style={{ width: '38%' }}
    >
      <motion.div
        className="cursor-grab touch-none drop-shadow active:cursor-grabbing"
        style={{ rotate: rotation, transformOrigin: '80% 12%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg viewBox="0 0 120 200" className="h-auto w-full">
          {/* Pivot base */}
          <circle cx="96" cy="24" r="16" fill="#A23F1C" />
          <circle cx="96" cy="24" r="7" fill="#F6EAD2" />
          {/* Arm */}
          <rect
            x="90"
            y="22"
            width="8"
            height="150"
            rx="4"
            fill="#5A3C22"
            transform="rotate(18 96 24)"
          />
          {/* Headshell */}
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
