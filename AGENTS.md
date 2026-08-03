# AGENTS.md — The Robert H. Butter House Listing Site

## Project Overview

Single-page static marketing site advertising the **Robert H. Butter House** (303 S School St, Mayville, WI) for sale, **together with the antique collection inside it**. All markup lives in `index.html` — no framework, no backend. The only build step is image generation: `npm install && npm run build` produces the gitignored `img/` folder from `assets/`, and is required before the site works locally (Netlify runs it automatically on deploy).

## Critical Facts (do not get these wrong)

- **Build year is 1893.** Some old listing snippets (including one provided by the owner) say 1886 — **that is wrong**. The Wisconsin Historical Society's Architecture & History Inventory record (#46371) lists 1893, and the owner has confirmed the Historical Society record is authoritative. Always use 1893 (or "c. 1893").
- Historic name: **Robert H. Butter House**. Style: **Queen Anne** Victorian, clapboard.
- **3 bedrooms, 2½ baths, ~2,650 sq ft, 0.67-acre lot, 4-car detached garage.**
- **The downstairs bathroom is the half bath.** The upstairs bath (shower, brass high-tank toilet, mosaic floor) and master en-suite are full baths.
- The **master bedroom en-suite bath** photos show one room from two angles — it is not two separate bathrooms.
- Previous owner **Karen Hale** collected the Victorian / Art Nouveau antiques; **the collection is sold with the house**. She is named on the site with the owner's approval.
- Amenities to mention when relevant: new roof, hot water heat, central air.

## Tech Stack

- **Tailwind CSS via Play CDN** (`https://cdn.tailwindcss.com`) with an inline `tailwind.config` extending the theme. Custom palette: `victorian-wood` `#2e1f1a`, `victorian-cream` `#f3ece4`, `victorian-mauve` `#a3544b`, `victorian-green` `#2a3d2e`, `victorian-gold` `#d4b878`. Fonts: Playfair Display (serif), Raleway (sans).
- **Netlify Forms** — the contact form (`<form name="inquiry" data-netlify="true">` with honeypot `netlify-honeypot="bot-field"`) is parsed by Netlify at deploy time; submissions show up in the Netlify dashboard under Forms, and email notifications must be configured there (Configuration → Notifications → Form submission notifications). Vanilla JS (`initContactForm`, in the same bottom script block) intercepts submission to show an inline confirmation via `fetch`; without JS, visitors get Netlify's default success page. (HTMX was removed — no longer a dependency.)
- **Image pipeline (`npm run build`)** — `scripts/build-images.mjs` (sharp, the one devDependency) walks `assets/` recursively and writes responsive variants to the gitignored `img/` folder: each photo → 480/960/1440/2000px-wide (never upscaled; smaller sources also emit their native width) progressive JPEG (mozjpeg q80) + WebP (q75), with slugged filenames (lowercase, spaces → hyphens: `assets/house exterior/front view.jpg` → `img/house-exterior/front-view-960w.webp`). It also writes `img/manifest.json` (source path → widths/dimensions) to consult when authoring markup. `netlify.toml` runs the same command on deploy (`publish = "."`); `package-lock.json` stays committed. Builds are fingerprint-guarded: a sha256 over the `assets/` contents, the script's own source, and the installed sharp version is stored in `img/.build-hash`, and repeat builds with no changes skip the rebuild — `npm run build -- --force` forces a full one. On Netlify, the local build plugin `plugins/persist-img/` restores `img/` from the build cache pre-build and saves it post-build, so deploys that don't touch photos skip image generation entirely; use Netlify's "Clear cache and deploy" button as the escape hatch if the cache ever goes stale.
- **Responsive markup** — every photo is a `<picture>`. A WebP `<source>` srcset plus a JPEG-fallback `<img>` srcset, both with `sizes`, hand-tuned per layout context, plus `width`/`height`, `loading="lazy"`, `decoding="async"`, and `data-full-webp`/`data-full-jpg` pointing at the largest variant (the lightbox depends on the `data-full-*` attributes). The hero is an absolutely-positioned `<picture>` behind the hero content (not a CSS background) with `fetchpriority="high"` and a matching `<link rel="preload" imagesrcset>` in `<head>` for LCP.
- **Vanilla JS lightbox** at the bottom of `index.html`: it auto-collects every `<img>` on the page (except `#lightbox-img`) at `DOMContentLoaded`, so new images get click-to-zoom with zero extra work. `showLightboxImage()` paints the clicked thumbnail's `currentSrc` (already cached) instantly, then swaps in the `data-full-*` full-size variant after a double `requestAnimationFrame` — the browser keeps painting the thumbnail while the full image loads. The fade-in depends on a forced reflow (`void lightbox.offsetWidth`) between removing `hidden` and removing `opacity-0` — do not remove that line or the open animation breaks.
- **Vanilla JS nav toggle**: below `xl` (1280px) the desktop link bar is replaced by a hamburger button (`#nav-toggle`) that shows/hides `#mobile-menu`; the logic (`initMobileNav`) lives in the same bottom script block and inits alongside the lightbox at `DOMContentLoaded`. Keep mobile menu links in sync with the desktop nav links.

## Conventions

- **Image paths**: originals stay under `assets/` (folders still contain spaces) and are committed to git. Page markup references only generated `img/` paths, which are slugged (lowercase, hyphens) so srcset needs no `%20` encoding. `img/` is gitignored and regenerated wholesale by the build — never edit it by hand. When adding a new photo, drop it in the right `assets/` folder, run `npm run build`, and copy the `<picture>` pattern from an existing image (check `img/manifest.json` for its available widths).
- **Sections alternate backgrounds** in order: `bg-white` → `bg-victorian-cream`. Keep the alternation when inserting new sections. The nav has smooth-scroll anchor links; every nav `href="#x"` must have a matching `id="x"`.
- **Photo placement matters**: images live in folders by room (`assets/bedroom/`, `assets/bathrooms/`, etc.). The master en-suite bath photos live in `assets/bedroom/` (not `assets/bathrooms/`) but are **displayed in The Baths section**, which shows every bath in the home; the Master Suite section sits directly above The Baths.
- **Commit style**: short, lowercase, imperative summaries (e.g. `add image lightbox with fade-in/out transitions`). Commit in logical chunks when making multi-part changes. Assets are committed to git; `.DS_Store` is gitignored.

## Known Placeholders / TODOs for the Owner

- No price or MLS details are shown — intentionally generic per the owner's request.
