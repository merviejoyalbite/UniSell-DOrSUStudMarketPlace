# UniSell — Code Walkthrough

This document explains how data moves through the app. It is written for the
oral defense: each section answers “what happens when the user does X?”

> **Status:** the original build phases (auth → browse → post → profile →
> ownership) are implemented, and the Figma-alignment Phase 3 added reservations,
> the seller dashboard, notifications, messages/chat and reviews. Typecheck
> passes. The preview APK and physical-phone checks are still pending.

---

## 1. The big picture

```
Screen
  → calls a function from a Context provider (useAuth / useListings /
    useReservations / useNotifications / useMessages / useReviews)
    → provider calls the API service (authApi / listingsApi / reservationsApi /
      notificationsApi / messagesApi / reviewsApi)
      → apiClient sends fetch() to json-server
        → json-server reads/writes server/db.json
  ← data returns → reducer updates state → screen re-renders
```

Two rules keep the code easy to explain:

1. **Screens never call `fetch` directly.** They only read context and call
   context actions.
2. **Context never builds URLs.** It calls typed functions in `src/api/`.

---

## 2. Why each library exists

| Library | Responsibility | Where |
| --- | --- | --- |
| `expo` | Build/runtime for React Native, Expo Go support | project root |
| `@react-navigation/native` + `native-stack` | Screen-to-screen navigation | `src/navigation/RootNavigator.tsx` |
| `@react-navigation/bottom-tabs` | Home / Search / Sell / Saved / Profile shell | `src/navigation/MainTabs.tsx` |
| `react-native-screens` + `react-native-safe-area-context` | Native screen optimisation + notch-safe layout | `App.tsx`, `ScreenContainer` |
| `@react-native-async-storage/async-storage` | Persist the session and favorites | `src/utils/storage.ts` |
| `@expo-google-fonts/poppins` + `expo-font` | Load the Figma font | `App.tsx` |
| `@expo/vector-icons` | Ionicons used across the UI | components |
| `json-server` (dev) | Fake REST API from `server/db.json` | `npm run api` |

---

## 3. Phase 1 — what exists today

### 3.1 App start

1. `index.ts` registers `App.tsx`.
2. `App.tsx` loads the four Poppins weights.
3. While fonts load, a plain brand-coloured view is shown (no flash of
   unstyled text).
4. `SafeAreaProvider` → `AuthProvider` → `ListingsProvider` → `RootNavigator`.
5. `AuthProvider` starts in status `loading` and reads the saved session.
6. While restoring, `RootNavigator` shows a branded loading screen.
7. With a session it opens **Main**; without one it opens **Welcome**.

### 3.2 Navigation shell

- `RootStackParamList` in `src/navigation/types.ts` lists every root route and
  its params. TypeScript fails the build if a screen navigates to a missing
  route.
- Bottom tabs use `MainTabParamList`.
- `RootNavigator` renders one of two groups based on auth status:
  - signed in → `Main` (tabs) + `ListingDetails`;
  - signed out → `Welcome` + `Login` + `SignUp`.
  Because the groups are conditional, logging in or out swaps the whole stack
  automatically. There is no manual `navigate('Main')` after login.
- Every MVP route has a real screen; there are no placeholder screens left.

### 3.3 API service

`src/api/apiClient.ts`

- `API_BASE_URL` picks `10.0.2.2` on Android emulators and `localhost`
  elsewhere, unless `EXPO_PUBLIC_API_URL` is set.
- Every request has a 6-second `AbortController` timeout.
- Failures are normalised into `ApiError` with a human-readable message.

`src/api/listingsApi.ts`

- `getListings()` tries `GET /listings` and returns `{ listings, source }`.
  - Unreachable server / timeout → bundled `src/data/listings.json` with
    `source: "fallback"`.
  - A real HTTP error (for example a 500) is re-thrown so the provider can show
    the retry state.
- `createListing()` posts a new listing with `status: "available"` and a
  `createdAt` timestamp. A failed write is surfaced — there is no offline write
  fallback.

`src/api/authApi.ts`

- `loginWithEmail()` queries `/users?email=...`, compares the demo password,
  and strips the password before returning the user. If json-server is
  unreachable it falls back to the bundled demo users; HTTP errors such as 401
  are still returned as errors.
- `signUpWithEmail()` validates the `@dorsu.edu.ph` domain and password again
  (defence in depth), rejects an existing email, and creates a new user.

