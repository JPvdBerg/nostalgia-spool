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
/** Fraction of the size you must drag past to commit to the next slide. */
const COMMIT_FRACTION = 0.22
/** Spring used to settle onto a slide — snappy but with a touch of glide. */
const SNAP = { type: 'spring' as const, stiffness: 500, damping: 48, mass: 0.8 }

type Axis = 'x' | 'y'

interface SwiperProps {
  count: number
  index: number
  onIndexChange: (i: number) => void
  renderSlide: (i: number) => ReactNode
  /** Swipe direction. 'x' = horizontal, 'y' = vertical. Default 'x'. */
  axis?: Axis
  /** Fires on a tap (never after a drag). */
  onTap?: () => void
  onInteractStart?: () => void
  onInteractEnd?: () => void
}

/**
 * An Instagram-style swiper: a single track of full-size slides that follows the
 * finger 1:1, peeks the neighbours, rubber-bands at the ends, and snaps with
 * velocity. Works on either axis. Everything is a GPU transform → 60fps.
 */
export default function Swiper({
  count,
  index,
  onIndexChange,
  renderSlide,
  axis = 'x',
  onTap,
  onInteractStart,
  onInteractEnd,
}: SwiperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const offset = useMotionValue(0)
  const dragging = useRef(false)
  const vertical = axis === 'y'

  // Measure the viewport synchronously (before paint) so slides size correctly.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setSize(vertical ? el.clientHeight : el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [vertical])

  // Settle onto the active slide whenever index/size change from the outside
  // (dots, arrows, keyboard, autoplay). Skipped while actively dragging.
  useEffect(() => {
    if (!size || dragging.current) return
    const controls = animate(offset, -index * size, SNAP)
    return () => controls.stop()
  }, [index, size, offset])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    dragging.current = false
    onInteractEnd?.()

    const delta = vertical ? info.offset.y : info.offset.x
    const velocity = vertical ? info.velocity.y : info.velocity.x
    let target = index
    if (delta < -size * COMMIT_FRACTION || velocity < -FLICK_VELOCITY) {
      target = index + 1
    } else if (delta > size * COMMIT_FRACTION || velocity > FLICK_VELOCITY) {
      target = index - 1
    }
    target = Math.max(0, Math.min(count - 1, target))

    if (target === index) {
      animate(offset, -index * size, SNAP)
    } else {
      onIndexChange(target)
    }
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <motion.div
        className={`flex h-full will-change-transform ${vertical ? 'flex-col' : 'flex-row'}`}
        style={
          vertical
            ? { y: offset, touchAction: 'pan-x' }
            : { x: offset, touchAction: 'pan-y' }
        }
        drag={count > 1 ? axis : false}
        dragConstraints={
          vertical
            ? { top: -(count - 1) * size, bottom: 0 }
            : { left: -(count - 1) * size, right: 0 }
        }
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
          <div
            key={i}
            className="shrink-0"
            style={
              vertical
                ? { height: size || '100%', width: '100%' }
                : { width: size || '100%', height: '100%' }
            }
          >
            {renderSlide(i)}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
