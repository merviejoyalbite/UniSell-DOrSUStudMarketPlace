# UniSell — Submission Checklist

Use this as the final gate before the hackathon submission. Tick items only after
they have actually been run on the submission machine or demo phone.

**Legend:** `[x]` verified in this workspace · `[ ]` still requires a human/device
check · **BLOCKED** requires an account, device or external service.

---

## 1. Required deliverables

- [x] Source code in `unisell/` with React Native + Expo + TypeScript.
- [x] `README.md` with setup, demo accounts, flows, architecture and troubleshooting.
- [x] `AI_DISCLOSURE_LOG.md` with one entry per phase and honest review status.
- [x] `PITCH_DECK_OUTLINE.md` with a 5–7 minute story and demo path.
- [x] `docs/ARCHITECTURE.md`, `docs/CODE_WALKTHROUGH.md`, `docs/ACCESSIBILITY.md`,
      `docs/TESTING.md`.
- [x] `docs/DEMO_SCRIPT.md` with pre-flight, timing, fallback and cleanup.
- [x] `docs/BUILD_AND_RELEASE.md` with EAS preview instructions.
- [x] `server/db.json` and `server/db.seed.json` at 4 users / 18 listings / 6 categories / 6 reservations / 6 notifications / 6 chats / 16 messages / 1 review.
- [x] `eas.json` preview APK profile and Android/iOS identifiers in `app.json`.
- [ ] Real team names and roles in `README.md` and the pitch deck.
- [ ] Final slide deck built from `PITCH_DECK_OUTLINE.md`.
- [x] Nine web-preview screenshots (390 × 844) added to `docs/screenshots/` and
      linked from the README; they are explicitly labelled as web captures.
- [ ] Phone screenshots captured and substituted if the rubric requires on-device
      evidence.
- [ ] Preview APK built/downloaded and attached to the submission.

**APK status: BLOCKED in this workspace.** The EAS configuration is ready, but no
Expo account is signed in and no Android SDK is installed. See
[`BUILD_AND_RELEASE.md`](BUILD_AND_RELEASE.md). Do not claim an APK exists until
the EAS build finishes.

---

## 2. Commands to run on the submission machine

```powershell
cd path\to\unisell
npm install
npm run typecheck
npm run export:web
npm run db:reset
```

Expected results:

- [x] `npm install` completes without a dependency error.
- [x] `npm run typecheck` prints no errors.
- [x] `npm run export:web` completes and creates `dist/` (ignored by git).
- [x] `npm run db:reset` restores 4 users / 18 listings / 6 categories /
      6 reservations / 6 notifications / 6 chats / 16 messages / 1 review.
- [x] `npm run api` serves `http://localhost:3001/listings`.
- [x] `npm start` opens Expo; pressing `w` opens the web preview.

Re-run all four on the actual submission machine if it is not this laptop.

---

## 3. Functional smoke test

### Authentication

- [x] Empty login shows both validation messages.
- [x] A non-DOrSU email is rejected.
- [x] Wrong password shows a friendly error and stays on Login.
- [x] `mika.santos@dorsu.edu.ph` / `unisell123` signs in.
- [x] A reload restores the session and opens Home.
- [x] Log out clears the session and returns to Welcome.
- [ ] Sign-up on the demo phone with the keyboard open.
- [ ] Seeded login with the API intentionally offline.

### Browse and save

- [x] Home shows 18 listings and six category chips.
- [x] A category chip narrows the feed and updates the count.
- [x] Search matches title/description/seller/meet-up text.
- [x] Category and condition filters combine correctly.
- [x] No-match state appears and **Clear filters** restores the feed.
- [x] Listing Details shows price, seller, status and meet-up copy.
- [x] Saving from a card and from Details agree.
- [x] Saved items survive a reload via AsyncStorage.
- [x] Removing the last saved item shows the Saved empty state.
- [ ] Offline banner and pull-to-refresh on a physical phone.
- [ ] Deliberate HTTP-500 **Try again** state (still pending from Phase 3).

### Post a listing

- [x] Empty submit shows all required field errors.
- [x] Price `0` is rejected.
- [x] A valid post writes through json-server, appears first in Home and opens
      its Details screen.
- [x] The new post persists after a reload while the API is running.
- [x] The post fails cleanly with the API off; the draft remains.
- [ ] Double-tap **Publish** check on a slow connection.
- [ ] Phone keyboard/multiline/picker layout check.
- [ ] Restore the database after the live demo (`npm run db:reset`).

### Profile

- [x] Verified profile card shows avatar, name, course · year, email and the
      reviews / items sold / listings stats; the full student ID is not shown.
- [x] My listings count and rows match the signed-in student.
- [x] A row opens the real Listing Details screen.
- [x] Saved stat changes when an item is saved/removed.
- [x] Empty state and **Post your first item** open the Sell tab.
- [ ] Phone layout at large system font size.
- [ ] Profile error/retry branch triggered with a real failure.

### Seller ownership and sold lifecycle (Phase 7)

- [x] `canManageListing(user, listing)` gates every owner control in Listing
      Details, Profile > My listings and the edit form.
- [x] `createListing` sets `sellerId` and the seller snapshot from the session.
- [x] Every PATCH/DELETE reloads the listing and compares `sellerId` with the
      persisted session before writing.
- [x] Home hides sold items; Search has **Show sold items** off by default.
- [x] Profile has Active / Sold / All filters, an owner “…” menu and
      **Delete all sold listings (N)** with a count confirmation.
- [x] Deleting removes the id from the feed and from Saved; a missing listing
      shows **This listing is no longer available**.
- [x] Edit mode prefills the Post Listing form, keeps `createdAt` and adds
      `updatedAt`; sold listings are blocked.
