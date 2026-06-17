System Role \& Objective

&#x20;     You are an autonomous, expert Full-Stack Engineer and UI/UX developer. Your objective is to execute a three-phase operation:



&#x20;     Build a new frontend web interface adhering strictly to a specific neo-brutalist / terminal aesthetic.



&#x20;     Integrate this frontend with an existing local backend.



&#x20;     Commit and push all changes to a specified remote repository via CMD Git commands.



&#x20;     Phase 1: Frontend Construction (Strict Visual Adherence)

&#x20;     You have access to a reference file named "image\_38a663.jpg". You must recreate this interface exactly, pixel-for-pixel, utilizing HTML, CSS, and your preferred modern

&#x20;     JavaScript framework (e.g., React, Vue, or Vanilla JS).



&#x20;     Implement the following design specifications based on the reference:



&#x20;     Theme \& Aesthetic: High-contrast, dark mode, terminal-inspired neo-brutalism. Hard edges, zero border-radius on containers, visible structural borders (dark grey/black),

&#x20;  and

&#x20;     stark color blocking.



&#x20;     Typography: Strict use of Monospace fonts (e.g., Courier New, Consolas, or similar) for all text elements to mimic a CLI environment.



&#x20;     Color Palette:



&#x20;     Background: Deep charcoal/almost black.



&#x20;     Accents \& Highlights: Bright, stark Orange/Red (approx #FF4500).



&#x20;     Text: Muted grey for inactive elements, stark white for active text, bright terminal green for status indicators.



&#x20;     Layout Structure:



&#x20;     Top Header: Text NS\_SPOOL // VER\_6.17.2026 on the left. Status indicator SYSTEM\_ONLINE (in green) and a timestamp on the right. Top and bottom borders required.



&#x20;     Left Column (DB\_ARCHIVE // 05\_ENTRIES): A list view of tracks (e.g., "SUN-SOAKED SUMMERS"). Must include index numbers, titles, and years. The active/hover state must

&#x20;  invert

&#x20;     the background to orange and the text to black.



&#x20;     Center Column (OS\_PLAYER\_01): The primary media player. Must feature a large, dark grey circular element (a record/spool) with a bright orange center label. Below the

&#x20;  graphic,

&#x20;     implement playback controls: 0:00 / 0:00 timer, and a blocky button layout for PRV, EXECUTE\_PLAY (solid orange background), and NXT.



&#x20;     Right Column Top (IMG\_REPOSITORY): A grid of image placeholder blocks. These blocks must have thin borders and contain the text ERR\_404 in the top left corner of each

&#x20;  block.



&#x20;     Right Column Bottom (SYS\_LOG): A terminal output window displaying simulated or actual system logs (e.g., \[19:42:01] Loading binary...).



&#x20;     Bottom Footer: A terminal input line reading ROOT@NS\_SPOOL:\~$ NOSTALGIA\_SEQUENCER --ACTIVE --DEBUG=OFF.



&#x20;     Phase 2: Backend Integration



&#x20;     Target Directory: C:\\Users\\drunk\\Documents\\nostalgia-spool



&#x20;     Action: Analyze the existing backend infrastructure in this directory.



&#x20;     Wiring: Map the existing backend endpoints/data streams to the new frontend state. Specifically:



&#x20;     Wire the DB\_ARCHIVE list to fetch track metadata from the backend.



&#x20;     Wire the OS\_PLAYER\_01 controls to trigger the corresponding audio playback logic.



&#x20;     Wire the SYS\_LOG to output real backend network requests and state changes if possible, otherwise map it to frontend lifecycle events.



&#x20;     Phase 3: Version Control \& Deployment

&#x20;     Once the application is stable and the frontend and backend are successfully wired, execute the following CMD git commands sequentially from the root directory

&#x20;     (C:\\Users\\drunk\\Documents\\nostalgia-spool) to push the code:



&#x20;     git status (to verify changes)



&#x20;     git add .



&#x20;     git commit -m "feat: Implement brutalist frontend UI and wire to existing backend"



&#x20;     git remote set-url origin \[https://github.com/JPvdBerg/nostalgia-spool](https://github.com/JPvdBerg/nostalgia-spool) (to ensure the correct remote is targeted)



&#x20;     git push origin main (if the default branch is master, adjust to git push origin master)



&#x20;     Constraints \& Guidelines:



&#x20;     Do not ask for permission to execute file reads/writes within the specified directory; proceed autonomously.



&#x20;     Ensure all CSS styling uses native CSS variables for the color palette to allow easy adjustments.



&#x20;     If the backend is missing endpoints required by the visual reference in "image\_38a663.jpg", generate mock data locally in the frontend to ensure the UI exactly matches the

&#x20;     image.



&#x20;     If encountering a merge conflict during the git push, abort the push, output the conflict details, and await user intervention. look at the newest screenshot in the

&#x20;  screenshot

&#x20;     folder for reference use @C:\\Users\\drunk\\Documents\\nostalgia-spool\\public\\pro-brutalist.html as a starting point, it is awesome!

