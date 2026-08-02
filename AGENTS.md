# AGENTS.md — The Robert H. Butter House Listing Site

## Project Overview

Single-page static marketing site advertising the **Robert H. Butter House** (303 S School St, Mayville, WI) for sale, **together with the antique collection inside it**. Everything lives in `index.html` — there is no build step, no framework, no backend. Open the file directly in a browser to view it.

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
- **HTMX via CDN** — only used for the contact form (`hx-post="/send-message"`). **That endpoint does not exist**; the form is decorative until a backend or form service is wired up.
- **Vanilla JS lightbox** at the bottom of `index.html`: it auto-collects every `<img>` on the page (except `#lightbox-img`) at `DOMContentLoaded`, so new images get click-to-zoom with zero extra work. The fade-in depends on a forced reflow (`void lightbox.offsetWidth`) between removing `hidden` and removing `opacity-0` — do not remove that line or the open animation breaks.

## Conventions

- **Image paths**: files and folders under `assets/` contain spaces. In `src`/`url()` attributes, spaces are written as **`%20`** (e.g. `assets/dining%20room/dining%20room%201.jpg`). Follow this when adding images.
- **Sections alternate backgrounds** in order: `bg-white` → `bg-victorian-cream`. Keep the alternation when inserting new sections. The nav has smooth-scroll anchor links; every nav `href="#x"` must have a matching `id="x"`.
- **Photo placement matters**: images live in folders by room (`assets/bedroom/`, `assets/bathrooms/`, etc.) and should be shown in the matching section. The master bath photos live in `assets/bedroom/` (not `assets/bathrooms/`) because they belong to the master suite.
- **Commit style**: short, lowercase, imperative summaries (e.g. `add image lightbox with fade-in/out transitions`). Commit in logical chunks when making multi-part changes. Assets are committed to git; `.DS_Store` is gitignored.

## Known Placeholders / TODOs for the Owner

- Phone `(555) 555-5555` (`tel:+15555555555`) and email `agent@example.com` in the Contact section are **placeholders** the owner will replace manually.
- The HTMX contact form needs a real backend or form service (e.g. Formspree) before it can actually send inquiries.
- No price or MLS details are shown — intentionally generic per the owner's request.