> Security note for the defense: the mock server stores plain-text passwords
> on purpose so the demo is inspectable. A real deployment must hash passwords
> on a server, never in the app.

### 3.4 Theme

`src/theme/` exports tokens only. No screen hard-codes a colour or font name.
Changing the brand colour in one file updates the whole app.

### 3.5 Mock data

`server/db.json` has three collections:

- `users` — 4 verified DOrSU students.
- `categories` — the six MVP categories.
- `listings` — 18 items with seller snapshots (name, course, year) so the feed
  does not need a second request.

`src/data/` holds copies of the same data for offline reads.

---

## 4. Phase 2 — Authentication

### 4.1 Log in

1. The student types a school email and password on `LoginScreen`.
2. On submit, `validateSchoolEmail()` and `validatePassword()` run. Errors are
   shown under the field; the request is not sent until both pass.
3. `AuthContext.signIn()` calls `loginWithEmail()`.
4. `loginWithEmail()` requests `/users?email=...`. If the server is down, it
   reads the same records from `src/data/users.json` instead.
5. The password is compared in the mock API; a mismatch throws
   `ApiError('Incorrect email or password.', 401)`.
6. On success, `AuthContext` saves the safe user object and sets
   `status = "signedIn"`.
7. `RootNavigator` replaces the auth stack with the Main tabs. No extra
   navigation call is needed.

### 4.2 Sign up

- `SignUpScreen` collects email, full name, student ID, course, year level,
  password and confirmation.
- Course and year level use `SelectField`, a small custom modal picker (no extra
  dependency).
- `validate()` checks every field and only calls `signUp()` when the form is
  valid.
- One subtle bug found during browser testing: an early version returned
  `Object.keys(next).length === 0`, but `next` always had `email`, `password` and
  `studentId` keys even when their values were `undefined`. The form therefore
  never submitted and showed no error. The fix checks the values instead:
  `Object.values(next).every((message) => !message)`.
- `signUpWithEmail()` repeats the domain and password checks on the API side,
  rejects duplicates, then `POST /users`. The new record is written to
  `server/db.json`.
- Successful sign-up signs the student in immediately.

### 4.3 Session restore and logout

- `src/utils/storage.ts` wraps AsyncStorage with `loadSession`, `saveSession`
  and `clearSession`. The key is `unisell.session`.
- On app start, `AuthProvider` restores the user once, then the navigator
  chooses the correct stack.
- Only the safe user object is persisted — never the password.
- `ProfileScreen` shows the account and provides the required logout action.
  `signOut()` clears storage and sets `status = "signedOut"`, so the auth stack
  returns. Phase 5 later added My Listings and the accessibility pass around the
  same sign-out action.

Questions to be able to answer:

- Where is the session stored? → AsyncStorage key `unisell.session`, via
  `src/utils/storage.ts`.
- What happens on a wrong password? → `ApiError` message shown in the error
  banner; the session is unchanged.
- Why does the app not flash Welcome for a signed-in student? → status starts as
  `loading` and a branded loading screen is shown until restore finishes.
- Why is the password not saved? → It is only needed for the login request; the
  persisted user object is safe to restore.
- What if json-server is off during the demo? → Seeded accounts still log in
  with the bundled fallback; sign-up needs the server.

---

## 5. Phase 3 — Browse and search

### 5.1 Loading the feed

`src/context/ListingsContext.tsx` owns the browse state:

| Field | Meaning |
| --- | --- |
| `listings` | Cards currently loaded (newest first). |
| `status` | `idle` → `loading` → `ready` or `error`. |
| `source` | `api`, `fallback`, or `null` before the first load. |
| `error` | Human-readable message for the error banner/state. |
| `favorites` | Saved numeric listing ids. |
| `refreshing` | True during pull-to-refresh; keeps the cards visible. |

The provider exposes `refresh()`, `toggleFavorite()` and `publishListing()`.
It loads once when it mounts:

1. `refresh()` dispatches `LOAD_START`.
2. `getListings()` returns live data or the bundled fallback.
3. Success dispatches `LOAD_SUCCESS`; failure dispatches `LOAD_ERROR`.
4. Pull-to-refresh calls `refresh({ silent: true })`, which dispatches
   `REFRESH_START` instead of replacing the feed with a spinner.

If an HTTP error happens while cards are already on screen, the reducer keeps
`status: "ready"` and stores the error, so the feed stays usable and an inline
banner appears.

### 5.2 Home feed

