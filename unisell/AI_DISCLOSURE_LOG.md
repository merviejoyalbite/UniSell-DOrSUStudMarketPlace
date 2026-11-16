# AI Disclosure Log

This log records how AI was used while building UniSell. It is a required
deliverable for the ITMSD1 Inter-Class Mobile Hackathon.

**Rules we follow**

1. Every AI-assisted phase gets its own entry.
2. Entries describe the **actual** prompt, the files generated, and what a
   human still needs to review.
3. We never claim a human edit that did not happen. The “Human edits” section
   stays empty until a teammate actually reviews and changes the code.
4. The final oral defense should be based on the student's own understanding of
   the code in this repository, not on the AI's explanation alone.

---

## Entry format

```md
### Phase N — <milestone> (<YYYY-MM-DD>)
- **AI tool / model:** <tool and model>
- **Prompt summary:** <what the team asked for>
- **Generated:** <files and behaviour>
- **Verified by team:** <commands run, results seen>
- **Human edits needed:** <review checklist>
- **Human edits made:** <what a teammate actually changed>
```

---

## Phase 1 — Setup (2026-10-22)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** The team provided the full UniSell hackathon brief (SDG 12,
3-feature MVP, approved stack, screens, folder structure, phases, deliverables)
and asked for **Phase 1 only**: an Expo TypeScript scaffold, theme tokens, a
navigation shell with placeholder screens, a json-server database with realistic
DOrSU listings, npm scripts, and the documentation skeleton. The team explicitly
required a plan before code and a stop after the phase.

**Generated:**

- Expo managed TypeScript app (`expo@~58`, React Native 0.88) inside `unisell/`.
- Installed React Navigation (native stack + bottom tabs), safe-area, screens,
  AsyncStorage, Expo Font, and Poppins.
- `src/theme/` — colour, spacing, radius, typography and shadow tokens sampled
  from the UniSell Figma prototype.
- `src/types/` — `User`, `Listing`, `Category`, `Condition`, `AuthState`,
  `ListingsState`.
- `src/navigation/` — typed root stack (Welcome → Login/SignUp → Main →
  ListingDetails) and bottom tabs (Home, Search, Sell, Saved, Profile) with the
  centre orange Sell button.
- `src/screens/` — a real Welcome screen plus Phase-labelled placeholders for
  Login, Sign Up, Home, Search, Listing Details, Post Listing, Favorites and
  Profile.
- `src/components/` — `ScreenContainer`, `AppButton`, `BrandMark`,
  `PlaceholderScreen`.
- `src/context/` — `AuthContext` and `ListingsContext` provider shells (state
  only; actions arrive in Phases 2–4).
- `src/api/` — `apiClient` with configurable base URL, 6-second timeout and
  typed `ApiError`; `listingsApi` with offline fallback; `authApi` for the mock
  `/users` endpoint.
- `src/data/` — bundled fallback copies of the seeded listings and users.
- `server/db.json` — 4 DOrSU users, 6 categories and 18 realistic listings
  (textbooks, uniforms, gadgets, dorm items, food, services).
- `src/utils/` — `@dorsu.edu.ph` validators and peso/date formatters.
- `README.md`, `AI_DISCLOSURE_LOG.md`, `PITCH_DECK_OUTLINE.md`,
  `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md`.
- `package.json` scripts: `npm start`, `npm run api`, `npm run typecheck`.

**Verified by team:**

- [ ] `npm run typecheck` passes on the team's machine
- [ ] `npm run api` returns 18 listings at `http://localhost:3001/listings`
- [ ] Welcome screen opens and all three buttons navigate
- [ ] All five tabs open their placeholder screens
- [ ] App runs in Expo Go on a physical Android phone

**Human edits needed:**

- [ ] Compare `src/theme/colors.ts` against the Figma file and correct any
      colour that looks off on a real phone.
- [ ] Replace the placeholder tab labels/icons if the Figma uses different
      ones.
- [ ] Review the 18 sample listings for realistic DOrSU course names, prices and
      meet-up spots; edit or add items.
- [ ] Confirm the Welcome screen wording in the team's own voice.
- [ ] Run the app on the actual demo phone and note any layout issue.
- [ ] Decide whether to keep the temporary “Preview the app shell” button on
      the Welcome screen (remove it in Phase 2 if not needed).
- [ ] Add the real team names and roles to `README.md`.

**Human edits made:**

_To be filled in by the team after the review above. Do not claim edits that
have not happened._

---

## Phase 2 — Authentication (2026-10-23)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** After reviewing the Phase 1 summary, the team said
“continue”, which (per the original brief) starts **Phase 2 only**: real Login
and Sign Up screens, `@dorsu.edu.ph` validation, AuthContext sign-in/sign-up/
sign-out actions, AsyncStorage session restore, and navigator logic that skips
the auth screens for a signed-in student.

**Generated:**

- `src/utils/storage.ts` — `loadSession`, `saveSession`, `clearSession` around
  AsyncStorage key `unisell.session`; only the safe user object is stored.
- `src/context/AuthContext.tsx` — full reducer (`loading` → `signedIn` /
  `signedOut`), `signIn`, `signUp`, `signOut`, `clearError`, and one-time
  session restore on mount.
- `src/api/authApi.ts` — keeps password stripping, re-validates the DOrSU domain
  and password on the API side, rejects duplicate emails, and falls back to
  `src/data/users.json` for logins when json-server is unreachable.
- `src/components/FormField.tsx` — labelled input with focus styling, inline
  error and show/hide password.
- `src/components/SelectField.tsx` — dependency-free modal picker used for
  course and year level.
- `src/components/ErrorBanner.tsx` — API error surface.
- `src/components/AppButton.tsx` — added `loading` and `danger` variants.
- `src/components/ScreenContainer.tsx` — optional keyboard avoidance for forms.
- `src/screens/LoginScreen.tsx` — welcome-back layout, validation, inline
  errors, loading state, forgot-password MVP notice, link to Sign Up.
- `src/screens/SignUpScreen.tsx` — email, name, student ID, course picker, year
  picker, password + confirmation, per-field validation.
- `src/screens/LoadingScreen.tsx` — branded session-restore screen.
- `src/screens/ProfileScreen.tsx` — minimal account summary and the logout
  action (Phase 5 later expanded it).
- `src/navigation/RootNavigator.tsx` — conditional auth stack vs. Main stack
  driven by `status`; no manual navigate after login.
- `src/screens/WelcomeScreen.tsx` — removed the temporary “Preview the app
  shell” button, since the real auth flow now opens the app.
- `src/types/index.ts` — `COURSES` and `YEAR_LEVELS` options for sign-up.
- Updated `README.md`, `docs/ARCHITECTURE.md` and `docs/CODE_WALKTHROUGH.md`.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- Empty login shows “Please enter your school email.” and
  “Please enter a password.”
- `test@gmail.com` is rejected with “Use your official @dorsu.edu.ph email.”
- Wrong password with a DOrSU email shows “Incorrect email or password.” and
  stays on the login screen.
- Correct login (`mika.santos@dorsu.edu.ph` / `unisell123`) opens the Home tab;
  Profile shows the user; reload restores the session directly to Home.
- Log out returns to Welcome and a reload stays signed out.
- Sign-up validation shows all expected messages; course/year pickers work; a
  new account was created, signed in, and restored after reload. The temporary
  test user was deleted afterwards, leaving the seeded 4 users intact.
- With json-server stopped, the seeded demo account still logged in through the
  bundled fallback.
- During testing, sign-up did not submit because `validate()` counted keys with
  `undefined` values. Fixed to test the values; re-tested successfully.
- One web-preview reload showed missing Ionicons/Poppins after the dev server's
  font request timed out; reloading restored them. This is a web dev-server
  artifact to re-check on a phone, not a change to the auth code.

**Human edits needed:**

- [ ] Run the auth flow on the actual demo phone in Expo Go and adjust spacing
      or keyboard behaviour if needed.
- [ ] Review the login/sign-up wording in the team's own voice.
- [ ] Confirm the `COURSES` list and the student ID format with DOrSU records;
      edit `src/types/index.ts` and the Student ID helper text if needed.
- [ ] Decide whether to keep the “Forgot password?” MVP notice or hide the link.
- [ ] Confirm the team is comfortable defending why demo passwords are plain
      text in `server/db.json` and why only the safe user object is persisted.
- [ ] Check the Profile card on a narrow phone; Phase 5 later added My Listings.
- [ ] Add the real team names and roles to `README.md`.
- [ ] Re-run the checks above on the team's machine and tick them off.

**Human edits made:**

_None yet. This section must stay empty until a teammate actually changes the
code above._

---

## Phase 3 — Browse and search (2026-10-23)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** After reviewing the Phase 2 summary, the team said
“continue”, which starts **Phase 3 only**: the home feed, keyword search with
category/condition filters, listing details, device-saved favorites, and
loading/empty/offline/error states.

**Generated:**

- `src/context/ListingsContext.tsx` — full reducer (`idle`/`loading`/`ready`/
  `error`), `refresh({ silent })`, `toggleFavorite`, one-time feed load,
  one-time favorites restore, and persistence after each change.
- `src/api/listingsApi.ts` — `getListings()` now returns `{ listings, source }`;
  only network failures use the bundled fallback, while HTTP errors propagate to
  the error state.
- `src/utils/storage.ts` — `loadFavorites` / `saveFavorites` around the
  AsyncStorage key `unisell.favorites`.
- `src/utils/categoryMeta.ts` — category icons and tints for photo placeholders.
- `src/utils/listings.ts` — pure `filterListings()` for keyword, category and
  condition filtering.
- `src/utils/formatters.ts` — `getInitials()` shared by the Home avatar, seller
  card and Profile.
- `src/components/FilterChip.tsx` — category/condition pill with selected state.
- `src/components/ListingImage.tsx` — photo or tinted category placeholder.
- `src/components/ListingCard.tsx` — two-column card with price, title, meet-up
  spot, category, condition, date, status badge and heart.
- `src/components/EmptyState.tsx`, `LoadingState.tsx`, `ErrorState.tsx`,
  `OfflineBanner.tsx` — shared data states.
- `src/screens/HomeScreen.tsx` — greeting, avatar shortcut, search shortcut,
  category chips, item count, two-column feed, pull-to-refresh, SDG note.
- `src/screens/SearchScreen.tsx` — keyword input, category chips, condition
  chips, result count, clear filters, empty state.
- `src/screens/ListingDetailsScreen.tsx` — category hero, price, badges,
  meet-up/date, seller card, description, safety note, save action.
- `src/screens/FavoritesScreen.tsx` — saved grid, unavailable-item handling,
  empty state, pull-to-refresh.
- `src/screens/ProfileScreen.tsx` — now reuses `getInitials()`.
- `src/types/index.ts` — `ListingsSource`, `source` and `refreshing` fields.
- Updated `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md` and
  `PITCH_DECK_OUTLINE.md` for Phase 3.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- Logged in as `mika.santos@dorsu.edu.ph`; Home loaded 18 listings from
  json-server and showed the greeting, avatar, chips and count.
- **Textbooks** chip narrowed the feed to 4 items and changed the section title.
- Search `calculator` returned 2 items; **Uniforms + Used** returned 2 items;
  `zzzz` showed “No matches” and **Clear filters** restored the feed.
- Opened a textbook: price, title, meet-up spot, seller card, description,
  safety note and save button rendered correctly. A reserved uniform showed the
  orange **Reserved** badge and “reserved for another student” notice.
- Saving from details updated the button and the top heart; the Saved tab showed
  the item. After a full page reload the session and favorite were restored from
  AsyncStorage.
- Saving from a card’s heart did **not** open the card. Removing the last saved
  item showed the Saved empty state, and `unisell.favorites` became `[]`.
- With json-server stopped, a reload showed the bundled 18 listings and the
  “You're offline. Showing saved listings.” banner. Restarting the API restored
  live data.
- Browser testing exposed a React DOM warning: the card Pressable contained the
  heart Pressable, producing nested `<button>` elements. Fixed by making the
  heart a sibling of the card press target, with the same visual position. The
  console was clean after the reload.
- The favorites key is currently device-wide, not per account. This is recorded
  as an MVP simplification in the README and architecture notes.
- The HTTP-error retry state was implemented but **not triggered** in browser
  testing: stopping json-server produces a network error and deliberately uses
  the fallback. It needs a separate check against a real HTTP error.
- Testing was web-only at a desktop viewport. The Phase 3 screens have not yet
  been reviewed on a physical phone.

**Human edits needed:**

- [ ] Run the browse flow on the actual demo phone in Expo Go; check the
      two-column cards, long titles, chip scrolling and details spacing.
- [ ] Confirm the condition filter wording (“Any / New / Used”) and card copy in
      the team's voice.
- [ ] Decide whether the “See all” link should reset Search filters; today it
      opens the Search tab with its last local filters.
- [ ] Confirm device-wide favorites are acceptable for the demo, or scope the
      storage key by user id.
- [ ] Trigger the error state on purpose (for example with a temporary HTTP 500)
      and confirm **Try again** works.
- [ ] Re-check the offline banner and pull-to-refresh on a phone with Wi-Fi off.
- [ ] Capture phone screenshots for `docs/screenshots/` and update the README.
- [ ] Add the real team names and roles to `README.md`.
- [ ] Re-run the checks above on the team's machine and tick them off.

**Human edits made:**

_None yet. This section must stay empty until a teammate actually changes the
code above._

---

## Phase 4 — Post a listing (2026-10-23)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** After reviewing the Phase 3 summary, the team said
“continue”, which starts **Phase 4 only**: a validated post-listing form, a
`POST /listings` write through the existing API layer, seller data from the
signed-in session, and a feed update after publishing.

**Generated:**

- `src/screens/PostListingScreen.tsx` — full form (title, whole-peso price,
  category, condition, campus meet-up spot, description), inline validation,
  API error banner, “Posting as” seller card, category-art photo placeholder,
  submit/loading state, reset and navigation to the new details screen.
- `src/context/ListingsContext.tsx` — `publishListing()` and the `ADD_LISTING`
  reducer case. The action inserts the new card at the top immediately, removes
  any duplicate id, then runs a silent refresh to reconcile the feed with the
  server.
- `src/components/FormField.tsx` — multiline support for the description
  field, including top-aligned icon and a minimum text area height.
- `src/types/index.ts` — `MEETUP_SPOTS` campus allow-list and an updated
  `image` comment (MVP placeholders, no uploader).
- `src/utils/validators.ts`, `src/api/listingsApi.ts` — comments updated to match
  the implemented flow; `createListing()` itself already existed from Phase 1.
- `src/api/apiClient.ts` — offline error copy changed from backticks to a plain
  instruction (the same message is now shown on auth and post screens).
- Updated `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md` and
  `PITCH_DECK_OUTLINE.md` for Phase 4.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- Empty submit showed all six field errors: title, price, category, condition,
  meet-up spot and description.
- Filling the form with price `0` showed only “Price must be greater than zero.”;
  the other field errors cleared as the fields were changed.
- Selected **Textbooks / Used / Student Center** and posted “Test Listing —
  Phase 4” at ₱350. json-server logged `POST /listings 201` and assigned id 19;
  the app opened the new Listing Details with the category hero, price, status,
  description, seller card and meet-up spot.
- The Home count changed from 18 to 19 with the new card first. A full page
  reload kept the session and the new listing, confirming it persisted in
  `server/db.json`.
- With json-server stopped, a second draft POST showed the inline “Could not
  reach the UniSell mock API” error above the button, and the draft fields stayed
  filled. No record was created.
- Test cleanup: the original `server/db.json` was restored (4 users / 18 listings
  / 6 categories), the browser session and favorites were cleared, and both dev
  servers were stopped.
- Browser testing was web-only at a desktop viewport. The Phase 4 form has not
  been checked on a physical phone, and the HTTP-500 retry state from Phase 3 is
  still not exercised.
- Photo upload is intentionally not implemented: the form previews category art
  and posts `image: null`.

**Human edits needed:**

- [ ] Run the post flow on the actual demo phone: keyboard avoidance, multiline
      description, the three modal pickers, tab-bar spacing and the error banner.
- [ ] Review the new copy in the team's voice: “Posting as”, “MVP placeholder”,
      validation messages and the API error text.
- [ ] Decide whether the rubric expects a real image picker; if so, add
      permissions, upload/storage and preview handling.
- [ ] Confirm the campus meet-up list is accurate and complete for DOrSU.
- [ ] Confirm the whole-peso price rule, six-digit cap and field limits are
      acceptable.
- [ ] Decide whether a successful post should open Listing Details (current) or
      return Home with a success toast.
- [ ] Check the immediate insert + silent refresh under a slow network, and
      confirm double-tapping Publish cannot create duplicate posts.
- [ ] Re-test the Phase 3 HTTP-500 retry state, the “See all” filter decision,
      phone layouts and screenshots.
