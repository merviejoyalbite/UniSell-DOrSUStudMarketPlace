# UniSell × Figma Make — Design Gap Audit

**Phase:** 0 (audit) — Phase 1 tokens/components/navigation implemented
**Date:** 2026-11-04 (Phase 3 update: 2026-11-12)
**Reference:** live Figma Make site `https://gale-bats-78360910.figma.site/`
**Status:** Phases 1–2 implemented and typechecked. Phase 3 complete: the
`reservations` resource, the buyer reserve flow, the seller dashboard,
notifications, messages/chat and reviews are all implemented. The questions in §6
are answered by the defaults recorded there.

---

## 0. Reference inventory and caveat

### 0.1 `design-reference/`

`design-reference/` (and `design-reference/figma-make-code/`) **does not exist** in
`unisell/`, in `Default Project/`, or anywhere else in the workspace. It was
searched for by folder name and by image extension. No screenshots or exported
code are available to compare byte-for-byte.

The audit therefore uses the **live Figma Make site**, which is reachable, plus
the written spec in the request. All Figma values below were read from the live
DOM (computed styles) at the mobile frame width (768–785 px), in both light and
dark mode.

If the screenshots/export are supplied later, this document should be re-checked
against them; the token values should not change much, but pixel spacing might.

### 0.2 Screens reviewed on the live site

| Route | Screen |
| --- | --- |
| `#login` | Login |
| `#signup` | Sign Up |
| `#forgot-password` | Reset your password |
| `#home` | Home / Marketplace (light + dark) |
| `#saved` | Saved items |
| `#sell` | Post a listing |
| `#search` | Search results + filter panel |
| `#profile` | Profile |
| `#profile-shop` | Profile → Seller shop |
| `#dashboard` | Seller dashboard |
| `#notifications` | Notifications |
| `#messages` | Messages list |
| `#review/:listingId?reservation=` | Rate and review |
| `#my-reviews` | Profile → My Reviews |
| `#settings` | Settings |
| `#design-system` | Design System |
| `#components` | Components |
| `#accessibility` | Accessibility |

The chat route now opens from a conversation (`#chat/l4`) and was reviewed live:
header with verified role, pinned "Chatting about" card, day divider, teal sent /
glass received bubbles, quick replies and the rounded composer. The review route
(`#review`) only renders for a valid sold listing + reservation, so its markup,
copy and styles were read from the deployed bundle (`review-screen`,
`review-summary`, `review-person`, `star-picker`, `review-tags`, `review-submit`,
`review-thanks`) and confirmed against the Components page.

### 0.3 Current app inventory

| Area | File(s) |
| --- | --- |
| Auth stack | `src/screens/WelcomeScreen.tsx`, `LoginScreen.tsx`, `SignUpScreen.tsx` |
| Tabs | `src/navigation/MainTabs.tsx` — Home, Search, Post, Favorites, Profile |
| Marketplace | `HomeScreen.tsx`, `SearchScreen.tsx`, `FavoritesScreen.tsx` |
| Listing | `ListingDetailsScreen.tsx`, `PostListingScreen.tsx` |
| Account | `ProfileScreen.tsx`, `EditProfileScreen.tsx`, `SettingsScreen.tsx` |
| Phase 3 flows | `ReserveScreen.tsx`, `SellerDashboardScreen.tsx`, `NotificationsScreen.tsx`, `MessagesScreen.tsx`, `ChatScreen.tsx`, `ReviewScreen.tsx` |
| Docs | `DesignSystemScreen.tsx` (Settings → Reference → Design System) |
| Shared UI | `src/components/*` (button, field, chip, card, states, gallery, sheet) |
| Theme | `src/theme/*`, `src/context/ThemeContext.tsx` |
| Data | `src/api/*`, `src/context/*Context.tsx`, `server/db.json`, `server/db.seed.json` |

---

## 1. Extracted design tokens

### 1.1 Light palette