`HomeScreen` is a two-column `FlatList` whose header contains:

- the student greeting and profile avatar;
- a search shortcut that opens the Search tab;
- category chips (`FilterChip` + `categoryMeta` icons);
- the section title, item count and “See all” link;
- the offline banner when `source === "fallback"`.

`ListingCard` shows the price, title, meet-up spot, category, condition and
relative date. If a listing has no usable image, `ListingImage` renders a
tinted category icon instead of a broken photo. Seeded sample illustrations get
a **Sample image** badge, and a small camera icon appears only when the cover
photo came from the camera. Reserved and sold items get a status badge. The
heart is a **sibling** of the card press target, not a nested Pressable; nested
interactive elements are invalid on the web and this also keeps “open card” and
“save item” as separate actions.

### 5.3 Search and filters

`SearchScreen` keeps three pieces of local state: `query`, `category` and
`condition`. Every change runs `filterListings()` from
`src/utils/listings.ts`:

- keyword is matched against title, description, category, seller and meet-up
  spot;
- category and condition are exact matches;
- no request is made because the mock catalogue is small.

`EmptyState` covers “no matches” with a **Clear filters** action. The same
components render loading, error and offline states as on Home.

### 5.4 Listing details

Tapping a card pushes `ListingDetails` with `{ listingId }`. The screen:

1. finds the listing in context;
2. shows a spinner while the feed is still loading;
3. shows the retry state for an HTTP error;
4. shows “Listing unavailable” if the id is gone;
5. otherwise renders the category hero, price, badges, meet-up spot, seller
   card, description and a safe meet-up tip.

The heart in the top-right and the bottom **Save this item** button call the
same `toggleFavorite(id)`, so they always agree.

### 5.5 Favorites and persistence

- `src/utils/storage.ts` adds `loadFavorites` / `saveFavorites` around the
  AsyncStorage key `unisell.favorites`.
- On mount, the provider reads the array and dispatches `SET_FAVORITES`.
- A `favoritesReady` ref prevents the initial empty array from overwriting saved
  ids before the read finishes.
- After that, every `favorites` change is written back in an effect.
- The Saved tab maps ids back to current listings, so deleted listings simply
  disappear.

The key is device-wide for the MVP. If two students share one phone they share
favorites; scoping the key by user id is a future improvement.

### 5.6 Questions to be able to answer

- What happens when the API is down? → Network failures use the bundled JSON and
  show the offline banner; an HTTP error shows the retry state.
- Why filter in the app? → The mock catalogue is tiny; a pure function is instant
  and easy to test. A production catalogue would filter on the server.
- How do saved items survive a reload? → `toggleFavorite` updates context, an
  effect writes `unisell.favorites`, and the provider restores it on mount.
- Why does the heart not open the card? → It is a separate sibling Pressable,
  not a child of the card button.
- What if a saved listing is removed? → The Saved screen filters ids against the
  current listings and shows the unavailable state if none remain.

---

## 6. Phase 4 — Post a listing

### 6.1 Form and validation

`PostListingScreen` keeps the draft in local state because it belongs to one
screen:

| Field | Input | Rule |
| --- | --- | --- |
| Title | `FormField` | required, 4–80 characters |
| Price | `FormField`, number pad | digits only, greater than zero, up to six digits |
| Category | `SelectField` | one of the six categories |
| Condition | `SelectField` | New or Used |
| Meet-up spot | `SelectField` | one of the fixed campus spots in `MEETUP_SPOTS` |
| Description | multiline `FormField` | required, at least 10 characters, max 500 |

`validateForm()` is a pure function at the top of the screen file. It reuses the
same helpers as the auth forms: `validateTitle`, `validatePrice`,
`validateRequired` and `validateDescription`. Category and condition only need a
presence check. Submission stops when
`Object.values(errors).some(Boolean)` is true.

Changing a field clears that field's error, and any old API error, so the form
does not keep stale messages. The photo section accepts 1–3 photos from either
source: **Take photo** uses `launchCameraAsync`, and **Choose from gallery**
uses `launchImageLibraryAsync` with multiple selection limited to the remaining
slots. Each source explains its permission before the system prompt and leaves
the other source usable if access is denied. Every photo is auto-oriented,
resized to at most 800px wide, compressed to JPEG, recompressed at a lower
quality if it is still over about 300KB, and stored as a
`data:image/jpeg;base64,...` URI. `images` keeps the order,
`imageSources` records `camera`/`gallery` per photo, and **Make cover** reorders
the array.

