import { useEffect } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { Pause, Play, Disc3, Music2, Loader2 } from 'lucide-react'
import type { Track } from '../types'

interface VinylPlayerProps {
  track: Track | null
  isPlaying: boolean
  isLoading?: boolean
  onToggle: () => void
}

/** Seconds for one full 360° revolution of the record. */
const ROTATION_DURATION = 6

export default function VinylPlayer({
  track,
  isPlaying,
  isLoading = false,
  onToggle,
}: VinylPlayerProps) {
  // Drive the record's rotation with a motion value so that pausing freezes
  // it exactly where it is (instead of snapping back to 0deg).
  const rotation = useMotionValue(0)

  useEffect(() => {
    if (!isPlaying) return

    const from = rotation.get()
    const controls = animate(rotation, from + 360, {
      ease: 'linear',
      duration: ROTATION_DURATION,
      repeat: Infinity,
      repeatType: 'loop',
    })

    // Stopping the animation leaves `rotation` at its current angle.
    return () => controls.stop()
  }, [isPlaying, rotation])

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {/* Turntable plinth */}
      <div className="relative w-full max-w-sm rounded-[2rem] bg-sand p-6 shadow-soft-lg sm:p-8">
        {/* Tonearm — pivots in from the top-right and rests on the record while playing */}
        <Tonearm isPlaying={isPlaying} />

        {/* The record itself */}
        <div className="relative mx-auto aspect-square w-full">
          {/* Spindle shadow / platter base */}
          <div className="absolute inset-0 rounded-full bg-brown-med/20 blur-md" />

          <motion.div
            style={{ rotate: rotation }}
            className="relative h-full w-full rounded-full bg-[radial-gradient(circle_at_center,#3a2a1d_0%,#1c130c_55%,#2a1d12_100%)] shadow-soft-lg"
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
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.10)_40deg,transparent_90deg,transparent_270deg,rgba(255,255,255,0.06)_310deg,transparent_360deg)]" />

            {/* Centre label / cover art */}
            <div className="absolute left-1/2 top-1/2 aspect-square w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-cream/80 bg-beige-dark shadow-inner-warm">
              {track ? (
                <img
                  src={track.coverArt}
                  alt={`${track.title} cover art`}
                  className="h-full w-full object-cover"
                  draggable={false}
                  onError={(e) => {
                    // Graceful fallback until real cover art is dropped in.
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brown-dark/70">
                  <Music2 className="h-1/3 w-1/3" strokeWidth={1.5} />
                </div>
              )}
              {/* Spindle hole */}
              <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream shadow-inner-warm" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Now-playing info + transport control */}
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <div className="text-center">
          {track ? (
            <>
              <p className="text-xs uppercase tracking-[0.25em] text-brown-med">
                {isLoading ? 'Loading…' : `Side A · ${track.era}`}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-brown-dark">
                {track.title}
              </h2>
              <p className="text-sm text-brown-med">{track.artist}</p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-brown-med">
              <Disc3 className="h-5 w-5" />
              Pick a memory to start spinning
            </p>
          )}
        </div>

        <motion.button
          type="button"
          onClick={onToggle}
          disabled={!track || isLoading}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: track && !isLoading ? 1.05 : 1 }}
          aria-label={isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
          aria-busy={isLoading}
          className="flex h-16 w-16 touch-manipulation select-none items-center justify-center rounded-full bg-brown-dark text-cream shadow-soft transition-colors hover:bg-brown-med disabled:cursor-not-allowed disabled:bg-beige-dark disabled:text-cream/70"
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
    </div>
  )
}

/** A small, friendly tonearm that swings onto the record while playing. */
function Tonearm({ isPlaying }: { isPlaying: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute -right-2 -top-4 z-20 origin-top-right sm:-right-3"
      initial={false}
      animate={{ rotate: isPlaying ? 28 : -6 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      style={{ width: '38%' }}
    >
      <svg viewBox="0 0 120 200" className="h-auto w-full drop-shadow">
        {/* Pivot base */}
        <circle cx="96" cy="24" r="16" fill="#A87954" />
        <circle cx="96" cy="24" r="7" fill="#F6EAD2" />
        {/* Arm */}
        <rect
          x="90"
          y="22"
          width="8"
          height="150"
          rx="4"
          fill="#C2956E"
          transform="rotate(18 96 24)"
        />
        {/* Headshell */}
        <rect
          x="36"
          y="150"
          width="26"
          height="16"
          rx="5"
          fill="#A87954"
          transform="rotate(18 49 158)"
        />
      </svg>
    </motion.div>
  )
}
