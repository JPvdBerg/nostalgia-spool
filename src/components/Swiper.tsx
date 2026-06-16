import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'

/** Flick speed (px/s) that advances a slide regardless of distance — IG-like. */
const FLICK_VELOCITY = 450
/** Fraction of the width you must drag past to commit to the next slide. */
const COMMIT_FRACTION = 0.22
/** Spring used to settle onto a slide — snappy but with a touch of glide. */
const SNAP = { type: 'spring' as const, stiffness: 500, damping: 48, mass: 0.8 }

interface SwiperProps {
  count: number
  index: number
  onIndexChange: (i: number) => void
  renderSlide: (i: number) => ReactNode
  /** Fires on a tap (never after a drag). */
  onTap?: () => void
  onInteractStart?: () => void
  onInteractEnd?: () => void
}

/**
 * An Instagram-style horizontal swiper: a single track of full-width slides that
 * follows the finger 1:1, peeks the neighbouring slides, rubber-bands at the
 * ends, and snaps with velocity. Everything is a GPU transform so it stays at
 * 60fps on mobile.
 */
export default function Swiper({
  count,
  index,
  onIndexChange,
  renderSlide,
  onTap,
  onInteractStart,
  onInteractEnd,
}: SwiperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const x = useMotionValue(0)
  const dragging = useRef(false)

  // Measure the viewport synchronously (before paint) so slides size correctly.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Settle onto the active slide whenever the index or width changes from the
  // outside (dots, arrows, keyboard, autoplay). Skipped while actively dragging.
  useEffect(() => {
    if (!width || dragging.current) return
    const controls = animate(x, -index * width, SNAP)
    return () => controls.stop()
  }, [index, width, x])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false
    onInteractEnd?.()

    const { offset, velocity } = info
    let target = index
    if (offset.x < -width * COMMIT_FRACTION || velocity.x < -FLICK_VELOCITY) {
      target = index + 1
    } else if (offset.x > width * COMMIT_FRACTION || velocity.x > FLICK_VELOCITY) {
      target = index - 1
    }
    target = Math.max(0, Math.min(count - 1, target))

    if (target === index) {
      // No change — spring back to the current slide.
      animate(x, -index * width, SNAP)
    } else {
      // The index effect will animate to the new slide.
      onIndexChange(target)
    }
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <motion.div
        className="flex h-full will-change-transform"
        // touch-action: pan-y lets vertical page scroll pass through while we
        // own horizontal gestures — so the carousel never feels "trapped".
        style={{ x, touchAction: 'pan-y' }}
        drag={count > 1 ? 'x' : false}
        dragConstraints={{ left: -(count - 1) * width, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={() => {
          dragging.current = true
          onInteractStart?.()
        }}
        onDragEnd={handleDragEnd}
        onTap={onTap}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-full shrink-0" style={{ width: width || '100%' }}>
            {renderSlide(i)}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
