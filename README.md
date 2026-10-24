# AHBIIOvO · Portfolio

Personal portfolio for AHBIIOvO, featuring game development and interactive experiences.

**Production URL:** https://ahbiiovo.github.io/

## Content

- AI-Driven VR Museum: environment, interaction, Convai integration and research contribution.
- First-Person Shooter: independent development, Blender animation pipeline, physical ballistics and hit feedback.
- OutRun: multi-camera gameplay, architecture, rendering and A* navigation.
- A card-based homepage, with a separate detail page for each project (`museum.html`, `fps.html`, `outrun.html`).
- English / Chinese copy and keyboard-accessible image previews.
- Two Bilibili videos loaded only after a visitor clicks the player or video selector. Video bytes are served by Bilibili, not this repository.

## Preview

Serve `dist/` using any static server, for example:

```sh
python -m http.server 8765 --directory dist
```

The website has no build step, dependencies, external fonts or analytics. All images and styles are local.

You can also open `dist/index.html` directly in a browser. The homepage uses ordinary deferred scripts and does not require a server or a package installation.

Work locally until the user explicitly requests publication. A reminder to review the site is not permission to push or deploy.

## Deployment

Repository: `AHBIIOvO/ahbiiovo.github.io` (public).

In Settings → Pages, select **GitHub Actions** as the publishing source. Pushes to `main` deploy the contents of `dist/` using `.github/workflows/pages.yml`. Only project images and website source are included; personal documents must not be added.

## Editing

- `dist/index.html`: homepage structure, text logo, cat stage and introduction.
- `dist/home.css`: homepage colors, responsive layout, alternating project cards and mascot animation.
- `dist/home.js`: homepage language switching, project rendering and the floating back-to-top control.
- `dist/cat.js`: sleep, wake stretch, gaze, grooming, run, jump and upward-reaching states. Desktop waits for the first mouse movement, then sleeps for one more second and performs a 1.9-second quadruped stretch before pursuing. Compact/touch wakes automatically without roaming. Running accelerates to 480px/s and brakes before stopping. Games and Interactive share a single walking region with its top above Games; Interactive has no separate walking surface. Experiences, work labels and the divider remain platforms. Reaching lasts up to 2.23 seconds (0.5 seconds shorter), then waits for another meaningful pointer movement. A 24px follow radius keeps tiny pointer changes from interrupting the pose or moving the feet; gaze still tracks the live pointer. Reduced motion uses a static cat, and offscreen animation is paused.
- `dist/cat-sprites.js`: the supplied character artwork with pose-specific head-height normalization. Grooming reuses the exact default head/body geometry, with a lifted paw and subtle rotation, without scaling the cat; switching between these identical body images is immediate to avoid faded double silhouettes. Sleeping splits the original full-size head from the torso and scales only the torso by 0.5. The original profile head is mounted on an independently articulated quadruped stretch: forepaws step and plant, chest lowers, hips rise, then weight returns and the head lifts. The head scale stays fixed throughout. Run gait frames change cleanly without ghosted crossfades; direction changes keep the short front-facing bridge. Reaching head height is normalized too, and its gentle rocking no longer stretches the whole figure. All awake poses use the same vertical oval eye design and painted iris, preserving perspective and parallel gaze.
- The renderer has exactly one shared tail behind every pose. Root motion, seven joint angles/velocities, travelling wave phase and length persist through pose changes and direction reversals. Running eases the tail length from 196 to 147 native units (about three quarters); other poses recover the longer length gradually. Angular speed limits and damped root/joint motion prevent abrupt switches, while the softer tip follows the root with delay. Source tails are masked. The original sheet and earlier cutout remain at `assets/cat-reference.png` and `assets/cat-cutout.png`; the active raster is `assets/cat-clean.png`, without a white outer contour or matte fringe. No third-party animation assets are included.
- Jumping and landing use an articulated quadruped with the supplied profile head and common oval eyes. Chest, hips, head and four legs have independent trajectories; descending past the apex lowers the face and extends the forepaws below the tucked hind legs. A downward step enters the descent earlier. The head keeps a fixed 1.08 scale. Landing lowers the hips to absorb contact, preserves facing and shares the same rig to avoid a sprite swap. The old whole-SVG horizontal-speed tilt is removed.
- Jumping and landing retain the compact 147-unit tail. Only the tail root receives the hip/spine direction and velocity balance drive, scaled gently by jump height. Every subsequent joint follows a delayed sample of its parent's actual angle, with a small local rest bend and damped angular motion. The turn therefore travels physically along the chain instead of seven joints independently chasing a prescribed flight pose. Persistent angles, velocities and a bounded 0.6-second history carry the motion through apex, descent and landing. There is no looping airborne wag; ground poses and length recover smoothly.
- Reaching mirrors the complete pose toward the pointer, including the paw and shared tail attachment; gaze remains aligned with the pointer. A small center deadband preserves the current facing during tiny pointer movements without restarting the reaching animation.
- `dist/projects.js`: project data. Add an entry to this array to add a homepage card; numbering, count and left/right alternation update automatically. Include an existing detail-page path and a real project screenshot.
- Compact/touch cats remain in place while continuing their idle and grooming actions. Click, tap or keyboard activation gives a 2.2-second belly roll with closed eyes, subtle four-paw flutter and a gentle sway; repeated activations extend the current pose without restarting its entry. Midair clicks wait for landing. Independent randomized meow/heart particles float upward with a 380ms click cooldown and automatic cleanup. Petting suspends pursuit, and reduced motion uses a timed still pose with fading feedback. The cat is exposed as an accessible button.
- The introduction and Explore divider/link use one shared text inset and stack together at the same breakpoint. The project count omits its leading zero. The floating back-to-top uses a compact Top label, a thin horizontal rule and an upward arrow; there is no lower text panel. Its accessible label remains localized.
- Detail pages use a larger reading scale, consistent stroke icons and the homepage's slate palette. Photo corner arrows are removed while click-to-enlarge remains. On phones, museum images display as a single full-width column.
- `dist/shared.css` / `dist/shared.js` own the common page width, jump-link hover/divider treatment and floating back-to-top control on all four pages. Figure labels and blue current-project counters are consistent across the detail pages.
- Belly rolls use an intact supplied belly-up drawing, with one uniform scale and no separately positioned head/torso; only small original-art limb patches articulate. Re-clicking during the return phase eases back into the comfortable pose. The tail's parent-following chain also drives ground direction changes and run-to-idle raising, including delayed local curvature changes.
- `dist/museum.html`, `dist/fps.html`, `dist/outrun.html`: independent project detail pages.
- `dist/styles.css`: project-detail layouts and visual style.
- `dist/app.js`: project-detail language switching, image previews and video selection.
- `dist/assets/`: project images and favicon.

