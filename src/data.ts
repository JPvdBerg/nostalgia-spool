import type { Track } from './types'

/**
 * Resolve a path inside /public against Vite's configured `base`.
 *
 * In dev `import.meta.env.BASE_URL` is "/", in the GitHub Pages build it is
 * "/nostalgia-spool/". Prefixing here means the same data works in both
 * environments without hard-coding the repo name.
 *
 * NOTE: drop your own files into these exact locations:
 *   public/audio/<id>.mp3
 *   public/images/<id>/cover.jpg
 *   public/images/<id>/01.jpg, 02.jpg, ...
 */
const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`

export const tracks: Track[] = [
  {
    id: 'wonderful-nothing',
    title: 'Wonderful Nothing',
    era: '2024',
    artist: 'Glass Animals',
    coverArt: asset('images/wonderful-nothing/cover.webp'),
    audioSrc: asset('audio/wonderful-nothing.mp3'),
    photos: [
      asset('images/wonderful-nothing/01.jpg'),
      asset('images/wonderful-nothing/02.jpg'),
      asset('images/wonderful-nothing/03.jpg'),
    ],
    themeColor: '#CC7A33',
    linerNotes:
      "A sun-drenched moment captured in motion. The kind of afternoon that feels timeless.",
  },
  {
    id: 'first-snowfall',
    title: 'The First Snowfall',
    era: '2003',
    artist: 'Window Seat Sessions',
    coverArt: asset('images/first-snowfall/cover.jpg'),
    audioSrc: asset('audio/first-snowfall.mp3'),
    photos: [
      asset('images/first-snowfall/01.jpg'),
      asset('images/first-snowfall/02.jpg'),
      asset('images/first-snowfall/03.jpg'),
    ],
    themeColor: '#5E8FB5',
    linerNotes:
      "Silence falling like snow. Everything quieter, softer, waiting for spring.",
  },
  {
    id: 'late-night-drives',
    title: 'Late Night Drives',
    era: '2009',
    artist: 'Dashboard Glow',
    coverArt: asset('images/late-night-drives/cover.jpg'),
    audioSrc: asset('audio/late-night-drives.mp3'),
    photos: [
      asset('images/late-night-drives/01.jpg'),
      asset('images/late-night-drives/02.jpg'),
      asset('images/late-night-drives/03.jpg'),
      asset('images/late-night-drives/04.jpg'),
      asset('images/late-night-drives/05.jpg'),
    ],
    themeColor: '#2C2C3C',
    linerNotes:
      "Empty highways and endless radio. The dashboard lights blur together as the miles disappear.",
  },
  {
    id: 'seaside-mornings',
    title: 'Seaside Mornings',
    era: '2014',
    artist: 'Saltwater Tapes',
    coverArt: asset('images/seaside-mornings/cover.jpg'),
    audioSrc: asset('audio/seaside-mornings.mp3'),
    photos: [
      asset('images/seaside-mornings/01.jpg'),
      asset('images/seaside-mornings/02.jpg'),
      asset('images/seaside-mornings/03.jpg'),
    ],
    themeColor: '#2E9D9A',
    linerNotes:
      "Salt air and first light. The kind of morning that makes you believe in new beginnings.",
  },
  {
    id: 'golden-hour',
    title: 'Golden Hour',
    era: '2021',
    artist: 'Rooftop Recordings',
    coverArt: asset('images/golden-hour/cover.jpg'),
    audioSrc: asset('audio/golden-hour.mp3'),
    photos: [
      asset('images/golden-hour/01.jpg'),
      asset('images/golden-hour/02.jpg'),
      asset('images/golden-hour/03.jpg'),
      asset('images/golden-hour/04.jpg'),
    ],
    themeColor: '#E0942B',
    linerNotes:
      "The sky on fire. Everything glowing amber. The day's last breath, held tight.",
  },
  {
    id: 'secret-sessions',
    title: 'Secret Sessions',
    era: '???',
    artist: 'Unknown',
    coverArt: asset('images/golden-hour/cover.jpg'),
    audioSrc: asset('audio/golden-hour.mp3'),
    photos: [
      asset('images/golden-hour/01.jpg'),
      asset('images/golden-hour/02.jpg'),
    ],
    themeColor: '#8B4789',
    linerNotes: "A memory you thought was lost. Found in the silence between songs.",
    isHidden: true,
  },
]
