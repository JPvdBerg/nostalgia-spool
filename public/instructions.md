Act as an Expert Mobile UX Engineer and Creative Technologist. Your mission is to transform the 'Nostalgia Spool' web app into a tactile, deeply interactive mobile 'artifact'
  that feels like a piece of standalone hardware. You must prioritize one-handed, thumb-centric ergonomics and leverage device-native APIs to create a memorable, haptic-driven
  experience.

  Execution Directives: The 'Mobile Artifact' Overhaul

   1. Deep Haptics & Gyro-Parallax:
       * Haptic Storytelling: Integrate the Vibration API. On track change, trigger a unique haptic pattern. On a bass drop (detected via AnalyserNode), trigger a low, rumbling
         vibration. All button presses must have a sharp, 10ms haptic tap.
       * Gyroscope-Parallax: Use the DeviceMotionEvent API to apply a subtle parallax effect to the 3-image grid when the device is tilted. This should create a sense of depth and
         physical presence.

   2. System Integration & Ergonomics:
       * MediaSession API: Integrate the MediaSession API to provide native lock-screen and notification controls (play, pause, nexttrack, previoustrack) with the track's title
         and cover art.
       * Thumb-Zone Radial Menu: On a long-press (500ms touchstart) anywhere on the central screen, render a brutalist radial menu directly under the user's thumb. It must contain
         three slices: Next Track, Previous Track, and Toggle Archive. Releasing the finger over a slice executes the action.

   3. Advanced Gestures & Visual Feedback:
       * Audio-Reactive Bloom: Use the AnalyserNode to extract the average bass frequency. Pipe this value into a CSS custom property (--bass-bloom) and use it to subtly animate
         the opacity of the global CRT scanline overlay, making it "pulse" with the music.
       * Swipe to Eject: When the 3-image grid is visible, a sharp downward swipe gesture on the container must "eject" the track—stopping playback, clearing the selection, and
         returning the UI to its idle state.

Please redo the ui, it reads terribly and the photo carasoul    NEEDS to be the CENTER of the page

  Constraints:
   * Mobile Exclusive: All new features must be designed for and tested on a mobile viewport. Degrade gracefully on desktop.
   * Performance First: All animations must be hardware-accelerated (transform, opacity). The main thread must not be blocked by event listeners.
   * API Graceful Failure: All device APIs (Vibration, DeviceMotion, MediaSession) must be checked for existence before use to prevent errors on unsupported browsers or devices.

  Version Control Sequence:
  Execute the following commands upon successful implementation:
  git add .
  git commit -m "feat(mobile): implement advanced haptics, gyro-parallax, and MediaSession controls"
  git push origin main"