| Token | Figma value (measured) | Current value | Verdict |
| --- | --- | --- | --- |
| Primary | `#1F7A72` | `#0E6A5F` | must change |
| Primary gradient | `linear-gradient(135deg, #1F7A72, #286F83)` | `#0A4F47 → #0E6A5F` | must change |
| Accent (orange) | `#F4A261` | `#F2994A` | must change |
| Page background | gradient `#EAF6F6 → #E4F3F4 → #DCEBFA` | flat `#EAF6F3` | must change |
| Surface / card | `rgba(255,255,255,0.68)` | `#FFFFFF` | must change |
| Elevated surface | `rgba(255,255,255,0.82)` | `#FFFFFF` | must change |
| Card border | `rgba(255,255,255,0.8)` | `#DCEAE6` | must change |
| Input background | `rgba(255,255,255,0.76)` | `#F6FAF9` | must change |
| Input border | `rgba(85,125,145,0.2)` | `#DCEAE6` | must change |
| Text | `#1F3A4D` | `#173033` | must change |
| Label | `#324E60` | (reuses text/muted) | must add token |
| Muted text | `#4F6878` | `#56666A` | must change |
| Chip inactive bg | `rgba(255,255,255,0.52)` | `#FFFFFF` | must change |
| Chip inactive border | `rgba(31,122,114,0.13)` | `#DCEAE6` | must change |
| Chip inactive text | `#46606F` | `#56666A` | must change |
| Chip active | `#1F7A72`, white text | `#0E6A5F`, white text | must change |
| Success | `#2E9E5B` | `#1F7A50` | **keep ours** (Figma documents white-on-success 3.41:1 — large text only) |
| Danger | `#D64545` | `#B3261E` | **keep ours** (Figma documents white-on-error 4.38:1 — fails normal text) |
| Reserved pill | bg `rgba(244,162,97,0.24)`, text `#1F3A4D` | `#FDF0E0` / `#8A520E` | must change |
| Sold pill | neutral grey | `#EEF2F2` / `#5F6F75` | keep ours, retint |
| Verified check | `#356E9F` | uses primary | must change |
| Online dot | `#2E9E5B` | (missing) | must add |
| Unread dot | `#4A90D9` | (missing) | must add |
| Focus ring | Figma uses primary teal | `#0B7A6B` | retint |

**Contrast notes.** The Figma Accessibility page itself lists: white on primary
5.14:1 (AA), muted on surface 5.86:1 (AA), sky blue on surface 3.34:1 (large
text/icons only), amber on surface 2.06:1 (decorative only), white on success
3.41:1 (large only), white on error 4.38:1 (fails normal text). We will keep our
AA-safe success/danger pairs and pair amber with dark text, exactly as the Figma
page recommends.

### 1.2 Dark palette ("Marketplace/Dark")

| Token | Figma value (measured) | Current dark value | Verdict |
| --- | --- | --- | --- |
| Background | `#0B1030` (deep navy) | `#081B19` (green-black) | must change |
| Card | `#141B45` | `#0F2724` | must change |
| Elevated / input | `#1A2250` | `#143430` | must change |
| Border | `#2A3470` | `#24463F` | must change |
| Mint active chip | `#7FD6C4`, text `#0B1030` | `#1E6F63`, white text | must change |
| Accent orange | `#F4A261` | `#F6B37A` | must change |
| Text | `#FFFFFF` | `#E9F3F0` | must change |
| Muted text | `#A9B1D6` | `#A7BEB8` | must change |
| Shadow | `rgba(3,6,24,0.22–0.26)` | `#000000` | must change |

### 1.3 Typography

**Font family: Poppins — confirmed.** The live site computes
`font-family: Poppins, sans-serif` for headings, body, labels and buttons.
The project already depends on `@expo-google-fonts/poppins@^0.4.1` and loads
`Poppins_400Regular`, `500Medium`, `600SemiBold`, `700Bold` in `App.tsx`.

**No font is unavailable.** All observed weights (400, 500, 600, 700) are
installed. No 800/900 weight was observed; if the screenshots show one, it would
need to be added.

| Style | Figma | Current token | Verdict |
| --- | --- | --- | --- |
| H1 | 28 px / 700 | `xxl` 28 | matches |
| H2 | 22 px / 700 | `xl` 22 | matches |
| H3 | 18 px / 600 | `lg` 18 | matches |
| Body | 16 px / 400–500 | `md` 15 | must change |
| Caption | **14 px minimum** / 500–600 | `sm` 13, `xs` 11 | must change |
| Micro badge | Figma still uses ~12–14 px | 11 px | raise to 12–14 |
| Buttons | 14 px / 600 | 14–15 | matches |
| Chips | 14 px / 600 | 13–14 | raise to 14 |

The current 11 px `xs` is below the Figma minimum and below comfortable mobile
reading. Phase 1 should set the smallest text token to 14 px and use 12 px only
for non-essential counters if necessary.

### 1.4 Radii

The Figma Design System page documents a scale of **12 / 18 / 24 / pill**, but
the components themselves measure larger: listing cards 22, notification cards
19–20, seller banner 20, big content panels 42, bottom nav 25, avatars 50 %.

| Token | Figma measured | Current | Verdict |
| --- | --- | --- | --- |
| Small | 12 | 10 | must change |
| Medium | 18–20 | 16 | must change |
| Card | 22 | 16 (cards) | must change |
| Large | 24 | 24 | matches |
| Panel | 42 | 32 (`xl`) | must add |
| Bottom nav | 25 | (standard bar) | must add |
| Pill | 999 | 999 | matches |

### 1.5 Spacing

Figma documents **4 / 8 / 16 / 24 / 32 / 40**. Current scale is
**4 / 8 / 12 / 16 / 24 / 32 / 48**.

