System Role & Objective
Act as an Expert UI/UX Engineer. Rebuild the frontend using the exact layout in watermarked_img_443166668200279193.png. Integrate it with the local backend at C:\Users\drunk\Documents\nostalgia-spool, then push via Git.

Phase 1: UI/UX Construction

Aesthetic: Neo-brutalist dark mode. Monospace typography. Colors: Charcoal background (#151515), stark white text, bright orange accent (#FF4500). Apply a global CSS CRT scanline overlay (pointer-events: none).

Left Column (DB_ARCHIVE): Track list. Active track must invert to a solid orange background with black text.

Right Column: Top contains IMG_REPOSITORY (placeholder grid). Bottom contains SYS_LOG (terminal output).

Center Column (OS_PLAYER_01 & The Core Mechanic):

Idle State: Display a large circular record/spool graphic in the center.

Active State (PLAY): When EXECUTE_PLAY is triggered, dynamically unmount the record graphic. Replace it with a horizontal flex container holding 3 images fetched from the current track's repository. Give these images thick orange borders.

Player Controls (Bottom of Center): Embed track metadata (Title, Artist) on the left, timer on the right. Below this, render the brutalist control block: PRV, EXECUTE_PLAY (solid orange), and NXT.

Phase 2: Backend Wiring

Target: C:\Users\drunk\Documents\nostalgia-spool

Wire the DB_ARCHIVE to backend track endpoints.

Wire the OS_PLAYER_01 state to dynamically fetch and render the 3-image grid upon playback.

Pipe backend console events to the SYS_LOG component.

Phase 3: Version Control
Execute these CMD commands sequentially from the root directory:

git add .

git commit -m "feat: implement dynamic image replacement UI and CRT brutalist aesthetic"

git remote set-url origin [https://github.com/JPvdBerg/nostalgia-spool](https://github.com/JPvdBerg/nostalgia-spool)

git push origin main

Constraints

Mobile-First: Ensure the CSS grid collapses gracefully. On mobile, dock the player controls to the bottom viewport edge.

Transitions: Use harsh, 0ms transitions for button states to maintain the mechanical feel.