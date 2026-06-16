# Where to drop your media

The app reads everything in this `public/` folder as static assets. Match these
exact paths (they are derived from `id` in `src/data.ts`).

## Audio — `public/audio/`

```
audio/sun-soaked-summers.mp3
audio/first-snowfall.mp3
audio/late-night-drives.mp3
audio/seaside-mornings.mp3
audio/golden-hour.mp3
```

## Images — `public/images/<track-id>/`

Each track needs a square `cover.jpg` (shown on the record) plus numbered photos
for the carousel (`01.jpg`, `02.jpg`, …). Example for one track:

```
images/sun-soaked-summers/cover.jpg
images/sun-soaked-summers/01.jpg
images/sun-soaked-summers/02.jpg
images/sun-soaked-summers/03.jpg
images/sun-soaked-summers/04.jpg
```

Repeat for `first-snowfall`, `late-night-drives`, `seaside-mornings`, and
`golden-hour`. The photo counts per track are listed in `src/data.ts` — add or
remove entries there to match what you have.

Until you add real files the UI degrades gracefully: covers fall back to a music
icon and carousel slides show a friendly "drop a photo here" placeholder.