- Add `40`.
- Keep `12` (used for dense rows) and `48` (used for page bottoms); they are
  ours, not a conflict.
- Page padding: Figma mobile ≈ 16–20 px; current 16/24/32 by breakpoint — keep.

### 1.6 Elevation

| Use | Figma | Current | Verdict |
| --- | --- | --- | --- |
| Card | `rgba(31,82,99,0.09) 0 12 30` | `0 6 12` @ 0.08 | must change |
| Panel | `rgba(31,82,99,0.12) 0 18 60` | (none) | must add |
| Floating nav | `rgba(31,65,82,0.18) 0 13 38` | `0 8 16` @ 0.16 | must change |
| Dark card | `rgba(3,6,24,0.26) 0 12 30` | black shadow | must change |

Shadows are soft, large-blur and **teal-tinted** in light mode, near-black navy
in dark mode.

### 1.7 Icon style

- Outline Ionicons-style, 20–22 px, 1.8–2 px stroke.
- Icons sit inside **circular tinted tiles** (42–48 px) for headers, stats and
  notification types.
- Verified check is a small `✓` in `#356E9F`, not a filled green badge.
- Online dot 11 px `#2E9E5B`; unread dot 7 px `#4A90D9`.
- Current app already uses Ionicons, but has no shared round icon button, no
  verified-check pill and no dot tokens.

### 1.8 Layout

| Aspect | Figma | Current | Verdict |
| --- | --- | --- | --- |
| Content max width | 768 px | 1200 px | keep ours (responsive brief) |
| Grid | 2 col mobile, 3 col at 768 | 2 / 3 / 4 | keep ours |
| Desktop nav | (not designed) | left sidebar ≥1024 | **question Q5** |
| Mobile nav | floating rounded bar, 76 px high, radius 25, inset ~34, bg `rgba(250,253,253,0.9)` | standard bottom bar, 62 px + inset | must change |
| Nav items | Home · Saved · Sell (raised) · Messages · Profile | Home · Search · Sell · Saved · Profile | must change — **question Q3** |
| Auth card | compact glass card, pill inputs | glass card, pill inputs | close; retint |

---

## 2. Screen-by-screen gap table

Verdict key: **must change** = required for visual/functional alignment;
**nice to have** = optional polish; **keep ours** = intentional difference to
preserve a working feature or responsive behaviour.