- [ ] Add the real team names and roles to `README.md`.
- [ ] Re-run the checks above on the team's machine and tick them off.

**Human edits made:**

_None yet. This section must stay empty until a teammate actually changes the
code above._

---

## Phase 5 — Profile, accessibility and cleanup (2026-10-23)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** After reviewing the Phase 4 summary, the team said
“continue”, which starts **Phase 5 only**: complete the Profile tab, show the
signed-in student's own listings, make a focused accessibility pass, remove
unused code, and update the documentation before the final delivery phase.

**Generated:**

- `src/screens/ProfileScreen.tsx` — expanded from the Phase 2 account/logout
  surface into the full Profile: verified account card, school email, course,
  year level and student ID; My Listings and Saved item stat tiles; compact
  My Listings rows that open the real Listing Details screen; loading, empty,
  error/retry and offline states; **Post new** / **Post your first item**
  actions; campus safety card; and a loading-aware logout button.
- `src/navigation/MainTabs.tsx` — explicit `tabBarAccessibilityLabel` values for
  all five tabs; the centre Sell FAB glyph is now dark for non-text contrast.
- `src/components/ListingCard.tsx` — fuller “Open …” and “Save/Remove …”
  accessible labels and a larger heart target via `hitSlop`.
- `src/components/LoadingState.tsx` — spinner label, plus a labelled Profile
  section spinner.
- `src/screens/HomeScreen.tsx` — header roles, explicit avatar/search/“See all”
  labels, and larger hit targets.
- `src/screens/SearchScreen.tsx` — header roles, labelled input/clear action,
  larger clear targets, and a polite live region for the result count.
- `src/theme/colors.ts` — darker muted, warning/danger and
  available/reserved/sold tokens while preserving the brand teal and orange.
- `src/utils/categoryMeta.ts` — darker category accents for readable labels on
  their tints.
- `src/utils/listingStatus.ts` — shared `getStatusColor()` used by the feed card,
  details screen and Profile.
- Removed the unused `src/components/PlaceholderScreen.tsx`.
- `docs/ACCESSIBILITY.md` — implemented labels, touch targets, contrast ratios,
  Lighthouse web result, and the remaining human checks.
- Updated `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md` and
  `PITCH_DECK_OUTLINE.md` for Phase 5.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes after the final accessibility/Profile edits.
- Profile, signed in as Mika, showed the verified account, **4 My listings** and
  the Saved count. My Listings rows opened the matching Listing Details screen.
- Saving an item changed the Profile Saved stat from 0 to 1, and removing it
  returned the stat to 0.
- The empty My Listings state was checked with a temporary browser session whose
  user id had no posts. It showed **0 listings**, the explanatory copy and
  **Post your first item**; that CTA opened the Sell tab. The temporary session
  existed only in browser localStorage and was not written to `server/db.json`.
- The tab bar exposed readable names for Home, Search, Sell, Saved and Profile.
- Lighthouse in the desktop web preview reported **Accessibility 1.0** for Home,
  Profile, Search and Post after the fixes. The remaining Lighthouse failures
  were SEO (`meta-description` and `robots.txt`), not accessibility.
- Data cleanup: `server/db.json` was confirmed at 4 users / 18 listings / 6
  categories; the browser session and `unisell.favorites` were cleared; both dev
  servers were stopped.
- Testing was **web-only** at a desktop viewport. The Profile error/retry branch
  and the Phase 3 HTTP-500 state were implemented but not triggered, and no
  physical-phone or screen-reader pass was performed.

**Human edits needed:**

- [ ] Run the Profile flow on the actual demo phone: narrow width, large system
      text, long course names, My Listings rows and the logout state.
- [ ] TalkBack on Android and VoiceOver on iOS: headings, tab names, card/heart
      actions, chip selected state, picker modal, live search count and focus
      order.
- [ ] Decide whether the Phase 5 darker muted/status/category colours are close
      enough to the Figma design after seeing them on the phone.
- [ ] Trigger the Profile loading-error/retry branch on purpose and confirm
      **Try again** works; repeat the still-pending HTTP-500 retry check.
- [ ] Review the Profile, safety and empty-state copy in the team's voice.
- [ ] Reconsider whether “My Listings” needs its own API in a future version;
      the current filter is intentional for the MVP.
- [ ] Capture phone screenshots for `docs/screenshots/` and update the README.
- [ ] Add the real team names and roles to `README.md`.
- [ ] Re-run the checks above on the team's machine and tick them off.

**Human edits made:**

_None yet. This section must stay empty until a teammate actually changes the
code above._

---

## Phase 6 — Delivery package (2026-10-23)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** After reviewing the Phase 5 summary, the team said
“continue”, which starts **Phase 6 only**: final delivery preparation — README
and AI log updates, EAS preview configuration, screenshots, a demo script and a
submission checklist. The brief still requires a stop after the phase.

**Generated:**

- `eas.json` — internal `preview` profile that builds an Android APK, plus a
  production profile with automatic version increments. `appVersionSource` is
  local.
- `app.json` — added `android.versionCode: 1` and `ios.buildNumber: "1"` so the
  EAS profiles have explicit starting versions; added web `name`, `lang`,
  `themeColor` and `description` so the static export includes a meta description.
- `public/robots.txt` — copied into the static web export so crawlers do not get
  a 404.
- `tsconfig.json` — explicit excludes for `dist`, `web-build`, `.expo` and native
  folders so `npm run typecheck` never scans generated export output.
- `package.json` — added `export:web`, `build:preview` and `db:reset` scripts.
- `server/db.seed.json` — a clean copy of the 4-user / 18-listing / 6-category
  database, used to restore the demo after a live post.
- `LICENSE` — replaced the Expo template copyright line with the UniSell Team,
  Davao Oriental State University. The MIT terms are unchanged.
- `docs/BUILD_AND_RELEASE.md` — EAS setup, APK build, the baked-in
  `EXPO_PUBLIC_API_URL` limitation, local-build fallback and APK verification
  list.
- `docs/DEMO_SCRIPT.md` — 7-minute run of show, pre-flight checklist, exact demo
  actions, fallback table and cleanup.
- `docs/SUBMISSION_CHECKLIST.md` — deliverables, command checks, functional
  smoke test, accessibility, honesty/security review, pitch tasks and cleanup.
- `docs/screenshots/` — nine web-preview captures at a 390 × 844 CSS viewport:
  Welcome, Login, Sign Up, Home, Search, Listing Details, Post Listing, Saved and
  Profile. The gallery README labels them as **web captures, not phone captures**.
- Updated `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md`,
  `docs/ACCESSIBILITY.md` and `PITCH_DECK_OUTLINE.md` with the delivery status,
  build caveat, screenshots, demo-script link and final Lighthouse result.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes after the delivery edits. A check run that raced with
  deleting `dist/` showed TypeScript could include generated export files; the
  explicit `tsconfig.json` excludes now prevent that.
- `npm run export:web -- --clear` completes and creates `dist/` with a 1.4 MB web
  bundle. `dist/` remains ignored.
- The first production export failed because Metro tried to resolve Node's `fs`
  from the temporary `scripts/reset-db.js`. The reset helper was replaced with an
  inline Node command in the `db:reset` npm script; the export then passed. This
  is recorded so the failure is not mistaken for an app-code bug.
- `npm run db:reset` restores `server/db.json` from the seed and reports
  **4 users / 18 listings / 6 categories**. Running it while json-server was
  watching caused a transient `EBUSY` read warning before the watcher recovered;
  the docs now say to stop the API first.
- `app.json` and `eas.json` parse as valid JSON; Expo config resolves the app
  name, slug, package (`ph.edu.dorsu.unisell`) and orientation.
- The nine screenshots were taken from the Expo web preview with json-server
  running, the app root constrained to 390 × 844 and browser chrome cropped out.
  No test listings or test users were created for the captures.
- The static export contains the description meta tag and `robots.txt`. Lighthouse
  against the served production export (Welcome page) reported **Accessibility
  1.0, Best Practices 1.0 and SEO 1.0**, with no failures. This closes the two
  Phase 5 SEO gaps but is still a Welcome-page-only run.
- The preview APK was **not built**. This workspace has no signed-in Expo
  account, no `EXPO_TOKEN`, and no Android SDK. An interrupted `npx eas-cli`
  download also left its cache incomplete (`MODULE_NOT_FOUND` on `whoami`).
  `eas.json` is configuration only until the team runs the documented steps.
- `npx expo-doctor` again failed at the Expo API schema check with a TLS/network
  error, not a reported project configuration error. It is not counted as a pass.
- No physical-phone, TalkBack or VoiceOver pass was performed. The still-pending
  HTTP-500 retry and Profile error/retry branches remain untested.
- Cleanup after the capture: browser session and `unisell.favorites` cleared,
  `server/db.json` restored to the clean seed, and both dev servers stopped.
  `server/db.json` has no Phase 6 test listings.

**Human edits needed:**

- [ ] Create/sign in to an Expo account, run `npx eas-cli@latest init`, then
      `npm run build:preview`. Do not claim an APK exists before the EAS build
      finishes.
- [ ] Decide the preview APK's API URL strategy. The app cannot reach the
      laptop's LAN API unless `EXPO_PUBLIC_API_URL` is set at build time; Expo Go
      remains the recommended live-demo path.
- [ ] Install the APK on the demo phone and run the APK verification list in
      `docs/BUILD_AND_RELEASE.md`.
- [ ] Replace the web-preview screenshots with phone captures if the rubric
      requires on-device evidence; keep the filenames or update the README links.
- [ ] Run the demo script end to end with a timer, then again with the API
      deliberately stopped.
- [ ] Run the phone layout, large-font and screen-reader checks still listed in
      the submission checklist.
- [ ] Add real team names, roles and final slide details; the README team table
      is still placeholders.
- [ ] Confirm the MIT copyright line (“UniSell Team, Davao Oriental State
      University”) is the attribution the team wants.
- [ ] Review the new delivery copy in the team's voice and re-run all checks on
      the submission machine.

**Human edits made:**

_None yet. This section must stay empty until a teammate actually changes the
code above._

---

## Post-delivery debugging — 2026-10-24

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Expo Go on the physical phone showed “Could not reach the
UniSell mock API” even though the phone browser could open the LAN API. The team
asked for a robust API base URL, console diagnostics, a `.env` file and restart
instructions.

**Generated / changed:**

- `src/api/apiClient.ts` — resolves the API URL from `EXPO_PUBLIC_API_URL`,
  otherwise from `Constants.expoConfig.hostUri` plus port `3001`; rejects stale
  port `3000`; replaces loopback URLs on native with the Expo host when possible;
  logs the exact method, URL, status and error message for every failed request.
- `package.json` / `package-lock.json` — added `expo-constants` `~58.0.13`.
- `.env` — local, Git-ignored value:
  `EXPO_PUBLIC_API_URL=http://192.168.22.131:3001`. The laptop's Wi-Fi DHCP
  address changed from `192.168.22.151` to `192.168.22.131` during the restart;
  the stale `.env` URL was the likely reason the phone kept failing even though
  the API itself was healthy.
- `README.md` — replaced the old shell-only phone instructions with `.env` and
  `npx expo start --clear`, and documented the `[UniSell API]` console line.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- Expo reported `env: load .env` and `env: export EXPO_PUBLIC_API_URL` when
  restarted with `--clear`.
- The restarted Expo manifest reported `hostUri=192.168.22.131:8081`.
- `GET http://192.168.22.131:3001/listings` returned `200` with 8,736 bytes.
- An earlier Android bundle built from the same `.env` mechanism contained the
  configured LAN API URL; the bundle was not re-downloaded after the DHCP change.

**Not verified:**

- The physical phone still needs to reload the new bundle and confirm that
  login, posting and the error logs work. No on-device pass is claimed here.

---

## UI polish Task 1 — Welcome screen (2026-10-24)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Polish the first Welcome screen: replace the empty middle
with a vector-only hero illustration of overlapping item cards, add three value
props, keep the SDG 12 chip, logo, headline, both auth buttons and the verified
footer, use a subtle gradient, a gentle fade/slide entrance, safe areas and a
scrollable layout for small phones.

**Generated / changed:**

- `src/components/WelcomeHero.tsx` — new vector-only illustration with three
  tilted item cards (book, uniform, dorm lamp), a soft mint glow and two small
  accent icons. All colours, spacing, radii, fonts and shadows come from
  `src/theme`.
- `src/screens/WelcomeScreen.tsx` — replaced the fixed, vertically centred hero
  with a `ScrollView` inside `SafeAreaView`; added `expo-linear-gradient`
  background, a short `Animated` fade/slide entrance, a responsive compact
  heading, and the three value props with icons.
- Kept the SDG 12 chip, UniSell logo, headline, “Create an account” and “I
  already have an account” buttons, and “Verified DOrSU students only” footer.
- Touch targets remain the shared `AppButton` (minimum 52px); buttons keep
  accessibility labels through that component.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.

**Human edits needed:**

- [ ] Check the Welcome screen on the smallest demo phone in portrait and
      landscape; confirm nothing is clipped and the page scrolls when needed.
- [ ] Check the fade/slide does not feel distracting with Android “Remove
      animations” enabled.
- [ ] Confirm the new copy and illustration match the team’s Figma direction.
- [ ] Check contrast on the actual phone display, especially the 11px value-prop
      labels.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## UI polish Task 2 — Camera-only listing photos (2026-10-24)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Add real seller-taken listing photos using
`expo-image-picker` and `expo-image-manipulator`. Camera only — no gallery
option. Require 1–3 photos, explain the permission before asking, handle denial
with an Open settings button, resize to 800px / JPEG 0.6 / base64, warn above
300KB, show Retake/Remove thumbnails, save `listing.images` and `listing.image`,
show photos on cards and a swipeable gallery on details, and document the
camera-only and base64 trade-offs.

**Generated / changed:**

- Installed `expo-image`, `expo-image-picker`, `expo-image-manipulator` and
  `expo-linear-gradient` at SDK 58-compatible versions.
- `app.json` — added the `expo-image-picker` config plugin with a camera usage
  description, photo-library permission disabled and microphone permission
  disabled.
- `src/types/index.ts` — added `images?: string[]` to `Listing` and required
  `images: string[]` on `NewListingInput`; `image` remains the first-photo
  mirror for older screens.
- `src/screens/PostListingScreen.tsx` — new camera-only photo section:
  explanation alert before the OS prompt, denied-permission message with
  `Linking.openSettings()`, 1–3 photo limit, resize/compress/base64 pipeline,
  300KB rejection, Retake/Remove buttons, Add another photo, and publish
  validation “Take at least 1 photo of your item”. The API payload now sends
  `images` plus `image: images[0]`.
- `src/components/ListingImage.tsx` — switched to `expo-image` with
  `contentFit="cover"`, a pulsing skeleton while loading, and the existing
  category placeholder on missing/error images.
- `src/components/ListingGallery.tsx` — new horizontal paged gallery with page
  dots, the “Photo taken by seller” badge, and a category-placeholder fallback
  for seed listings.
- `src/screens/ListingDetailsScreen.tsx` — uses the gallery in the hero.
- `src/theme/colors.ts` — added the `dangerSoft` token for permission notices.
- `README.md` — documented the posting flow, camera-only rationale (authentic
  photos, anti-scam), base64 mock-API limitation, the 10MB json-server body
  limit and the production Supabase Storage alternative.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- A temporary json-server instance accepted a **1.56MB** POST with three
  base64 photos and returned **201**; the temporary database was deleted after
  the check. The installed `json-server` body parser limit is 10MB, so three
  photos near the 300KB target fit.
- The camera/manipulator flow has **not** been run on a phone in this session;
  it cannot be verified in the web preview.

**Human edits needed:**

- [ ] Run the camera flow on the demo phone: first-time permission, denial,
      Open settings, Retake, Remove and the 3-photo limit.
- [ ] Check that the compressed photos look acceptable and stay under 300KB on
      the team's phone camera.
- [ ] Publish a listing from one phone, open it on another phone using the same
      mock API, and confirm all photos appear.
- [ ] Confirm the 800px / 0.6 quality choice is a good balance for the demo.
- [ ] Confirm the README wording about Supabase Storage and the mock-API
      limitation is accurate for the team's final pitch.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## UI polish Task 3 — Bottom tab bar and scroll clearance (2026-10-24)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Fix the bottom tab bar so labels are not cut off, make the
centre “+” button a 56px circle raised about 12px, use safe-area insets, set
11–12px labels with an accessible inactive gray, and add tab-bar-height bottom
padding to every tab screen’s scroll content.

**Generated / changed:**