Project images and descriptions come from the supplied portfolio. Publication: https://doi.org/10.1109/VRW70859.2026.00009 (fourth-author contribution). Study findings retain the source's sample limitations.

Video IDs: `BV1oBssenEVH` (109-second demo), `BV1UXsVe3EyK` (21-second animation update). Bilibili controls player availability and playback quality; direct links remain visible as a fallback.

Original project content and media © AHBIIOvO. No general license is granted to the portfolio artwork or media.

- Downward routes launch directly from the current position toward the cursor, ignoring only the departure surface until landing. Distant landing targets are limited to the reachable portion of the lower platform, then approached on foot.
- Detail-page navigation keeps All projects in the top breadcrumb. At the bottom, only the first project returns to All projects; later projects link to their predecessor with a matching PREVIOUS PROJECT label and compact All projects-sized title/arrow. The final project shows a static No more projects message instead of a cycling next link. Navigation labels and dividers remain static while the title and arrow scale together as one group. Current-project numerals use brighter blue and captions use FIGURE. The publication link uses a close top rule that ends slightly before the arrow. Watch on Bilibili uses a left vertical rule. Both rules remain static on hover.

- Previous-project names use 14px text and 20px icons on desktop (14.5px text and 22px icons on compact screens), with a 3px label/title gap. Mobile project navigation keeps previous and next entries side by side, with one shared vertical separator between them; compact sizing remains scoped to that breakpoint.

- Previous/next labels align at the top on desktop and compact screens. All projects arrows point up-left; previous/next arrows point left/right. End-of-list text is 20px on desktop and compact screens. The shared back-to-top transition explicitly outranks the detail-page generic button transition, preserving the same 380ms slide and hover scaling as the homepage.

- Compact project navigation right-aligns the previous label/title and left-aligns the next label/title, with equal 36px gaps from the central vertical divider. Long labels may wrap on narrow phones without changing font sizes.

- Compact next-project titles use 25px text / 30px arrows, while previous titles retain their smaller hierarchy at 14.5px / 22px. Desktop title/icon sizes are unchanged.

- Back-to-top foreground and background remain unchanged across hover, focus and click; the slide/scale animation and keyboard focus outline are retained.

- Bilibili embedding follows the minimal documented HTTPS external-player endpoint with bvid and autoplay=0, scrolling disabled and fullscreen enabled. Optional p/danmaku/poster parameters and the explicit referrer-policy override were removed during a connectivity check. The official player page loads in the test browser, but media playback could not be verified successfully; see tmp/home-v24/verification.md for environment-specific findings.
