System Role & Objective
You are a Lead Mobile Frontend Engineer and Creative Technologist. Your objective is to implement a suite of mobile-first, tactile micro-interactions into the nostalgia-spool frontend. You must abandon all desktop paradigms (like hover states or keyboard shortcuts) and focus exclusively on touch mechanics, device APIs, and thumb-friendly ergonomics. The app must feel like a heavy, responsive piece of portable hardware.

Execution Directives: The "Mobile Machine" Update
Audit the frontend architecture and implement the following features without altering the existing backend infrastructure at C:\Users\drunk\Documents\nostalgia-spool:

1. Haptics & Diegetic Feedback (The Touch Layer):

Vibration API: Implement navigator.vibrate() for touch events. Add a heavy haptic response (e.g., 50ms) to primary controls like EXECUTE_PLAY and HALT. Add micro-haptics (10ms) to list items in the DB_ARCHIVE. Fail gracefully on iOS devices that do not support this API.

Phosphor Touch Impact: Remove any custom cursors. Implement a global touchstart event listener. When the screen is tapped, spawn a sharp, 0px border-radius div (a phosphor block) at the clientX/clientY coordinates that expands and fades out within 200ms.

Hardware Mute Toggle: Add a brutalist toggle switch to the top header. When toggled off, mute all diegetic UI sound effects (if implemented) but maintain the haptic feedback.

2. The Radial Command Menu (Ergonomics):

Implement a global contextmenu or long-press (touchstart with a 500ms delay) event.

Triggering this must dim the background and render a stark, brutalist radial menu (similar to a gaming "weapon wheel") centered exactly at the user's touch coordinates.

The wheel must contain quick actions (e.g., Next Track, Previous Track, Clear Logs). Releasing the touch over a slice executes the command.

3. Responsive Terminal Visuals:

Responsive ASCII Progress: Refactor the media player progress bar to an ASCII text string ([████░░░░]). Write logic to dynamically set the maximum character length of this string based on the active mobile viewport width, ensuring it never wraps to a second line.

Safe-Area Notifications: Implement a notification system for track changes. These brutalist toast notifications must slide down from the top of the screen. You MUST use CSS env(safe-area-inset-top) to ensure the notification clears mobile hardware notches/camera cutouts.

Interruptible Boot: Add a simulated 1.5-second terminal boot sequence on initial page load. Crucially, attach a touchstart listener to the overlay that allows the user to instantly bypass the sequence and access the UI.

4. Swipe Architecture:

Ensure the OS_PLAYER_01 is permanently fixed to the bottom of the viewport.

Implement touch swipe logic (touchstart and touchend delta calculations) allowing the user to seamlessly swipe horizontally between the DB_ARCHIVE list, the IMG_REPO, and the SYS_LOG.

Strict Constraints:

Mobile-First Exclusivity: Ensure all active states trigger on :active or touch events, not :hover.

Performance: Do not block the main thread with heavy JS animations. Use CSS transitions for the radial menu and touch impacts.

Styling: Maintain the stark, unrounded, heavy-border brutalist styling.

Version Control Sequence:
Execute the following commands upon successful local implementation and testing:

git add .

git commit -m "feat(mobile): implement haptic feedback, radial touch menu, and mobile-first gesture architecture"

git push origin main