Context & Tech Stack

Target Files/Directory: [Insert directory path, e.g., ./src/components and ./src/styles]

Framework/Stack: [Insert stack, e.g., React, TailwindCSS, Next.js]

Primary Issue: The layout breaks on mobile viewports (under 768px). Elements overlap, scaling is incorrect, and the UI/UX does not feel native or intuitive on touch devices.

Execution Directives: The "Mobile-First" Mandate
Do not attempt to patch the desktop layout to fit mobile screens. You must ensure the base styling targets mobile devices first, progressively enhancing for larger screens using standard breakpoints. Execute the following refactoring checklist:

1. Structural Layout & Overflow:

Identify and eliminate any hard-coded, fixed widths (e.g., width: 800px) causing horizontal scrolling. Replace them with fluid layouts (width: 100%, max-width, Flexbox, or CSS Grid).

Fix any overlapping absolute-positioned elements that break on smaller viewports.

2. Touch Targets & Accessibility (UX):

Ensure all interactive elements (buttons, links, navigation icons) have a minimum touch target size of 44x44 pixels.

Add adequate spacing (padding/margin) between interactive elements to prevent misclicks.

3. Typography & Scaling:

Implement fluid typography or adjust mobile font sizes to ensure readability without zooming.

Ensure proper line height (minimum 1.5) and text wrapping within containers.

4. Navigation & Forms:

If applicable, convert desktop-style navigation (e.g., horizontal top bars) into a mobile-friendly alternative (e.g., a bottom tab bar or a clean hamburger menu).

Ensure form inputs zoom correctly on iOS/Android (font size must be at least 16px to prevent auto-zoom) and utilize appropriate mobile keyboards (e.g., type="email" or type="number").

Required Output & Git Commands

Review the code and implement the necessary layout and UI fixes autonomously.

Refactor the CSS/styling to enforce the mobile-first hierarchy.

Once the layout is responsive and verified, execute the following commands to commit the fixes:

git add .

git commit -m "fix: refactor UI/UX for strict mobile-first responsiveness and accessibility"

git push origin [Insert Branch Name, e.g., main]

Constraints:

Do not alter the underlying backend logic or database schemas; constrain your fixes entirely to the presentation layer.

Maintain the existing brand identity and color palette while optimizing the spacing and structure.

this app is meant to focus on the memories of a past relationship, therefor the image gallery MUST be fronty and center when a song plays

Each song will have x amount of photos attached to it

please add the cover photo for the song playing to the record in the center like a real record and have it spin with the record and have it change for each song

Have all photos load on first load and store them in local storage, have a in-theme loading screen appear and gatekeep entrance until all photos have loaded and have entered local storage, this is to prevent constant calls to the same image