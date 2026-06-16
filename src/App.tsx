import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { Disc3, Pause, Play } from 'lucide-react'
import VinylPlayer from './components/VinylPlayer'
import TrackList from './components/TrackList'
import PhotoCarousel from './components/PhotoCarousel'
import Toast from './components/Toast'
import LoadingScreen from './components/LoadingScreen'
import { useAudio, type UseAudio } from './hooks/useAudio'
import { useMediaKeyboard } from './hooks/useMediaKeyboard'
import { tracks } from './data'
import type { Track } from './types'

const panelMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

export default function App() {
  const hasTracks = tracks.length > 0
  const [appReady, setAppReady] = useState(false)
  const [unlockedTracks, setUnlockedTracks] = useState<Set<string>>(new Set())

  // Dynamic background color animation (defaults to cream).
  const bgColor = useMotionValue('#F6EAD2')
  const bgGradient = useMotionTemplate`linear-gradient(to bottom, ${bgColor} 0%, #F6EAD2 50%, #D4C4B1 100%)`

  // Stable refs let the once-registered "ended" handler reach fresh values
  // without re-subscribing the audio element each render.
  const apiRef = useRef<UseAudio | null>(null)
  const nextTrackRef = useRef<Track | undefined>(undefined)

  const handleEnded = useCallback(() => {
    // Roll on to the next track when one finishes (stays put on the last).
    const next = nextTrackRef.current
    if (next) apiRef.current?.selectTrack(next)
  }, [])

  const audio = useAudio({ onEnded: handleEnded })
  apiRef.current = audio
  const {
    currentTrack,
    isPlaying,
    isLoading,
    error,
    time,
    duration,
    seek,
    analyser,
    selectTrack,
    play,
    pause,
    toggle,
    clearError,
  } = audio

  // `browsing` shows the playlist while audio keeps playing (decoupled from stop).
  const [browsing, setBrowsing] = useState(false)

  const showCarousel = currentTrack !== null && !browsing

  const handleToggle = () => {
    if (currentTrack) toggle()
    else if (hasTracks) {
      selectTrack(tracks[0])
      setBrowsing(false)
    }
  }

  // Tonearm dropped onto the record → start playing (first track if none yet).
  const handleEngage = () => {
    if (currentTrack) play()
    else if (hasTracks) {
      selectTrack(tracks[0])
      setBrowsing(false)
    }
  }
  // Tonearm lifted off the record → pause.
  const handleDisengage = () => pause()

  // Selecting from the list: same track just re-opens its photos (no restart).
  const handleSelect = (track: Track) => {
    if (track.id === currentTrack?.id) setBrowsing(false)
    else {
      selectTrack(track)
      setBrowsing(false)
    }
  }

  const goToTrack = (track: Track) => {
    selectTrack(track)
    setBrowsing(false)
  }

  // Adjacent tracks for the prev/next buttons (memoized — doesn't recompute
  // while the record spins, only when the track changes).
  const { prevTrack, nextTrack } = useMemo(() => {
    const i = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1
    return {
      prevTrack: i > 0 ? tracks[i - 1] : undefined,
      nextTrack: i >= 0 && i < tracks.length - 1 ? tracks[i + 1] : undefined,
    }
  }, [currentTrack])
  nextTrackRef.current = nextTrack

  // Global media keyboard controls (Spacebar, Arrow keys).
  useMediaKeyboard({
    onPlayPause: handleToggle,
    onNextTrack: () => nextTrack && goToTrack(nextTrack),
    onPrevTrack: () => prevTrack && goToTrack(prevTrack),
  })

  // Unlock a hidden track and play it immediately (via easter egg).
  const unlockAndPlay = useCallback(
    (track: Track) => {
      setUnlockedTracks((prev) => new Set([...prev, track.id]))
      selectTrack(track)
      setBrowsing(false)
    },
    [selectTrack],
  )

  // Animate background color on track change (1.5s soft bleed).
  useEffect(() => {
    const targetColor = currentTrack?.themeColor || '#F6EAD2'
    void animate(bgColor, targetColor, {
      duration: 1.5,
      ease: 'easeInOut',
    })
  }, [currentTrack, bgColor])

  // Mini bar shows on mobile when something is loaded but we're browsing.
  const showMiniBar = currentTrack !== null && browsing

  // Asset preload targets for the loading screen.
  const firstTrack = tracks[0]
  const coverArts = tracks.map((t) => t.coverArt)
  const firstPhotos =
    firstTrack?.photos.map((p) => (typeof p === 'string' ? p : p.src)) || []
  const firstAudioSrc = firstTrack?.audioSrc || ''

  return (
    <>
      <LoadingScreen
        onReady={() => setAppReady(true)}
        coverArt={coverArts}
        firstPhotos={firstPhotos}
        firstAudioSrc={firstAudioSrc}
      />
      <motion.div
        className={[
          'relative min-h-[100dvh] overflow-hidden lg:h-screen',
          !appReady ? 'hidden' : '',
        ].join(' ')}
        style={{ backgroundImage: bgGradient }}
      >
      {/* Decorative depth — static blurred orbs, painted once, no per-frame cost */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-clay/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brown-med/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-teal/10 blur-3xl"
      />

      <div
        className={[
          'relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-7 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-5',
          showMiniBar ? 'pb-28 lg:pb-5' : '',
        ].join(' ')}
      >
        {/* Header */}
        <header className="mb-5 flex flex-col items-center text-center lg:mb-4">
          <span className="flex items-center gap-2 rounded-full bg-espresso px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-cream shadow-soft">
            <Disc3 className="h-4 w-4" />
            A Music Timeline
          </span>
          <h1 className="mt-3 text-3xl font-semibold text-espresso sm:text-4xl lg:mt-2 lg:text-5xl">
            Nostalgia Spool
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-cocoa sm:text-base">
            Drop the needle on a memory and watch the photos drift by.
          </p>
        </header>

        {/* Split layout: vinyl left, content right (stacks on mobile) */}
        <main className="grid flex-1 grid-cols-1 items-center gap-6 lg:min-h-0 lg:grid-cols-2 lg:auto-rows-fr lg:items-stretch lg:gap-10 lg:overflow-hidden">
          <section className="flex items-center justify-center lg:min-h-0">
            <VinylPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              isLoading={isLoading}
              canPlay={hasTracks}
              time={time}
              duration={duration}
              onSeek={seek}
              analyser={analyser}
              onToggle={handleToggle}
              onEngage={handleEngage}
              onDisengage={handleDisengage}
              onLongPressCentre={() => {
                const hiddenTrack = tracks.find((t) => t.isHidden && !unlockedTracks.has(t.id))
                if (hiddenTrack) unlockAndPlay(hiddenTrack)
              }}
            />
          </section>

          <section className="min-h-[22rem] lg:min-h-0 lg:overflow-hidden">
            {hasTracks ? (
              <AnimatePresence mode="wait" initial={false}>
                {showCarousel && currentTrack ? (
                  <motion.div key="carousel" className="h-full" {...panelMotion}>
                    <PhotoCarousel
                      track={currentTrack}
                      time={time}
                      onBackToPlaylist={() => setBrowsing(true)}
                      onPrevTrack={prevTrack ? () => goToTrack(prevTrack) : undefined}
                      prevTrackTitle={prevTrack?.title}
                      onNextTrack={nextTrack ? () => goToTrack(nextTrack) : undefined}
                      nextTrackTitle={nextTrack?.title}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="tracklist" className="h-full" {...panelMotion}>
                    <TrackList
                      tracks={tracks.filter((t) => !t.isHidden || unlockedTracks.has(t.id))}
                      activeTrackId={currentTrack?.id ?? null}
                      onSelect={handleSelect}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <EmptyLibrary />
            )}
          </section>
        </main>

        <footer className="mt-6 text-center text-sm text-cocoa lg:mt-4">
          Made with warm tape hiss &amp; soft focus · {new Date().getFullYear()}
        </footer>
      </div>

      {/* Mobile mini now-playing bar — tap to return to the photos */}
      <AnimatePresence>
        {showMiniBar && currentTrack && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-cocoa/20 bg-espresso px-3 py-2 text-cream shadow-soft-lg">
              <button
                type="button"
                onClick={() => setBrowsing(false)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-label="Back to photos"
              >
                <MiniCover key={currentTrack.id} src={currentTrack.coverArt} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {currentTrack.title}
                  </span>
                  <span className="block truncate text-xs text-cream/70">
                    {currentTrack.artist}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleToggle}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full bg-clay text-cream transition-colors hover:bg-clay-dark"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-blocking error toast for audio/playback problems */}
      <Toast message={error} onDismiss={clearError} />
      </motion.div>
    </>
  )
}

/** Tiny cover thumbnail for the mini bar, with a graceful fallback. */
function MiniCover({ src }: { src: string }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cocoa">
        <Disc3 className="h-5 w-5 text-cream/70" />
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setErrored(true)}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
    />
  )
}

/** Shown if the tracklist is ever empty (e.g. data.ts cleared). */
function EmptyLibrary() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-3xl border border-cocoa/15 bg-sand p-8 text-center shadow-card">
      <Disc3 className="h-12 w-12 text-clay" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-semibold text-espresso">No memories yet</h2>
      <p className="mt-1 max-w-xs text-sm text-cocoa">
        Add some tracks to <code className="font-mono">src/data.ts</code> to start building
        your timeline.
      </p>
    </div>
  )
}