- `src/navigation/MainTabs.tsx` — reads `useSafeAreaInsets()`, sets the bar
  height to a 62px base plus the bottom inset, and adds matching bottom padding.
  The centre button is now 56px with a 28px radius, raised 12px, with the shared
  floating shadow and `tabBarAccessibilityLabel: 'Post a listing'`. Labels use
  the 11px `fontSizes.xs` token; inactive labels keep the AA-contrast
  `colors.textMuted`. Removed the hard-coded `#E58A38` focused colour.
- `src/navigation/useTabBarBottomInset.ts` — new hook around
  `useBottomTabBarHeight()` for tab screens.
- `src/components/ScreenContainer.tsx` — added an optional `bottomInset` prop.
- `src/screens/HomeScreen.tsx`, `SearchScreen.tsx`, `FavoritesScreen.tsx` — the
  FlatList content adds `tabBarHeight + spacing.xxxl` bottom padding.
- `src/screens/PostListingScreen.tsx`, `ProfileScreen.tsx` — pass the tab bar
  height to `ScreenContainer` as `bottomInset`.
- Listing Details remains a root-stack screen, so the tab bar is naturally
  hidden there. Post Listing remains a tab and keeps the bar visible, matching
  the existing five-tab Figma shell.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.

**Human edits needed:**

- [ ] Check the tab bar on a gesture-navigation phone and a 3-button-navigation
      phone; confirm “Home”, “Search”, “Saved” and “Profile” are fully visible.
- [ ] Confirm the 56px centre button is raised about 12px and does not cover the
      neighbouring labels.
- [ ] Scroll to the last card on Home, Search and Saved and confirm it clears the
      bar; repeat on Post Listing and Profile.
- [ ] Confirm whether the team’s Figma hides the tab bar on Post Listing. If it
      does, this screen needs an explicit back action before hiding it.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Photo diagnosis and rendering fix (2026-10-25)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Diagnose why listing photos were not showing, report what the
database and submit/API code actually contained, then make camera photos persist
as compressed data URIs and render on Home, Search, Saved, Profile and Listing
Details. Keep camera-only capture and the 1-photo minimum. Remove temporary
debug logging at the end.

**Generated / changed:**

- Diagnosed the current `server/db.json`: all 18 seed listings had
  `image: null`, no `images` array, and there were no app-posted listings in the
  file. The category icon was therefore the correct fallback, not a broken image
  path.
- Confirmed the posting pipeline was already resizing to 800px, compressing to
  JPEG quality 0.6, requesting base64 from `expo-image-manipulator`, and sending
  `image: images[0]` plus `images` in the POST body. json-server's 10MB body
  limit was not rejecting the tested payloads.
- Added `src/utils/images.ts` with `resolveImageUri` / `resolveImageUris`. A
  `data:` URI is used unchanged; a relative `/images/<file>.jpg` path is prefixed
  with the current API base URL; empty values become `null`.
- `ListingImage.tsx` now resolves both fields, treats empty strings as missing,
  keeps the pulsing skeleton, and shows the category icon only when there is no
  usable image or the image fails to load.
- `ListingGallery.tsx` now resolves and de-duplicates `images` plus `image`,
  uses a new `GalleryPhoto` with `expo-image`, `contentFit="cover"`, a skeleton
  and a category-icon fallback for missing files.
- `ProfileScreen.tsx` now uses `ListingImage` for My Listings thumbnails instead
  of always drawing the category icon.
- Added temporary `[UniSell photo debug]` logs for the captured URI, POST
  payload, render URI and load errors, then removed them after the fix.
- Updated the `Listing` / `NewListingInput` comments to describe both camera data
  URIs and API-served seed paths.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes after the fix.
- The API layer and form payload were inspected; no code path converts a camera
  capture to `file://`.

**Human edits needed:**

- [ ] Take a photo on the demo phone, publish, then reload and confirm the photo
      still appears from `server/db.json`.
- [ ] Open the same listing on a second phone and confirm the base64 photo loads.
- [ ] Check Home, Search, Saved, Profile and Listing Details for the same item.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Seed photo infrastructure and shot list (2026-10-25)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Add support for local seed photos served by the mock API,
create a shot list for the 18 seeded listings, add a `sharp` resize script and
npm script, update the seed data to use `/images/...` paths, ignore raw phone
photos, and document the workflow without downloading or generating stock/AI
images.

**Generated / changed:**

- Added `src/utils/images.ts` relative-path resolution for `/images/<file>.jpg`
  using the API base URL (shared with the diagnosis fix above).
- Added `server/public/images/` with a `.gitkeep`, and updated the `api` script
  to `--static server/public`. This was verified with a temporary text file:
  `GET /images/static-check.txt` returned **200**. The file was deleted after
  the check. Without `--static`, json-server would serve the project-level
  `public/` folder instead of `server/public/`.
- Added `docs/PHOTO_SHOT_LIST.md` with all 18 ids, titles, categories and exact
  lowercase kebab-case file names, plus the team shooting guide.
- Added `scripts/prepare-images.js` and the `photos` npm script. It reads the
  expected names from `server/db.json`, resizes with `sharp` to max width 800px,
  writes JPEG quality 70, and reports missing raw photos.
- Installed `sharp` as a devDependency.
- Updated `server/db.json`, `server/db.seed.json` and `src/data/listings.json`
  so each of the 18 seed listings has `image: "/images/<file>.jpg"` and
  `images: ["/images/<file>.jpg"]`.
- Added `raw-photos/` to `.gitignore`.
- Updated `README.md` with the seed-photo workflow and the production cloud
  storage note.

**Important honesty note:** no photo files were created, downloaded, generated
or invented by the AI. The 18 seed photo files must still be taken by the team
with their own phones. Until then, the app falls back to the category icon.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- `GET /images/static-check.txt` returned **200** from a temporary json-server
  instance with `--static server/public`; the test file was removed.
- `server/db.json`, `server/db.seed.json` and `src/data/listings.json` each have
  18 image paths matching the shot list.
- The `photos` script has not been run with real photos yet because the team has
  not supplied them.

**Human edits needed:**

- [ ] Take the 18 real photos using the shot list, put them in `raw-photos/`,
      and run `npm run photos`.
- [ ] Commit the resized files in `server/public/images/`.
- [ ] Confirm the photos look like the actual items and contain no faces, IDs or
      private information.
- [ ] Check that missing files fall back to the category icon without a crash.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Welcome screen SDG chip removal (2026-10-25)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Remove the “SDG 12 — Responsible Consumption” chip from the
Welcome screen only, delete unused styles/imports, and rebalance vertical spacing
without changing other screens or removing SDG 12 from the docs.

**Generated / changed:**

- `src/screens/WelcomeScreen.tsx` — removed the leaf/SDG 12 pill above the
  “Buy and sell within campus.” headline.
- Removed the now-unused `sdgChip` and `sdgText` styles.
- Increased the hero-to-headline spacing from `spacing.xs` to `spacing.md` so the
  headline does not sit too close to the vector artwork.
- Kept the existing safe-area wrapper, scroll container, compact-heading rule and
  all other Welcome content. SDG 12 remains in `README.md`, `docs/` and
  `PITCH_DECK_OUTLINE.md`.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.

**Human edits needed:**

- [ ] Check the Welcome screen on a small phone and confirm nothing is cramped,
      clipped or hidden behind the status/gesture bars.
- [ ] Confirm both buttons are still reachable and the entrance animation still
      plays.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Temporary sample product images (2026-10-26)

**AI tool / model:** OpenCode coding agent - DeepSeek V4.1 Flash Free

**Prompt summary:** Put sample pictures on the seeded products for demo purposes
only; the team will replace them with real phone photos before submission.

**Generated / changed:**

- Added `scripts/generate-sample-images.js` and the `photos:sample` npm script.
  It reads the 18 seeded listings from `server/db.json`, renders 800x800 JPEG
  cards with a category colour, product emoji, title and a visible `SAMPLE
  IMAGE` label, and writes them to `server/public/images/`.
- Ran the generator to create all 18 sample JPEGs. These are generated demo
  placeholders, not real product photos.
- Updated `README.md` and `docs/PHOTO_SHOT_LIST.md` so they clearly say the
  sample placeholders are temporary and must be replaced with team-taken photos.
- Did not change the app rendering code, the database records, or the 19th
  `Laptop` test listing that uses a base64 data URI.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- All 18 seed image URLs return HTTP 200 from the running API.
- `npm run typecheck` passes.
- The generator skips existing files by default and only overwrites them when
  `--force` is passed.

**Human edits needed:**

- [ ] Replace all 18 sample cards with real team-taken photos in `raw-photos/`,
      then run `npm run photos`.
- [ ] Confirm the final photos contain no faces, IDs or private information.
- [ ] Do not present the sample cards as real product photos in the final pitch.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Seeded product illustrations (2026-10-26)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Replace the temporary emoji sample cards with original vector
illustrations of the 18 seeded products, convert them to 800x800 JPEGs, mark the
seed records with `imageType: "sample"`, show a sample badge only for those
records, keep new listings camera-only, and fix the Laptop category.

**Disclosure:** The 18 sample images are AI-generated illustrations, not
photographs of the actual items.

**Generated / changed:**

- Added 18 original SVG illustrations in `assets/seed-illustrations/`, one per
  seeded listing. The illustrations use the UniSell teal/orange palette, a soft
  mint background, a subtle ground shadow and a square 800x800 composition.
  They were drawn as vector shapes; no stock, internet or copyrighted images
  were downloaded or hotlinked.
- Added `scripts/generate-seed-svgs.js` to regenerate the SVGs from the seeded
  listing filenames.
- Added `scripts/build-seed-images.js` and the `seed-images` npm script. It
  converts every SVG to `server/public/images/<file>.jpg` at 800x800 and JPEG
  quality 80 using the existing `sharp` devDependency.
- Removed the old emoji-card generator and the `photos:sample` script so the
  temporary cards cannot overwrite the new illustrations.
- Backed up `server/db.json` to `server/db.backup.json`, then marked the 18
  seeded listings with `imageType: "sample"` and kept their `/images/...` paths
  and `images` arrays. The Laptop listing keeps its camera `data:image` photo
  untouched and its category was corrected from Textbooks to Gadgets.
- Updated `server/db.seed.json` and `src/data/listings.json` to match the active
  database.
- Added `SampleImageBadge` and used it on ListingCard and Listing Details only
  when `imageType === "sample"`. Camera listings continue to show the
  "Photo taken by seller" badge and no sample badge.
- Updated `README.md` and `docs/PHOTO_SHOT_LIST.md` to explain that seeded items
  use AI-generated sample illustrations, while new listings use camera-only
  seller photos. Also refreshed the photo notes in `docs/ARCHITECTURE.md` and
  `docs/CODE_WALKTHROUGH.md` so they no longer describe the old `image: null`
  placeholder.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- All 18 generated JPEGs return HTTP 200 from the running API at
  `/images/<file>.jpg`.
- The sample illustration contact sheet was reviewed; the images are
  recognizable illustrations of the listed items.
- `npm run typecheck` passes.
- The production web export succeeds.

**Human edits needed:**

- [ ] Review the 18 sample illustrations and confirm the style is acceptable for
      the demo.
- [ ] Reload the app on a phone and confirm the "Sample image" badge appears on
      seeded cards and Details, and not on the Laptop camera listing.
- [ ] Confirm the Laptop listing now appears under Gadgets.
- [ ] Confirm missing image files fall back to the category icon without a crash.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Camera or gallery photos (2026-10-27)

**AI tool / model:** OpenCode coding agent - DeepSeek V4.1 Flash Free

**Prompt summary:** Change the Post Listing photo section from camera-only to
camera **or** gallery. Add side-by-side source buttons, separate permission
explanations, Android 13+ handling, compression under about 300KB, per-photo
source tracking, photo-source badges, cover reordering, and updated docs.

**Generated / changed:**

- `src/screens/PostListingScreen.tsx` - added **Take photo** and **Choose from
  gallery** buttons (stacked below 500px), gallery multi-select limited to the
  remaining slots, separate camera/media permission flows, **Open settings**
  notices, `imageSources` output, gallery **Replace** actions, and **Make
  cover** reordering. The counter, **Camera or gallery** chip, helper text and
  missing-photo message were updated.
- `src/types/index.ts` - added `ImageSource` and `imageSources` on `Listing` and
  `NewListingInput`.
- `src/utils/imageSources.ts` - resolves each photo's source, including legacy
  `data:image` camera records.
- `src/components/ListingCard.tsx` - shows a small camera icon only when the
  cover photo came from the camera.
- `src/components/ListingGallery.tsx` - shows **Taken with camera** or **From
  gallery** per photo, keeps **Sample image** for seeded listings, and preserves
  the missing-image fallback.
- `app.json` - enabled the iOS photo-library permission string for gallery use.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md`,
  `docs/ACCESSIBILITY.md` and `PITCH_DECK_OUTLINE.md` - replaced camera-only
  wording with camera-or-gallery behaviour, base64 mock storage, cloud-storage
  production note and the new accessibility labels.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- json-server's JSON body parser limit is 10MB; three photos at about 300KB
  decoded each (roughly 1.2MB after base64) fit without changing the server.
- No gallery permission is requested on Android 13+ or web, where the system
  picker handles access.

**Human edits needed:**

- [ ] Run the app on a physical phone and test camera, gallery, mixed sources,
      remove, replace, make cover, and the per-photo/source badges.
- [ ] Deny camera access, confirm the **Open settings** button appears and the
      gallery button still works. Repeat for gallery access.
- [ ] Confirm Android 13+ opens the gallery without a media permission prompt.
- [ ] Confirm three photos still post and persist in `server/db.json`.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Seller ownership and listing lifecycle (2026-10-30)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Enforce strict listing ownership. Only the signed-in seller
may edit, delete, reserve, mark available or mark sold their own listing. Add a
reusable `canManageListing(user, listing)` helper, owner-only controls in Listing
Details and Profile > My listings, sold/reserved lifecycle and confirmations,
Active/Sold/All filters, delete-all-sold, sold visibility rules, deleted-listing
states, and service-layer ownership checks that do not trust route params.

**Generated / changed:**

- `src/utils/permissions.ts` — added `canManageListing` and shared rejection
  copy for ownership, sold-edit, signed-out and profile-ownership errors.
- `src/api/listingsApi.ts` — rewrote create/update/status/delete. `createListing`
  sets seller identity from the persisted session; `assertOwner` reloads the
  server copy and compares `sellerId` before every PATCH/DELETE; added a 404-safe
  `getListingById` and the seller-field bulk update helper.
- `src/context/ListingsContext.tsx` — added `UPDATE_LISTING`,
  `REMOVE_LISTINGS`, `updateListing`, `updateListingStatus`, `deleteListing` and
  `deleteListings`. Deletes also remove the id from Saved.
- `src/screens/ListingDetailsScreen.tsx` — owner action stack per status, SOLD
  ribbon, status-specific confirmations, loading/error/retry, delete toast and
  “This listing is no longer available”.
- `src/screens/PostListingScreen.tsx` — edit mode prefilled from the listing,
  owner/sold guards, sample-image labelling, **Save changes**, cancel/discard,
  PATCH via context and `updatedAt`.
- `src/screens/ProfileScreen.tsx` — Active/Sold/All segmented filter, owner “…”
  menu, sold-row delete shortcut, delete-all-sold count confirmation, masked
  student ID with Show/Hide, confirmed logout and immediate counts.
- `src/components/ListingActionsSheet.tsx`, `ToastContext.tsx`, `AppButton`
  `dangerOutline`, `ErrorBanner` retry and `ListingCard` SOLD ribbon.
- `src/screens/HomeScreen.tsx`, `SearchScreen.tsx`, `FavoritesScreen.tsx`,
  `src/utils/listings.ts` — sold items hidden by default, **Show sold items**
  toggle, unavailable copy and silent Saved cleanup.
- `src/types/index.ts`, `src/utils/validators.ts`, `src/utils/formatters.ts`,
  navigation types and `App.tsx` — supporting types, validation, masking and the
  toast provider.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md`,
  `docs/TESTING.md` and `PITCH_DECK_OUTLINE.md` — ownership, lifecycle, testing
  and demo notes.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- The API service layer rejects a non-owner before PATCH/DELETE and sets
  `sellerId` from the session on create.
- Sold filtering and the Saved cleanup paths were reviewed in code.

**Human edits needed:**

- [ ] Run the two-account checklist in `docs/TESTING.md` on a phone.
- [ ] Confirm A sees owner controls, B sees only Save, and a forced B edit/delete
      is blocked with the expected message.
- [ ] Confirm sold items leave Home/Search, stay in My listings > Sold and Saved,
      and deletion updates counts and Saved.
- [ ] Confirm a deleted listing opened from a stale screen shows “This listing is
      no longer available”.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Profile editing and password change (2026-10-30)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Add an Edit profile screen and button. Let students change