### 6.2 Publishing

1. The student taps **Publish listing**.
2. The screen builds a `NewListingInput` using the signed-in `user` from
   `AuthContext` for `sellerId`, `sellerName`, `sellerCourse` and
   `sellerYearLevel`. The seller fields are not editable.
3. `ListingsContext.publishListing()` calls `createListing()`.
4. `createListing()` sends `POST /listings` with `status: "available"`,
   `createdAt`, `image: images[0]`, the ordered `images` array and the matching
   `imageSources` array.
5. json-server assigns the numeric id and writes `server/db.json`.
6. The reducer handles `ADD_LISTING`: it removes any card with the same id and
   puts the new listing first.
7. A silent `GET /listings` runs to reconcile ids and ordering with the server.
8. The form resets and the app opens `ListingDetails` for the new listing.

Every screen reads the same context, so Home, Search and Saved already know
about the item when the student navigates back. The silent refresh protects
against a race where the first feed request started before the post and returned
an older snapshot.

### 6.3 Failure handling

- A failed POST throws before `ADD_LISTING`, so no fake card is created.
- The screen catches the error and shows `ErrorBanner` above the publish button.
- The draft stays intact, so the student can start the API and retry.
- Writes have no bundled fallback; only reads can use `src/data/`.
- The mock server does not authenticate the write. Validation and seller
  identity are client-side in this MVP; a production backend would enforce both.

### 6.4 Questions to be able to answer

- Where is the new listing stored? → `POST /listings` in json-server, persisted
  in `server/db.json`.
- Why does Home update without another manual refresh? → `ADD_LISTING` updates
  the shared `ListingsContext`; all subscribed screens re-render.
- Why the extra GET after the POST? → To reconcile the feed with the server and
  avoid a stale snapshot/duplicate after the immediate insert.
- What happens if the API is down? → The POST fails, an inline error appears and
  the draft remains; the app never pretends the listing was saved.
- Why are seller details copied into the listing? → The feed and details render
  without a join request; acceptable for the seeded MVP.
- Why can photos come from the camera or gallery? → Sellers may already have a
  clear photo of the item, or may prefer to take one in the moment. Photos are
  compressed to base64 data URIs in the mock DB; a production system would
  upload them to cloud storage.
- How does the UI know where a photo came from? → `imageSources` is aligned with
  `images`. Details shows **Taken with camera** or **From gallery** per photo,
  and the feed shows a camera icon only when the cover came from the camera.

---

## 7. Phase 5 — Profile, accessibility and cleanup

### 7.1 Profile reads two existing providers

`ProfileScreen` is still the fourth tab; it was expanded rather than split into a
new route. It needs no new API function:

1. `useAuth()` supplies `user` and `signOut()`.
2. `useListings()` supplies the shared feed, favorites, load flags and
   `refresh()`.
3. The screen returns `null` if the session has no user (the root navigator
   normally prevents this state).
4. `myListings` is `listings.filter((listing) => listing.sellerId === user.id)`.
5. The same array feeds the summary count and the compact rows.
6. A row navigates to `ListingDetails` with the listing id, exactly like a feed
   card.

`StatCard` is read-only and exposes one combined accessible label, for example
“4 my listings”. `MyListingRow` uses category art, price, status and relative
date, then adds a chevron and a full “Open your listing …” label.

### 7.2 Why there is no My Listings endpoint

The shared context already owns every listing, including the one just published.
Filtering by the signed-in student is instant and avoids a second cache that
could disagree with Home. The count also updates without a refetch:

```
Publish succeeds
  → ADD_LISTING updates ListingsContext
    → Profile's filter recomputes
      → count + rows show the new listing
```

A production API might add `GET /users/:id/listings` for pagination, but the mock
catalogue is small enough that a client-side filter keeps the demo honest and
easy to explain.

### 7.3 Profile states

| Condition | Rendering |
| --- | --- |
| `status` is `idle` or `loading` | Account card appears; stat value is `—`; a labelled spinner says “Loading your listings…”. |
| `status === "error"` with no listings | Error card shows the API message and **Try again**, wired to `refresh()`. |
| Error with cached listings | Inline `ErrorBanner`; existing rows remain usable. |
| `source === "fallback"` | `OfflineBanner` above the account card. |
| Feed ready, zero own listings | Empty card with **Post your first item** → `Post` tab. |
| Feed ready, one or more own listings | Rows plus **Post new** → `Post` tab. |
| Logout pressed | Button shows “Logging out…” and disables while `signOut()` runs. |

