# Nostalgia Spool 🎵

An interactive **vinyl / music timeline** photo gallery. Pick a memory, the record
spins, the audio plays, and a soft cross-fading carousel drifts through that era's
photos. Built with React + TypeScript + Vite, styled with Tailwind, animated with
Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Then add your own media — see [`public/ASSETS.md`](public/ASSETS.md) for the exact
file names and folders the app expects.

## Deploying to GitHub Pages

The Vite `base` is set to `/nostalgia-spool/` to match the repo. To publish:

```bash
npm run deploy
```

This runs `predeploy` (a production build) and pushes `dist/` to the `gh-pages`
branch via the `gh-pages` package. Make sure GitHub Pages is set to serve from the
`gh-pages` branch in the repository settings.

## Project structure

```
src/
  App.tsx                 # layout + state, AnimatePresence panel toggle
  data.ts                 # mock tracks (paths resolved against Vite base)
  types.ts                # shared interfaces
  hooks/useAudio.ts       # single HTML5 <audio> lifecycle
  components/
    VinylPlayer.tsx       # spinning record, cover art, tonearm, transport
    TrackList.tsx         # scrollable playlist
    PhotoCarousel.tsx     # auto-playing cross-fade gallery
```