their full name (2–60 characters), course, year level and a compressed 400 px
camera/gallery photo with Remove photo and initials fallback. Keep email and
student ID read-only with a lock and “Contact your school office to change this”.
Mask the student ID on Profile with Show/Hide. Add an optional password change
with current/new/confirm validation and a “Discard changes?” guard. Save through
`PATCH /users/:id`, update AuthContext and AsyncStorage immediately, and refresh
the denormalized seller fields on the user's listings.

**Generated / changed:**

- `src/api/authApi.ts` — added `updateProfile` and `changePassword`, session-id
  ownership checks, `photo` in the safe user, and a best-effort bulk update of
  each owned listing's seller name/course/year. Documented that the mock API
  stores plain text for the prototype only.
- `src/context/AuthContext.tsx` — added `updateProfile` and `changePassword`,
  persisted the updated user with `saveSession` and dispatched `AUTH_SUCCESS`.
- `src/screens/EditProfileScreen.tsx` — new stack screen with name/course/year
  fields, 400 px compressed photo picker, Remove photo, initials fallback,
  read-only email/student ID, inline validation, disabled-until-changed Save,
  discard guard, optional password section and prototype password note.
- `src/screens/ProfileScreen.tsx` — added **Edit profile**, profile photo in the
  avatar, masked student ID Show/Hide and confirmed logout.
- `src/screens/PostListingScreen.tsx` — shows the profile photo in the Posting as
  card.
- `src/navigation/types.ts` and `RootNavigator.tsx` — registered `EditProfile`.
- `src/utils/validators.ts` — added `validateFullName` and
  `validateNewPassword`.
- `src/types/index.ts` — added profile/password input types and `User.photo`.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md`,
  `docs/TESTING.md` and `PITCH_DECK_OUTLINE.md` — profile editing, seller-field
  decision and test steps.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- The profile save path checks the persisted session id before PATCH and updates
  the local session immediately.
- Password validation covers wrong current password, minimum length, different
  new password and matching confirmation.

**Human edits needed:**

- [ ] Run the profile section of `docs/TESTING.md` on a phone.
- [ ] Test camera and gallery photos, Remove photo and initials fallback.
- [ ] Test the discard dialog, disabled Save and inline validation.
- [ ] Test wrong current password, a reused password and mismatched confirmation,
      then sign out and back in with the new password.
- [ ] Confirm the new name/photo appear on Home, Profile, Posting as and listing
      seller cards.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Responsive laptop/desktop layouts (2026-11-01)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Add responsive laptop/desktop layouts without changing app
logic. Confirm `react-native-web`, `react-dom` and `@expo/metro-runtime` work
with `npx expo start --web`. Add a `useBreakpoint` hook with mobile `< 600`,
tablet `600–1023` and desktop `>= 1024`, layout tokens (max content 1200, side
padding, grid gaps) and a `ResponsiveContainer` used on every screen. Home,
Search and Saved use 2/3/4 columns with a consistent card ratio. Desktop gets a
left sidebar (logo, Home, Search, Saved, Profile, prominent **Post a listing**);
mobile/tablet keep bottom tabs and the raised **+** stays mobile-only. Listing
Details and Profile become two-column on desktop; Post/Edit forms cap at 720 with
paired fields; auth screens use a 480 card with the hero beside it. No horizontal
scroll, readable type, 44 px mobile targets, web hover/focus/pointer feedback.
Verify 360/768/1024/1366/1920.

**Generated / changed:**

- `src/theme/layout.ts` — breakpoints, `useBreakpoint`, layout caps, page
  padding, grid gaps/columns, sidebar width.
- `src/components/ResponsiveContainer.tsx` and `ScreenContainer.tsx` — shared
  page width/padding wrapper used by every screen.
- `src/navigation/MainTabs.tsx` — custom tab bar: desktop left sidebar with the
  logo, four tabs and **Post a listing**; bottom tabs on mobile/tablet; raised
  mobile-only **+**; sidebar-aware inset.
- `src/screens/HomeScreen.tsx`, `SearchScreen.tsx`, `FavoritesScreen.tsx` —
  measured 2/3/4-column grids and desktop-aware card width.
- `src/screens/ListingDetailsScreen.tsx` — desktop two-column gallery/details.
- `src/screens/PostListingScreen.tsx`, `EditProfileScreen.tsx` — 720 px form cap
  and two-column field rows above mobile.
- `src/screens/LoginScreen.tsx`, `SignUpScreen.tsx`, `WelcomeScreen.tsx` —
  480 px card plus `WelcomeHero` beside it on desktop.
- `src/screens/ProfileScreen.tsx` — desktop two-column dashboard.
- `app.json`, `README.md`, `docs/ARCHITECTURE.md`, `docs/ACCESSIBILITY.md` —
  web metadata and layout/width documentation.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- `npm run export:web` completes for the production web bundle.
- Browser checks at 360 / 768 / 1024 / 1366 / 1920 px: no horizontal
  overflow, 2 / 3 / 4 grid columns, and the desktop sidebar appears at 1024.
- Listing Details and Profile render as two columns at 1024; the Post form
  pairs Title + Price and Category + Condition.
- Two web-only flex bugs were found and fixed: `ListingCard` used `flex: 1`
  with an explicit grid width (cards collapsed to 0 px), and the Profile
  desktop left column used `flex: 0` with a fixed width (column collapsed).
  Both now use `flexGrow` / `flexShrink` so the explicit width applies.

**Human edits needed:**

- [ ] Run the app at 360 / 768 / 1024 / 1366 / 1920 px and confirm no horizontal
      scroll, readable type, correct grid columns and the sidebar/bottom-tab switch.
- [ ] Check the desktop sidebar and **Post a listing** on a real laptop.
- [ ] Confirm Listing Details, Profile and the forms keep their two-column layout.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Colourful gradient button system (2026-11-01)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Replace ad-hoc buttons/chips/actions with one `Button`
component. Variants: primary (teal gradient), accent (orange gradient),
secondary, success, warning, danger filled/outline and ghost; sizes sm/md/lg;
left/right icons, loading and disabled. Pressed darker + scale 0.98, web hover
lighter + lift shadow, visible focus ring, desaturated disabled, loading spinner.
Keep AA contrast in light and dark. Give category chips per-category selected
colours, a red-pink filled saved heart, meaningful icons, teal primary, orange
only for the main CTA and red only for destructive actions.

**Generated / changed:**

- `src/components/AppButton.tsx` — one button with eight variants, three sizes,
  gradients, icons, loading, disabled, hover/pressed/focus/scale states and
  accessibility labels/hints.
- `src/components/FilterChip.tsx` — selected colour from the category palette.
- `src/theme/palettes.ts` — gradient sets, `hoverSheen` / `pressedSheen`,
  `onPrimary` / `onAccent` / `onSuccess` / `onWarning` / `onDanger` and category
  `color` / `tint` / `onColor` per mode.
- Every screen and component that had a button, chip or icon action — migrated
  to `AppButton` or the shared themed control; owner actions use
  success/warning/danger.
- `src/components/ListingCard.tsx` — filled `favorite` heart state.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/ACCESSIBILITY.md` — variant and
  contrast documentation.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- Every filled variant uses a checked text/background pair in both palettes.
- `AppButton` is the only filled action component; raw colour values were
  removed from `src/**/*.tsx` except the intentional `BrandMark` logo.

**Human edits needed:**

- [ ] Check every variant and size on a phone and in the browser, including
      hover, pressed, focus, disabled and loading.
- [ ] Confirm category chip colours and the filled heart read correctly in both
      themes.
- [ ] Confirm orange appears only on the main CTA and red only on destructive
      actions.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Persistent light/dark mode (2026-11-01)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Add persistent dark mode with light and dark semantic
palettes (background, surface, surfaceElevated, text, textMuted, border,
primary, accent, success, warning, danger, overlay, chips, shadows, skeleton).
Add `ThemeContext` with System / Light / Dark, AsyncStorage persistence, instant
apply and no startup flash (wait for the stored value). Put the theme switch in
Profile and in the desktop sidebar/top bar. Every screen and component must use
semantic tokens, including modals, toasts, skeletons, the status bar, photo
badges, the SOLD ribbon and the React Navigation theme. Keep photos/logo
unchanged, add a subtle overlay for text on photos, and set the web document
background and `color-scheme`.

**Generated / changed:**

- `src/theme/palettes.ts` — full light and dark palettes, gradients, category
  colours, status, chip, skeleton, overlay and button-sheen tokens.
- `src/context/ThemeContext.tsx` — mode state, system resolution, AsyncStorage
  load/save, first-paint gate, theme-aware shadows and web document theming.
- `src/theme/themed.ts` — `createThemedStyles` factory hook.
- `src/theme/index.ts` — re-exports palettes, hooks, layout and helpers.
- `src/utils/storage.ts` — `ThemeMode`, `loadThemeMode`, `saveThemeMode`.
- `src/components/ThemeSwitch.tsx` — System / Light / Dark segmented control.
- `src/navigation/RootNavigator.tsx` — React Navigation light/dark theme.
- `src/navigation/MainTabs.tsx` — sidebar/top-bar switch and themed tab bar.
- Every screen and shared component — replaced static colours with
  `createThemedStyles((colors, shadows) => ...)` + `useTheme()`.
- `src/screens/ProfileScreen.tsx` — Appearance card with the theme switch.
- `app.json` — `userInterfaceStyle: "automatic"`.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/ACCESSIBILITY.md` — theme system and
  dark-mode contrast tables.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes.
- A palette scan found no hard-coded hex/rgba values in `src/**/*.tsx` outside
  `BrandMark` (fixed logo colours by design).
- Dark-mode contrast pairs were calculated: body copy ≥ 6.8:1, muted text ≥ 8:1,
  primary on surface 7.76:1, focus ring 10.08:1.
- The stored mode is read before first paint so the app does not flash light.

**Human edits needed:**

- [ ] Toggle System / Light / Dark in Profile and the desktop sidebar, then
      reload and confirm the saved choice with no startup flash.
- [ ] Walk every screen, modal, toast, skeleton, status pill, photo badge and
      the SOLD ribbon in both themes.
- [ ] Confirm photos and the logo keep their original colours and that text on
      photos stays readable.
- [ ] Check the OS system-theme change while the app is open.
- [ ] Re-run `npm run typecheck` on the team's machine.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Figma alignment Phase 0 — design audit (2026-11-04)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Audit the UniSell app against the Figma Make design with no
code changes. List the reference files, extract colours, typography, radii,
shadows and icon style, write `docs/DESIGN_GAP.md` with one row per screen
(matches / differs / missing, marked must change / nice to have / keep ours),
list the new features and their data needs, then stop and ask questions before
Phase 1.

**Generated / changed:**

- `docs/DESIGN_GAP.md` — new Phase 0 audit: reference inventory, light and dark
  token tables, typography/radii/spacing/elevation/icon/layout notes,
  20-row screen gap table, new-feature data map and proposed record shapes,
  shared-component plan, phase mapping and 12 open questions.
- `AI_DISCLOSURE_LOG.md` — this entry.
- No `src/` or `server/` file was changed in this phase.

**Reference note:** `design-reference/` (and `figma-make-code/`) is not present
anywhere in the workspace, so the audit used the live Figma Make site
(`https://gale-bats-78360910.figma.site/`) and the written spec. The missing
folder is recorded as Question 1 in the audit. Values were read from computed
styles at the mobile frame width in light and dark mode.

**Key findings recorded (not yet implemented):**

- Light primary `#1F7A72`, accent `#F4A261`, glass surfaces, mint→blue page
  gradient; dark background `#0B1030`, card `#141B45`, mint `#7FD6C4`.
- Poppins is confirmed and already installed (400/500/600/700); no font is
  unavailable.
- Current body text (15) and caption (11–13) are below the Figma 16/14 scale.
- The app is missing Forgot password, Settings, Design System, Seller shop,
  Seller dashboard, Notifications, Messages/Chat and Reviews.
- Profile and Edit Profile currently display the student ID; the spec says the
  full ID must never be shown.
- The Figma five-item nav is Home · Saved · Sell · Messages · Profile; ours is
  Home · Search · Sell · Saved · Profile.
- Figma's success/danger colours fail normal-text AA in its own Accessibility
  page, so the audit recommends keeping our AA-safe pairs.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- The live Figma site loaded all audited routes and returned readable text and
  computed styles for light and dark mode.
- `design-reference/` was searched for by directory name and by image extension
  in `unisell/` and the parent workspace; it is absent.
- No app code was edited, so `npm run typecheck` was not required for this phase.

**Human edits needed:**

- [ ] Answer the 12 questions in `docs/DESIGN_GAP.md` §6 (especially the missing
      reference folder, student-ID privacy, and the Search vs Messages tab).
- [ ] Supply `design-reference/` screenshots and `figma-make-code/` if pixel
      comparison is required.
- [ ] Confirm the token table against the team's own Figma file before Phase 1.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 1 — Design alignment: tokens, shared components and navigation (2026-11-04)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Continue from the Phase 0 audit with Phase 1 only: apply the
Figma Make colour, type, radius, spacing and elevation tokens (including the
navy dark palette), build the shared components listed in
`docs/DESIGN_GAP.md` §4, and change the bottom navigation to
**Home · Saved · Sell · Messages · Profile** with the floating rounded bar and a
raised orange Sell button. Keep the desktop sidebar. Keep every working feature
(auth, API layer, ownership permissions, camera/gallery photos, sold/delete
flows, profile editing, responsive layout, button system, dark mode, mock REST
API). The splash/loading and Welcome screens must not be changed because the
team already approved them. Stop after Phase 1 and wait for “continue”.

**Generated / changed:**

- `src/theme/palettes.ts` — Figma light palette (`#1F7A72` teal,
  `#F4A261` orange, glass surfaces) and dark palette (`#0B1030` background,
  `#141B45` card, `#1A2250` elevated/input, `#2A3470` border, `#7FD6C4` mint).
  Added `label`, `verified`, `online`, `unread`, `rating`, `cardBorder`,
  `inputBorder`, `chipBorder`, `navBackground`, `navBorder`, and the three-stop
  page gradient. Kept the AA-safe success/danger pairs.
- `src/theme/typography.ts` — body raised to 16 px and caption to 14 px with
  matching line heights; Poppins 400/500/600/700 already installed.
- `src/theme/spacing.ts` — added `xxxl`/`huge` spacing and the Figma radii
  (`sm 12`, `md 18`, `lg 22`, `xl 28`, `panel 42`, `nav 25`, `pill 999`).
- `src/theme/layout.ts` — floating bar height 76 and 16 px margin.
- `src/theme/colors.ts` — now aliases the light palette for older imports.
- `src/context/ThemeContext.tsx` — Figma elevation presets plus a `panel` shadow.
- New components: `GradientBackground`, `RoundIconButton`, `SearchPill`,
  `StatusBadge`, `VerifiedBadge` (`VerifiedPill` / `VerifiedCheck`), `Rating`,
  `SegmentedControl`, `NotificationRow`, `ConversationRow`, `Avatar`.
- Updated components: `ScreenContainer` (page gradient), `FilterChip` (44 px,
  14 px, all-teal active state), `FormField` (pill inputs and label token), and
  `ListingCard` (condition chip, heart, status pill, ₱ price, seller name with
  green “Student” pill, optional rating, 22 px radius).
- Navigation: `MainTabs` now renders the floating five-item bar with the raised
  orange Sell button on phone/tablet and keeps the desktop sidebar with
  Messages. Search stays registered as a hidden tab so the Home search pill and
  “See all” still open it. Added the `Messages` route and a Phase 3 placeholder
  `MessagesScreen`.
- `src/navigation/useTabBarBottomInset.ts` — returns floating-bar clearance and
  `0` on desktop.
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors after the component and navigation
  changes (run twice, including after adding `Avatar`).
- Web smoke test at an 811 × 574 viewport against the Metro dev server:
  - Welcome → Login → Home works; the floating bar shows Home, Saved, Sell,
    Messages, Profile.
  - The rebuilt `ListingCard` shows the condition chip, heart, ₱ price, title,
    seller first name and green Student pill; the sample-image badge and status
    pill are visible.
  - Messages opens the placeholder with its header, search pill and empty state.
  - The Home search pill opens the hidden Search tab.
  - Light and dark palettes both render (page gradient, mint active chips,
    navy dark surfaces).
- No component console errors were logged. The only errors were API timeouts
  because the browser preview used the LAN `EXPO_PUBLIC_API_URL`; the app
  correctly fell back to the seeded listings. This does not affect the code
  changes.

**Human edits needed:**

- [ ] Review the token values and the floating-bar spacing on a physical phone;
      the preview was desktop-browser only.
- [ ] Check the raised Sell button against the Figma frame at phone width and
      confirm the label/icon spacing.
- [ ] Confirm the desktop sidebar still looks right at ≥1024 px (not exercised
      in this preview session).
- [ ] Run `npm run typecheck` yourself and open the app once in light and dark
      mode before Phase 2.
