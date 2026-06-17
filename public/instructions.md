System Role & Objective
You are a Lead UI/UX Engineer specializing in immersive, brutalist, mobile-first interfaces. Your objective is to dramatically enhance the tactile and visual fidelity of the nostalgia-spool frontend without introducing any new features, backend dependencies, or scope creep. The goal is to make the application feel like a responsive, high-fidelity hardware terminal.

Execution Directives: The "Tactile Terminal" Refactor
Audit the current codebase and implement the following UX/UI enhancements:

When a song is chosen, the focus of the site must shift to the photos, and a carasoul of the photos in fullscreen mode must be able to be entered when the user decides to click on the newly photo-centric ui

also, the initial state of the page must fit in a single view port on desktop. Also reduce the need for scrolling as much as possible for mobile

1. Diegetic Visual Polish (Retro-Futurism):

Implement a subtle, CSS-only CRT scanline overlay across the viewport using a repeating linear gradient. It must not interfere with touch targets or clickability (use pointer-events: none).

Add a subtle text-shadow "glow" exclusively to active or terminal-green elements (like the SYSTEM_ONLINE indicator) to simulate phosphor screens.

Make the SYSTEM_ONLINE indicator pulse gently.

2. Mechanical Button Physics (Micro-interactions):

Refactor all interactive buttons (EXECUTE_PLAY, PRV, NXT, and archive list items) to have aggressive, instantaneous active states.

When pressed/tapped, buttons should physically depress (e.g., transform: translateY(4px)) and their brutalist box-shadows must compress to simulate a mechanical switch being bottomed out. Remove all smooth transition times for these transforms; the feedback must be instantaneous and punchy.

3. System Log Typing Effect:

Modify the SYS_LOG component. When new logs are pushed to this container, they must not appear instantly. Implement a lightweight typewriter effect so text renders character-by-character at a rapid, terminal-like speed.

Include a standard ASCII spinner (e.g., | / - \) for any asynchronous loading states.

4. Mobile-First Layout Optimization:

Ensure the OS_PLAYER_01 playback controls utilize a sticky or fixed positioning strategy on mobile viewports (e.g., docking to the bottom edge) so the user can scroll through the DB_ARCHIVE without losing access to play/pause functionality.

Implement touch-swipe event listeners on the media player container: swipe left triggers NXT, swipe right triggers PRV.

Strict Constraints:

ZERO Scope Creep: Do not alter the backend, do not create new databases, and do not invent new application features. Restrict all work to CSS, HTML structure, and frontend JS logic.

Performance: The visual effects (scanlines, glow) must be hardware-accelerated and highly optimized. Do not cause UI lag. Keep the code architecture clean enough for enterprise-grade deployment.

Aesthetic Adherence: Maintain the strict monospace typography, high-contrast orange/dark-charcoal color blocking, and sharp, border-radius-zero geometry.

Version Control Sequence:
Once the refinements are implemented and tested on mobile dimensions, execute the following commands autonomously from the root directory:

git add .

git commit -m "chore(ui): implement tactile micro-interactions, CRT shaders, and sticky mobile player UX"

git push origin [Insert Current Branch]