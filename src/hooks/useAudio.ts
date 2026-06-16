import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'
import type { Track } from '../types'

/** Player status, surfaced so the UI can show spinners and friendly errors. */
export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface UseAudio {
  /** The track currently loaded into the player (may be paused). */
  currentTrack: Track | null
  /** Whether the loaded track is actively playing. */
  isPlaying: boolean
  /** True while the current track is still buffering. */
  isLoading: boolean
  /** Coarse status for the whole player. */
  status: AudioStatus
  /** A human-friendly error message, or null when healthy. */
  error: string | null
  /**
   * Current playback position in seconds as a MotionValue. It updates on the
   * audio element's `timeupdate` WITHOUT triggering React renders, so the UI
   * can bind to it (scrubber, time label) at 60fps with zero re-renders.
   */
  time: MotionValue<number>
  /** Track duration in seconds (0 until metadata loads). */
  duration: number
  /** Jump to a position (seconds). */
  seek: (time: number) => void
  /** Live frequency analyser for the music (null until the graph is built). */
  analyser: MutableRefObject<AnalyserNode | null>
  /** Load a track and start it from the beginning, cleanly stopping any previous track. */
  selectTrack: (track: Track) => void
  /** Load a track into the player *without* playing (e.g. restoring last session). */
  loadTrack: (track: Track) => void
  /** Resume the currently loaded track. */
  play: () => void
  /** Pause the currently loaded track (keeps it loaded). */
  pause: () => void
  /** Toggle play / pause on the loaded track. */
  toggle: () => void
  /** Stop playback entirely and unload the track. */
  stop: () => void
  /** Dismiss the current error without unloading the track. */
  clearError: () => void
}

/** Turn a MediaError code into something a human can act on. */
function describeMediaError(audio: HTMLAudioElement, track: Track | null): string {
  const file = track ? `audio/${track.id}.mp3` : 'the audio file'
  switch (audio.error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Playback was cancelled. Tap play to try again.'
    case MediaError.MEDIA_ERR_NETWORK:
      return `Couldn't load ${file} — check your connection and try again.`
    case MediaError.MEDIA_ERR_DECODE:
      return `${file} appears to be corrupted and can't be played.`
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return `No playable audio found. Make sure ${file} exists and is an MP3.`
    default:
      return `Something went wrong playing ${file}.`
  }
}

/** Volume for the ambient vinyl crackle — sits underneath the music. */
const CRACKLE_VOLUME = 0.15

/**
 * Owns the single, long-lived HTML5 <audio> element for the whole app, plus an
 * ambient crackle loop and a Web Audio analyser for the reactive glow.
 */