The safety card is copy, not a fake settings control. Ratings, profile editing
and chat were left out rather than adding buttons that do nothing.

### 7.4 Accessibility changes

The full notes and contrast table are in
[`ACCESSIBILITY.md`](ACCESSIBILITY.md). The code changes worth explaining:

- **Headers:** Home, Search, Profile and section titles use
  `accessibilityRole="header"`.
- **Explicit tab names:** `MainTabs` adds labels for every tab. The centre Sell
  label is visually hidden because the orange FAB replaces it, but screen readers
  still announce “Sell — post a listing”.
- **Separate card actions:** `ListingCard`’s card button says “Open …” and the
  heart says “Save …” or “Remove … from saved”. The heart remains a sibling of
  the card press target.
- **Live search count:** the result count on Search is a polite live region, so a
  screen reader hears the new count after a chip or query change.
- **Spinners:** `LoadingState` and the Profile section spinner have accessible
  labels; the visual message is not the only cue.
- **Touch targets:** chips, the card heart, details circles, password reveal,
  clear search and Profile’s **Post new** use `hitSlop` to reach about
  44 × 44 px.
- **Contrast:** `colors.ts` darkens muted text, danger/warning, available,
  reserved and sold colours. Category accents in `categoryMeta.ts` were darkened
  against their tints. Brand teal and orange are unchanged.

The UI now uses `getStatusColor()` from `src/utils/listingStatus.ts` so the feed,
details and Profile all choose the same status colour. The unused
`src/components/PlaceholderScreen.tsx` was deleted.

### 7.5 Questions to be able to answer

- Why is Profile not a new route? → It is a tab with account data and a filtered
  view of shared state; a separate route would add navigation without adding a
  new data source.
- Why is there no `GET /my-listings`? → `ListingsContext` already holds the feed,
  and a client-side `sellerId` filter stays consistent after `ADD_LISTING`.
- How does a new post update Profile? → `ADD_LISTING` changes the shared array;
  the `myListings` filter and count recompute on the next render.
- What happens while the feed loads? → The account card still renders, counts
  show `—`, and the section shows a labelled spinner.
- What happens if loading fails? → With no rows, the section offers **Try again**
  and calls `refresh()`; with cached rows, an inline banner appears.
- Is the app WCAG compliant? → No formal claim. Phase 5 covers labels, touch
  targets and key contrast pairs; TalkBack/VoiceOver and large-text phone checks
  remain.
- Why were colours changed? → Small muted/status/feedback copy needed contrast;
  the brand hues were preserved.

---

## 8. Phase 7 — Ownership, sold lifecycle and profile editing

### 8.1 The ownership check

The UI asks one question before rendering any seller control:

```ts
canManageListing(user, listing) // src/utils/permissions.ts
```

It is true only when `listing.sellerId === user.id`. `ListingDetails` uses it to
show the owner action stack or the buyer Save button. `Profile` uses it to build
My listings. The Post Listing screen uses it in edit mode.

The service layer repeats the check because a route param or stale screen is not
trusted:

```ts
// src/api/listingsApi.ts
async function assertOwner(id, action) {
  const [user, listing] = await Promise.all([
    getSessionUser(),      // loadSession() from AsyncStorage
    loadListingForWrite(id), // GET /listings/:id, no bundled fallback
  ]);
  if (!canManageListing(user, listing)) {
    throw new ApiError(
      action === 'edit' ? EDIT_OWNERSHIP_ERROR : OWNERSHIP_ERROR,
      403,
    );
  }
  return listing;
}
```

`createListing` overwrites `sellerId` and the seller snapshot from the session,
so a form can never choose the owner.

### 8.2 Owner actions in Listing Details

```
Mark as sold
  → Alert “Mark this item as sold?”
    → ListingsContext.updateListingStatus(id, "sold")
      → listingsApi.updateListingStatus → assertOwner
        → PATCH /listings/:id { status: "sold", soldAt, updatedAt }
      → dispatch UPDATE_LISTING
      → silent refresh
      → “Marked as sold” toast

Delete
  → Alert (status-specific copy)
    → ListingsContext.deleteListing(id)
      → listingsApi.deleteListing → assertOwner
        → DELETE /listings/:id
      → dispatch REMOVE_LISTINGS
        → removes the card and the Saved id
      → “Listing deleted” toast
      → navigation.goBack()
```

