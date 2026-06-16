import { motion } from 'framer-motion'
import { Disc3, Play } from 'lucide-react'
import type { Track } from '../types'

interface TrackListProps {
  tracks: Track[]
  activeTrackId: string | null
  onSelect: (track: Track) => void
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function TrackList({ tracks, activeTrackId, onSelect }: TrackListProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-sand p-5 shadow-soft sm:p-7">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brown-dark text-cream">
          <Disc3 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-brown-dark">The Tracklist</h2>
          <p className="text-sm text-brown-med">Tap a memory to drop the needle</p>
        </div>
      </header>

      <motion.ul
        variants={container}
        initial="hidden"
        animate="show"
        className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2"
      >
        {tracks.map((track, index) => {
          const isActive = track.id === activeTrackId
          return (
            <motion.li key={track.id} variants={item}>
              <button
                type="button"
                onClick={() => onSelect(track)}
                aria-pressed={isActive}
                className={[
                  'group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors',
                  isActive
                    ? 'bg-brown-dark text-cream shadow-soft'
                    : 'bg-cream/70 text-brown-dark hover:bg-beige-dark',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isActive
                      ? 'bg-cream text-brown-dark'
                      : 'bg-beige-dark text-brown-dark group-hover:bg-cream',
                  ].join(' ')}
                >
                  {isActive ? (
                    <EqualizerBars />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{track.title}</span>
                  <span
                    className={[
                      'block truncate text-sm',
                      isActive ? 'text-cream/80' : 'text-brown-med',
                    ].join(' ')}
                  >
                    {track.artist} · {track.era}
                  </span>
                </span>

                <Play
                  className={[
                    'h-5 w-5 shrink-0 transition-opacity',
                    isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
                  ].join(' ')}
                  fill="currentColor"
                />
              </button>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}

/** Tiny animated equalizer shown on the active track. */
function EqualizerBars() {
  const bars = [0, 1, 2]
  return (
    <span className="flex h-4 items-end gap-[3px]">
      {bars.map((i) => (
        <motion.span
          // Animate scaleY (a composited transform) instead of height to avoid
          // per-frame layout/reflow — keeps the list buttery while playing.
          key={i}
          className="h-full w-[3px] origin-bottom rounded-full bg-brown-dark"
          animate={{ scaleY: [0.3, 1, 0.45] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: i * 0.15,
          }}
          style={{ scaleY: 0.5 }}
        />
      ))}
    </span>
  )
}