| # | Screen (current file) | Matches | Differs | Missing | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | **Welcome** (`WelcomeScreen.tsx`) | gradient/hero tone, verified-student copy | Figma has no Welcome screen; it opens on Login | — | **keep ours** (entry choice + sign-up path). Retint background only. |
| 2 | **Login** (`LoginScreen.tsx`) | School email + Password, Log in CTA, "New to UniSell?", school-email sign-up link, verified footer | Figma title "Welcome back" + subtitle "Sign in to discover great finds on campus."; glass card; gradient pill button; "Forgot password?" is a real link | Forgot-password navigation | **must change** (visual + link). Keep auth API/validation. |
| 3 | **Sign Up** (`SignUpScreen.tsx`) | School email, Full name, Student ID, Course, Year level, Password, Confirm password; official-email rule | Figma title "Join UniSell", subtitle, CTA "Verify my student account", no confirm-password field, glass card | — | **must change** (visual/copy). Keep confirm password + validation (ours). |
| 4 | **Forgot password** (`—`) | — | — | Entire screen: back arrow, title, subtitle, School email, gradient "Send reset instructions", success state | **must change** — new screen in Phase 2. Mock API cannot send email; simulate success + code comment. |
| 5 | **Home** (`HomeScreen.tsx`) | greeting, search pill, category chips, "Fresh finds", "See all", 2-column cards | Figma: logo tile (not avatar), "Good morning," + "Hi, <first>!", bell with orange unread dot, "Search campus finds…", 8 design chips, seller banner, "From students around campus", cards with condition chip / seller + verified pill / rating | Bell, unread dot, seller banner, section subtitle, card seller row/rating, condition chip on image | **must change** — restyled in Phase 2 (brand tile, bell + dot, search copy, seller banner, section copy). Ratings and the 8 design chips stay Phase 3. Keep responsive grid + refresh + fallback banner. |
| 6 | **Search** (`SearchScreen.tsx`, `SearchFiltersSheet.tsx`) | search field, category chips, condition filter, sold toggle, results grid, empty/error states | Figma "Search results", result count, filter panel (category, course, year, department, price, condition, meetup) | Course/year/department/price filters; filter panel layout; result count | **must change** — restyled in Phase 2 (compact header with back, editable search pill and filter trigger with an active dot; "Search results" heading with a live "N campus finds for “query”" count and a Filters button; bottom filter sheet with category, condition, show-sold toggle, Reset and a live "Show N results" button). Kept the search query, sold toggle, responsive 2/3/4-column grid, empty/error/offline states and pull-to-refresh. Course/year/department/price filters stay optional Phase 3 work; the sheet only includes filters the app can actually apply. |
| 7 | **Saved** (`FavoritesScreen.tsx`) | title "Saved items", count, 2-column grid, empty state | Figma subtitle "3 campus finds / Items you've hearted", "Clear all" action, seller rows on cards | "Clear all" (bulk unsave) | **must change** — restyled in Phase 2 (compact top bar with back + notifications, "N campus finds" subtitle, "Items you've hearted" heading, red "Clear all" with a confirm, Figma empty-state copy). Seller rows already exist on `ListingCard`. Kept AsyncStorage persistence, responsive grid, refresh and unavailable-favorites state. |
| 8 | **Post listing** (`PostListingScreen.tsx`) | photo add flow, title, price, category, condition, meetup spot, description, edit mode, validation | Figma "Post a listing / Share something with campus", seller verified row, 5 photos, auto-fill from photo, quantity, up to 3 meetup spots, availability days/times | Quantity, multi-spot, availability, auto-fill | **must change** — restyled in Phase 2 (compact top bar, green "Selling as" banner, separate Photos / Item details / Meetup cards, 3-slot photo row with selected-photo cover/replace/remove, 44 px fields, condition segmented control, meetup chips, gradient "Post item"). Kept 3 photos, camera/gallery, edit mode, validation and ownership checks. Quantity, multi-spot, availability and auto-fill stay out of scope. |
| 9 | **Listing details** (`ListingDetailsScreen.tsx`) | photo gallery, price, title, description, seller block, meetup safety card, owner actions (reserved/sold/edit/delete), save | Figma adds buyer actions and seller/reserve context | "Reserve" (non-owner), "Message seller", reservation status card, seller shop link, review entry after sold | **must change** - restyled in Phase 2 (glass body panel, 46 px gallery buttons, centered dots + gradient, condition/category/status tags, title + price row, Meetup preferences chip, gradient seller card). **Phase 3 (done):** non-owner "Reserve" button opens the new reserve screen, and a pending/accepted request shows a status card with meetup time, spot and a "Cancel request" action. The reserved notice now reads "This item is currently reserved." **Phase 3 (done):** non-owners also get an outlined "Message seller" action that finds or creates their thread with the seller and opens the chat. Report, quantity, seller-shop links and post-sale reviews stay later Phase 3 work. Keep owner permissions + delete/sold. |
| 10 | **Profile** (`ProfileScreen.tsx`) | avatar with initials/photo, name, verified line, edit profile, own listings management, logout, theme switch | Figma: gradient avatar + check badge, "BSIT · 3rd year", school email, stats **reviews / items sold / listings**, segmented **Profile \| Seller shop**, menu card (My Listings, Saved, My Reviews, Notifications, Settings, Log out), footer "Verified DOrSU student · School email and student ID confirmed"; gear icon | Segmented control, menu card, reviews/sold/listings stats, seller shop tab, footer, My Reviews link | **must change** — restyled in Phase 2 (82 px gradient avatar with verified check, name, course · year, school email, reviews/sold/listings stats, Profile \| Seller shop tabs, menu card with verified footer, Appearance card, centered 720 px column). **Removed the full student ID and the show/hide toggle.** My Listings management moved into a sub-view; the Settings row and hero gear now open the new Settings screen. The stats are live: average rating / review count from `reviews` ("New" at zero), items sold and listing count from `listings`. "My reviews" (Phase 3) opens the submitted-reviews panel and the menu can be deep-linked from a review notification. Kept editing, listing actions, logout and the theme switch. |
| 11 | **Seller shop** (`—`) | — | — | Tab under Profile: "<First>'s active listings", "N items available", "★ New · 0", "Recent reviews" empty state | **must change** — added in Phase 2 as a Profile tab: active-listing grid using the shared card (no heart), heading with live item count and the live rating ("★ 4.7 · 3" or "★ New · 0"), and a "Recent reviews" list. Reviews themselves landed in Phase 3: received reviews show the reviewer's initials, stars, listing title, comment (or tags) and date. |
| 12 | **Seller dashboard** (`SellerDashboardScreen.tsx`) | — | — | Screen: "Seller dashboard / Manage your UniSell activity", segmented **Requests (count) / My Listings / Sold**, "No reserve requests yet.", accept/decline, meetup spot + time | **must change** — new screen in Phase 3 (done). A pill segmented control with a live Requests count, request cards with the buyer's course/year, meetup spot and time, and Accept/Decline actions; accepted cards offer View item / Mark as sold; My Listings rows offer Edit / Mark as sold / Delete; the Sold tab lists completed sales and the total earned. Quantity is omitted (single-item listings) and the "Verified student ✓" line uses the stored course/year instead. Opened from the Profile menu "Seller dashboard" row and the Seller shop "Manage requests" link. |
| 13 | **Notifications** (`NotificationsScreen.tsx`) | — | — | Screen: title/subtitle, "Mark all as read", Today/Earlier, typed rows (reserved, accepted, declined, meetup, review), unread state, tap target | **must change** — implemented in Phase 3. New `notifications` resource (one row per recipient, session-checked read receipts) plus a `NotificationsContext`; the screen shows the Figma top bar, a disabled-aware "Mark all as read", Today/Earlier groups and glass cards with the 42 px tone tile (teal heart / green check / amber clock / blue star), title, detail, relative time and "· New" for unread. Tapping a card marks it read and opens its listing, the seller dashboard, the review form (`review`) or the Seller shop (`shop`). Reserve/accept/decline/cancel/sold/review create notifications best-effort, and the Home + dashboard bells show the live unread count and only show the dot when it is above zero. Seeded with Carlo's two unread seller requests, older read declined/accepted/sold updates and a blue "New review received" from Ana. |
| 14 | **Messages** (`MessagesScreen.tsx`) | — | — | List: search, product thumbnail, other student + verified check, time, product title in teal, preview, online dot, unread dot | **must change** — implemented in Phase 3. A new `chats` + `chatMessages` resource (one thread per listing + buyer, session-checked reads) and a `MessagesContext`; the inbox shows the Figma top bar + bell, an editable "Search conversations" pill, glass cards with a 58 px/17 px-radius thumbnail, name + blue verified check, relative time, teal listing title, last-message preview and a 7 px blue unread dot. Includes loading/error/empty/no-results states, focus refresh and a live unread badge on the Messages tab (floating bar + desktop sidebar). The green "online" dot and "Active now" copy are intentionally omitted because the mock API has no presence data. |
| 15 | **Chat** (`ChatScreen.tsx`) | — | — | Per-listing thread, sent/received bubbles, input, quick replies, polling | **must change** — implemented in Phase 3. Header with the other student + verified role, tappable "Chatting about" card with the live listing status, Today/Yesterday day chips, teal sent / glass received bubbles with times, send-on-tap quick replies ("Is this still available?", "Can you lower the price?", "Can we meet tomorrow?"), rounded composer with a circular teal send button, and a 10 s poll while focused (no socket backend). Opening the chat marks incoming messages read. The Figma "+" location button is omitted because the mock API has no location support. |
| 16 | **Reviews / My Reviews** (`ReviewScreen.tsx`) | — | — | 1–5 stars + comment after a sold sale; Seller shop "Recent reviews"; "My Reviews"; profile average or "New" | **must change** — implemented in Phase 3. A `reviews` resource (listing + reservation + reviewer, both parties may review once the listing is sold) plus a `ReviewsContext`. The form mirrors Figma: completed-sale summary with a Sold pill, the other student's initials avatar, "How was your experience with …?", a 1–5 star radiogroup with Poor/Fair/Good/Very good/Excellent labels, the four tags (On time, As described, Friendly, Fair price), an optional 200-character comment with a live counter, and "Submit review". Loading, error + retry, already-reviewed and "Thank you for your review!" states match Figma; the thanks screen stays until "Return to previous screen" is pressed (no auto-return, matching the Figma panel). The Profile menu gains "My reviews" (submitted reviews), the Seller shop shows received reviews with the live average in the heading and stats, and sold listing details / the dashboard Sold tab offer "Rate & review" / "Rate buyer" until the student has reviewed. Reviews create a best-effort blue "New review received" notification targeting the reviewee's shop. If the reviews request fails, the profile stat shows "—" and the review panels show an error banner with retry instead of a false empty state. |
| 17 | **Settings** (`SettingsScreen.tsx`) | Top bar "Settings / Prototype and account preferences" with back + notifications, Edit profile card (Full name, read-only school email, Course/Year level, Save profile, success status), Appearance card | — | Reference card + Design System button, Demo data card + Reset demo data | **must change** — implemented in Phase 2. The inline Edit profile card saves Full name, read-only school email, Course and Year level through `updateProfile` (preserving the photo and refreshing seller snapshots) and shows "Profile updated everywhere." Appearance keeps the System/Light/Dark switch. The Reference card links to the Design System screen. Demo data stays deferred until the mock API exposes a bulk reset; no inert button ships. |
| 18 | **Design System** (`DesignSystemScreen.tsx`) | — | — | Top bar "Design System / The visual foundations used by UniSell", Colors (8 swatches), Typography (H1 28 / H2 22 / H3 18 / Body 16 / Caption 14 minimum), Spacing (4/8/16/24/32/40), Elevation (Level 0/1/2), Border radius (Small 12 / Medium 18 / Large 24 / Pill) | **must change** — implemented in Phase 2. Swatches follow the active light/dark palette and keep the AA-safe success/danger tokens. The Figma Components and Accessibility docs pages are not implemented, so the docs nav is omitted rather than linking to empty screens. Reached from Settings → Reference → Design System. |
| 19 | **Edit profile** (`EditProfileScreen.tsx`) | full name, course, year level, school email, student ID, photo camera/gallery, change password | Figma edits name/course/year inline in Settings; no separate photo/password section there | — | **keep ours** (full editor + password + photo). Restyle to match. **Remove full student ID display** (Q2). |
| 20 | **Dark Marketplace** (`ThemeContext` + palettes) | dark mode exists, System/Light/Dark persisted | Current dark is green-black; Figma is deep navy with mint active states | Navy palette tokens, mint chip, navy shadows | **must change** (Phase 1). Keep System/Light/Dark. |

