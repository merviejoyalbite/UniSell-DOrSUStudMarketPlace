# UniSell — Accessibility Notes

Phase 5 included a focused accessibility pass; Phase 8 added dark mode, the
responsive layouts and the shared button states; the Figma-alignment Phase 3
added reservations, the seller dashboard, notifications, messages/chat and
reviews. This is **not** a formal WCAG audit, and it has not yet been checked
with a screen reader on a physical phone. It records what the code does, the
contrast calculations behind the token changes, and what remains for the team to
verify.

---

## 1. What is implemented

### Screen structure and names

- Main screen titles and section titles use `accessibilityRole="header"` so
  screen readers can jump between headings.
- Every icon-only control has a descriptive label: back, save/remove, show/hide
  password, clear search, close picker, and the centre **Sell** tab.
- The listing card has two separate controls: the card opens the item, and the
  heart saves it. The accessible labels say “Open …” and “Save/Remove …”, so a
  screen reader user does not have to guess which action is which.
- Filter chips expose `accessibilityState.selected`, and the picker options
  announce their label and selected state.
- The Profile **Active / Sold / All** control is a labelled tab list
  (`accessibilityRole="tablist"` + `tab`) with `aria-selected` on web, and
  Search's **Show sold items** is a checkbox with `accessibilityState.checked` +
  `aria-checked`, so both announce their current state instead of colour alone.
- Form fields are labelled, validation errors sit directly under their field,
  and API errors/banners use `accessibilityRole="alert"`.
- The Search result count is a polite live region, so filter changes are
  announced without interrupting the user.
- **Take photo** and **Choose from gallery** use their visible labels as their
  accessible names. Thumbnail actions name the photo number, for example
  “Replace photo 2 with a gallery photo” or “Make photo 2 the cover”.
- Listing Details announces each photo's source, **Taken with camera** or
  **From gallery**, and keeps the **Sample image** label for seeded listings.
- Phase 3 screens keep the same conventions:
  - Reserve and Review fields are labelled, their validation errors sit under
    the field, and API failures use `accessibilityRole="alert"`.
  - The 1–5 star picker is a labelled **radiogroup** (`1 star` … `5 stars`) with
    `accessibilityState.checked`, so the rating is not conveyed by colour alone.
  - Review tags are checkboxes with selected state; the comment counter is part
    of the field hint.
  - Dashboard **Requests / My Listings / Sold** and Profile **Profile / Seller
    shop** are labelled tab lists with selected state.
  - Notification cards name the event and expose **· New** in the text; the bell
    label includes the unread count and only shows the dot when it is above zero.
  - Message threads name the other student and include the unread count in the
    tab badge label. Chat bubbles keep the sender's name in the text, not only
    alignment/colour.
  - Icon-only controls (chat back/send, dashboard back, mark-all-read, quick
    replies) have labels, and loading/empty/error states announce themselves.

### Touch targets

The target is at least **44 × 44 px** for interactive controls.

| Control | Visible size | Effective target |
| --- | --- | --- |
| `AppButton` `sm` / `md` / `lg` | 40 / 48 / 56 px high | same (`sm` adds 4 px `hitSlop`) |
| Post photo source buttons | 48 px high | 48 px |
| Thumbnail Retake/Replace, Make cover, Remove | 44 px high | 44 px |
| Filter chips | 38 px high | 46 px with `hitSlop` |
| Listing-card heart | 34 × 34 | 46 × 46 with `hitSlop` |
| Details back/save circles | 42 × 42 | 58 × 58 with `hitSlop` |
| Password reveal | 19 px icon | 47 px with `hitSlop` |
| Search clear / clear filters | 19 px icon / text | 47 px / 44 px with `hitSlop` |
| Profile “Post new” link | 36 px high | 52 px with `hitSlop` |
| Star picker (review) | 44 × 44 | 52 × 52 with `hitSlop` |
| Quick-reply chips / send button | 44 px high / 48 × 48 | same |
| Notification card | full row | full row (min 64 px) |
| Tab bar items | platform default | native tab-bar target |