export function useAudio(options: { onEnded?: () => void } = {}): UseAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const crackleRef = useRef<HTMLAudioElement | null>(null)
  const trackRef = useRef<Track | null>(null)
  const onEndedRef = useRef(options.onEnded)
  onEndedRef.current = options.onEnded

  // Web Audio graph (built lazily on the first user-initiated play).
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  // Playback position as a MotionValue — never causes a React render.
  const time = useMotionValue(0)

  // Create the audio + crackle elements once and wire up lifecycle listeners.
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    const crackle = new Audio(`${import.meta.env.BASE_URL}audio/crackle.mp3`)
    crackle.loop = true
    crackle.preload = 'auto'
    crackle.volume = CRACKLE_VOLUME
    crackleRef.current = crackle

    const handlePlay = () => {
      setIsPlaying(true)
      setError(null)
    }
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setIsLoading(false)
      onEndedRef.current?.()
    }
    const handleWaiting = () => setIsLoading(true)
    const handlePlaying = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }
    const handleCanPlay = () => setIsLoading(false)
    const handleTimeUpdate = () => time.set(audio.currentTime)
    const handleDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const handleError = () => {
      setIsPlaying(false)
      setIsLoading(false)
      setError(describeMediaError(audio, trackRef.current))
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleDuration)
    audio.addEventListener('durationchange', handleDuration)
    audio.addEventListener('error', handleError)

    return () => {
      // Strict teardown — no audio, nodes, or contexts survive unmount.
      audio.pause()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleDuration)
      audio.removeEventListener('durationchange', handleDuration)
      audio.removeEventListener('error', handleError)
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null

      crackle.pause()
      crackle.removeAttribute('src')
      crackle.load()
      crackleRef.current = null

      try {
        sourceRef.current?.disconnect()
        analyserRef.current?.disconnect()
      } catch {
        /* nodes may already be gone */
      }
      sourceRef.current = null
      analyserRef.current = null
      void audioCtxRef.current?.close()
      audioCtxRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build the Web Audio graph once, on a user-initiated play (autoplay policy).
  const ensureGraph = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audioCtxRef.current) return
    try {
      const Ctx: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      const ctx = new Ctx()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      // music → analyser → speakers
      source.connect(analyser)
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      sourceRef.current = source
      analyserRef.current = analyser
    } catch {
      /* Analyser is a nice-to-have; audio still plays without the graph. */
    }
  }, [])

  // Ambient crackle follows the music's play/pause (independent of track).
  useEffect(() => {
    const crackle = crackleRef.current
    if (!crackle) return
    if (isPlaying) void crackle.play().catch(() => {})
    else crackle.pause()
  }, [isPlaying])

  const seek = useCallback(
    (to: number) => {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = to
      time.set(to)
    },
    [time],
  )

  /** Shared play() that translates rejected promises into useful errors. */
  const attemptPlay = useCallback(
    (audio: HTMLAudioElement) => {
      ensureGraph()
      void audioCtxRef.current?.resume()
      void audio.play().catch((err: unknown) => {
        setIsPlaying(false)
        setIsLoading(false)
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError') {
          setError('Your browser blocked autoplay. Tap the play button to start.')
        } else if (name === 'NotSupportedError') {
          const file = trackRef.current ? `audio/${trackRef.current.id}.mp3` : 'this track'
          setError(`Couldn't play ${file}. Make sure the MP3 has been added.`)
        } else if (audio.error) {
          setError(describeMediaError(audio, trackRef.current))
        } else {
          setError('Playback failed. Please try again.')
        }
      })
    },
    [ensureGraph],
  )

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    setError(null)
    attemptPlay(audio)
  }, [attemptPlay])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return
    if (audio.paused) play()
    else pause()
  }, [play, pause])

  const selectTrack = useCallback(
    (track: Track) => {
      const audio = audioRef.current
      if (!audio) return

      audio.pause()
      setError(null)
      setIsLoading(true)

      // Set the source synchronously inside the gesture, before play().
      if (trackRef.current?.id !== track.id) {
        audio.src = track.audioSrc
        audio.load()
      }
      trackRef.current = track
      setCurrentTrack(track)
      time.set(0)
      setDuration(0)

      try {
        audio.currentTime = 0
      } catch {
        /* currentTime can throw before metadata loads — safe to ignore. */
      }
      attemptPlay(audio)
    },
    [attemptPlay, time],
  )

  const loadTrack = useCallback(
    (track: Track) => {
      const audio = audioRef.current
      if (!audio) return
      if (trackRef.current?.id !== track.id) {
        audio.src = track.audioSrc
        audio.load()
      }
      trackRef.current = track
      setCurrentTrack(track)
      time.set(0)
      setDuration(0)
    },
    [time],
  )

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    crackleRef.current?.pause()
    trackRef.current = null
    setCurrentTrack(null)
    setIsPlaying(false)
    setIsLoading(false)
    setError(null)
    time.set(0)
    setDuration(0)
  }, [time])

  const clearError = useCallback(() => setError(null), [])

  const status: AudioStatus = error
    ? 'error'
    : isLoading
      ? 'loading'
      : isPlaying
        ? 'playing'
        : currentTrack
          ? 'paused'
          : 'idle'

  return {
    currentTrack,
    isPlaying,
    isLoading,
    status,
    error,
    time,
    duration,
    seek,
    analyser: analyserRef,
    selectTrack,
    loadTrack,
    play,
    pause,
    toggle,
    stop,
    clearError,
  }
}