### 2.1 "Must change" summary

1. Light tokens → Figma teal/glass values; page gradient; soft teal shadows.
2. Dark tokens → navy/mint palette.
3. Type scale → body 16, caption 14 minimum.
4. Shared components: gradient page, round icon button, pill search, pill chips,
   ListingCard with condition chip / seller + verified pill / rating, status
   pills, segmented control, notification row, conversation row, floating
   5-item tab bar with raised Sell.
5. Forgot-password screen.
6. Home header/bell/banner/section copy/cards.
7. Profile rebuild: gradient avatar + check, stats, segmented Profile | Seller
   shop, menu card, footer, **no student ID**.
8. Design System screen (Settings and Design System are done).
9. Seller shop tab.
10. Search/Saved/Post/Details visual restyle with the same components (Search done).
11. Mobile floating nav: Home · Saved · Sell · Messages · Profile.

### 2.2 "Keep ours" summary (do not remove)

- Auth flow, session restore, school-email validation, confirm password.
- API service layer and mock REST API (`json-server`), offline fallback.
- Ownership enforcement (only owners edit/delete/mark their listings).
- Camera-or-gallery photos, 1–3 photos, image compression, sample-image badge.
- Sold/delete flows, mark reserved/available, bulk delete sold.
- Profile editing (name, course, year, photo, password).
- Responsive 2/3/4-column grid and desktop sidebar (pending Q5).
- Button system, form fields, toast/error/empty/loading states.
- Dark mode with System/Light/Dark.
- Seed items keep our labelled sample images.

