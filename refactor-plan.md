# Nostalgia Spool: Mobile-First & Feature Enhancement Plan

## 1. Goal
Refactor the interface to be strictly mobile-first, improve touch accessibility, and implement specific feature requests (record label art, image preloading, and gallery prominence).

## 2. Technical Strategy

### A. Mobile-First Responsive Layout
- **CSS Hierarchy**: Update `src/index.css` and Tailwind classes to use mobile styles as the base (e.g., `flex-col`, `w-full`) and apply desktop styles via `md:` or `lg:` prefixes.
- **Navigation**: On mobile, convert the fixed sidebar into a collapsible "Archive" drawer or a togglable view to maximize space for the Player and Gallery.
- **Gallery Prominence**: On mobile, the `IMG_REPOSITORY` will move directly below the `OS_PLAYER_01` when a track is active, ensuring it is "front and center".

### B. Image Preloading & Loading Screen
- **Preloader Logic**: 
  - Scan `src/data.ts` for all cover art and photo URLs.
  - Implement a `LoadingScreen` component that uses `fetch` and the `Cache API` (or simple `Image` preloading) to ensure all assets are ready.
  - Use a progress bar in the "Brutalist" style (orange blocks, mono text).
- **Gating**: The `App` will only render the main UI once `isLoaded` is true.

### C. Vinyl Record Enhancements
- **Label Art**: Modify the `OS_PLAYER_01` record to include a `<img>` element in the center label.
- **Dynamic Change**: Ensure the image updates seamlessly when `currentTrack` changes.
- **Spin Animation**: The cover art will rotate in sync with the record.

### D. UX & Accessibility
- **Touch Targets**: Standardize all buttons to at least `48px` height.
- **Spacing**: Increase padding between the track list entries and control buttons.
- **Typography**: Ensure all text wraps correctly and uses `rem` for scaling.

## 3. Implementation Steps

1. **Step 1: Global Styles**: Update `index.css` with mobile-first resets and global border/spacing rules.
2. **Step 2: Loading Screen**: Build the `LoadingScreen` component and the asset scanning utility.
3. **Step 3: App Refactor**: Rewrite the `App` component's layout to be responsive.
4. **Step 4: Vinyl Component**: Extract or refactor the Vinyl player logic to support dynamic cover art.
5. **Step 5: Gallery Logic**: Ensure the gallery is prominent on mobile.
6. **Step 6: Git Workflow**: Commit and push changes.

## 4. Verification Plan
- **Mobile View**: Test on simulated iPhone/Android viewports in DevTools.
- **Preloading**: Verify the loading screen appears and finishes only when assets are cached.
- **Functionality**: Ensure song switching updates the record label and the gallery.
