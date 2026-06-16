/**
 * A single "track" represents one memory / era in the timeline.
 * It owns its own audio file and the photos that cross-fade while it plays.
 */
export interface Track {
  /** Stable, unique identifier (also used as a public asset folder name). */
  id: string
  /** Display title of the memory / song. */
  title: string
  /** The era this memory belongs to (e.g. a year or a season). */
  era: string
  /** Sub-label shown under the title (artist, place, mixtape name…). */
  artist: string
  /** Square cover image rendered in the centre of the vinyl. */
  coverArt: string
  /** Path to the local MP3 in /public/audio. */
  audioSrc: string
  /** Ordered photos for the cross-fading carousel (paths in /public/images). */
  photos: string[]
}