- [ ] Confirm the splash/loading and Welcome screens were not changed (the AI
      did not edit them, but the global type tokens affect their colours).

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 2 — Auth screens: Login, Sign Up and Forgot password (2026-11-04)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Continue with the first Phase 2 batch: restyle Login and
Sign Up to the Figma Make auth cards and add the missing Forgot password flow
(back arrow, title, subtitle, school email, gradient “Send reset instructions”
button and the inline success state). Keep the auth API, validation, session
restore, confirm-password field and school-email rule. Do **not** change the
splash/loading or Welcome screens. Stop after this batch and wait for
“continue”.

**Generated / changed:**

- `src/screens/ForgotPasswordScreen.tsx` — new glass card with a 44 px back
  button, “Reset your password”, “We’ll send instructions to your school
  email.”, school-email field, gradient primary button and the Figma inline
  success message. The mock API has no mail service, so a valid email
  simulates the request and a code comment records that this is demo-only.
  Validation reuses `validateSchoolEmail`.
- `src/navigation/types.ts` / `src/navigation/RootNavigator.tsx` — added the
  `ForgotPassword` route to the signed-out stack.
- `src/screens/LoginScreen.tsx` — “Forgot password?” now opens the real screen
  instead of showing the old MVP hint; removed the hint state and styles.
  Login card now uses the Figma panel tokens (`radii.panel` 42,
  `colors.surface`, `colors.cardBorder`, `shadows.panel`). The primary button
  uses the right-arrow icon from Figma, and the sign-up button no longer has
  an extra icon. The back button is now the shared `RoundIconButton`.
- `src/screens/SignUpScreen.tsx` — title and subtitle moved inside the glass
  card, card switched to the same panel tokens, CTA copy changed to
  “Verify my student account” (teal gradient, no icon), note copy matched to
  “Only official DOrSU school emails are accepted.”, and the “Already
  registered? Log in” row moved inside the card. The back button is now the
  shared `RoundIconButton`.
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the Metro dev server:
  - Login card measures 480 px wide with radius 42, `rgba(255,255,255,0.68)`
    background, `rgba(255,255,255,0.8)` border and the panel shadow.
  - “Forgot password?” opens `ForgotPassword`; an invalid email shows the
    inline validation error; a valid `@dorsu.edu.ph` email shows
    “Check your school email for reset instructions.”; the back button returns
    to Login.
  - Sign Up shows the new copy and CTA, and the back button returns to Login.
  - Light and dark auth cards use the expected tokens (dark card `#141B45`,
    border `#2A3470`, navy page background).
  - Welcome and the loading screen still render unchanged.
- No component console errors. The only logged errors were the known LAN API
  timeouts in the browser preview, which do not affect these screens.

**Human edits needed:**

- [ ] Review the auth cards on a physical phone, especially the 42 px radius
      and the card height with the keyboard open.
- [ ] Confirm the simulated reset success message is acceptable for the demo
      (no email is actually sent).
- [ ] Decide whether the Login/Sign Up brand block should move inside the card
      on phones; the current build keeps it above the card on mobile and in the
      desktop hero column.
- [ ] Run `npm run typecheck` yourself and try the full auth flow once in light
      and dark mode.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 2 — Home screen (2026-11-05)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** Continue with Phase 2 by restyling Home to the Figma Make
marketplace frame: 48 px brand tile, “Good morning,” + “Hi, <first>!”, a 48 px
glass bell with the orange unread dot, the “Search campus finds...” pill, the
seller banner with “Start selling →”, and the “Fresh finds / From students
around campus / See all” heading. Keep the six working categories, the
responsive grid, pull-to-refresh, the offline banner, the listing cards and the
ownership flows. Do **not** touch the splash/loading or Welcome screens. Stop
after Home and wait for “continue”.

**Generated / changed:**

- `src/screens/HomeScreen.tsx` — replaced the avatar/tagline header with the
  Figma header: `BrandMark` 48 px tile (18 px radius), “Good morning,” eyebrow
  at 14/400 muted, “Hi, <first>!” at 18/400 and a 48 px `RoundIconButton` bell
  with the orange dot. The old search row is now the shared `SearchPill`
  (“Search campus finds...”) that opens Search. Added the glass seller banner
  (“Have something to sell?” / “Sell as a verified DOrSU student.” / teal
  “Start selling →” pill) linking to the Sell tab. Section heading is now
  18/700 with “From students around campus”; “See all” is 14/600 and still
  opens Search. The six category chips, offline/error banners, card grid,
  refresh control and SDG footer note are unchanged.
- `src/components/BrandMark.tsx` — added an optional `radius` prop so the Home
  tile can use Figma’s 18 px corners without changing the Welcome, auth or
  sidebar marks.
- `src/components/SearchPill.tsx` — switched the pill from
  `inputBackground`/`inputBorder` to `colors.surface`/`colors.cardBorder` so
  Home, Search and Messages match the Figma white-glass search bar.
- `src/screens/NotificationsScreen.tsx` — new placeholder behind the bell:
  44 px back button, “Notifications”, subtitle and a “You’re all caught up”
  empty state. Phase 3 replaces the body with the real notification list.
- `src/navigation/types.ts` / `src/navigation/RootNavigator.tsx` — registered
  the `Notifications` route in the signed-in stack.
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the Metro dev server at 1000×700:
  - Header renders the 48 px teal brand tile with an 18 px radius, the
    14/400 “Good morning,” eyebrow and the 18/400 “Hi, Mika!” greeting.
  - Bell is 48 px with the glass surface, border and orange dot.
  - Search pill is 52 px high and opens Search; the six category chips still
    filter the feed.
  - Seller banner measures 74 px high with the glass surface, 22 px radius and
    a 48 px teal “Start selling →” pill; pressing it opens the Sell tab.
  - Section heading is 18/700, subtitle is 14/400 muted, and “See all” opens
    Search.
  - The bell opens `Notifications`; the back button returns to Home.
  - The bundled fallback feed rendered 17 listing cards, and pull-to-refresh /
    the offline banner are unchanged.
  - Dark mode uses the navy card `#141B45`, border `#2A3470`, white text and
    the mint `#7FD6C4` seller CTA; light mode uses the glass surfaces.
- No component console errors. The only logged errors were the known LAN API
  timeouts in the browser preview, which fall back to the seeded listings.

**Human edits needed:**

- [ ] Review Home on a physical phone, especially the brand tile + bell row and
      the seller banner at narrow widths (the banner keeps the copy and pill on
      one row).
- [ ] Confirm the bell placeholder is acceptable until Phase 3 adds the real
      notifications resource.
- [ ] Check the seller banner as a single pressable card; if the team prefers
      only the “Start selling” pill to be tappable, split the Pressable.
- [ ] Run `npm run typecheck` yourself and open Home once in light and dark mode.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

## Phase 2 - Listing details screen (2026-11-05)

**AI tool / model:** OpenCode coding agent - DeepSeek V4.1 Flash Free

**Prompt summary:** Continue Phase 2 by restyling Listing details to the Figma
Make item frame: glass body panel with a rounded top on phones and a rounded
card on desktop, 46 px glass back/save buttons, centered carousel dots with a
bottom gallery gradient, condition/category/status tags, title + price row,
Description, Meetup preferences chips, seller card with a gradient avatar and
verified check, and the existing owner actions. Keep both gallery paths,
save/favorite, ownership checks, sold/reserved/available actions, edit and
delete. Do **not** add quantity, multi-spot availability, reserve, message
seller, report or seller-shop links yet. Stop after this screen and wait for
"continue".

**Generated / changed:**

- `src/screens/ListingDetailsScreen.tsx` - rebuilt the content column as a glass
  body panel (`colors.surface` + `colors.cardBorder`, top radius 28 on phones,
  full rounded card on desktop) that overlaps the gallery by 2 px. The tags row
  is now condition, category, status, with a teal condition pill, a blue
  category pill and the shared `StatusBadge` for reserved/sold. Title and price
  share one row (21/700 title, 22/700 teal price); the posted date stays as a
  caption. Description is still 16 px body copy. Added "Meetup preferences"
  with a teal chip built from `listing.meetupSpot`, kept the safe meet-up card,
  and rebuilt the seller card with a 50 px blue-to-teal gradient initials
  avatar, an inline verified check and course/year. Removed the old sold ribbon
  and the separate "Seller"/verified header. All owner controls
  (sold/reserved/available/edit/delete), non-owner save button, offline/error
  banners and the missing-listing state are unchanged.
- `src/components/ListingGallery.tsx` - added the Figma bottom gradient
  (`transparent` to `colors.photoOverlay`), centered the carousel dots (7 px,
  active 20 px) and removed the dark pill behind them. Added an optional
  `height` prop so Listing details can use Figma's 330 px phone / 420 px
  desktop hero instead of the old width-based height.
- `src/theme/palettes.ts` - added semantic `categoryTag` / `categoryTagText`
  tokens for the blue category pill in both palettes (light
  `rgba(74,144,217,0.12)` / `#396070`; dark
  `rgba(111,168,240,0.14)` / `#A9C8EC`).
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`. No Phase 3 features were added.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test at 360 px, 847 px and 1024 px in light and dark mode:
  - The 46 px glass back/save buttons sit 20 px from the top and 18 px from the
    gallery edges; the save button fills when the item is saved.
  - The gallery is 330 px on phones and 420 px on desktop, with the bottom
    gradient and centered dots.
  - The body panel has a 28 px rounded top on phones and a rounded card on
    desktop; tags, title + price, posted date, status notice, Description,
    Meetup preferences, safe meet-up card and seller card all render in order.
  - Owner view (Mika on her PE Uniform) still shows Mark as sold / Mark as
    available / Edit listing / Delete listing. Non-owner view (Mika on Carlo's
    TI-84) shows only "Save this item".
  - The save toggle changes to "Saved to favorites" and back.
  - Reserved shows the peach status pill; the sold ribbon is gone.
  - Dark mode uses `#141B45` panels, `#2A3470` borders, mint price/links and
    the mint-to-blue gradient avatar.
- No component console errors. The only logged errors were the known LAN API
  timeouts in the browser preview, which fall back to the seeded listings.

**Human edits needed:**

- [ ] Review the details screen on a physical phone, especially the title +
      price row with long titles and the 330 px hero.
- [ ] Re-check the gallery with a seller listing that has 2-3 photos so the
      centered dots and bottom gradient are exercised on real photos.
- [ ] Confirm the glass panel and seller card are legible in both themes on a
      lower-contrast phone screen.
- [ ] Run `npm run typecheck` yourself and open Details once in light and dark
      mode as both the owner and a non-owner.
- [ ] Decide whether Phase 3 should add the quantity note, multi-spot meetup
      chips, seller availability, reserve/message actions and the report link.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

## Phase 2 - Post listing screen (2026-11-07)

**AI tool / model:** OpenCode coding agent - DeepSeek V4.1 Flash Free

**Prompt summary:** Continue Phase 2 by restyling Post a listing to the Figma
Make sell frame: compact back button with a 20/700 title and 14/400 subtitle, a
green "Selling as" banner with a 32 px check circle, separate Photos / Item
details / Meetup cards, a three-slot photo row whose selected photo exposes
Cover / Replace / Remove, 44 px compact fields, a condition segmented control,
compact meetup chips, a teal gradient submit button, a missing-fields hint and
a safety note. Keep the existing 3-photo limit, camera-or-gallery picker, edit
prefill, validation, and ownership checks. Do **not** add quantity, availability,
multi-spot meetup, auto-fill from photo, or a 5-photo limit. Stop after this
screen and wait for "continue".

**Generated / changed:**

- `src/screens/PostListingScreen.tsx` - rebuilt the screen around the Figma
  layout. The old single form card is now three cards: Photos (3-slot row,
  selected-photo toolbar, camera/gallery buttons, 3-photo limit note), Item
  details (Title, Category + Price row, Condition, Description), and Preferred
  meetup spot (compact chips). Added a 48 px `RoundIconButton` back button, a
  20/700 title with a 14/400 subtitle, a green "Selling as" banner with a 32 px
  check circle, a dynamic hint that names the first missing requirement, and a
  shield safety note. The submit button is a full-width teal gradient "Post
  item" / "Save changes". Kept the create/edit routes, prefill, photo capture
  and gallery flows, replace/cover/remove logic, validation errors, offline
  handling, and `canManageListing` ownership checks. The submit button stays
  enabled while incomplete so validation errors remain discoverable.
- `src/components/FormField.tsx` - added a `compact` 44 px variant and an
  optional `icon` prop. Post omits the leading icon to match Figma.
- `src/components/SelectField.tsx` - added a `compact` variant and support for
  `icon={null}` so the Category field matches the plain Figma input.
- `src/components/SegmentedControl.tsx` - added a `form` variant (rounded
  track, white/mint active thumb), a nullable value for the initial empty
  condition, radio semantics, and an explicit `aria-checked` so the selected
  condition is exposed on web.
- `src/components/FilterChip.tsx` - added a `compact` 40 px variant with a 4 px
  hit slop, used by the meetup chips so all 11 spots fit without dominating the
  card.
- `src/theme/palettes.ts` - added `segmentedTrack` / `segmentedThumb` tokens
  for both themes.
- `docs/DESIGN_GAP.md` - marked row 8 as restyled in Phase 2 and updated the
  status line.
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`. No Phase 3 features were added.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test at 847 px and 360 px in light and dark mode:
  - Create mode shows the compact header, "Selling as" banner, three cards, the
    dashed 3-slot photo row, and the disabled-looking hint before any photo is
    added.
  - Selecting a photo exposes Cover (hidden on the first photo) / Replace /
    Remove; removing a photo restores an empty slot and the limit note.
  - Condition renders as a segmented control; choosing "Used" fills the thumb
    and updates `aria-checked`. Meetup chips select one spot at a time.
  - Submitting an incomplete form shows the field errors and the hint instead of
    navigating away.
  - Edit mode (Carlo's Electric Fan) pre-fills title, price, category,
    condition, meetup spot, description and the sample photo; removing the photo
    and saving exercises the existing validation path.
  - Back returns to Home in create mode; Cancel asks before discarding in edit
    mode.
  - Dark mode uses `#141B45` cards, `#1A2250` inputs, `#2A3470` borders and the
    mint segmented thumb.
- No React console errors. The only logged errors were the known LAN API
  timeouts and 502 sample-image loads in the browser preview.

**Human edits needed:**

- [ ] Review the post screen on a physical phone, especially the 3-slot photo
      row, the selected-photo toolbar and the 44 px fields with the keyboard
      open.
- [ ] Test camera and gallery capture on a real device, including replace and
      cover reordering with actual photos.
- [ ] Re-check the segmented condition control and the 11 meetup chips at large
      font sizes and with TalkBack/VoiceOver.
- [ ] Confirm the "Selling as" banner and gradient submit button read correctly
      in both themes.
- [ ] Run `npm run typecheck` yourself and post one item end to end, then edit
      and delete it.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

## Phase 2 - Saved items screen (2026-11-07)

**AI tool / model:** OpenCode coding agent - DeepSeek V4.1 Flash Free

**Prompt summary:** Continue Phase 2 by restyling Saved to the Figma Make
"09 - Saved Items" frame: a compact top bar with a back arrow, "Saved items"
title, "N campus finds" subtitle and a "..." notifications button; an
"Items you've hearted" heading with a red "Clear all" action; the shared
responsive listing grid; and the Figma empty-state copy. Keep AsyncStorage
persistence, pull-to-refresh, the unavailable-favorites state, and the existing
card behaviour. Stop after this screen and wait for "continue".

**Generated / changed:**

- `src/screens/FavoritesScreen.tsx` - rebuilt the header as the Figma top bar:
  48 px glass back button (navigates Home), 20/700 "Saved items" title,
  "N campus finds" subtitle and a 44 px glass "..." button (opens
  Notifications). Added the "Items you've hearted" row with a red "Clear all"
  action; the row only appears when at least one id is saved. Bulk clear asks
  for confirmation (browser `confirm` on web because RN Web's `Alert` is a
  no-op, native `Alert` elsewhere), clears every saved id and shows the
  existing toast. Kept the responsive column grid, fixed card widths, refresh
  control, offline/error banners and the "no longer available" state. Empty
  state now uses Figma's copy: "Nothing saved yet.", "Tap the heart on any
  item." and "Browse fresh finds".
- `src/context/ListingsContext.tsx` - added a `CLEAR_FAVORITES` action and a
  `clearFavorites()` callback so bulk unsave updates state once and the
  existing persistence effect writes the empty list to AsyncStorage.
