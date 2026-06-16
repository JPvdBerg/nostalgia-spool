import { useCallback, useEffect, useRef, useState } from 'react'
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
  /** Current playback position in seconds. */
  currentTime: number
  /** Track duration in seconds (0 until metadata loads). */
  duration: number
  /** Jump to a position (seconds). */
  seek: (time: number) => void
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

/**
 * Owns the single, long-lived HTML5 <audio> element for the whole app.
 *
 * Only ever one Audio object exists, so switching tracks cannot produce
 * overlapping playback: we `pause()` + reset the element, swap `src`, call
 * `load()` to drop the previous track's buffered data, then `play()`.
 */
export function useAudio(options: { onEnded?: () => void } = {}): UseAudio {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Keep a ref to the loaded track so event listeners can build good messages.
  const trackRef = useRef<Track | null>(null)
  // Latest onEnded callback, so the once-mounted listener never goes stale.
  const onEndedRef = useRef(options.onEnded)
  onEndedRef.current = options.onEnded

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Create the audio element once and wire up lifecycle listeners.
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

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
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
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
      // Tear down completely so no audio survives an unmount.
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
    }
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  /** Shared play() that translates rejected promises into useful errors. */
  const attemptPlay = useCallback((audio: HTMLAudioElement) => {
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
  }, [])

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

      // Cleanly stop whatever is currently playing before touching `src`.
      audio.pause()
      setError(null)
      setIsLoading(true)

      // IMPORTANT: set the source *synchronously*, inside the click handler,
      // BEFORE calling play(). Doing this in a setState updater would run it
      // during render — after play() had already fired on an empty element,
      // which rejects and consumes the user gesture (no autoplay).
      // We compare against the ref (not state) to keep this self-contained.
      if (trackRef.current?.id !== track.id) {
        audio.src = track.audioSrc
        audio.load()
      }
      trackRef.current = track
      setCurrentTrack(track)
      setCurrentTime(0)
      setDuration(0)

      try {
        audio.currentTime = 0
      } catch {
        /* currentTime can throw before metadata loads — safe to ignore. */
      }
      attemptPlay(audio)
    },
    [attemptPlay],
  )

  const loadTrack = useCallback((track: Track) => {
    const audio = audioRef.current
    if (!audio) return
    if (trackRef.current?.id !== track.id) {
      audio.src = track.audioSrc
      audio.load()
    }
    trackRef.current = track
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    trackRef.current = null
    setCurrentTrack(null)
    setIsPlaying(false)
    setIsLoading(false)
    setError(null)
    setCurrentTime(0)
    setDuration(0)
  }, [])

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
    currentTime,
    duration,
    seek,
    selectTrack,
    loadTrack,
    play,
    pause,
    toggle,
    stop,
    clearError,
  }
}
