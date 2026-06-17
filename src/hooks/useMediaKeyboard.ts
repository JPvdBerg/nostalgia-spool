import { useCallback, useEffect, useRef } from 'react'

interface MediaKeyboardOptions {
  onPlayPause?: () => void
  onNextTrack?: () => void
  onPrevTrack?: () => void
}

/**
 * Global keyboard media controls: Spacebar (play/pause), ArrowRight (next),
 * ArrowLeft (previous). Defensive against input hijacking and rapid firing.
 */
export function useMediaKeyboard({
  onPlayPause,
  onNextTrack,
  onPrevTrack,
}: MediaKeyboardOptions = {}) {
  const spacebarDebounce = useRef(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null
      const tag = target?.tagName

      // Never hijack text-entry fields.
      const isTextField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.getAttribute('role') === 'textbox'

      if (isTextField) return

      const now = Date.now()

      switch (e.code) {
        case 'Space':
          // A focused button/link already activates on Space (its onClick runs),
          // so bail here to avoid toggling playback twice.
          if (tag === 'BUTTON' || tag === 'A') return
          if (now - spacebarDebounce.current < 200) return // Debounce
          spacebarDebounce.current = now
          e.preventDefault() // Prevent page scroll
          onPlayPause?.()
          break

        case 'ArrowRight':
          onNextTrack?.()
          break

        case 'ArrowLeft':
          onPrevTrack?.()
          break
      }
    },
    [onPlayPause, onNextTrack, onPrevTrack],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