---

## 3. New features and the data they need

### 3.1 Feature → data map

| Feature | Data required | Proposed resource | Notes |
| --- | --- | --- | --- |
| Reserve request | listing, buyer, seller, status, meetup spot/time, timestamps | `reservations` | Buyer creates; seller accepts/declines; accept sets listing `reserved` |
| Notifications | recipient, type, title, body, related ids, read flag, timestamp | `notifications` | Bell unread dot; Today/Earlier; mark all read |
| Conversations | listing, buyer, seller, listing snapshot, last activity | `chats` | One thread per listing + buyer; `ensureChat` reuses it |
| Chat messages | chat, sender, body, timestamp, read flag | `chatMessages` | One `read` flag per message for its recipient; poll every 10 s; quick replies |
| Reviews | listing, reservation, reviewer, reviewee, 1–5 stars, tags, comment, timestamp | `reviews` | One per listing + reservation + reviewer; both parties may review after the sale is sold/completed |
| Seller shop stats | active listing count, items sold, average rating | derived from `listings` + `reviews` | No new table needed |
| Profile stats | reviews count/average, items sold, listings | derived | "New" when no reviews |
| Seller dashboard | pending requests, my listings, sold | derived from `reservations` + `listings` | Count badge on Requests |
| Demo reset | restore seed for all resources | `POST`/script or `db:reset` | Settings action; confirmation dialog |

### 3.2 Proposed record shapes (Phase 3)

```jsonc
// reservations
{
  "id": 1,
  "listingId": 2,
  "buyerId": 1,
  "sellerId": 2,
  "status": "pending",            // pending | accepted | declined | completed | cancelled
  "meetupSpot": "Main Library Lobby",
  "meetupAt": "2026-11-06T04:30:00.000Z",
  "note": "Can meet after my 3 PM class.",
  "createdAt": "2026-11-04T02:10:00.000Z",
  "updatedAt": "2026-11-04T02:10:00.000Z",
  "sample": true
}
```

```jsonc
// chats (implemented as `chats`)
{
  "id": 1,
  "listingId": 5,
  "buyerId": 4,
  "sellerId": 1,
  "buyerName": "Carlo Mendoza",
  "sellerName": "Mika Santos",
  "listingTitle": "Homemade Brownies (Box of 6)",
  "listingPrice": 180,
  "listingImage": "/images/05-homemade-brownies-box-of-6.jpg",
  "listingCategory": "Food",
  "listingStatus": "available",   // snapshot; the chat prefers the live listing
  "createdAt": "2026-11-12T02:30:00.000Z",
  "updatedAt": "2026-11-12T02:38:00.000Z",
  "sample": true
}
```