### Contrast

The brand teal (`#0E6A5F`) and orange (`#F2994A`) are unchanged. Muted text,
feedback colours, status badges and three category accents were darkened so
small copy meets the AA contrast target on the app's surfaces.

| Pair | Ratio |
| --- | --- |
| Muted text `#56666A` on white | 5.99:1 |
| Muted text on mint background `#EAF6F3` | 5.41:1 |
| Muted text on `surfaceMuted` `#F6FAF9` | 5.70:1 |
| Error text `#B3261E` on `#FDECEC` | 5.72:1 |
| Offline text `#8A520E` on `#FDEBDD` | 5.50:1 |
| White on reserved `#8A520E` | 6.38:1 |
| White on sold `#5F6F75` | 5.23:1 |
| White on available `#1F7A50` | 5.31:1 |
| Dark FAB glyph `#173033` on accent orange | 6.26:1 |
| White on primary teal | 6.47:1 |
| Primary-dark safety copy on `primaryLight` | 8.13:1 |

Category label pairs on their tints:

| Category | Ratio |
| --- | --- |
| Textbooks | 5.61:1 |
| Uniforms | 5.89:1 |
| Gadgets | 5.62:1 |
| Dorm Items | 5.43:1 |
| Food | 5.60:1 |
| Others | 4.63:1 |

The category-colour changes are visible but small; compare them with the Figma
during the phone review and revert a value only if the team accepts the
resulting contrast trade-off.

### Dark mode contrast

Dark mode uses deep blue-green surfaces (`#081B19` background, `#0F2724`
surface) rather than pure black. The same semantic pairs were checked:

| Pair (dark palette) | Ratio |
| --- | --- |
| Text `#E9F3F0` on background `#081B19` | 15.70:1 |
| Text on surface `#0F2724` | 13.88:1 |
| Muted text `#A7BEB8` on surface | 8.01:1 |
| Muted text on background | 9.06:1 |
| Muted text on `surfaceMuted` `#0C211E` | 8.55:1 |
| Primary `#5AC8B6` on surface | 7.76:1 |
| White on primary gradient (`#0B4F47` → `#12786B`) | 9.44:1 / 5.35:1 |
| `onAccent` `#1F1305` on accent gradient (`#D97706` → `#F2A45C`) | 5.71:1 / 8.88:1 |
| White on danger gradient (`#9E1B14` → `#B3261E`) | 8.01:1 / 6.54:1 |
| White on selected chip `#1E6F63` | 5.98:1 |
| Danger `#FF8A80` on `dangerSoft` `#3B1A18` | 6.83:1 |
| Warning `#F0B45E` on `warningSoft` `#3A2A12` | 7.50:1 |
| Success `#6FD3A8` on `successSoft` `#12332A` | 7.54:1 |
| Sold `#A9B8B4` on `statusSoldSoft` `#1A2E2B` | 6.94:1 |
| Saved heart `#FF7A9C` on `favoriteSoft` `#3A1B25` | 6.25:1 |
| Focus ring `#7FE0CF` on surface | 10.08:1 |

Large text and UI edges (borders, focus rings) target 3:1; body copy targets
4.5:1. Photos and the logo keep their original colours on purpose, and text
placed over photos sits on the `photoOverlay` scrim.

### Focus, hover and keyboard (web)

- Every `AppButton` has a visible focus ring (`focusRing`, 2 px) that is drawn
  with `outline`/box-shadow on web, so keyboard users can see the target.
- Hover lightens filled buttons (`hoverSheen`) and lifts the shadow; pressed
  darkens (`pressedSheen`) and scales to 0.98. Both are additive to colour, so
  the state is not conveyed by hue alone.
- Pressables use `cursor: pointer` on web.
- Disabled buttons are desaturated and block presses, and the loading state
  shows a spinner plus a label change (“Saving…”).
- Icon-only controls keep their accessible labels, and the theme switch is a
  labelled segmented control (`System` / `Light` / `Dark`) with selected state.
