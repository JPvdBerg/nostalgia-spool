import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ToastProps {
  /** When non-null, the toast is shown with this message. */
  message: string | null
  /** Called when the user dismisses it (or it auto-hides). */
  onDismiss: () => void
  /** Auto-dismiss delay in ms. Set to 0 to disable. */
  duration?: number
}

/**
 * A single, non-blocking error toast pinned to the bottom of the screen.
 * Stays out of the way on mobile (full-width, above the safe-area) and
 * floats bottom-centre on larger screens.
 */
export default function Toast({ message, onDismiss, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (!message || duration <= 0) return
    const timer = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timer)
  }, [message, duration, onDismiss])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-live="assertive"
      role="status"
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-brown-med/40 bg-cream px-4 py-3 text-brown-dark shadow-soft-lg"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brown-dark" />
            <p className="flex-1 text-sm leading-snug">{message}</p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="-mr-1 -mt-0.5 shrink-0 rounded-full p-1 text-brown-med transition-colors hover:bg-beige-dark hover:text-brown-dark"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
