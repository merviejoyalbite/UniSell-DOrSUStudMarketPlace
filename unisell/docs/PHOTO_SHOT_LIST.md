# Seed photo shot list (optional future replacement)

These are the real photos the team could take if it later replaces the current
sample illustrations for the 18 seeded listings. The app expects each file in
`server/public/images/` and the mock API serves it from
`/images/<file>.jpg`.

> **Photo status:** the 18 seed listings currently use original AI-generated
> sample illustrations. The SVG sources are in `assets/seed-illustrations/`,
> and `npm run seed-images` converts them to the JPEGs in
> `server/public/images/`. The app labels them with a **Sample image** badge.
> Use this shot list only if the team decides to replace the illustrations with
> real phone photos later.

## Files to take

Put the raw phone photos in `raw-photos/` with these exact names. The
`npm run photos` script resizes each one to a maximum width of 800px and writes
the matching JPEG into `server/public/images/`.

| ID | Title | Category | Exact file name |
| --- | --- | --- | --- |
| 1 | Calculus: Early Transcendentals (8th Edition) | Textbooks | `01-calculus-early-transcendentals-8th-edition.jpg` |
| 2 | DOrSU PE Uniform (Medium) | Uniforms | `02-dorsu-pe-uniform-medium.jpg` |
| 3 | TI-84 Plus CE Graphing Calculator | Gadgets | `03-ti-84-plus-ce-graphing-calculator.jpg` |
| 4 | Laboratory Gown (Small) | Uniforms | `04-laboratory-gown-small.jpg` |
| 5 | Homemade Brownies (Box of 6) | Food | `05-homemade-brownies-box-of-6.jpg` |
| 6 | Electric Fan (12 inch, dorm size) | Dorm Items | `06-electric-fan-12-inch-dorm-size.jpg` |
| 7 | Fundamentals of Nursing (11th Edition) | Textbooks | `07-fundamentals-of-nursing-11th-edition.jpg` |
| 8 | Casio fx-991EX Scientific Calculator | Gadgets | `08-casio-fx-991ex-scientific-calculator.jpg` |
| 9 | DOrSU Lanyard with ID Case | Others | `09-dorsu-lanyard-with-id-case.jpg` |
| 10 | IT Fundamentals Review Notes (Photocopy) | Textbooks | `10-it-fundamentals-review-notes-photocopy.jpg` |
| 11 | Mini Rice Cooker (1.2L) | Dorm Items | `11-mini-rice-cooker-1-2l.jpg` |
| 12 | Poster / Tarpaulin Printing (per sq ft) | Others | `12-poster-tarpaulin-printing-per-sq-ft.jpg` |
| 13 | PE Shoes (Size 7, White) | Uniforms | `13-pe-shoes-size-7-white.jpg` |
| 14 | Desk Lamp with USB Port | Dorm Items | `14-desk-lamp-with-usb-port.jpg` |
| 15 | Arduino Uno Starter Kit | Gadgets | `15-arduino-uno-starter-kit.jpg` |
| 16 | Accounting Workbook (Brand New) | Textbooks | `16-accounting-workbook-brand-new.jpg` |
| 17 | Iced Coffee Beans (250g, Local Roast) | Food | `17-iced-coffee-beans-250g-local-roast.jpg` |
| 18 | Extension Cord (4 sockets, 3m) | Dorm Items | `18-extension-cord-4-sockets-3m.jpg` |

## Shooting guide

- Take the photo yourself with a normal phone camera. These must be real photos
  of the actual item, taken by the team. Do not download, hotlink, screenshot or
  generate stock, internet or AI images.
- Use items you already own or borrow them from a classmate. The point is to
  show everyday DOrSU student items, not a professional product catalogue.
- Shoot in daylight near a window. Avoid harsh flash and coloured room lights.
- Put one item per photo, centered on a table, desk, bed or classroom surface.
  A boarding-house or dorm setting is fine and makes the feed feel local.
- Keep the background plain and uncluttered. A wall, bedsheet or clean tabletop
  works better than a busy room.
- Use portrait or square orientation. Do not add filters, stickers, text or a
  watermark.
- No faces, ID numbers, student numbers, addresses or other private information.
- No brand logos beyond the item itself. Do not stage extra branded packaging.
- Keep the item in the same condition described in the listing (for example, the
  brownies should look freshly baked and the PE uniform should be clean).
- Take a few shots and pick the clearest one. The app resizes to 800px wide, so
  the item should fill most of the frame.

## Process

1. Create `raw-photos/` if it does not exist.
2. Copy the photos there using the exact file names in the table. Supported
   input formats are JPG, PNG, WebP, HEIC/HEIF and TIFF; the script always
   writes JPEG output.
3. Run `npm run photos`.
4. Start the API with `npm run api`. The updated script serves
   `server/public/images/` as static files.
5. Reload the app. Each seeded listing should show its photo on Home, Search,
   Saved, Profile/My Listings and Listing Details.
6. If a file is missing or cannot be loaded, the app shows the category icon
   instead of crashing.

The raw phone photos are Git-ignored. The resized files in
`server/public/images/` should be committed so the demo works from a fresh
clone. A production system would upload photos to cloud storage instead of
serving them from the mock API.

## Current sample illustrations

The seeded listings use clean vector illustrations of the actual items, not
photos. The editable SVG sources are in `assets/seed-illustrations/`, and the
API serves the generated JPEGs from `server/public/images/`.

- Rebuild the JPEGs with `npm run seed-images`.
- The app shows a small **Sample image** badge on these listings.
- If an image file is missing, the app falls back to the category icon without
  crashing.
- Running `npm run photos` with real files in `raw-photos/` is still available
  if the team later replaces the illustrations with team-taken photos.