- The desktop sidebar uses the same tab semantics as the bottom bar, so tab
  order follows Home → Search → Saved → Profile → Post.

### Web check results

In the desktop web preview, Lighthouse reported an **Accessibility score of 1.0**
for Home, Profile, Search and Post after the Phase 5 fixes. Those runs still
failed two SEO checks (`meta-description` and `robots.txt`).

Phase 6 closed those gaps with `web.description`/`web.themeColor` in `app.json`
and `public/robots.txt`. Lighthouse on the **static production export** (Welcome
page) then reported:

- Accessibility **1.0**
- Best Practices **1.0**
- SEO **1.0**
- No reported failures

These automated scores cover the Welcome page only in that final run; they do not
replace the phone and screen-reader checks below or a full audit of every screen.

### Layout and text scaling

- Text uses React Native's default font scaling (`allowFontScaling` is not
  disabled).
- Cards and state containers use flexible widths and `minHeight` rather than
  fixed text heights, so larger system text can wrap.
- Long listing titles are capped at two lines on cards and in My Listings, with
  the full title available on Listing Details.
- Layout switches at the shared breakpoints **mobile < 600**, **tablet
  600–1023** and **desktop ≥ 1024**. Content is capped at **1200 px**; the Post
  and Edit forms cap at **720 px**, auth cards at **480 px**, and Listing
  Details / Profile at **1120 px** instead of stretching across a desktop
  window. The desktop sidebar is **248 px** and the product grid is 2 / 3 / 4
  columns with 12 / 16 / 20 px gaps.
- The page never scrolls horizontally; long text wraps and cards keep a
  consistent aspect ratio.
- The theme switch follows the device by default, so a system dark-mode user
  gets dark surfaces without changing a setting.

---

## 2. Still needs a human check

- [ ] TalkBack on Android and VoiceOver on iOS: headings, card/heart actions,
  chip selected state, picker modal, validation announcements, and focus order.
- [ ] Largest system font size on a narrow phone: Profile stats, My Listings
  rows, status badges, and the tab bar.
- [ ] Landscape orientation on the demo phone.
- [ ] Colour-blind check of the available/reserved/sold badges; the text label
  is always present, not colour alone.
- [ ] Figma comparison after the Phase 5 colour darkening.
- [ ] Keyboard-only web check: tab order, Enter/Space on Pressables, Escape/
  backdrop close for the picker modal, and visible focus rings on every button.
- [ ] Check both themes at 360 / 768 / 1024 / 1366 / 1920 px: no horizontal
  scroll, readable type, sidebar/bottom-tab switch, 2/3/4-column grid.
- [ ] Check every button variant in light and dark mode, including hover,
  pressed, focus, disabled and loading.
- [ ] Toggle System / Light / Dark, reload the page/app, and confirm the saved
  choice applies with no light flash on startup.
- [ ] TalkBack/VoiceOver on the new Phase 3 screens: reserve date/time pickers,
  dashboard tabs, notification rows and unread state, chat composer/quick
  replies, star radiogroup, review tags and the thanks panel.
- [ ] Large system font on Reserve, Chat, the seller dashboard, Notifications and
  the Review form (keyboard avoidance, counter wrapping, no clipped buttons).
- [ ] Keyboard-only chat: focus the composer, send with Enter, reach every quick
  reply and the send button, and confirm the 10-second poll does not steal focus.
- [ ] Colour-blind check of the unread dot/border, the notification tone tiles and
  the review stars (text labels and counts stay visible).
- [ ] Re-run the contrast tables if any token in `src/theme/palettes.ts`
  changes.

Do not describe the app as “WCAG compliant” in the pitch. Say that Phase 5
covered labels, touch targets and key contrast pairs, Phase 8 added dark mode,
responsive layouts and consistent button states, and the Figma-alignment Phase 3
kept the same conventions on reservations, notifications, chat and reviews — and
that a screen-reader pass is still on the phone checklist.