- [ ] Two-account owner/non-owner pass on a phone (see `docs/TESTING.md` §1–5).
- [ ] Status confirmation copy and loading states on a slow connection.

### Profile editing (Phase 7)

- [x] **Edit profile** updates name (2–60), course, year level and photo through
      `PATCH /users/:id`, then persists the session in AsyncStorage.
- [x] Email and student ID are read-only with a lock and the helper **Contact
      your school office to change this**; Profile masks the ID until **Show**.
- [x] Optional password change validates the current password, 8+ characters, a
      different new password and a matching confirmation.
- [x] Seller name/course/year are refreshed on the user's listings after a save.
- [ ] Camera/gallery photo, Remove photo and initials fallback on a phone.
- [ ] Discard-changes dialog, disabled Save and wrong-current-password error on a
      device.

### Reservations, dashboard, notifications, messages and reviews (Figma Phase 3)

- [x] A buyer can reserve a listing with date/time/spot, see the pending card and
      cancel it; the seller receives the request.
- [x] The seller dashboard lists requests, accepts/declines, opens the item and
      marks it sold; accepted requests stay accepted after the sale.
- [x] Buyers cannot accept/decline and sellers cannot reserve their own listing;
      the service layer repeats both checks.
- [x] Notifications are one row per recipient, with unread dots, Today/Earlier,
      **Mark all as read**, and targets for listing/dashboard/review/shop.
- [x] Lifecycle notifications are best-effort and never block the action.
- [x] **Message seller** creates or reuses one thread per listing + buyer; the
      inbox shows unread dots and the chat marks incoming messages read.
- [x] Chat ownership rejects students who are not the buyer or seller; quick
      replies send immediately.
- [x] A completed sale can be reviewed by both parties once (1–5 stars, four
      tags, optional 200-character comment); duplicates and self-reviews are
      rejected.
- [x] The thanks panel waits for **Return to previous screen**; Profile stats,
      My reviews and Seller shop reviews update from the saved review.
- [x] Review list failures show `—` / `★ —` / an error banner with retry.
- [ ] Observe the 10-second chat poll with two live sessions on a phone.
- [ ] Reserve date/time pickers and the review star picker with a screen reader.

---

## 4. Accessibility and quality

- [x] Header roles, tab labels, icon-button labels, picker labels and spinner labels.
- [x] Search result count is a polite live region.
- [x] Card open and heart actions have separate accessible labels.
- [x] Review stars are a labelled radiogroup, review tags are checkboxes, and
      dashboard/profile segments are tab lists with selected state.
- [x] Unread notifications say **· New** and the bell label includes the count;
      chat controls and quick replies are labelled.
- [x] Small controls have `hitSlop`; key targets aim for about 44 × 44 px.
- [x] Muted/status/feedback colours pass the documented AA contrast pairs.
- [x] Lighthouse Accessibility 1.0 on Home, Profile, Search and Post in the web preview.
- [x] Static production export (Welcome page) scored Accessibility 1.0,
      Best Practices 1.0 and SEO 1.0 with no reported failures.
- [ ] TalkBack on Android and VoiceOver on iOS.
- [ ] Largest system font and landscape on the demo phone.
- [ ] Keyboard-only web pass for pickers and focus order.
- [x] Unused placeholder screen removed; shared status-colour helper in place.
- [x] `server/db.json` has no test users/listings from this session.

Accessibility is a documented focused pass, **not** a formal WCAG certification.
Keep that wording in the pitch and README.

---

## 5. Data, security and honesty

- [x] Demo passwords are plain text only in the mock database and documented.
- [x] The persisted session stores the safe user object, not the password.
- [x] The seller identity comes from the session, not editable form fields.
- [x] Reservations, notifications, chats and reviews repeat the session check in
      their API services (buyer/seller/recipient/reviewer only).
- [x] Notifications are one row per recipient; mark-all-read only touches the
      signed-in student's rows.
- [x] Reads use bundled JSON only for network failures; HTTP errors surface.
- [x] Writes have no offline fallback.
- [x] Favorites are documented as device-wide for the MVP.
- [x] The mock server does not authenticate writes; this is documented.
- [x] AI disclosure does not claim human edits that did not happen.
- [ ] Team reviews every file and can explain the data flow without notes.
- [ ] Decide whether to keep the demo plain-text password story or replace the
      mock auth with a hashed local-only scheme.

---

## 6. Pitch and submission

- [ ] Title slide has real team names, members, date and SDG 12.
- [ ] Problem/persona/journey match the live demo.
- [ ] Three value props are visible before the technical slide.
- [ ] Architecture diagram matches `docs/ARCHITECTURE.md`.
- [ ] Demo script rehearsed once end to end with a timer.
- [ ] Fallback plan rehearsed with the API stopped.
- [ ] AI disclosure slide points to the real log.
- [ ] Final APK link/file name recorded in this checklist.
- [x] Web-preview screenshot links checked in the README.
- [ ] README links checked again after any phone screenshot replacement.
- [ ] Repository or archive includes source, docs and seed data, but not
      `node_modules`, `dist`, `.expo`, `.env` or build artifacts.

---

## 7. Final cleanup

Stop both dev servers first so json-server releases `server/db.json`, then:

```powershell
npm run db:reset
```

- [x] Database restored to 4 users / 18 listings / 6 categories / 6 reservations /
      6 notifications / 6 chats / 16 messages / 1 review.
- [x] Browser session and `unisell.favorites` cleared.
- [x] Dev servers stopped.
- [ ] Phone session/favorites cleared if the device is shared.
- [x] Web-preview screenshot files copied and linked.
- [ ] Final archive created and opened once from a clean folder.