`pendingAction` disables every owner button while a request runs. A failure keeps
the screen usable, shows `ErrorBanner`, and stores the last action so **Try
again** can repeat it.

### 8.3 Edit mode reuses the Post Listing form

`ListingDetails` navigates to `Main → Post` with `{ listingId }`. The form:

1. finds the listing in `ListingsContext`;
2. waits for the feed if it is still loading;
3. blocks a non-owner with **You can only edit your own listings** and goes back;
4. blocks a sold listing with **Sold listings cannot be edited…**;
5. prefills title, price, category, condition, meet-up spot, description and
   existing photos once per listing id;
6. saves with `updateListing`, which PATCHes only editable fields, keeping
   `createdAt`, `sellerId` and the seller snapshot, and adding `updatedAt`;
7. shows **Save changes** and a **Cancel** action with a discard confirmation.

Seeded sample illustrations are labelled **Sample image** in edit mode. If every
remaining photo is still a sample, `imageType: "sample"` is preserved; replacing
one with a real photo clears it.

### 8.4 Sold visibility and deletion

- `HomeScreen` filters `status !== "sold"` before category filtering.
- `filterListings(..., { includeSold })` powers Search; the **Show sold items**
  checkbox starts unchecked.
- `ProfileScreen` derives `activeListings` and `soldListings` from the same
  array. The segmented control chooses which list to render, and the Sold view
  adds **Delete all sold listings (N)**.
- `REMOVE_LISTINGS` also filters `favorites`, so the current device's Saved list
  updates immediately. Other devices drop missing ids because Saved maps ids to
  the current feed. If a missing listing is opened, `ListingDetails` shows
  **This listing is no longer available**.

### 8.5 Profile editing

```
EditProfileScreen
  → local form + validateFullName
    → Save disabled until a value changes
      → useAuth().updateProfile({ name, course, yearLevel, photo })
        → authApi.updateProfile(user.id, input)
          → loadSession(); reject a different id
          → PATCH /users/:id
          → updateUserListingsSellerFields(...)
        → saveSession(updated) + AUTH_SUCCESS
      → refresh listings so seller cards show the new name
      → “Profile updated” toast + go back
```

- The photo picker uses camera or gallery, resizes to 400 px and compresses to a
  JPEG data URI. Remove stores `null` and the initials avatar returns.
- Email and student ID are read-only. Profile never displays the full student ID.
- `beforeRemove` opens **Discard changes?** when the form is dirty.
- `changePassword` checks the current plain-text mock password, requires at least
  8 characters, a different new password and a matching confirmation.

### 8.6 Questions to be able to answer

- Where is ownership enforced? → In the UI with `canManageListing`, and again in
  `listingsApi.assertOwner` before every PATCH/DELETE. The mock server itself has
  no auth, so production needs row-level security.
- Why load the listing before writing? → The screen's copy may be stale, and the
  server copy is the authoritative `sellerId`.
- Why hide sold items instead of deleting them? → Owners may need the record and
  buyers may have saved it. Hiding keeps the feed useful while My listings >
  Sold retains history.
- Why update seller fields on every listing after a profile save? → The feed is
  denormalized for fast rendering; bulk PATCH keeps cards self-contained without
  a join.
- Why does Save start disabled? → No-op writes are confusing; the button enables
  only when a field or photo differs from the session user.

---

## 9. Figma Phase 3 — reservations, notifications, messages and reviews

These features follow the same three layers as the rest of the app. Each context
loads the signed-in student's rows and each API service re-checks the session
before writing.

### 9.1 Reserve a listing

```
ReserveScreen (meet-up date, time, spot, optional note)
  → useReservations().createReservation(listingId, input)
    → reservationsApi.createReservation()
      → loadSession(); buyerId comes from the session
      → GET /listings/:id; reject if the session owns the listing
      → POST /reservations { listingId, buyerId, sellerId, snapshots, status: "pending" }
      → createNotificationSafely(seller, "Reserve request", target: "dashboard")
  → navigate back; ListingDetails renders the pending request card
```

`ReservationsContext` loads requests where the student is the buyer or seller,
so one provider feeds both Listing Details and the dashboard. Cancel is allowed
only for the buyer and only while the request is `pending`; accept/decline are
allowed only for the seller. The API compares the persisted session id with the
stored `buyerId`/`sellerId` before every PATCH.