```jsonc
// chatMessages (implemented as `chatMessages`)
{
  "id": 1,
  "chatId": 1,
  "senderId": 4,
  "body": "Is this still available?",
  "createdAt": "2026-11-12T02:34:00.000Z",
  "read": true,                   // recipient's read receipt
  "sample": true
}
```

```jsonc
// reviews (implemented as `reviews`)
{
  "id": 1,
  "listingId": 4,
  "reservationId": 6,
  "reviewerId": 3,
  "reviewerName": "Ana Dela Cruz",
  "revieweeId": 4,
  "revieweeName": "Carlo Mendoza",
  "rating": 5,                       // whole stars, 1–5
  "tags": ["On time", "Friendly"],   // On time | As described | Friendly | Fair price
  "comment": "Friendly and easy to meet!",  // optional, max 200 chars
  "createdAt": "2026-10-21T03:15:00.000Z",
  "sample": true
}
```

```jsonc
// notifications (implemented as `notifications`)
{
  "id": 1,
  "userId": 4,                    // recipient
  "title": "Mika Santos sent a reserve request",
  "detail": "Review the requested meetup details.",
  "tone": "teal",                 // teal | green | amber | blue
  "target": "listing",            // listing | dashboard | shop | review | none
  "listingId": 6,
  "createdAt": "2026-11-12T02:10:00.000Z",
  "read": false,
  "sample": true
}
```

All seed rows must be visibly marked as samples (the `sample: true` flag plus a
comment in `db.seed.json` / docs). No real student data.

### 3.3 Ownership rules to enforce in the API service layer

| Action | Allowed actor |
| --- | --- |
| Edit / delete / mark reserved / mark sold a listing | Listing owner only |
| Create reservation | Any signed-in student **except** the listing owner |
| Accept / decline reservation | Listing owner only |
| Start a conversation ("Message seller") | Any signed-in student **except** the listing owner; reuses the listing + buyer thread |
| Read a conversation / send a message | Buyer or seller of that chat only |
| Mark a conversation read | Buyer or seller of that chat only |
| Create review | Buyer or seller of a **sold/completed** sale; once per listing + reservation + reviewer; never review yourself |
| Read reviews | Any signed-in student (reviews are public profile content) |
| Read notifications | Recipient only |
| Mark notification read | Recipient only |

`json-server` has no auth, so this is UI + service-layer demo enforcement, as
today. Document that clearly.

---

## 4. Shared component plan (Phase 1)

| Component | Purpose | Replaces / wraps |
| --- | --- | --- |
| `GradientBackground` | mint → light-blue page wash, navy in dark | `ScreenContainer` background |
| `RoundIconButton` | circular 44 px icon button (back, bell, gear, ellipsis) | ad-hoc `Pressable`s |
| `SearchPill` | pill search bar with icon + placeholder | Home/Search search rows |
| `CategoryChips` | pill chips, active filled teal, horizontal scroll | `FilterChip` (retint; keep per-category option — Q4) |
| `ListingCard` (rebuild) | photo, heart, condition chip, status pill, price ₱, title, seller + verified pill, rating | current card |
| `StatusBadge` | Available / Reserved (peach) / Sold | status pills |
| `SegmentedControl` | pill segmented (Profile \| Seller shop; Requests \| My Listings \| Sold) | Profile `FilterSegment` |
| `NotificationRow` | icon tile, title, body, time, unread dot | new |
| `ConversationRow` | thumbnail, name + check, time, product title, preview, dots | new |
| `FloatingTabBar` | 5 items, raised orange Sell, rounded 25, shadow | `MainTabs` bottom bar |
| `VerifiedPill` / `VerifiedCheck` | "Student" pill + blue check | inline badges |
| `Avatar` | gradient initials + optional photo + check badge | Profile/Home avatars |

---

## 5. Phase mapping (what happens after this audit)

- **Phase 1:** tokens + dark navy palette + shared components + fonts check.
- **Phase 2:** Welcome/Login/Sign Up/Forgot → Home → Details/Post/Saved →
  Profile + Seller shop → Settings (done) → Design System (done) →
  Search (done).
- **Phase 3:** resources + reserve flow + dashboard + notifications + messages +
  reviews. **Done:** `reservations` resource + buyer reserve flow (reserve
  screen, pending/accepted card, cancel, re-reserve after decline); seller
  dashboard (accept/decline, My Listings, Sold + total earned); notifications
  (feed, mark-all-read, tap-to-open, lifecycle creation, live bell dot);
  messages/chat (`chats` + `chatMessages`, Figma inbox, per-listing thread,
  quick replies, polling, unread badges, "Message seller" entry point);
  reviews (`reviews` resource, rate-and-review form for both parties, My
  reviews panel, received reviews in the Seller shop, live profile average,
  post-sale entry points and review notifications). **Phase 3 complete.**
