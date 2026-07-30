# Dvij — Portfolio

A hand-built, deployable portfolio site. No templates, no framework, no build step.

## Stack

- **HTML / CSS / vanilla JS** — zero dependencies to install
- **Three.js** (CDN) — morphing point-cloud centerpiece (sphere → torus knot → box lattice …) that reshapes per section, layered over an animated wave grid
- **GSAP + ScrollTrigger** (CDN) — pinned horizontal project gallery, word-by-word hero reveal, scroll-velocity marquee, section counter + progress bar
- Bright "warm paper" theme, tangerine + cobalt accents, custom cursor, magnetic buttons

## Run locally

Fully static. Open `index.html`, or serve it:

```bash
python -m http.server 8000
# http://localhost:8000
```

## Deploy

Works as-is on any static host (Vercel / Netlify / GitLab or GitHub Pages) with **no build command**, output dir `./`.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Markup and content |
| `styles.css` | Theme, layout, responsive rules |
| `main.js` | Loader, cursor, Three.js scene, pinned gallery, scroll animations |

## Customize

- Theme colours: `--paper`, `--ink`, `--accent`, `--cobalt` in `styles.css`
- 3D shapes: the `shapes[]` array in `initThree()` (`main.js`); each section/card maps to one via its `data-shape` attribute
- Per-card accent: `--card-accent` inline style in `index.html`
- Content: edit sections directly in `index.html`