### 9.2 Seller dashboard

```
SellerDashboardScreen
  → Requests: accept/decline → useReservations().updateReservationStatus()
  → My Listings / Sold: the same ListingsContext owner actions used elsewhere
  → Mark as sold → listingsApi.updateListingStatus()
      → notification to the accepted buyer (target: "review")
```

The dashboard is a root-stack screen opened from Profile → **Seller dashboard**
or the Seller shop's **Manage requests** link. It never takes a seller id from
the route; every row comes from the session-scoped contexts. Marking a listing
sold leaves the accepted reservation `accepted`, which is the signal the review
form uses.

### 9.3 Notifications

```
Lifecycle action (reserve/accept/decline/cancel/sold/review)
  → createNotificationSafely(recipient, …)
    → notificationsApi.createNotification()
      → POST /notifications { userId, title, detail, tone, target, listingId }
      → failure is swallowed: the main action still succeeds

NotificationsScreen
  → useNotifications().markAsRead(id) / markAllAsRead()
    → notificationsApi.markAsRead()
      → loadSession(); GET /notifications/:id; session.id must equal userId
      → PATCH { read: true }
  → tap also navigates by target:
      listing → ListingDetails
      dashboard → SellerDashboard
      review → Review
      shop → Profile tab with the shop panel
```

`unreadCount` is derived from the session-scoped feed. Home and the dashboard
bell render a dot only when it is above zero and include the count in the
accessibility label.

### 9.4 Messages and chat

```
ensureChat(listingId)
  → loadSession(); reject if the session is the seller
  → GET /chats?listingId=…; reuse the row where buyerId === session.id
  → otherwise POST /chats with listing/seller snapshots

ChatScreen
  → loadMessages(chatId)
    → GET /chatMessages?chatId=…
    → ownership: session.id must be chat.buyerId or chat.sellerId
  → opening marks incoming messages read (one `read` flag per message)
  → handleSend(text) → POST /chatMessages + PATCH /chats/:id { updatedAt }
  → setInterval(10 s) only while focused; cleared on blur/unmount
```

The inbox derives `lastMessage`, `lastMessageAt` and `unreadCount` from the
loaded threads, sorts by activity and shows a blue unread dot. Quick replies call
the same `handleSend` as the composer. There is no socket server; polling is the
honest demo substitute.

### 9.5 Reviews

```
getReviewTarget(listingId)
  → loadSession()
  → GET /listings/:id + GET /reservations?listingId=…
  → find a sold/completed reservation where the student is buyer or seller
  → reviewee = the other party; alreadyReviewed = existing review row

ReviewScreen
  → useReviews().addReview({ listingId, reservationId, rating, tags, comment })
    → reviewsApi.createReview()
      → re-check eligibility, self-review, duplicate and rating 1–5
      → POST /reviews
      → createNotificationSafely(reviewee, "New review received", target: "shop")
  → thanks panel stays until "Return to previous screen"
```

`ReviewsContext` loads `received` (revieweeId = session.id) and `submitted`
(reviewerId = session.id) lists. A list failure propagates so Profile can show
`—`, the shop rating `★ —` and an error banner with retry instead of claiming
zero reviews. Each party may review the other once per listing + reservation;
the review id is never taken from a form field.

### 9.6 Questions to be able to answer

- Why does each resource have its own context? → Each one has different
  ownership rules and refresh timing; keeping them separate stops one failed
  request from blanking the whole app.
- Why are notifications one row per recipient? → Reads become a simple
  `userId` check and each student controls their own feed.
- Why is a notification failure swallowed? → The reserve/accept/sold/review
  action already succeeded; the notification is a courtesy, not the transaction.
- Why does chat poll? → The mock API has no realtime transport, and polling only
  while focused keeps the demo responsive without pretending to have sockets.
- Why can both the buyer and seller review? → The trust signal runs both ways;
  uniqueness is per listing + reservation + reviewer, not per listing.
- Why does the thanks panel wait for a button? → Figma has a single action and no
  timer; an auto-return would flash the already-reviewed state.

---

## 10. How to trace a bug (works in every phase)

1. Find the screen in `src/screens/`.
2. Follow the handler to the context function in `src/context/`.
3. Follow the context to the API function in `src/api/`.
4. Check the request in the browser/terminal (`npm run api` logs it) or the
   fallback data in `src/data/`.
5. Fix the layer where the data is wrong — not the screen that displays it.
