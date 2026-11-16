# UniSell — Architecture Notes

This is the short version of how the app is put together. The walkthrough in
[`CODE_WALKTHROUGH.md`](CODE_WALKTHROUGH.md) explains the actual data flow code.

---

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI LAYER                                                 │
│    src/screens/*  +  src/components/*                       │
│    Renders state. Sends user actions to context functions.  │
│    Never calls fetch directly.                              │
└───────────────────────────┬─────────────────────────────────┘
                            │ useAuth() / useListings() /
                            │ useReservations() / useNotifications() /
                            │ useMessages() / useReviews()
┌───────────────────────────▼─────────────────────────────────┐
│ 2. STATE LAYER                                              │
│    src/context/AuthContext.tsx                              │
│    src/context/ListingsContext.tsx                          │
│    src/context/ReservationsContext.tsx                      │
│    src/context/NotificationsContext.tsx                     │
│    src/context/MessagesContext.tsx                          │
│    src/context/ReviewsContext.tsx                           │
│    React Context + useReducer.                              │
│    Owns user, feed, favorites, publish action, requests,     │
│    notifications, chats, reviews and data flags.             │
└───────────────────────────┬─────────────────────────────────┘
                            │ typed functions
┌───────────────────────────▼─────────────────────────────────┐
│ 3. API SERVICE LAYER                                        │
│    src/api/apiClient.ts  -> base URL, timeout, ApiError     │
│    authApi / listingsApi / reservationsApi                   │
│    notificationsApi / messagesApi / reviewsApi               │
│    One place that knows endpoint URLs and payload shapes.   │
└─────────────┬───────────────────────────────┬───────────────┘
              │ HTTP                          │ local writes
┌─────────────▼─────────────────┐   ┌─────────▼───────────────┐
│ 4a. MOCK REST API             │   │ 4b. DEVICE STORAGE      │
│     json-server :3001         │   │     AsyncStorage        │
│     server/db.json            │   │     session, favorites  │
└─────────────┬─────────────────┘   └─────────────────────────┘
              │ server unreachable?
┌─────────────▼─────────────────┐
│ 5. OFFLINE FALLBACK           │
│    src/data/listings.json     │
│    src/data/users.json        │
└───────────────────────────────┘
```

The bundled fallback covers **reads only**. Login with a seeded account can work
offline, but sign-up and publishing must reach json-server so the demo does not
pretend a write succeeded.

---

## Folder responsibilities

| Folder | Owns | Does not own |
| --- | --- | --- |
| `src/screens/` | Layout for one screen, local form/filter state | API URLs, global state |
| `src/components/` | Reusable UI (cards, chips, state views, button, container) | Business logic |
| `src/navigation/` | Route names, params, stack/tab structure | Screen content |
| `src/context/` | Global state + actions (auth, listings, reservations, notifications, messages, reviews, theme, toast) | JSX screens, raw fetch |
| `src/api/` | Endpoints, payloads, timeouts, fallback, per-resource ownership checks | UI state |
| `src/theme/` | Semantic palettes, breakpoints/layout tokens, spacing, type, shadows | Component-specific styles |
| `src/types/` | Shared TypeScript shapes | Runtime values |
| `src/utils/` | Pure helpers (validation, formatting, filtering, category meta) plus storage wrappers | React state |
| `src/data/` | Bundled read-only demo data | Writes |

---

## Authentication and session flow (Phase 2)

```
App start
  → AuthProvider status = "loading"
    → storage.loadSession() reads AsyncStorage key "unisell.session"
      → found:    status = "signedIn"  → RootNavigator renders Main tabs
      → not found: status = "signedOut" → RootNavigator renders Welcome/Login/SignUp

Log in
  → LoginScreen validates the form
    → AuthContext.signIn(email, password)
      → authApi.loginWithEmail() → GET /users?email=...
        → json-server unreachable? use bundled src/data/users.json
      → storage.saveSession(user) with the password stripped
      → reducer status = "signedIn"
        → RootNavigator swaps the stack automatically

Log out
  → ProfileScreen calls AuthContext.signOut()
    → storage.clearSession()
    → reducer status = "signedOut"
      → RootNavigator returns to Welcome
```

Two details worth explaining in the defense:

1. The root navigator renders **different screen groups** for signed-in and
   signed-out users. React Navigation unmounts the old group, so a signed-in
   student cannot go "back" into the login screens.
2. The password is used only for the login request. The persisted session keeps
   `id`, `name`, `email`, `course`, `yearLevel` and `studentId`; it never stores
   the password.

---

## Browse data flow (Phase 3)

### Loading the feed

```
App start
  → ListingsProvider mounts (above the navigator)
    → refresh()
      → dispatch LOAD_START (status = "loading")
        → getListings() in src/api/listingsApi.ts
          → apiClient GET /listings with a 6s timeout
            → success: { listings, source: "api" }
            → network failure: bundled src/data/listings.json, source = "fallback"
            → HTTP error (e.g. 500): throw → dispatch LOAD_ERROR
      → dispatch LOAD_SUCCESS or LOAD_ERROR
        → Home / Search / Saved re-render
```

`source === "fallback"` drives the orange offline banner. An HTTP error with no
cached cards drives `ErrorState`; an error during pull-to-refresh keeps the cards
and shows an inline banner instead.

### Search and filters

```
Search input / chips
  → local query, category, condition state in SearchScreen
    → filterListings(listings, filters)   // pure function, no request
      → matching cards render instantly
```

The function checks title, description, category, seller and meet-up spot for the
keyword, then applies category and condition exactly. The feed is already sorted
newest-first by `listingsApi`, so no extra sort step is needed.

### Favorites

```
Heart press
  → toggleFavorite(listingId)
    → reducer adds/removes the numeric id
      → effect writes the array to AsyncStorage key "unisell.favorites"
        → every screen with the same listing id re-renders its heart

App restart
  → ListingsProvider reads "unisell.favorites"
    → dispatch SET_FAVORITES
      → Saved tab maps ids back to current listings
```

The Saved tab filters out ids that no longer exist, so a removed listing cannot
leave a broken card. Favorites are device-wide for the MVP; scoping the storage
key by user id is listed as a future improvement.

### Listing details

`Home`, `Search` and `Saved` push the root-stack route
`ListingDetails` with `{ listingId }`. The screen finds the listing in
`ListingsContext`. If the feed is still loading it shows a spinner; if the id is
missing after loading it shows the “Listing unavailable” state.

---

## Publishing data flow (Phase 4)

```
PostListingScreen
  → local form state (strings, so the inputs stay controlled)
    → validateForm() uses pure helpers from src/utils/validators.ts
      → any errors: inline field messages, no request
        → valid: ListingsContext.publishListing(input)
          → listingsApi.createListing()
            → POST /listings { ...seller fields, status: "available",
                               createdAt, image: images[0],
                               images, imageSources }
              → json-server assigns id and writes server/db.json
          → dispatch ADD_LISTING
            → new card appears at the top of every screen immediately
          → silent refresh GET /listings
            → reconciles ids/ordering and clears the fallback source flag
          → navigate to ListingDetails with the new id

POST failure
  → error thrown before ADD_LISTING
    → ErrorBanner on the form; draft values are untouched
```

The seller identity comes from `AuthContext`, not from editable form fields. This
prevents a student from typing another person's name into the listing, but it is
still a mock app: there is no server-side token or authorization check.

Two consistency details:

- `ADD_LISTING` first filters the same id out of the old array. A later silent
  refresh therefore cannot create a duplicate card.
- The silent refresh runs after the immediate insert. It fixes the edge case
  where the initial feed request started before the post and returned a snapshot
  without the new listing.

---

## Profile and accessibility (Phase 5)

### Profile is a section over shared state

`Profile` is a tab screen, not a new root route. It composes the existing
providers instead of introducing a second feed:

```
ProfileScreen
  → useAuth()          → user, signOut(), updateProfile()
  → useListings()      → listings, favorites, status, source, error, refresh()
  → useReviews()       → received, submitted, status, error, refresh()
  → useNotifications() → unreadCount
    → myListings = listings.filter(listing => canManageListing(user, listing))
    → stats: average/count from received, sold count from myListings, listings count
    → tabs: Profile | Seller shop (active listings + received reviews)
    → menu: My Listings, Saved, My reviews, Notifications, Settings, Log out
```

This keeps one source of truth. A successful `ADD_LISTING` already updates
`ListingsContext`, so the listing count and My Listings rows reflect a new post
without a separate `/my-listings` request. The Saved tab maps favorites to the
current feed before rendering. Reviews come from `ReviewsContext`; a review
submission refreshes the received/submitted lists without reloading listings.

Profile states:

| State | What the user sees |
| --- | --- |
| `idle` / `loading` | Account card immediately; counts show `—`; section spinner and `Loading your listings…` |
| `error` with no cards | Error card with the API message and **Try again**, which calls `refresh()` |
| error with cached cards | `ErrorBanner` above the page; My Listings rows stay usable |
| reviews error | Reviews stat shows `—`, the shop rating `★ —`, and the review panels show **Reviews unavailable** with retry |
| `source === "fallback"` | Offline banner; account and saved items still render |
| no matching listings | Empty card and **Post your first item**, which opens the Sell tab |
| logout | `signOut()` clears the session and all resource contexts; the root navigator swaps to Welcome |

`MyListingRow` is deliberately compact (thumbnail, title, category/condition,
price, status, date). It opens the same `ListingDetails` route as a full card,
so there is no separate details implementation to keep in sync.

### Accessibility pass

The Phase 5 changes are described in detail in
[`ACCESSIBILITY.md`](ACCESSIBILITY.md). The implementation choices are:

- screen and section titles use `accessibilityRole="header"`;
- icon-only actions have explicit labels, and the tab bar names every tab even
  when the centre Sell label is visually hidden;
- listings expose separate “Open …” and “Save/Remove …” actions;
- filter chips announce selected state, and the Search result count is a polite
  live region;
- spinners have labels, and small controls use `hitSlop` to reach roughly
  44 × 44 px;
- muted text, feedback and status tokens were darkened for AA contrast while the
  brand teal/orange stayed unchanged.

The cleanup also removed the unused `PlaceholderScreen` and moved the
status-colour mapping into `src/utils/listingStatus.ts` so cards, details and
Profile cannot drift apart.

---

## Listing lifecycle and ownership (Phase 7)

### One ownership rule

`src/utils/permissions.ts` exports the single helper:

```ts
canManageListing(user, listing) =>
  Boolean(user && listing && listing.sellerId === user.id)
```

Screens use it to decide whether owner controls exist at all. Non-owners never
see disabled owner buttons; the controls are absent, and only **Save this item**
plus the meet-up card remain.

The API service layer repeats the rule because UI checks alone are not enough:

```
ListingDetails / Profile / Edit Listing
  → ListingsContext.updateListingStatus / updateListing / deleteListing
    → listingsApi.assertOwner(id)
      → loadSession()                       (identity from AsyncStorage)
      → GET /listings/:id                   (sellerId from the server copy)
      → canManageListing(sessionUser, listing)
        → false: ApiError("You can only change your own listings.", 403)
        → true:  PATCH or DELETE
```

The listing id may come from a screen or route param, but the user id never does.
`createListing` also overwrites `sellerId`, `sellerName`, `sellerCourse` and
`sellerYearLevel` from the session, so a form cannot forge an owner.

### Status lifecycle

| Current status | Owner actions |
| --- | --- |
| `available` | Mark as sold (primary), Mark as reserved, Edit listing, Delete listing (red outline) |
| `reserved` | Mark as sold, Mark as available, Edit listing, Delete listing |
| `sold` | Delete listing (destructive primary), Mark as available again. SOLD ribbon; Edit and Save are hidden. |

- **Mark as sold** sends `PATCH /listings/:id { status: "sold", soldAt, updatedAt }`
  after the confirmation “Mark this item as sold? Buyers will no longer be able
  to contact you about it.”
- **Mark as reserved / available** sends the matching `status` and clears
  `soldAt`.
- **Edit** reuses the Post Listing form in edit mode (`PATCH` with the editable
  item fields). `createdAt`, `sellerId` and the seller snapshot are preserved;
  `updatedAt` is added. Sold listings cannot be edited until they are available
  again.
- **Delete** sends `DELETE /listings/:id`. The confirmation is status-specific:
  sold uses “Delete this sold listing? This cannot be undone.”, other statuses
  use “Delete this listing? It will disappear from the campus feed.”
- The reducer removes the id from `listings` and from `favorites`, so Home,
  Search, Profile counts and the current device's Saved list update together.
  Other devices drop the card on their next refresh; Saved maps ids to the
  current feed, so a missing item disappears without a broken card.
- Missing ids render **This listing is no longer available**.

### Sold visibility

- Home filters `status !== "sold"` before applying category chips.
- Search calls `filterListings(..., { includeSold })`; **Show sold items** is a
  checkbox that defaults to off.
- Profile > My listings has **Active / Sold / All** segments. Sold rows keep a
  SOLD chip and a visible delete shortcut. The Sold view shows **Delete all sold
  listings (N)** with a count confirmation.
- Saved keeps sold items and `ListingCard` renders a full-width **SOLD** ribbon.

### Why json-server is not security

`json-server` has no authentication, tokens or row-level security. A caller who
edits `server/db.json` or sends a raw request can bypass the app. The service
layer check is a realistic demo of where authorization belongs, not a security
boundary. A production backend (for example Supabase with row-level security)
must verify the session token and enforce `sellerId = auth.uid()` on the server.

---

## Profile editing (Phase 7)

```
EditProfileScreen
  → useAuth().updateProfile({ name, course, yearLevel, photo })
    → authApi.updateProfile(user.id, input)
      → loadSession(); session.id must equal user.id
      → PATCH /users/:id { name, course, yearLevel, photo }
      → updateUserListingsSellerFields(user.id, { sellerName, sellerCourse, sellerYearLevel })
          → GET /listings?sellerId=:id
          → PATCH each listing
      → toSafeUser() strips the password
    → saveSession(updated)          (AsyncStorage survives a restart)
    → dispatch AUTH_SUCCESS(updated)
  → EditProfileScreen refreshes ListingsContext so feed seller cards update
  → navigate back
```

- The route has no `userId` param, so the screen cannot be pointed at another
  profile. `authApi` repeats the session check and throws
  “You can only edit your own profile.”
- Editable fields: full name (2–60 characters), course, year level and an
  optional 400 px compressed JPEG data URI. Removing the photo stores `null` and
  the initials avatar returns.
- Email and student ID are read-only with a lock and the helper "Contact your
  school office to change this". Profile never displays the full student ID.
- **Save changes** is disabled until a value actually changes. Leaving with
  unsaved edits opens **Discard changes?**
- The optional password change validates current password, minimum 8 characters,
  a different new password and a matching confirmation. The mock API compares
  and stores plain text; this is explicitly prototype-only.

### Seller fields decision

Each listing stores a denormalized `sellerName`, `sellerCourse` and
`sellerYearLevel` so Home, Search and Details render without a join. A profile
save therefore updates those fields on every listing owned by the user. The
alternative — looking up the seller by `sellerId` on every card — would need a
second request or a joined backend endpoint; for this mock app the snapshot plus
bulk update is simpler and keeps the feed self-contained.

---

## Reservations, dashboard, notifications, messages and reviews (Figma Phase 3)

These features share one pattern: a context provider loads the signed-in
student's rows, screens call typed actions, and the API service repeats every
ownership rule against the persisted session before writing.

### Reservations and the seller dashboard

```
ReserveScreen
  → useReservations().createReservation(listingId, { meetupAt, meetupSpot, note })
    → reservationsApi.createReservation()
      → loadSession(); the buyer id comes from the session
      → GET /listings/:id; reject the seller reserving their own item
      → POST /reservations { listingId, buyerId, sellerId, snapshots, status: "pending" }
      → best-effort notification to the seller (target: "dashboard")
  → ListingDetails shows the pending card; the buyer may cancel it

SellerDashboardScreen
  → Requests tab: accept / decline
    → reservationsApi.updateReservationStatus(id, "accepted" | "declined")
      → loadSession(); only reservation.sellerId may change it
      → PATCH /reservations/:id + best-effort notification to the buyer
  → My Listings / Sold tabs reuse the owner actions in ListingsContext
  → Mark as sold keeps the accepted request accepted and notifies the buyer
    (target: "review")
```

Reservation statuses are `pending | accepted | declined | cancelled | completed`.
Only the buyer can cancel a pending request, only the seller can accept/decline,
and the listing's owner is always taken from the server copy, never from the
form. `ReservationsContext` exposes `reservations`, `status`, `error`,
`refreshing`, `refresh`, `createReservation`, `updateReservationStatus` and
`cancelReservation`; it clears on sign-out.

### Notifications

- `notifications` stores **one row per recipient** (`userId`), so reads are a
  simple ownership check. `notificationsApi` rejects reads for another student
  and mark-all-read only touches that student's rows.
- Lifecycle writes use `createNotificationSafely` in the API layer: reserve →
  seller, accept/decline → buyer, cancel → seller, sold → accepted buyer, new
  review → reviewee. A notification failure never rolls back the action.
- Targets are `listing | dashboard | shop | review | none`. The screen marks a
  card read immediately, navigates in the background, and the Home/dashboard
  bells derive their dot and count from `unreadCount`.
- `NotificationsContext` owns the feed, unread count, `refresh`,
  `markAsRead` and `markAllAsRead`, and clears on sign-out.

### Messages / chat

```
ListingDetails "Message seller"
  → messagesApi.ensureChat(listingId)
    → loadSession(); reject the seller messaging their own listing
    → GET /chats?listingId=… then filter buyerId === session.id
    → reuse the thread or POST /chats with denormalized listing/seller snapshots
  → navigate("Chat", { chatId })

ChatScreen
  → useMessages().loadMessages(chatId)
    → messagesApi.getMessages(chatId)
      → ownership: session.id must be chat.buyerId or chat.sellerId
    → opening the chat marks incoming messages read (one `read` flag per message)
  → sendMessage → POST /chatMessages + PATCH /chats/:id updatedAt
  → a 10-second poll runs only while the screen is focused
```

There is exactly **one thread per listing + buyer**. The inbox sorts by last
activity, derives `lastMessage`, `lastMessageAt` and `unreadCount`, and shows a
7 px unread dot. Quick replies send immediately. Presence ("online") and
location sharing are deliberately omitted because the mock API has no presence
data and the app does not request location.

### Reviews

```
Rate & review (sold listing, dashboard Sold tab, or sold notification)
  → getReviewTarget(listingId)
    → loadSession(); find the sold/completed reservation for this student
    → reviewee = the other party; alreadyReviewed = existing row
  → ReviewScreen (1–5 stars, four tags, optional 200-char comment)
  → useReviews().addReview({ listingId, reservationId, rating, tags, comment })
    → reviewsApi.createReview()
      → re-check eligibility, self-review, duplicate and rating 1–5
      → POST /reviews + best-effort blue "New review received" to the reviewee
  → thanks panel stays until "Return to previous screen"
```

A review is unique per **listing + reservation + reviewer**; both the buyer and
the seller may review the other party once. `ReviewsContext` keeps `received`
and `submitted` lists, exposes `status`, `error`, `refreshing`, `refresh` and
`addReview`, and clears on sign-out. List failures propagate so the Profile can
show `—` / "Reviews unavailable" with retry instead of a false empty state.
Received reviews drive the Profile average, the Seller shop rating and the
recent-reviews list.

### Why these are session-scoped, not UI-scoped

A screen can be deep-linked or left stale. Every service function therefore
reloads the persisted session and the server copy before writing, and throws a
403-style `ApiError` when the student is not the buyer, seller, recipient or
reviewer. As with listing ownership, `json-server` has no auth, so this is demo
enforcement; a production backend must repeat the rules with row-level security.

---

## Responsive layout (Phase 8)

Breakpoints are defined once in `src/theme/layout.ts` and read through
`useBreakpoint()` (or `useResponsive()`), which wraps `useWindowDimensions`:

| Name | Width | Navigation | Product grid | Page padding |
| --- | --- | --- | --- | --- |
| `mobile` | `< 600` | Bottom tabs + raised centre `+` | 2 columns | 16 px |
| `tablet` | `600–1023` | Bottom tabs | 3 columns | 24 px |
| `desktop` | `≥ 1024` | Left sidebar (`248 px`) | 4 columns | 32 px |

Layout tokens also cap content: `maxContentWidth` 1200, `maxFormWidth` 720,
`maxAuthWidth` 480, `maxDetailsWidth` / `maxProfileWidth` 1120.

```
ScreenContainer (scroll / keyboard / bottom inset)
  └─ ResponsiveContainer (maxWidth, horizontal padding)
       └─ screen content
```

- **Home, Search, Saved** derive the card width from the window width minus
  `layout.sidebarWidth` on desktop, then render the same `ListingCard` with a
  fixed image aspect ratio in 2 / 3 / 4 columns.
- **MainTabs** keeps the bottom-tab navigator but swaps in a custom `tabBar`.
  On desktop it renders a left rail with the logo, Home, Search, Saved, Profile
  and a prominent **Post a listing**; `tabBarPosition` is `left`. Phones and
  tablets get the normal bottom bar, and the raised **+** only renders on mobile.
- **Listing Details** is two columns on desktop (gallery/seller beside details),
  and the gallery measures its own column instead of the window.
- **Post / Edit forms** cap at 720 px and pair short fields (Title + Price,
  Category + Condition, Course + Year) into rows above `mobile`.
- **Login / Sign Up / Welcome** use a 480 px card; desktop shows `WelcomeHero`
  beside it.
- **Profile** becomes a two-column dashboard: account, stats, appearance,
  safety and logout on the left; My listings on the right. Mobile keeps one
  column in reading order.

Web extras: `cursor: pointer`, hover feedback, visible focus rings and no
horizontal scrolling. Touch targets stay at least 44 px on phones.

---

## Theme system (Phase 8)

`src/theme/palettes.ts` exports `lightColors` and `darkColors` with identical
`ThemeColors` keys, plus `lightGradients` / `darkGradients` and a category
palette (`color`, `tint`, `onColor`) per mode.

```
ThemeMode = 'system' | 'light' | 'dark'
  → ThemeContext reads storage.loadThemeMode()
    → no stored value yet: hold first paint (no light flash)
    → resolved = mode === 'system' ? useColorScheme() : mode
      → lightColors / darkColors + theme-aware shadows
        → useTheme() in screens/components
```

- `ThemeContext` imports only `theme/palettes`; `theme/index.ts` re-exports the
  hooks/helpers so screens import from one place.
- The mode is saved with `saveThemeMode` under the existing storage module and
  applied immediately — no restart.
- `createThemedStyles((colors, shadows) => ({...}))` turns a module-level pure
  factory into a hook that re-runs when the palette changes. Static
  `StyleSheet.create` blocks with colours were removed from the UI.
- Every surface reads semantic tokens: screens, modals, toasts, skeletons,
  banners, status bar, photo badges, the SOLD ribbon and the React Navigation
  theme (`DarkTheme` in dark mode).
- Photos, seed illustrations and `BrandMark` keep fixed brand colours;
  text over photos uses `photoOverlay` for contrast.
- On web, `ThemeContext` also sets the document background and
  `color-scheme`, and `app.json` uses `"userInterfaceStyle": "automatic"`.
- `ThemeSwitch` (System / Light / Dark with icons) appears in Profile and in the
  desktop sidebar/top bar. Its selected pill uses `chipActive` / `chipTextActive`
  so white text stays AA in both modes.

---

## Button system (Phase 8)

One `AppButton` component replaces the previous ad-hoc buttons, chips and
actions.

| Variant | Look | Use |
| --- | --- | --- |
| `primary` | Teal gradient, light text | Normal primary action |
| `accent` | Orange gradient, dark text | The main CTA (Publish, Save) |
| `secondary` | Surface + border | Neutral actions |
| `success` | Green gradient | Mark available / positive owner action |
| `warning` | Amber gradient | Mark reserved |
| `danger` | Red gradient | Destructive confirm |
| `dangerOutline` | Red border/text | Lower-emphasis destructive action |
| `ghost` | Transparent | Cancel / dismiss |

- Sizes `sm` (40 px), `md` (48 px) and `lg` (56 px), with optional `icon` and
  `rightIcon`, `loading` spinner, `disabled`, `fullWidth`, `labelStyle` and
  `accessibilityHint`.
- States: pressed darkens and scales to **0.98**; web hover lightens with a lift
  shadow; focus shows `focusRing`; disabled is desaturated with
  `disabledBackground` / `disabledText`; loading shows a spinner and blocks
  presses.
- Filled variants paint `gradients.*` with `expo-linear-gradient`; content
  colours come from `onPrimary` / `onAccent` / `onSuccess` / `onWarning` /
  `onDanger`, all AA-checked in both modes.
- `FilterChip` uses the selected category's `color` / `onColor`; the saved heart
  fills `favorite`; owner actions use success/warning/danger so colour keeps a
  consistent meaning (teal primary, orange only for the main CTA, red only for
  destructive actions).

---

## Key decisions

| Decision | Reason |
| --- | --- |
| Context + `useReducer` instead of Redux | State is split by resource (auth, listings, reservations, notifications, messages, reviews), so plain Context is enough and there is one less library to explain. |
| Conditional root navigator groups | Auth state, not manual `navigate()` calls, decides whether the app shows the auth stack or the Main tabs. |
| One `apiClient` wrapper | Timeout handling, error messages and the base URL live in one place. |
| Fallback JSON for network failures only | The live demo survives no Wi-Fi, while a real HTTP error still surfaces a retry state instead of hiding the problem. |
| In-memory search and filters | The mock catalogue is 18 items, so filtering with a pure function is instant and needs no request per keystroke. A production catalogue would move this to the server. |
| Device-level favorites | One AsyncStorage key is simple to demo; per-user keys are the next step when accounts share a phone. |
| Seller details copied onto each listing | The feed renders without a second request; acceptable for a mock MVP. |
| Numeric ids | `json-server` auto-increments numeric ids on `POST`, so new listings behave like seeded ones. |
| Local form state + pure validation | The draft belongs to one screen, and `validateForm()` can be tested without rendering or networking. |
| Immediate `ADD_LISTING`, then silent refresh | The new card shows up instantly, while the follow-up GET reconciles order and clears a stale offline banner. |
| Camera-or-gallery photos with mock storage | The seller takes or chooses 1–3 photos, each compressed to a base64 data URI and tagged `camera`/`gallery` in `imageSources`. json-server stores them in the mock DB; a production backend would use cloud storage. Seeded listings use sample illustrations. |
| Fixed campus meet-up list | Keeps the demo safe and simple, and avoids free-text locations that are hard to filter or verify. |
| Profile filters the shared listing context | No duplicate endpoint or cache; Profile stays in sync after posting. |
| One `canManageListing` helper plus service-layer re-check | Screens cannot drift into different ownership rules, and a stale or deep-linked screen cannot write another seller's listing. |
| Seller snapshots updated after a profile save | Feed cards stay self-contained while the signed-in user's name/photo changes appear everywhere immediately. |
| Sold items hidden by default, opt-in in Search | Buyers see what is still available; owners keep the record in My listings > Sold and Saved. |
| One reservation row per request, not per meet-up slot | The Figma flow asks for one date/time/spot; there is no multi-slot inventory to model. |
| Sold keeps the accepted request `accepted` | The app has no separate completion step; the sold listing plus the accepted request are enough to unlock reviews. |
| One notification row per recipient | Reads become a plain `userId` check and each student can mark their own feed read. |
| Best-effort notifications | A failed notification must never block a reserve, accept, sold or review action. |
| One chat thread per listing + buyer | Matches the Figma inbox, avoids duplicate conversations and makes ownership a single buyer/seller check. |
| 10-second focus polling instead of sockets | The mock API has no realtime backend; polling keeps the demo honest and stops when the screen is not focused. |
| No presence dot or location sharing | The API has no online status and the app does not request location, so the Figma green dot and "+" are omitted. |
| Reviews unique per listing + reservation + reviewer | Prevents double reviews while letting both the buyer and seller review each other. |
| Review thanks stays until the button | Matches the Figma panel; an auto-return would flash an already-reviewed state. |
| Shared status-colour helper | The feed, details and Profile use one mapping instead of slightly different badge colours. |
| Accessibility labels live with their controls | The label travels with the action, so changing a button or placeholder does not silently remove its screen-reader name. |
| Contrast-adjusted tokens | Brand hues stay recognisable while small text, feedback and status pairs meet the AA target. |
| Semantic light/dark palettes instead of per-component overrides | Every screen, modal and toast changes together, and a missing token is obvious during review. |
| Theme mode persisted before first paint | The app waits for the stored value, so a dark-mode user never sees a light flash on launch. |
| `createThemedStyles` factories at module level | Styles stay pure and re-run only when the palette changes, instead of being rebuilt on every render. |
| One breakpoint hook for every screen | Home, Search, Details, forms and navigation cannot disagree about when the layout switches. |
| Sidebar as a custom `tabBar` on the existing navigator | Reuses the same routes and state on desktop without a second navigation tree. |
| One `AppButton` with variants and sizes | Button colour, state and accessibility behave the same everywhere; accent stays reserved for the main CTA. |
| Category colours as palette tokens | Chips and placeholders get per-category identity that still passes contrast in both modes. |
| Plain-text demo passwords | The mock DB is inspectable on purpose; **never** do this in production. |

---

## Delivery and release (Phase 6)

```
app.json                  identity, icons, versionCode/buildNumber
   ↓
eas.json                  internal preview profile → APK
   ↓
EAS Build (cloud)         installable artefact
   ↓
demo phone / submission   Expo Go remains the primary live-demo path
```

The runtime architecture does **not** change in Phase 6. Delivery adds:

- `eas.json` with an internal `preview` profile (`android.buildType: "apk"`) and
  a production profile with automatic version increments;
- `android.versionCode: 1` and `ios.buildNumber: "1"` in `app.json`;
- `npm run build:preview`, `npm run export:web` and `npm run db:reset` scripts;
- `server/db.seed.json` as the clean 4-user / 18-listing / 6-category baseline,
  restored by the inline `db:reset` command;
- web metadata (`web.description`, `themeColor`, `lang`) and `public/robots.txt`
  so the static export passes the SEO checks;
- web-preview screenshots, a timed demo script and a submission checklist.

`EXPO_PUBLIC_API_URL` is compiled into the JavaScript bundle. A standalone APK
therefore needs the demo machine's LAN URL at build time; otherwise it uses the
bundled fallback for reads and cannot post or sign up. The lack of a deployed
backend is an honest MVP limitation, not something the build step can fix.

No APK was produced in this workspace: there is no signed-in Expo account and no
Android SDK. The EAS profile is configuration only until the team runs
[`BUILD_AND_RELEASE.md`](BUILD_AND_RELEASE.md).
