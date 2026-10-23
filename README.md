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

## Deployment

Repository: `AHBIIOvO/ahbiiovo.github.io` (public).

In Settings → Pages, select **GitHub Actions** as the publishing source. Pushes to `main` deploy the contents of `dist/` using `.github/workflows/pages.yml`. Only project images and website source are included; personal documents must not be added.

## Editing

- `dist/index.html`: project cards and introduction.
- `dist/museum.html`, `dist/fps.html`, `dist/outrun.html`: independent project detail pages.
- `dist/styles.css`: responsive layout and visual style.
- `dist/app.js`: language switching, image previews and video selection.
- `dist/assets/`: project images and favicon.

Project images and descriptions come from the supplied portfolio. Publication: https://doi.org/10.1109/VRW70859.2026.00009 (fourth-author contribution). Study findings retain the source's sample limitations.

Video IDs: `BV1oBssenEVH` (109-second demo), `BV1UXsVe3EyK` (21-second animation update). Bilibili controls player availability and playback quality; direct links remain visible as a fallback.

Original project content and media © AHBIIOvO. No general license is granted to the portfolio artwork or media.