- `docs/DESIGN_GAP.md` - marked row 7 as restyled in Phase 2 and updated the
  status line.
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`. The shared `ListingCard` was left
  unchanged so Home and Search keep their approved look. No Phase 3 features
  were added.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test at 847 px and 360 px in light and dark mode:
  - The top bar shows the back button, "Saved items", the live count and the
    "..." notifications button. The heading row shows "Items you've hearted"
    and a red "Clear all" only when items are saved.
  - Saving three listings on Home updates Saved to "3 campus finds" and renders
    the three cards in the responsive grid (3 columns at 847 px, 2 columns at
    360 px).
  - "Clear all" opens a confirmation, clears the list, shows the "Saved items
    cleared" toast and switches to the Figma empty state with "0 campus finds".
  - The empty state renders the heart icon, "Nothing saved yet.", "Tap the
    heart on any item." and the "Browse fresh finds" action.
  - Dark mode uses the navy surface, mint title/price, `#2A3470` borders and
    the red "Clear all"; the top-bar buttons keep the glass treatment.
- No React console errors. The only logged errors were the known LAN API
  timeouts and 502 sample-image loads in the browser preview.

**Human edits needed:**

- [ ] Review the Saved screen on a physical phone, especially the top bar at
      large font sizes and the "Clear all" confirmation with TalkBack/VoiceOver.
- [ ] Confirm that "Clear all" is reachable and obvious enough without the
      heading row when the list is empty (the row is intentionally hidden).
- [ ] Re-check the 2-column card grid with real photos and long titles.
- [ ] Run `npm run typecheck` yourself and save, open and clear items once in
      light and dark mode.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

## Phase 2 - Profile and Seller shop (2026-11-08)

**AI tool / model:** OpenCode coding agent - DeepSeek V4.1 Flash Free

**Prompt summary:** Continue Phase 2 by rebuilding Profile to the Figma Make
"14 - Profile" frame: a centered hero with an 82 px gradient avatar and verified
check, name, course � year, school email and three stats; a Profile | Seller
shop segmented control; a menu card with the verified footer; and the Seller
shop tab. Remove the full student ID display and its show/hide toggle. Keep
profile editing, My Listings management, saved/notifications links, logout,
the theme switch and the responsive layout. Stop after this screen and wait for
"continue".

**Generated / changed:**

- `src/screens/ProfileScreen.tsx` - rebuilt the screen around a centered
  720 px column. The hero uses an 82 px gradient avatar (`#4A90D9 ? #1F7A72`)
  with a 4 px white border, a blue verified check, name, course � year, school
  email and reviews / items sold / listings stats. Added the Profile | Seller
  shop segmented control, a glass menu card (Edit profile, My Listings, Saved,
  Notifications, Log out) with the green verified footer, and an Appearance
  card that keeps the System/Light/Dark switch. My Listings is now a sub-view
  with its own back button, so all filters, sold/delete actions and the actions
  sheet are unchanged. The Seller shop tab shows "<First>'s active listings",
  the live item count, "? New � 0", a responsive active-listing grid with no
  heart buttons, and a "Recent reviews" empty state. Added a shared
  `confirmAction` helper so delete/sold/logout confirmations work on React
  Native Web as well as native.
- **Student ID:** removed the `showStudentId` state, the `maskStudentId`
  import, the InfoRow component and the Student ID row. The verified footer
  keeps the Figma copy "School email and student ID confirmed" but never shows
  the ID itself.
- `src/components/ListingCard.tsx` - added an optional `showFavorite` prop
  (default `true`) so the seller shop can reuse the card without a heart.
  Home, Search and Saved keep the existing heart.
- `docs/DESIGN_GAP.md` - marked rows 10 and 11 as restyled/added in Phase 2 and
  updated the status line.
- **Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
  and the splash settings in `app.json`. The Settings and My Reviews menu rows
  are deferred until those screens exist; the hero gear opens Edit profile for
  now. No Phase 3 features were added.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test with the mock API and Expo web:
  - Profile renders the gradient avatar, initials, verified check, name,
    "BSCS � 2nd Year", school email, "New / 0 reviews", "0 / Items sold" and
    "5 / Listings" at a 720 px column.
  - The Profile | Seller shop control switches views; the active segment is
    teal (light) or mint (dark).
  - The menu card links to Edit profile, My Listings, Saved and Notifications;
    the gear opens Edit profile; the verified footer and Appearance card
    render. The full student ID is absent from the Profile DOM.
  - Log out opens the browser confirmation and returns to the Welcome screen
    when accepted.
  - My Listings shows the back button, "5 active � 0 sold", Post new, the
    Active/Sold/All filters and five rows; the actions sheet lists Mark as
    sold, Mark as reserved, Edit listing, Delete listing and Cancel.
  - Seller shop shows "Carlo�s active listings", "5 items available",
    "? New � 0", five cards with no heart buttons and the "Recent reviews"
    empty state.
  - At 360 px the hero, tabs, menu card and My Listings rows fit without
    horizontal overflow; the shop grid uses 2 columns of 157 px. At 1000 px it
    uses 3 columns of 218 px.
  - Dark mode uses the navy background (`#0B1030`), card (`#141B45`), border
    (`#2A3470`), white text and mint active states. The theme was reset to
    System afterwards.
- No React console errors. The only logged errors were the known LAN API
  timeouts and sample-image loads, so the fallback listings were used.

**Human edits needed:**

- [ ] Review Profile on a physical phone, especially the 82 px avatar + check
      badge at large font sizes and the menu rows with TalkBack/VoiceOver.
- [ ] Re-check the Seller shop grid with real photos and long titles, and the
      3-column desktop layout at >= 1024 px.
- [ ] Confirm the hero gear should open Edit profile until the Settings screen
      is built, then point it at Settings.
- [ ] Run `npm run typecheck` yourself and open Profile, both tabs, My
      Listings, Saved, Notifications and Log out in light and dark mode.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 2 — Settings (2026-11-09)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — implement the next Phase 2 screen from the
Figma Make design: Settings. Keep the existing System/Light/Dark theme control,
preserve the auth/profile/API behaviour, restyle one screen at a time, and wait
for "continue" after the screen.

**Generated:**

- `src/screens/SettingsScreen.tsx` — new root-stack screen matching the Figma
  settings frame: a 48 px back button, "Settings / Prototype and account
  preferences" and a 44 px notifications button; an Edit profile card with Full
  name, read-only School email, Course and Year level pickers, a gradient "Save
  profile" button, inline validation and the "Profile updated everywhere."
  status; and an Appearance card with the Figma sentence plus the existing
  System/Light/Dark switch. Saves through `AuthContext.updateProfile` with
  `{ name, course, yearLevel, photo }`. The current photo is passed through
  because the API treats a missing photo as "remove it". After a save the
  listings refresh so the denormalized seller name/course/year stay current.
- `src/navigation/types.ts` — added `Settings: undefined` to the root stack.
- `src/navigation/RootNavigator.tsx` — imported and registered the signed-in
  `Settings` screen.
- `src/screens/ProfileScreen.tsx` — added a Settings row to the menu card and
  pointed the hero gear at `Settings` instead of `Edit profile`.
- `docs/DESIGN_GAP.md` — updated the status line, Profile row 10 and Settings
  row 17; adjusted §2.1 item 8. Documented the deferred Reference and Demo data
  cards.
- **Not touched:** the splash/Loading/Welcome screens and `app.json`; auth,
  API service layer, ownership enforcement, camera/gallery photos, sold/delete
  flows, profile editing, responsive layout, theme provider and mock REST API.
- **Deferred:** the Reference card + Design System button (the
  `DesignSystemScreen` does not exist yet) and the Demo data card + Reset demo
  data (there is no bulk reset API; `npm run db:reset` is server-side). They
  were not shipped as inert buttons.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test with the mock API and Expo web:
  - The Profile menu shows the new Settings row; the hero gear opens Settings;
    the Settings back button returns to Profile.
  - Settings renders the top bar, the Edit profile card (Carlo Mendoza,
    `carlo.mendoza@dorsu.edu.ph`, BSCS, 2nd Year), Save profile and the
    Appearance card. The school-email input is read-only.
  - Clearing Full name and pressing Save shows "Enter your full name." and does
    not call the API.
  - A valid save PATCHed `/users/4` and showed "Profile updated everywhere."
    The browser preview's `.env` points at `192.168.22.72:3001`, which times
    out here, so the test redirected `fetch` to the local mock API on port 3001
    for this check only. No `.env` or API-base change was made.
  - The Appearance switch changes to Dark (navy `#0B1030`, card `#141B45`,
    mint active state) and back to System; `unisell.themeMode` follows. The
    theme was reset to System afterwards.
  - The notifications button opens Notifications; back returns to Settings.
  - At 847 px the 720 px column has no horizontal overflow. In a simulated
    360 px container the layout fits (`scrollWidth === 360`); Course and Year
    use icon-less compact selects so "2nd Year" stays on one line.
  - No React console errors. The only errors were the known LAN API timeouts
    and 502 sample-image loads, plus one `ERR_NETWORK_IO_SUSPENDED` during a
    test retry, which is a browser suspension rather than an app error.

**Human edits needed:**

- [ ] Review Settings on a physical phone and at >= 1024 px, including keyboard
      avoidance, the two-column Course/Year row at large font sizes, and
      TalkBack/VoiceOver on the read-only email and theme radios.
- [ ] Decide whether to add the Reference and Demo data cards now (with the
      Design System screen and a real reset API) or keep them deferred.