- **Phase 4:** map doc, README, architecture, accessibility, walkthrough,
  disclosure entries, typecheck, restart/test checklist. **Done:** this audit,
  the README feature/screen/API sections, `ARCHITECTURE.md`, `ACCESSIBILITY.md`,
  `CODE_WALKTHROUGH.md`, `TESTING.md`, `DEMO_SCRIPT.md`,
  `SUBMISSION_CHECKLIST.md` and the Phase 4 disclosure entry were updated;
  typecheck passes and the demo data was restored.

Every phase ends with `npm run typecheck`; each screen/feature waits for
"continue".

---

## 6. Questions before Phase 1

Please answer these; where possible I have put a recommended default first.
I will not invent a different design.

1. **Missing `design-reference/` folder.** It is not in the workspace. Should I
   continue from the live Figma site + written spec (recommended), or will you
   add the screenshots/export first? *(If added, I will re-verify pixel spacing.)*

2. **Student ID privacy.** The spec says never display the full student ID.
   Current Profile shows a masked ID with a Show/Hide toggle, and Edit Profile
   shows the full ID in a locked field. Should I (a) remove the ID row from both
   screens and keep only "School email and student ID confirmed" (recommended),
   or (b) keep a masked value only (e.g. `••••-0417`) with no reveal?

3. **Five-item navigation.** Figma uses **Home · Saved · Sell · Messages ·
   Profile**, with Search reachable from the search bar. Our current tab bar is
   **Home · Search · Sell · Saved · Profile**. Confirm: replace the Search tab
   with Messages (recommended, matches design) and keep Search as a pushed
   screen from the search bar / "See all"? Or keep Search in the bar and put
   Messages elsewhere?

4. **Category labels and chip colors.** Figma chips are
   All / Uniforms / Books / School Supplies / Supplies / Tech / Food / Services,
   all teal when active. Our data model is Textbooks / Uniforms / Gadgets /
   Dorm Items / Food / Others, with per-category colors. Should I (a) keep our
   six categories and map display labels (Books→Textbooks, Tech→Gadgets,
   Supplies→Dorm Items) with all-teal active chips (recommended), (b) keep our
   labels and per-category colors, or (c) migrate the data model to the Figma
   taxonomy (bigger change, affects seed data and filters)?

5. **Desktop layout.** Figma is mobile-first (max 768, no desktop sidebar). We
   currently have a responsive 1200 px grid with a left sidebar at ≥1024.
   Keep the sidebar/desktop layout (recommended, preserves working responsive
   feature) and use the floating bar only on phone/tablet? Or force the mobile
   frame on desktop too?

6. **Seller dashboard entry point.** Where should "Seller dashboard" be opened
   from? Recommended: Profile menu item + a "Manage requests" link on Seller
   shop. Or Settings only, or a bell/notification deep link. (Figma's route
   exists but the visible entry point is not obvious.)

7. **Welcome screen.** Figma has no Welcome screen and opens on Login. Keep our
   Welcome screen (recommended, gives sign-up entry and branding) or remove it
   and open on Login?

8. **AA-safe success/danger.** Figma uses `#2E9E5B` / `#D64545`, which its own
   Accessibility page flags as large-text-only (3.41:1 and 4.38:1). Keep our
   AA-safe `#1F7A50` / `#B3261E` for text-bearing buttons (recommended), or match
   Figma exactly and restrict those colors to large text/icons?

9. **Dark-mode control.** Figma has a single toggle "Use the dark navy
   Marketplace theme". We already have System / Light / Dark. Should I keep the
   three-way control and add the Figma sentence as its description (recommended),
   or replace it with a single on/off toggle (loses System)?

10. **Post-listing extras.** Figma adds quantity, up to 3 meetup spots, and
    weekly availability. These are not in our data model. Add them in Phase 2/3
    (schema + form + display), or keep our single meetup spot and skip them for
    now? *(Recommended: skip quantity/availability for this pass; add multi-spot
    only if you want it.)*

11. **Price glyph.** Figma cards render `P250` (letter P). The written spec asks
    for `₱`. Use `₱` everywhere (recommended) and treat the Figma `P` as a
    prototype shorthand?

12. **Forgot-password behavior.** The mock API cannot send email. Confirm the
    success state should be a simulated message such as "If that school email is
    registered, reset instructions are on the way." with a code comment that it
    is simulated (recommended). Should it also offer a "Back to log in" action?

---

## 7. Next step

Phase 0 is complete. No `src/` code has been changed.

Waiting for answers to §6 and your **"continue"** before Phase 1 (tokens, dark
navy palette, shared components, font verification).
