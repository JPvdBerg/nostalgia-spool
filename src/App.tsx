import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { Disc3, Pause, Play, Sparkles } from 'lucide-react'
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
  const handleReady = useCallback(() => setAppReady(true), [])
  const [unlockedTracks, setUnlockedTracks] = useState<Set<string>>(new Set())
  // Title of a just-unlocked hidden track, for the celebratory toast.
  const [unlockedTitle, setUnlockedTitle] = useState<string | null>(null)

  // Dynamic background colour (defaults to cream). The base gradient is a soft
  // top-down wash; the reactive vignette (below) makes the track's colour bloom
  // prominently from the edges and pulse to the kick / bassline.
  const bgColor = useMotionValue('#F6EAD2')
  // Bold theme-colour bleed: solid from ~55% radius outward (covers well over
  // half the page), with only a small clear core so the centred content stays
  // legible. Opacity-only (driven by `--bass`) so the kick-drum pulse is a
  // compositor-only change that never repaints.
  const bgVignette = useMotionTemplate`radial-gradient(115% 95% at 50% 45%, transparent 15%, ${bgColor} 55%)`
  const bassRef = useRef<HTMLDivElement>(null)

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

  // Global media keyboard controls. Space always toggles playback; the arrows
  // skip tracks ONLY when the photo carousel isn't open — while it is, the
  // carousel owns ←/→ for photo navigation (otherwise both would fire at once).
  useMediaKeyboard({
    onPlayPause: handleToggle,
    onNextTrack: showCarousel ? undefined : () => nextTrack && goToTrack(nextTrack),
    onPrevTrack: showCarousel ? undefined : () => prevTrack && goToTrack(prevTrack),
  })

  // Unlock a hidden track and play it immediately (via easter egg).
  const unlockAndPlay = useCallback(
    (track: Track) => {
      setUnlockedTracks((prev) => new Set([...prev, track.id]))
      setUnlockedTitle(track.title)
      selectTrack(track)
      setBrowsing(false)
    },
    [selectTrack],
  )

  // Auto-retire the "B-side unlocked" toast.
  useEffect(() => {
    if (!unlockedTitle) return
    const id = window.setTimeout(() => setUnlockedTitle(null), 4000)
    return () => window.clearTimeout(id)
  }, [unlockedTitle])

  // Animate background color on track change (1.5s soft bleed).
  useEffect(() => {
    const targetColor = currentTrack?.themeColor || '#F6EAD2'
    void animate(bgColor, targetColor, {
      duration: 1.5,
      ease: 'easeInOut',
    })
  }, [currentTrack, bgColor])

  // Drive a `--bass` CSS variable (0..1) from the low end of the spectrum so the
  // colour vignette blooms on every kick / bass note. Ref + rAF only, so this
  // never triggers a React render (keeps 60fps and the Web Audio graph intact).
  useEffect(() => {
    const el = bassRef.current
    if (!el) return
    if (!isPlaying || !analyser) {
      el.style.setProperty('--bass', '0')
      return
    }
    let raf = 0
    let env = 0
    let data: Uint8Array<ArrayBuffer> | null = null
    const tick = () => {
      const node = analyser.current
      if (node) {
        if (!data || data.length !== node.frequencyBinCount) {
          data = new Uint8Array(new ArrayBuffer(node.frequencyBinCount))
        }
        node.getByteFrequencyData(data)
        // Kick + low bass live in the bottom ~3 bins (fftSize 256 → ~172 Hz each).
        const sum = data[0] + data[1] + data[2]
        let level = sum / 3 / 255
        // Aggressive floor + gain so a kick slams the value straight to full.
        level = Math.min(1, Math.max(0, (level - 0.04) / 0.96) * 2.2)
        // Instant attack, fast decay toward 0 → a hard, distinct thump per kick.
        env = level > env ? level : env * 0.84
        el.style.setProperty('--bass', env.toFixed(3))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.style.setProperty('--bass', '0')
    }
  }, [isPlaying, analyser])

  // Mini bar shows on mobile when something is loaded but we're browsing.
  const showMiniBar = currentTrack !== null && browsing

  // Preload EVERY image up front (covers + all photos) so switching tracks never
  // shows a loading flash, and keep the first track's audio warm. Memoized for a
  // stable identity so the preloader effect runs exactly once.
  const firstTrack = tracks[0]
  const allImages = useMemo(
    () =>
      tracks.flatMap((t) => [
        t.coverArt,
        ...t.photos.map((p) => (typeof p === 'string' ? p : p.src)),
      ]),
    [],
  )
  const firstAudioSrc = firstTrack?.audioSrc || ''

  return (
    <>
      <LoadingScreen
        onReady={handleReady}
        images={allImages}
        firstAudioSrc={firstAudioSrc}
      />
      <motion.div
        className={[
          'relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-cream via-cream to-[#E8D7B3] lg:h-screen',
          !appReady ? 'hidden' : '',
        ].join(' ')}
      >
      {/* Reactive colour bleed — the track's theme colour blooms from the edges
          and pulses to the kick / bassline via the `--bass` variable. Sits behind
          all content; the clear centre keeps text crisp. Opacity-only (no scale or
          blur) so the pulse is compositor-only and never repaints. */}
      <motion.div
        ref={bassRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 will-change-[opacity]"
        style={{
          backgroundImage: bgVignette,
          opacity: 'calc(0.25 + var(--bass, 0) * 0.75)',
        }}
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

      {/* Celebratory toast when the hidden B-side is unlocked */}
      <AnimatePresence>
        {unlockedTitle && (
          <motion.div
            key="unlock"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4"
          >
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-espresso px-4 py-2 text-cream shadow-soft-lg">
              <Sparkles className="h-4 w-4 text-clay" />
              <span className="text-sm font-semibold">B-side unlocked · {unlockedTitle}</span>
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