- [ ] Confirm the top-bar notifications button is the right mapping for
      Settings (Figma's ellipsis opens `#notifications`).
- [ ] Run `npm run typecheck` and exercise save, validation, theme and back
      yourself with the mock API reachable.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 2 — Design System (2026-11-09)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — implement the Figma Design System reference
screen, wire it into the Settings Reference card, keep the active light/dark
theme, and wait for "continue" after the screen.

**Generated:**

- `src/screens/DesignSystemScreen.tsx` — new root-stack reference screen:
  - top bar: 48 px back, "Design System / The visual foundations used by
    UniSell" and the 44 px notifications ellipsis;
  - **Colors**: eight swatches (Primary, Accent, Background, Surface, Text,
    Muted, Success, Error) read from the active palette. Success and Error keep
    the app's AA-safe `#1F7A50` / `#B3261E` in light mode instead of Figma's
    large-text-only `#2E9E5B` / `#D64545`;
  - **Typography**: H1 28/700, H2 22/600, H3 18/600, Body 16 and Caption 14
    minimum;
  - **Spacing**: 4/8/16/24/32/40 px teal bars;
  - **Elevation**: Level 0/1/2 cards using the themed card/floating shadows;
  - **Border radius**: Small 12, Medium 18, Large 24 and Pill 999.
  The Figma docs nav (Design System / Components / Accessibility) is omitted
  because only the Design System page exists in the app; no links point to
  empty screens.
- `src/navigation/types.ts` — added `DesignSystem: undefined`.
- `src/navigation/RootNavigator.tsx` — imported and registered the signed-in
  `DesignSystem` screen.
- `src/screens/SettingsScreen.tsx` — added the **Reference** card with a
  secondary "Design System" button that opens the new screen. Updated the
  screen comment; the Demo data card remains deferred.
- `docs/DESIGN_GAP.md` — status line, inventory, Settings row 17, Design System
  row 18, §2.1 item 8 and the Phase 2 mapping.
- **Not touched:** the splash/Loading/Welcome screens and `app.json`; auth,
  API service layer, ownership enforcement, camera/gallery photos, sold/delete
  flows, profile editing, responsive layout, theme provider and mock REST API.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test with Expo web:
  - Settings shows the new Reference card; the Design System button opens the
    screen and the back button returns to Settings.
  - Light mode renders all eight swatches with the expected values
    (`#1F7A72`, `#F4A261`, `#EAF6F6`, `#FFFFFF`, `#1F3A4D`, `#4F6878`,
    `#1F7A50`, `#B3261E`), the five type specimens, six spacing bars, three
    elevation levels and four radius boxes.
  - Dark mode switches every surface and swatch to the navy/mint palette
    (`#0B1030`, `#141B45`, `#7FD6C4`, `#A9B1D6`, `#6FD3A8`, `#FF8A80`) and
    returns to System afterwards.
  - At 847 px the 720 px column has no horizontal overflow. In a simulated
    360 px container the screen fits (`scrollWidth === 360`); the elevation
    grid keeps three columns and "Sample surface" wraps to two lines.
  - No React console errors. The only error was the known LAN API timeout from
    `192.168.22.72:3001`; the app fell back to its bundled listings.

**Human edits needed:**

- [ ] Review the Design System page on a physical phone and at >= 1024 px,
      including large-font wrapping in the three-column elevation grid and
      TalkBack/VoiceOver reading order.
- [ ] Decide whether the Components and Accessibility docs pages should be
      built later; the docs nav is intentionally omitted until they exist.
- [ ] Confirm the radius reference should stay 12/18/24/pill even though some
      components use 22/28/42.
- [ ] Run `npm run typecheck` and open Settings → Design System in light and
      dark mode yourself.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 2 — Search (2026-11-09)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — implement the next Phase 2 screen from the
Figma Make design: Search. Keep the existing search, filters, sold toggle,
responsive card grid and offline/error states; restyle one screen at a time and
wait for "continue" after the screen.

**Generated:**

- `src/screens/SearchScreen.tsx` — restyled around the Figma search frame:
  - compact header with a 44 px back button, an editable `SearchPill` and a
    44 px filter trigger that shows the orange active-filter dot;
  - "Search results" heading with a live "N campus finds for “query”" count and
    a glass "Filters" pill that also opens the sheet;
  - the responsive 2/3/4-column `ListingCard` grid, pull-to-refresh, offline
    banner, error banner and the existing empty/error states are unchanged.
  The always-visible category, condition and sold controls moved into the
  filter sheet so the screen matches Figma.
- `src/components/SearchFiltersSheet.tsx` — new bottom sheet with the Figma
  handle, "Filter results / Find exactly what you need", Reset, category chips
  (All + our six categories), condition chips (Any / New / Used), a themed
  show-sold switch and a live "Show N results" button. It uses the existing
  `FilterChip`, `AppButton` and theme tokens, so light and dark mode both work.
  Course, year, department and price filters are intentionally left out; they
  are optional Phase 3 work and would invent controls the app cannot apply yet.
- `docs/DESIGN_GAP.md` — status line, Search row 6, §2.1 item 10 and the Phase 2
  mapping.
- **Not touched:** the splash/Loading/Welcome screens and `app.json`; auth,
  API service layer, ownership enforcement, camera/gallery photos, sold/delete
  flows, profile editing, responsive layout, theme provider and mock REST API.
  `filterListings()` and the AsyncStorage favourites are unchanged.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test with Expo web:
  - The Home search pill opens Search; the screen shows the back button, search
    pill, filter trigger, "Search results", "17 campus finds for “all”" and the
    Filters pill.
  - The filter sheet opens with the category chips, condition chips, show-sold
    switch, Reset and "Show 17 results".
  - Selecting Textbooks updates the sheet to "Show 4 results" and the header to
    "4 campus finds", "Filters (2)" and the orange dot (Textbooks + sold).
  - Toggling show-sold raises the count from 17 to 18 and turns the switch
    teal; Reset returns to 17 and removes the dot/count.
  - "Show 17 results" closes the sheet. The back button returns to Home
    (`document.title` changes from Search to Home).
  - Light and dark mode both render the header, cards and sheet correctly.
  - At 847 px there is no horizontal overflow. In a simulated 360 px container
    the header and heading fit (`rootScroll === 360`); the card widths still
    use the real window width in that simulation, so the grid itself needs a
    real narrow viewport check.
  - No React console errors. The only errors were the known LAN API timeouts
    and 502 sample-image loads; the app fell back to its bundled listings.

**Human edits needed:**

- [ ] Review Search on a physical phone and at >= 1024 px, including the real
      two-column grid at 360 px and keyboard behaviour with the search pill
      focused.
- [ ] Confirm the filter sheet should keep only category, condition and
      show-sold; add course/year/department/price filters in Phase 3 if wanted.
- [ ] Run `npm run typecheck` and exercise search, the sheet, Reset, the sold
      switch and back yourself.
- [ ] Check TalkBack/VoiceOver on the search input, the filter trigger, the
      sheet switch and the "Show N results" button.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 3 — Reservations resource + buyer reserve flow (2026-11-10)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — start Phase 3 with the first item: add the
`reservations` resource and the buyer reserve flow from the Figma "Reserve
request / Set your meetup" screen. Every feature needs API support and
ownership enforcement; keep the existing auth, API layer, permissions, photos,
sold/delete flows, responsive layout, theme switch and mock REST API; do not
touch the splash/Welcome screens; run `npm run typecheck` and wait for
"continue" before the next item.

**Generated:**

- `src/types/index.ts` — `ReservationStatus` (`pending | accepted | declined |
  cancelled | completed`), `Reservation`, `NewReservationInput` and
  `ReservationsState`. Records denormalize the buyer name/course/year and the
  listing title so the seller dashboard can render a request without extra
  lookups.
- `src/api/reservationsApi.ts` — new resource service:
  - `getReservationsForUser()` loads the signed-in student's buyer requests and
    the requests on their listings, de-duplicates and sorts newest first;
  - `createReservation()` re-reads the session, rejects reserving your own
    listing, rejects non-available listings, and allows one active
    (`pending`/`accepted`) request per buyer per listing;
  - `acceptReservation()` / `declineReservation()` are seller-only and only act
    on pending requests; accepting marks the listing `reserved` and refuses to
    double-book;
  - `cancelReservation()` is buyer-only and only cancels pending requests.
  Every write re-reads the persisted session and checks ownership against the
  server copy, because json-server has no auth.
- `src/context/ReservationsContext.tsx` — provider for the shared buyer/seller
  request list with `refresh`, `createReservation`, `acceptReservation`,
  `declineReservation` and `cancelReservation`. Accepting also refreshes the
  listings feed so the Reserved chip appears everywhere. Wired into `App.tsx`
  inside `ListingsProvider`.
- `src/screens/ReserveScreen.tsx` — new Figma-style reserve screen: item
  preview, "Reserve request / Set your meetup" sheet, meetup-spot chip, 7 day
  chips (Today/Tomorrow/weekday + date), the 12:00 PM / 2:00 PM / 4:00 PM time
  slots, the "Available Monday–Friday, 11:30 AM–4:30 PM" note, optional note,
  "Pay cash at meetup" notice, validation and the "Request sent." success
  panel with "Back to home" and "View item details". Quantity is omitted on
  purpose (single-item listings, per the agreed scope).
- `src/screens/ListingDetailsScreen.tsx` — non-owner "Reserve" button, a
  pending/accepted reservation card with meetup date/spot and a "Cancel
  request" confirm, and the reserved notice now reads "This item is currently
  reserved." Declined/cancelled requests do not block re-reserving.
- `src/utils/confirm.ts` — web-safe `confirmAction` extracted from Profile so
  Listing details and Profile share one confirmation helper.
- `src/utils/formatters.ts` — `formatMeetupDate()` ("Thu, Nov 12 · 2:00 PM").
- `src/navigation/types.ts`, `RootNavigator.tsx` — new `Reserve: { listingId }`
  root-stack route.
- `server/db.seed.json`, `server/db.json` — 6 sample reservations covering
  pending (buyer and seller sides), accepted, declined and completed.
- `docs/DESIGN_GAP.md` — status line, Listing details row and Phase 3 mapping.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the mock API:
  - Listing 1 (Calculus) shows the seeded "Reservation pending" card with
    "Thu, Nov 12 · 2:00 PM · Main Library Lobby" and "Cancel request".
  - Listing 8 (Casio) shows "Reserve"; the reserve screen lists the item,
    meetup spot, 7 day chips and 3 time slots.
  - Submitting without a time slot shows "Choose a meetup spot, date, and
    time."; choosing 2:00 PM and submitting shows "Request sent." and stores a
    pending reservation on the mock API (buyer Carlo, seller Ana).
  - "View item details" returns to Listing details with the pending card;
    "Cancel request" confirms, marks the request `cancelled` and restores the
    Reserve button.
  - Listing 5 (Brownies, declined seed request) still offers Reserve, so a
    declined request does not block a new one.
  - Light and dark mode both render the reserve screen and the status card
    correctly at the 847 px tablet width.
  - Fixed a render-order bug found during testing: the new request reached the
    shared list before the success state was checked, so the screen showed
    "Request already sent" instead of "Request sent."; the success panel is now
    checked first.

**Human edits needed:**

- [ ] Review the reserve screen and status card on a physical phone, at
      >= 1024 px, and with large fonts.
- [ ] Exercise reserve, cancel, re-reserve after decline, and the ownership
      errors (own listing, sold/reserved item, duplicate request) yourself.
- [ ] Check TalkBack/VoiceOver on the day chips, time slots and Cancel action.
- [ ] Confirm the day-chip picker is acceptable in place of Figma's date input,
      and that the omitted quantity field is still the right call.
- [ ] Run `npm run typecheck` again after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 3 — Seller dashboard (2026-11-11)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — implement the next Phase 3 item, the seller
dashboard, matching the Figma "Seller dashboard / Manage your UniSell activity"
screen. Use the already-implemented `acceptReservation` / `declineReservation`
methods, keep the existing ownership checks and listing flows, run
`npm run typecheck`, and wait for "continue" before the next item.

**Generated:**

- `src/screens/SellerDashboardScreen.tsx` — new dashboard screen:
  - header with back, "Seller dashboard / Manage your UniSell activity" and a
    notifications button;
  - the shared pill `SegmentedControl` with **Requests (live count)**,
    **My Listings** and **Sold**;
  - request cards with a gradient initials avatar, buyer name, course · year,
    status pill, item thumbnail/title, meetup spot and formatted meetup date,
    plus **Decline / Accept** for pending requests, **View item / Mark as sold**
    for accepted ones, and a "Request declined." / "Sale completed." line for
    the rest;
  - My Listings rows with Edit / Mark as sold / Delete, reusing the existing
    update and delete context actions and the shared `confirmAction` dialog;
  - a Sold tab with sold rows, a Sold stamp and the "Total earned" summary;
  - loading, load-error retry, empty states and per-card busy/error handling.
  Quantity is omitted from request cards because listings are single items.
- `src/navigation/types.ts`, `RootNavigator.tsx` — new `SellerDashboard` root
  route.
- `src/screens/ProfileScreen.tsx` — entry points: a "Seller dashboard" menu
  row and a "Manage requests" link in the Seller shop heading. Also fixed the
  stat label to read "Item sold" when the count is 1.
- `docs/DESIGN_GAP.md` — status line, Seller dashboard row and Phase 3 mapping.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the mock API:
  - Profile → Seller dashboard opens the screen; the Requests tab shows the
    seeded pending requests from Mika (Electric Fan) and Jun (TI-84) with the
    buyer course/year, meetup spot and time.
  - Accepting Mika's request confirms, shows "Reserve request accepted", turns
    the card into Accepted with View item / Mark as sold, and the API stored
    `accepted` + listing `reserved`.
  - Declining Jun's request confirms, shows "Reserve request declined", turns
    the card into "Request declined.", and the listing stayed `available`.
  - My Listings shows the seller's active posts with Reserved/Available status
    and Edit / Mark as sold / Delete; Edit opens the Post form prefilled.
  - Marking the TI-84 sold moved it to the Sold tab with the ₱1,800 total and
    "From 1 completed campus sale", and removed it from My Listings.
  - The Sold tab shows "No sold listings yet." plus a ₱0 summary before a sale.
  - The Seller shop "Manage requests" link opens the same dashboard.
  - Light and dark mode both render correctly. Fixed a dark-mode contrast issue
    found during testing: status pills and the Sold stamp used the dark
    "strong" tokens on dark tints; they now use the base success/warning/danger
    tokens.
  - Demo data was restored with `npm run db:reset` afterwards (all 6 seeded
    reservations, listings back to their original statuses).

**Human edits needed:**

- [ ] Review the dashboard on a physical phone and at >= 1024 px, and with
      large fonts (the three manage buttons are the tightest row).
- [ ] Exercise accept, decline, mark sold, edit and delete yourself; confirm
      the confirm dialogs read correctly on iOS/Android.
- [ ] Check TalkBack/VoiceOver on the tabs, request cards and action buttons.
- [ ] Confirm the accepted card should offer "View item" instead of Figma's
      "View meetup" (there is no meetup screen yet), and that marking sold
      should leave the request `accepted` rather than introducing a new
      `completed` transition.
- [ ] Run `npm run typecheck` again after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 3 — Notifications (2026-11-12)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — implement the next Phase 3 item, notifications,
matching the Figma "Notifications / Updates from your marketplace" screen. Add
API support and ownership enforcement, create notifications from the reserve
lifecycle and the sold flow, seed demo rows, run `npm run typecheck`, and wait
for "continue" before messages.

**Generated:**

- `src/types/index.ts` — `NotificationTone`, `NotificationTarget`,
  `AppNotification`, `NewNotificationInput` and `NotificationsState`. Named
  `AppNotification` to avoid the DOM `Notification` type on web.
- `src/api/notificationsApi.ts` — session-scoped list, mark-one-read and
  mark-all-read (ownership checked against the persisted session), plus
  `createNotificationSafely` so a notification failure never fails the primary
  action.
- `src/context/NotificationsContext.tsx` — list, status, unread count, refresh,
  mark-as-read and mark-all-as-read; loads on sign-in and clears on sign-out.
- `App.tsx` — `NotificationsProvider` mounted inside `ReservationsProvider`.
- `src/api/reservationsApi.ts` — reserve → seller, accept → buyer, decline →
  buyer and cancel → seller notifications (best-effort).
- `src/api/listingsApi.ts` — marking a listing sold notifies the buyer whose
  request was accepted (best-effort).
- `src/screens/NotificationsScreen.tsx` — rebuilt from the placeholder: top
  bar, "Mark all as read", Today/Earlier groups, glass cards with a 42 px tone
  tile (teal heart, green check, amber clock, blue star), title, detail,
  relative time and "· New" for unread; tap marks read and opens the listing or
  dashboard; loading, error/retry and "You're all caught up" states.
- `src/screens/HomeScreen.tsx`, `SellerDashboardScreen.tsx` — the bell dot and
  accessibility label now follow the live unread count; both screens refresh
  the list on focus.
- `server/db.seed.json` — five seeded notifications for Carlo (two unread seller
  requests plus older read declined/accepted/sold updates).
- `docs/DESIGN_GAP.md` — status line, Notifications row and Phase 3 mapping.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the mock API:
  - The Home bell showed "Notifications, 2 unread" and the dot; the
    Notifications screen showed Today (Mika + Jun reserve requests) and Earlier
    (declined, sold, accepted) with the correct tones and "· New" labels.
  - "Mark all as read" cleared every "· New" label, showed the toast, wrote
    `read: true` for all five rows, and the Home bell returned to
    "Notifications" without the dot.
  - Tapping a card marked it read and opened its listing.
  - Lifecycle checks: accepting Mika's request created a green "Your reserve was
    accepted" notification for Mika; declining Jun's request created an amber
    "Reserve request declined" for Jun; cancelling Carlo's pending request
    created an amber "Reserve request cancelled" for Jun; re-reserving Mika's
    brownies created a teal "Carlo Mendoza sent a reserve request" for Mika;
    marking the fan sold created a green "Item marked as sold" for Mika.
  - Logged in as Mika: the bell read "Notifications, 3 unread"; the feed showed
    the three new cards with "Mika, your reserve was accepted"; tapping the sold
    card opened the sold listing and reduced the unread count to 2.
  - Light and dark mode both render correctly.
  - Demo data was restored with `npm run db:reset` afterwards (5 notifications,
    6 reservations, listings back to their original statuses) and the theme
    returned to `system`.

**Human edits needed:**

- [ ] Review the feed on a physical phone, at >= 1024 px and with large fonts.
- [ ] Check TalkBack/VoiceOver on the cards, the "· New" announcement and the
      "Mark all as read" disabled state.
- [ ] Confirm the unread teal card border is acceptable (Figma relies on
      "· New" only) and that tapping the accepted card should open the listing
      rather than Figma's meetup screen, which does not exist yet.
- [ ] Confirm the sold notification should go to the accepted buyer (our choice)
      rather than the seller, since there is no review screen yet.
- [ ] Run `npm run typecheck` again after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 3 — Messages and chat (2026-11-12)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "continue" — implement the next Phase 3 item, messages and
chat, matching the Figma "Messages / Your campus conversations" inbox and the
per-listing chat screen. Add API support and ownership enforcement, seed demo
conversations, run `npm run typecheck`, and wait for "continue" before reviews.

**Generated:**

- `src/types/index.ts` — `Chat`, `ChatMessage`, `ChatThread`, `ChatsStatus` and
  `ChatsState`.
- `src/api/messagesApi.ts` — `getChatThreadsForUser`, `getChatForUser`,
  `getChatMessages`, `ensureChat`, `sendChatMessage` and `markChatRead`. Every
  read/write is session-scoped and checks that the signed-in student is the
  buyer or the seller; `ensureChat` reuses an existing listing + buyer thread and
  refuses to let a seller start a thread about their own listing.
- `src/context/MessagesContext.tsx` — chats, status, error, refreshing,
  `unreadCount`, `refresh`, `ensureChat`, `sendMessage` and `markAsRead`; loads
  on sign-in and clears on sign-out.
- `App.tsx` — `MessagesProvider` mounted inside `NotificationsProvider`.
- `server/db.seed.json` — six chats and sixteen messages covering available,
  reserved and sold listings, with two unread buyer messages for Carlo.
- `src/utils/chatFormatters.ts` — `formatMessageTime`, `formatChatListTime` and
  `formatChatDay`.
- `src/screens/MessagesScreen.tsx` — rebuilt from the placeholder: top bar with
  bell, editable "Search conversations" pill, glass cards with a 58 px rounded
  thumbnail, name + blue verified check, relative time, teal listing title,
  last-message preview and a blue unread dot; loading, error/retry, empty and
  no-results states, focus refresh and a live unread badge.
- `src/screens/ChatScreen.tsx` — header with the other student and verified
  role, tappable "Chatting about" card that shows the live listing status,
  Today/Yesterday day chips, teal sent and glass received bubbles with times,
  send-on-tap quick replies, rounded composer with a circular send button, a
  10 s poll while focused, and mark-incoming-as-read on open.
- `src/navigation/RootNavigator.tsx`, `src/navigation/types.ts` — `Chat` route.
- `src/navigation/MainTabs.tsx` — Messages unread badge on the floating tab and
  the desktop sidebar.
- `src/screens/ListingDetailsScreen.tsx` — outlined "Message seller" action for
  non-owners that finds or creates the thread and opens the chat.
- `src/api/apiClient.ts` — bodyless requests no longer send
  `Content-Type: application/json`, so GET/DELETE stay "simple" CORS requests
  and skip the demo json-server preflight round-trip that was making reads time
  out after six seconds.
- `src/api/messagesApi.ts` — a failed inbox load now propagates instead of
  returning an empty list, so the inbox shows its error banner and retry rather
  than a misleading "No conversations yet".
- `docs/DESIGN_GAP.md` — status line, Messages and Chat rows, Listing details
  note, `chats` / `chatMessages` resource shapes, ownership rules and the Phase 3
  mapping.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the mock API:
  - The inbox listed all six seeded conversations sorted by last activity, with
    thumbnails, verified checks, relative times, teal listing titles, previews
    and unread dots; the Messages tab read "Messages, 2 unread".
  - Searching "Mika" filtered the list to her threads; an unmatched query showed
    "No conversations match your search."
  - Opening the brownies thread marked Mika's message read (the tab badge fell
    to 1), showed the pinned listing card, day divider and bubbles, and the
    quick reply plus a typed message both persisted with an updated `updatedAt`.
  - "Message seller" on Ana's Casio listing created chat 7 and reused it on a
    repeat tap; the thread opened on its empty "Say hello" state.
  - Signed in as Mika: only her two conversations appeared, Carlo's other
    threads were excluded, and her own listing showed owner controls with no
    "Message seller".
  - Light and dark mode both render correctly.
  - Demo data was restored with `npm run db:reset` (6 chats, 16 messages, 2
    unread) and the theme returned to `system`.

**Human edits needed:**

- [ ] Review the inbox and chat on a physical phone, at >= 1024 px and with large
      fonts (keyboard avoidance, composer spacing, long-message wrapping).
- [ ] Check TalkBack/VoiceOver on the cards, the unread announcements and the
      quick-reply chips.
- [ ] Confirm the omitted Figma details are acceptable: no green "online" dot or
      "Active now" copy (no presence data), no "+" location button (no location
      support), and no back button on the inbox (Messages is a tab).
- [ ] Confirm the 10 s polling fallback is acceptable in place of a real-time
      socket backend.
- [ ] Confirm the inbox error state should replace the empty state on a failed
      load (our choice, to avoid implying there are no conversations).
- [ ] Run `npm run typecheck` again after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Phase 3 — Reviews and My Reviews (2026-11-13)

**AI tool / model:** OpenCode coding agent — DeepSeek V4.1 Flash Free

**Prompt summary:** "proceed" / "continue" — implement the final Phase 3 item,
reviews, matching the Figma "Rate your meetup / Share your experience" form, the
Seller shop "Recent reviews" list and the Profile "My Reviews" panel. Add API
support and ownership enforcement, seed one demo review, run `npm run typecheck`,
and document the result.

**Generated:**

- `src/types/index.ts` — `Review`, `NewReviewInput`, `ReviewTarget`,
  `ReviewsState`, `ReviewTag` / `REVIEW_TAGS`, and the new `review` and `shop`
  notification targets.
