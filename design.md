# Design System — photos by George

## Inspiration
Editorial/magazine-feel inspired by InStyle magazine layout. Full-bleed imagery, clean white space, bold serif headlines.

## Color Palette
- `--bg`: #FFFFFF (white)
- `--surface`: #F8F8F6 (off-white for cards/panels)
- `--border`: #E5E5E5 (light gray)
- `--text-primary`: #0A0A0A (near-black)
- `--text-secondary`: #6B6B6B (gray)
- `--text-muted`: #A0A0A0 (light gray)
- `--accent`: #C8A96E (warm gold — editorial accent)
- `--accent-dark`: #A8893E

## Typography
- **Display/Headlines:** Playfair Display (serif) — used for site name, page titles, hero text
- **Body/UI:** Inter (sans-serif) — used for nav, labels, body text, buttons
- Font sizes: 12px / 14px / 16px / 20px / 24px / 32px / 48px / 64px / 80px
- Letter spacing: tight on large display text, normal on body

## Layout
- Max content width: 1400px, centered
- Grid: asymmetric masonry for photo grids, 2–4 columns depending on viewport
- Generous whitespace — 80px+ section padding
- Full-bleed hero (100vw × 100vh) with overlay text

## Navigation
- Minimal, fixed top nav: site name left (serif), category links right (sans, uppercase, tracking-widest)
- Thin 1px border-bottom on scroll, otherwise transparent over hero
- No hamburger menus — keep it clean

## Components
- **Hero Slideshow:** Full viewport, crossfade transition (1.5s), no controls visible by default, subtle dot indicator bottom-center
- **Photo Grid:** Masonry layout, photos clickable to lightbox, hover shows subtle overlay with title
- **Category Cards:** Landscape photo with category name overlaid, hover zoom effect
- **Admin Panel:** Clean white dashboard, table/grid of photos, drag-to-reorder, toggle favorite
- **Buttons:** Minimal — outlined or text-only, no heavy fills except primary CTA
- **Lightbox:** Black overlay, large photo, arrow navigation

## Motion
- Hero slideshow: CSS crossfade, 5s per slide, 1.5s transition
- Page transitions: subtle fade
- Photo hover: scale(1.03) on image, 300ms ease
- Nav link hover: underline slide-in from left

## Admin UI
- Protected `/admin` route
- Sidebar with category list
- Main area: photo grid with upload, delete, favorite toggle
- Upload: drag-and-drop area + file picker
- Clean table for managing photos per category
