import { AnimatePresence, motion } from 'framer-motion'
import { Disc3 } from 'lucide-react'
import VinylPlayer from './components/VinylPlayer'
import TrackList from './components/TrackList'
import PhotoCarousel from './components/PhotoCarousel'
import Toast from './components/Toast'
import { useAudio } from './hooks/useAudio'
import { tracks } from './data'

const panelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

export default function App() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    error,
    selectTrack,
    toggle,
    stop,
    clearError,
  } = useAudio()

  const hasTracks = tracks.length > 0

  // The right-hand panel shows the carousel whenever a memory is active,
  // and falls back to the tracklist otherwise.
  const showCarousel = currentTrack !== null

  // Pressing play with nothing selected starts the first track.
  const handleToggle = () => {
    if (currentTrack) toggle()
    else if (hasTracks) selectTrack(tracks[0])
  }

  // Work out the adjacent tracks (for the prev/next buttons), if any.
  const currentIndex = currentTrack
    ? tracks.findIndex((t) => t.id === currentTrack.id)
    : -1
  const prevTrack = currentIndex > 0 ? tracks[currentIndex - 1] : undefined
  const nextTrack =
    currentIndex >= 0 && currentIndex < tracks.length - 1
      ? tracks[currentIndex + 1]
      : undefined

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-cream via-cream to-sand">
      {/* Decorative depth — static blurred orbs, painted once, no per-frame cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-beige-dark/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brown-med/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-beige-dark/40 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-col items-center text-center sm:mb-8">
          <span className="flex items-center gap-2 rounded-full bg-sand px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.3em] text-brown-med shadow-soft">
            <Disc3 className="h-4 w-4" />
            A Music Timeline
          </span>
          <h1 className="mt-3 text-3xl font-semibold text-brown-dark sm:mt-4 sm:text-5xl">
            Nostalgia Spool
          </h1>
          <p className="mt-2 max-w-md text-sm text-brown-med sm:text-base">
            Drop the needle on a memory and watch the photos drift by.
          </p>
        </header>

        {/* Split layout: vinyl left, content right (stacks on mobile) */}
        <main className="grid flex-1 grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
          <section className="flex items-center justify-center">
            <VinylPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              isLoading={isLoading}
              canPlay={hasTracks}
              onToggle={handleToggle}
            />
          </section>

          <section className="min-h-[24rem] lg:min-h-0">
            {hasTracks ? (
              <AnimatePresence mode="wait" initial={false}>
                {showCarousel && currentTrack ? (
                  <motion.div key="carousel" className="h-full" {...panelMotion}>
                    <PhotoCarousel
                      track={currentTrack}
                      onBackToPlaylist={stop}
                      onPrevTrack={prevTrack ? () => selectTrack(prevTrack) : undefined}
                      prevTrackTitle={prevTrack?.title}
                      onNextTrack={nextTrack ? () => selectTrack(nextTrack) : undefined}
                      nextTrackTitle={nextTrack?.title}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="tracklist" className="h-full" {...panelMotion}>
                    <TrackList tracks={tracks} activeTrackId={null} onSelect={selectTrack} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <EmptyLibrary />
            )}
          </section>
        </main>

        <footer className="mt-8 text-center text-sm text-brown-med sm:mt-10">
          Made with warm tape hiss &amp; soft focus · {new Date().getFullYear()}
        </footer>
      </div>

      {/* Non-blocking error toast for audio/playback problems */}
      <Toast message={error} onDismiss={clearError} />
    </div>
  )
}

/** Shown if the tracklist is ever empty (e.g. data.ts cleared). */
function EmptyLibrary() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-3xl bg-sand p-8 text-center shadow-soft">
      <Disc3 className="h-12 w-12 text-brown-med" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-semibold text-brown-dark">No memories yet</h2>
      <p className="mt-1 max-w-xs text-sm text-brown-med">
        Add some tracks to <code className="font-mono">src/data.ts</code> to start building
        your timeline.
      </p>
    </div>
  )
}