- `src/api/reviewsApi.ts` — `getReviewsForUser`, `getReviewTarget` and
  `createReview`. A review is tied to listing + reservation + reviewer; only the
  buyer or seller of a sold/completed sale may review the other party, once each.
  Duplicate, self-review, incomplete-sale and 1–5 rating checks are repeated in
  the service layer. `getReviewTarget` resolves eligibility and the reviewee from
  the persisted session, so screens never guess either. A submitted review sends
  a best-effort blue "New review received" notification to the reviewee with
  `target: 'shop'`. A failed list load propagates instead of returning empty
  lists, so the Profile never claims "New · 0 reviews" when the API is down.
- `src/context/ReviewsContext.tsx` — received and submitted reviews, status,
  error, refreshing, `refresh` and `addReview`; loads on sign-in and clears on
  sign-out.
- `App.tsx` — `ReviewsProvider` mounted inside `MessagesProvider`.
- `src/screens/ReviewScreen.tsx` — completed-sale summary with Sold pill, the
  other student's avatar, "How was your experience with …?", a 1–5 star
  radiogroup with Figma's Poor/Fair/Good/Very good/Excellent labels, the four
  Figma tags, an optional 200-character comment with a live counter, and
  "Submit review". Loading, error + retry, already-reviewed and "Thank you for
  your review!" states; the thanks screen stays until "Return to previous
  screen" is pressed, with no auto-return (matching the Figma panel).
- `src/navigation/types.ts`, `RootNavigator.tsx` — `Review` route and Profile
  deep-link params (`tab`, `panel`, `nonce`).
- `src/components/FormField.tsx` — optional `labelHint` for the comment counter.
- `src/utils/formatters.ts` — `formatReviewDate`, `formatAverageRating`,
  `formatReviewCount` and `formatStars`.
- `src/screens/ProfileScreen.tsx` — live reviews/items-sold/listings stats,
  "My reviews" menu row and submitted-reviews panel, received reviews in the
  Seller shop with the average in the heading and "★ 5.0 · 1" pill. If the
  reviews request fails the stat shows "—", the shop rating shows "★ —", and the
  panels show an error banner with retry instead of a false empty state.
- `src/screens/ListingDetailsScreen.tsx` — post-sale "Rate & review" / "Rate
  buyer" entry and a "You reviewed this sale." state.
- `src/screens/SellerDashboardScreen.tsx` — "Rate buyer" action and reviewed note
  in the Sold tab.
- `src/screens/NotificationsScreen.tsx` — `review` opens the review form and
  `shop` opens Profile → Seller shop.
- `src/api/listingsApi.ts` — the sold notification now targets `review` and says
  the buyer can leave a review.
- `server/db.seed.json` — a seeded Ana → Carlo 5-star review for the sold
  Laboratory Gown (listing 4 / reservation 6), the sold notification retargeted
  to `review`, and a blue "New review received" row targeting Carlo's shop.
- `docs/DESIGN_GAP.md` — Reviews row, Profile/Seller shop/Notifications updates,
  review resource shape, ownership rules, screen inventory and Phase 3 mapping.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes with no errors.
- Web smoke test against the mock API:
  - The sold notification opened the review form for listing 4 with Ana as the
    reviewee; 5 stars, two tags and a 70-character comment enabled the submit
    button, the counter updated live, and the POST stored the review with the
    canonical tag order.
  - The thanks screen appeared and stayed until "Return to previous screen" was
    pressed; reopening the same notification showed "You already reviewed this
    completed sale."
  - Profile stats updated to 5.0 / 1 review / 1 Item sold / 5 Listings; the
    Seller shop heading showed "★ 5.0 · 1" with Ana's review; "My reviews"
    listed the submitted review.
  - Seller path: accepting Mika's fan request, marking it sold and choosing
    "Rate buyer" in the Sold tab opened the form for Mika; the 4-star review
    persisted, the card switched to "You reviewed this sale.", and Mika received
    the sold (`review`) and "New review received" (`shop`) notifications.
  - Deleting the reservation produced the Figma-style error state ("Reviews open
    after a completed sale.") with retry and Go back.
  - With the API stopped and the app reloaded, the Profile stat showed "—", the
    "My reviews" panel showed the "Reviews unavailable" error banner with "Try
    again", and pressing it after restarting the API reloaded the submitted
    review list.
  - Light and dark mode both render correctly, including the review form, thanks
    and error states.
  - Demo data was restored with `npm run db:reset` (1 review, 6 notifications,
    6 reservations, original listing statuses) and the theme returned to
    `system`.

**Human edits needed:**

- [ ] Review the form, thanks and error states on a physical phone and with large
      fonts (keyboard avoidance, comment counter wrapping).
- [ ] Check TalkBack/VoiceOver on the star radiogroup, tag checkboxes and the
      submit disabled state.
- [ ] Confirm the thanks panel's single "Return to previous screen" button (no
      timer) matches the Figma prototype feel.
- [ ] Confirm "Rate buyer" in the dashboard Sold tab is the right seller entry
      point, and that the buyer/seller both review each other once per sale.
- [ ] Confirm the four Figma tags and the "Optional · n/200" counter are enough
      (no free-form tag entry).
- [ ] Run `npm run typecheck` again after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Figma Phase 4 - Documentation, architecture and final checks (2026-11-14)

**Prompt summary:** proceed to Phase 4 of the Figma-alignment plan: update the
map/README/architecture/accessibility/walkthrough docs, record the phase in the
disclosure log, run typecheck, and restart/test the demo. Also finish the final
review-fidelity fix: the Figma thanks panel has only a "Return to previous
screen" button, so remove the 1.8 s auto-return.

**What changed:**

- `src/screens/ReviewScreen.tsx` — removed the auto-return `useEffect`; the
  thanks panel now stays until the button is pressed.
- `docs/DESIGN_GAP.md` — Phase 3 marked complete, thanks-panel wording fixed,
  Phase 4 marked done.
- `README.md` — current status, features 8–12 (reservations/dashboard,
  notifications, messages, reviews, seller shop), screens/routes table,
  architecture diagram and contexts, API endpoint list, new try-flows, reset
  counts, project structure and roadmap.
- `docs/ARCHITECTURE.md` — expanded layer diagram, folder responsibilities, a
  new "Reservations, dashboard, notifications, messages and reviews" section
  with resource flows and ownership rules, and new key decisions.
- `docs/ACCESSIBILITY.md` — Phase 3 screen conventions, touch-target rows, and
  new manual checks (star radiogroup, unread text, chat keyboard/polling,
  large fonts).
- `docs/CODE_WALKTHROUGH.md` — status and big-picture update plus a new section 9
  covering reserve, dashboard, notifications, chat and review data flows and
  defense questions; the trace-a-bug section is now 10.
- `docs/TESTING.md` — clean-state counts and accounts, new sections 10–14 for
  reservations, dashboard, notifications, messages and reviews; known limits
  renumbered to 15.
- `docs/DEMO_SCRIPT.md` — updated counts/trust line/architecture, optional
  90-second reserve → dashboard → chat → review block, profile and cleanup
  wording.
- `docs/SUBMISSION_CHECKLIST.md` — counts, Phase 3 smoke tests, accessibility
  and session-scope items.
- `AI_DISCLOSURE_LOG.md` — this entry.

**Verified in this session (AI-run, not yet re-run by a teammate):**

- `npm run typecheck` passes after the ReviewScreen change.
- Submitted a review for the seeded sold Laboratory Gown as Carlo: the thanks
  panel appeared, stayed for more than 3 seconds, and **Return to previous
  screen** navigated back to Notifications.
- With the API stopped, Profile showed `—` / "Reviews", the My reviews panel
  showed "Reviews unavailable" plus the API error banner, and **Try again**
  reloaded the review list after the API restarted.
- `npm run db:reset` restored 1 review / 6 notifications / 6 reservations /
  6 chats / 16 messages; the app was reloaded on Home as Carlo with the theme in
  `system`.
- Mock API on `3001` and Expo web on `8082` were restarted and the app loaded
  online.

**Human edits needed:**

- [ ] Re-read the updated README/docs against the live app and correct any
      wording that does not match the team's demo.
- [ ] Complete the phone/TalkBack/VoiceOver/large-font checks listed in
      `docs/ACCESSIBILITY.md` and `docs/TESTING.md`.
- [ ] Observe the 10-second chat poll with two live sessions.
- [ ] Build and attach the preview APK, or state clearly that Expo Go is the
      demo path.
- [ ] Add real team names/roles and final screenshots if the rubric requires
      them.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Native splash screen restored (2026-11-15)

**Prompt summary:** after the Figma phases, the user asked whether the "flash
screen" was still there. The in-app `LoadingScreen` was intact, but `app.json`
had no splash configuration, so the native launch screen was Expo's default.
The user approved adding a branded native splash.

**What changed:**

- `app.json` — added the `expo-splash-screen` plugin with
  `assets/splash-unisell.png`, `imageWidth: 180`, `resizeMode: "contain"`,
  background `#EAF6F3` for light and `#0B1030` for dark mode.
- `package.json` — added `expo-splash-screen@^58.0.11` (installed offline from
  the local npm cache) and an `npm run splash-icon` script.
- `assets/splash-unisell.png` — new 1024 × 1024 transparent mark that mirrors the
  in-app `BrandMark` (teal rounded square, white graduation cap, orange check
  dot). It replaces nothing; the old Expo template `splash-icon.png` is left
  untouched and unreferenced.
- `scripts/build-splash-icon.js` — reproducible SVG → PNG generator using the
  already-installed `sharp`.
- `docs/BUILD_AND_RELEASE.md` — documents the splash plugin settings.
- `README.md` — project structure now lists the splash asset and script.

**Not touched:** `src/screens/LoadingScreen.tsx`, `src/screens/WelcomeScreen.tsx`
and the in-app session-restore flow. The branded in-app flash screen still runs
while `AuthContext` restores the saved session.

**Verified in this session:**

- `npx expo config --type public` resolves the plugin without errors.
- `npm run typecheck` passes.
- Mock API (`3001`) and Expo web (`8082`) were restarted and the app loads.

**Human edits needed:**

- [ ] Rebuild the preview APK or run `npx expo prebuild` and confirm the splash
      mark, light/dark background and scale on a real device.
- [ ] Re-run `npm run typecheck` after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Branded app icons (2026-11-15)

**Prompt summary:** the user approved replacing the Expo template placeholder
icons with the same graduation-cap mark used by the splash screen.

**What changed:**

- `assets/icon.png` — 1024 × 1024 opaque teal icon with the white cap and orange
  check dot (full-bleed; the OS applies its own corner mask).
- `assets/android-icon-foreground.png` — transparent foreground, mark scaled to
  0.62 so it stays inside the adaptive-icon safe zone.
- `assets/android-icon-background.png` — solid `#1F7A72` background layer.
- `assets/android-icon-monochrome.png` — single white alpha silhouette for
  Android themed icons (no dot or check, since the launcher supplies the tint).
- `assets/favicon.png` — 64 × 64 rounded teal favicon.
- `app.json` — `android.adaptiveIcon.backgroundColor` is now `#1F7A72`.
- `scripts/build-app-icons.js` + `npm run app-icons` — reproducible generator
  (SVG → PNG with `sharp`).
- `README.md`, `docs/BUILD_AND_RELEASE.md` — document the assets and script.

**Verified in this session:**

- The generated foreground composites correctly over the teal background inside
  the adaptive safe zone; the monochrome layer is a clean single-colour cap.
- `npx expo config --type public` still resolves the config.
- `npm run typecheck` passes.

**Human edits needed:**

- [ ] Check the launcher icon on a real Android phone (adaptive + themed icon)
      and on iOS if available.
- [ ] Rebuild the preview APK so the new icon is baked into the package.
- [ ] Re-run `npm run typecheck` after any edits.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Welcome screen restored and auth routing verified (2026-11-15)

**Prompt summary:** the user reported that the Welcome/Landing screen had been
removed and the app opened straight into Home. They asked to restore the
Welcome screen without touching Home, and to fix a Home header where a settings
gear appeared to overlap the notification bell.

**What I found:**

- There is **no git repository** in this workspace (`git status` → “not a git
  repository”), so there was no history to restore from.
- `src/screens/WelcomeScreen.tsx` already existed and `RootNavigator` already
  routed `signedOut` → Welcome, `signedIn` → Main tabs, and `loading` →
  `LoadingScreen`. The app opened on Home because a session was saved from the
  previous demo — which matches the requested rule “saved session → Home”.
- The Home header contains **only the notification bell**; there is no settings
  gear on Home in this codebase. Settings lives behind the gear on **Profile**,
  so there was no overlap to fix.

**What changed:**

- `src/screens/WelcomeScreen.tsx`
  - Added the **“SDG 12 · Responsible Consumption”** pill above the headline
    (leaf icon, `primaryLight` pill, `primary` text).
  - Changed **Create an account** from the orange `accent` variant to the teal
    `primary` variant, as requested.
  - Everything else (brand mark, floating Textbooks/Uniforms/Dorm finds cards,
    sparkle/leaf decorations, headline, subtext, three feature cards, outlined
    secondary button, mint gradient) is unchanged.
- `docs/screenshots/README.md` — noted that `01-welcome.png` predates the pill
  and teal button and needs recapturing.

**Not changed:** `RootNavigator.tsx`, `AuthContext.tsx`, `MainTabs.tsx`,
`HomeScreen.tsx`, the tab bar, listings, theme, dark mode and API logic.

**Verified in this session:**

- `npm run typecheck` passes.
- Logged out + reload → **Welcome** (session key empty), with the SDG pill,
  three feature cards and both buttons.
- Welcome → **I already have an account** → Log in as Carlo → **Home**.
- Reload while signed in → **Home** directly (session restored).
- Log out (Profile → Log out → confirm) → **Welcome**, session cleared.
- Home header shows the bell only, top-right, with no overlapping icon.

**Human edits needed:**

- [ ] Confirm the Welcome layout and button order on a physical phone.
- [ ] Recapture `docs/screenshots/01-welcome.png` with the SDG pill and teal CTA.
- [ ] If a gear should sit next to the Home bell (instead of only on Profile),
      decide the final placement before the demo.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## Dev API base URL repaired after DHCP change (2026-11-15)

**Prompt summary:** the app threw
`[UniSell API] GET http://192.168.22.72:3001/listings failed | status=NO_RESPONSE`
after an environment restart. The user asked to fix it.

**Cause:** `.env` hardcoded `http://192.168.22.72:3001`, a DHCP address the
machine no longer had (current Wi-Fi address was `10.50.128.59`), and both dev
servers had stopped. After restarting them, the API answered `200` in PowerShell
but the browser still timed out on the LAN IP, so the web preview could not use
it either.

**What changed:**

- `.env` → `EXPO_PUBLIC_API_URL=http://localhost:3001`. The web preview now
  calls the API on the same machine. On native, `apiClient` already replaces a
  loopback env host with the Expo `hostUri`, so Expo Go still reaches the laptop.
- `.env.example` — documents `localhost` for web and a LAN IP for phones.
- `README.md` — notes `localhost` as the safe web default, plus a troubleshooting
  row for “browser times out on a LAN IP that PowerShell can reach”.

**Verified:** `npm run api` served 18 listings / 4 users on `0.0.0.0:3001`; the
Expo web bundle returned `200`; the app logged
`Base URL: http://localhost:3001 (source: env)`; Home rendered 17 listing cards
with no “You're offline” banner and zero console errors; `npm run typecheck`
passes.

**Human edits needed:**

- [ ] If the demo runs on a phone, confirm the API is reachable from that phone
      (same Wi-Fi, Node allowed through the firewall).

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._

---

## SDG 12 pill removed from Welcome (2026-11-15)

**Prompt summary:** remove the “SDG 12 · Responsible Consumption” pill between
the floating category cards and the “Buy and sell within campus.” headline, and
keep the spacing balanced. Nothing else on Welcome should change.

**What changed:**

- `src/screens/WelcomeScreen.tsx` — deleted the pill `View` (leaf icon + `Text`)
  and the `sdgPill` / `sdgPillText` styles, which were used only there. The
  headline now follows the hero artwork directly; `hero.marginTop` and
  `heading.marginBottom` keep the spacing even. No imports became unused
  (`Ionicons` still draws the feature-card icons).
- `docs/screenshots/README.md` — the stale `01-welcome.png` note no longer
  mentions the pill.
- SDG 12 wording stays in the README, pitch deck and architecture docs; those
  are project documentation, not the Welcome screen.

**Verified:** `npm run typecheck` passes; the Welcome screen renders with no
“SDG 12” text, the brand block, all three floating cards, headline, subtext,
three feature cards and both buttons intact; zero console errors.

**Human edits needed:**

- [ ] Re-check the gap under the floating cards on a physical phone.

**Human edits made:**

_To be filled in by the team. Do not claim edits that have not happened._
