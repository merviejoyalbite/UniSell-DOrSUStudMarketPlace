# UniSell — Manual Testing Checklist

This checklist covers **seller ownership, the sold lifecycle, edit mode, profile
editing and the Figma Phase 3 features** (reservations, the seller dashboard,
notifications, messages/chat and reviews). Run it against the mock API with two
accounts so the ownership rules are visible.

> **Important:** `json-server` has no authentication. The app and the API service
> layer enforce ownership for the demo, but a real backend must repeat the rule
> with tokens and row-level security. These tests verify the demo behaviour, not
> a security boundary.

---

## 0. Start from a clean state

1. Stop any running `npm run api` and Expo process.
2. Reset the mock data only if the last demo created test rows:

   ```powershell
   npm run db:reset
   ```

   This restores 4 users / 18 listings / 6 categories / 6 reservations /
   6 notifications / 6 chats / 16 messages / 1 review. It does not clear the
   device session or favorites.

3. Start the API:

   ```powershell
   npm run api
   ```

4. In a second terminal, start Expo:

   ```powershell
   npx expo start --clear
   ```

5. Run the static check:

   ```powershell
   npm run typecheck
   ```

   Expected: no TypeScript errors.

6. Prepare two sessions:
   - **Account A (seller):** `mika.santos@dorsu.edu.ph` / `unisell123`
   - **Account B (buyer):** `jun.reyes@dorsu.edu.ph` / `unisell123`
   - Optional seeded pair: **Ana** (`ana.delacruz@dorsu.edu.ph`, seller of
     listing 4) and **Carlo** (`carlo.mendoza@dorsu.edu.ph`, buyer with a
     completed request).

   On a phone, use Expo Go and the LAN URL. On the web preview, use
   `localhost:8081` only if the browser preview renders; the static export is the
   fallback.

---

## 1. Owner controls on Listing Details

| # | Steps | Expected |
| --- | --- | --- |
| 1.1 | Sign in as **A**. Post a new listing with 1–3 photos. Open it from Home. | Listing Details opens with the SOLD/Reserved status area and the seller card. |
| 1.2 | Inspect the bottom action area. | A sees the owner notice, **Mark as sold** (primary), **Mark as reserved**, **Edit listing** and **Delete listing** (red outline). A does **not** see **Save this item**. |
| 1.3 | Sign out, sign in as **B**, open A's listing. | B sees **Save this item**, **Reserve**, **Message seller** and the meet-up/safety info. No edit, delete, owner-reserve or sold controls exist. |
| 1.4 | As B, tap **Save this item**. | The item appears in B's Saved tab. |

## 2. Status lifecycle

| # | Steps | Expected |
| --- | --- | --- |
| 2.1 | As **A**, open the available listing → **Mark as reserved** → confirm. | Confirmation copy appears; after success the details screen shows a **Reserved** chip and a **Marked as reserved** toast. The item stays in Home. |
| 2.2 | Reopen the reserved listing. | Owner actions are **Mark as sold**, **Mark as available**, **Edit listing**, **Delete listing**. |
| 2.3 | Tap **Mark as available**. | The Reserved chip disappears; the item stays in Home/Search. |
| 2.4 | Tap **Mark as sold** → confirm “Mark this item as sold? Buyers will no longer be able to contact you about it.” | The listing shows a **SOLD** ribbon. It disappears from Home and Search (with **Show sold items** off). |
| 2.5 | Open **Profile > My listings > Sold**. | The sold listing is present with a SOLD chip and a visible delete shortcut. |
| 2.6 | Open **Search**, turn **Show sold items** on. | The sold listing appears. Turn it off; the listing disappears again. |
| 2.7 | As **B**, open Saved. | The sold item B saved still appears, with a full-width **SOLD** ribbon. |

## 3. Edit mode

| # | Steps | Expected |
| --- | --- | --- |
| 3.1 | As **A**, open an available or reserved listing → **Edit listing**. | The shared Post Listing form opens prefilled with title, price, category, condition, meet-up spot, description and existing photos. Header says **Edit listing**; primary button says **Save changes**. |
| 3.2 | Change the title and price → **Save changes**. | PATCH succeeds, **Listing updated** toast appears, Listing Details opens with the new values. `createdAt` is unchanged and `updatedAt` is set. |
| 3.3 | Open the same listing in Profile > My listings. | The updated title/price appears there too. |
| 3.4 | Try to edit a **sold** listing. | The app blocks it with **Sold listings cannot be edited. Mark it as available again first.** and goes back. |
| 3.5 | As **B**, deep-link or otherwise reach A's edit form. | The form is blocked with **You can only edit your own listings.** and returns. No PATCH is sent. |
| 3.6 | In edit mode, change a field then press back/Cancel. | **Discard changes?** appears. **Keep editing** stays; **Discard** leaves without saving. |

## 4. Delete and saved-list cleanup

| # | Steps | Expected |
| --- | --- | --- |
| 4.1 | As **A**, open an available listing → **Delete listing** → confirm. | Confirmation says “Delete this listing? It will disappear from the campus feed.” After success: **Listing deleted** toast, navigate back, item gone from Home/Search/Profile. |
| 4.2 | As **A**, open a sold listing → **Delete listing**. | Confirmation says **Delete this sold listing? This cannot be undone.** After success, the item is gone from My listings > Sold. |
| 4.3 | As **A**, delete all remaining sold rows with **Delete all sold listings (N)**. | Confirmation includes the exact count; after success all sold rows disappear and the counts update immediately. |
| 4.4 | As **B**, keep one of A's listings in Saved, then have A delete it. Refresh B's Saved tab. | The card drops silently; no broken card or crash. If B opens the stale details screen, it shows **This listing is no longer available**. |
| 4.5 | As **B**, post a listing and delete it. | B can delete their own listing. B still cannot edit/delete/reserve/sell any of A's listings. |

## 5. Ownership enforcement in the service layer

The UI hides controls, but the service layer must also reject a forced call.
With the API running, the following PowerShell check should return a 403-style
error message from the app when attempted through a stale screen or a temporary
test call. The exact request shape is intentionally simple:

```powershell
# Replace 1 with a listing id owned by a different account.
Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3001/listings/1" `
  -ContentType "application/json" `
  -Body '{"status":"sold"}'
```

`json-server` itself accepts the request because it has no auth. The app's
`listingsApi` is what rejects it before sending when the session does not own the
listing. To verify the app path:

1. Sign in as **B**.
2. Use a stale/deep link to A's edit form (or trigger an owner action through a
   temporary dev button).
3. Expected: **You can only edit your own listings.** / **You can only change
   your own listings.**, and no PATCH/DELETE in the API terminal log.

> This is why the README and `docs/ARCHITECTURE.md` say a real backend must
> enforce ownership server-side.

## 6. Profile editing

| # | Steps | Expected |
| --- | --- | --- |
| 6.1 | Sign in as **A** → **Profile** → **Edit profile**. | The form is prefilled with A's name, course and year level. Email and student ID are read-only with a lock and **Contact your school office to change this**. |
| 6.2 | Without changing anything, inspect **Save changes**. | Disabled. |
| 6.3 | Clear the name and type one character, then blur. | Inline error: name must be at least 2 characters. Save stays disabled or shows the error. |
| 6.4 | Change the name, course or year level → **Save changes**. | **Profile updated** toast; returns to Profile. The new name appears on Profile, Home's greeting, Posting as and the user's listing seller cards after refresh. |
| 6.5 | Add a photo with the camera (phone) or gallery. | Photo is resized to 400 px, compressed, and shown in the avatar. **Remove photo** restores the initials avatar. |
| 6.6 | Change a field, then press back. | **Discard changes?** appears; **Keep editing** keeps the draft, **Discard** leaves. |
| 6.7 | Open **Change password**. Enter a wrong current password, a new password of 8+ characters and a matching confirmation → **Update password**. | Inline error **Current password is incorrect.** |
| 6.8 | Enter the correct current password and a new password that matches the current one. | Inline error: new password must be different. |
| 6.9 | Enter the correct current password, a different 8+ character new password, and a mismatched confirmation. | Inline error: passwords do not match. |
| 6.10 | Enter valid values → **Update password**. | **Password changed** toast. Sign out and back in with the new password to confirm. |
| 6.11 | Check the student ID on Profile and Edit profile. | Profile never displays the full ID; Edit profile shows it read-only with the lock and helper. |
| 6.12 | As **B**, try to open A's profile edit screen through any route. | There is no user id in the route; the screen always edits the signed-in user. A forced `authApi.updateProfile` with another id is rejected with **You can only edit your own profile.** |

## 7. Regression checks

| # | Check | Expected |
| --- | --- | --- |
| 7.1 | Home category chips and pull-to-refresh. | Still filter and refresh; sold items stay hidden. |
| 7.2 | Search keyword, category and condition filters. | Still work; **Show sold items** is independent and off by default. |
| 7.3 | Saved persistence after reload. | Saved ids survive; sold saved items show SOLD; deleted saved items drop silently. |
| 7.4 | Post a new listing. | Appears immediately, owner controls appear for the creator, non-owners see only Save. |
| 7.5 | Log out. | Confirmation appears; session clears and Welcome shows. |
| 7.6 | Offline mock API. | Browsing falls back to bundled data; writes show a clear error and keep the draft. |

## 8. Accessibility spot checks

- Every icon-only button has a screen-reader label (back, heart, “…” menu,
  delete shortcut, chat send/back, mark-all-read).
- Status chips and the SOLD ribbon are announced as text, not only colour.
- Buttons show a disabled/loading state while a request runs.
- Form errors are announced through `accessibilityLiveRegion`/alerts.
- The review star picker is a labelled radiogroup with checked state; review tags
  are checkboxes; dashboard/profile segmented controls are tab lists.
- Unread state is not colour-only: notification cards say **· New** and the bell
  label includes the unread count.
- Tap targets are roughly 44 × 44 px.

Physical TalkBack/VoiceOver and large-text passes are still pending on a real
phone.

---

## 9. Responsive, theme and button checks

Run these in the browser (`npx expo start --web`) and on a phone.

| # | Check | Expected |
| --- | --- | --- |
| 9.1 | Widths 360 / 768 / 1024 / 1366 / 1920 px. | No horizontal scroll; 2 / 3 / 4 grid columns; sidebar appears at 1024. |
| 9.2 | Home, Search and Saved on desktop. | Cards are equal size, 4 per row, with the sidebar offset accounted for. |
| 9.3 | Listing Details and Profile on desktop. | Two columns; no stretched single column. |
| 9.4 | Post/Edit forms and auth screens. | Form caps at 720; auth card caps at 480 with the hero beside it. |
| 9.5 | Mobile bottom tabs. | Bottom tabs show; the raised **+** is mobile-only. |
| 9.6 | Every button variant and size. | Hover lightens, pressed darkens/scales, focus ring is visible, disabled is desaturated, loading shows a spinner. |
| 9.7 | Theme switch (System / Light / Dark). | Applies instantly in Profile and the desktop sidebar. |
| 9.8 | Reload after choosing a theme. | Saved choice applies with no light flash. |
| 9.9 | Both themes on every screen. | Cards, modals, toasts, skeletons, status pills, photo badges and the SOLD ribbon all use the active palette. |
| 9.10 | Owner action colours. | Teal primary, orange only on the main CTA, red only for destructive actions. |

---

## 10. Reservations and the buyer flow

| # | Steps | Expected |
| --- | --- | --- |
| 10.1 | As **B**, open an available listing owned by **A** → **Reserve**. | The reserve form shows date, time and campus meet-up spot; the seller's own listing never shows Reserve. |
| 10.2 | Submit with the fields empty. | Inline errors appear; no request is sent. |
| 10.3 | Choose a valid date/time/spot and send. | Request is created as `pending`, Listing Details shows the meet-up details and **Cancel request**, and A receives a reserve notification. |
| 10.4 | As **B**, cancel the pending request. | Status becomes `cancelled`; the buyer can reserve again. The seller gets a cancel notification. |
| 10.5 | As **A**, try to reserve A's own listing. | The API rejects it; the button is absent in the UI. |
| 10.6 | As **B**, try to accept/decline B's own request through a stale screen or forced call. | Rejected with a seller-only error; no PATCH is sent. |

## 11. Seller dashboard

| # | Steps | Expected |
| --- | --- | --- |
| 11.1 | As **A**, open **Profile → Seller dashboard**. | **Requests / My Listings / Sold** tabs; pending requests from B are listed with buyer name, course, meet-up and note. |
| 11.2 | Tap **Accept** on B's request. | Status becomes `accepted`, the card shows the accepted state, and B receives an accepted notification. |
| 11.3 | Tap **View item**. | The real Listing Details screen opens. |
| 11.4 | Mark the item **sold** from the item or the dashboard. | The listing leaves Home/Search, the Sold tab shows it with the total earned, and the accepted buyer gets the sold/review notification. |
| 11.5 | As **B**, open the accepted request. | The request stays accepted; the item shows Sold and **Rate & review** appears. |
| 11.6 | As **B**, open the dashboard route. | B sees only B's own seller requests/listings; A's rows never appear. |

## 12. Notifications

| # | Steps | Expected |
| --- | --- | --- |
| 12.1 | Sign in as **Carlo** and open the Home bell. | Two unread seller requests show **· New** and a teal border; the bell label includes the unread count. |
| 12.2 | Tap a reserve card. | The card is marked read and the seller dashboard opens. |
| 12.3 | Tap the sold card. | The review form opens for the completed sale. |
| 12.4 | Tap the **New review received** card. | Profile opens on the Seller shop tab with received reviews. |
| 12.5 | Press **Mark all as read**. | Every unread row for Carlo clears; the bell dot disappears. Ana's notifications are untouched. |
| 12.6 | Stop the API and reload. | The notifications screen shows an error/retry state, not a false empty feed. |

## 13. Messages and chat

| # | Steps | Expected |
| --- | --- | --- |
| 13.1 | As **B**, open A's listing → **Message seller**. | A thread opens (or the existing thread is reused) with A's name and the listing context. |
| 13.2 | Send a message. | It appears immediately, the thread moves to the top of the inbox, and A's unread badge increases. |
| 13.3 | As **A**, open **Messages**. | The unread dot/badge is visible; opening the chat marks incoming messages read. |
| 13.4 | As **A**, reply and wait up to 10 seconds with B's chat focused. | B's chat polls and shows the reply without a manual refresh. |
| 13.5 | Tap a quick reply. | It sends immediately; the composer stays usable. |
| 13.6 | As **A**, try to message A's own listing. | Rejected; no thread is created. |
| 13.7 | Try to open a chat id that belongs to other students. | Rejected with an ownership error; messages never render. |

## 14. Reviews

| # | Steps | Expected |
| --- | --- | --- |
| 14.1 | As **Carlo**, open the sold Laboratory Gown notification → **Rate & review**. | The form shows the completed sale, Ana as the reviewee, stars, tags and counter. |
| 14.2 | Submit with no stars. | Inline error asks for a star rating. |
| 14.3 | Pick 5 stars, tags and a comment → **Submit review**. | The thanks panel appears and **stays** until **Return to previous screen**. |
| 14.4 | Reopen the same notification. | **You already reviewed this completed sale.** |
| 14.5 | Check **Profile** and **Seller shop**. | Average/count update, **My reviews** lists the review, and the shop shows it in Recent reviews. |
| 14.6 | As a seller with an accepted request (for example accept Mika's request, then mark it sold), open the Sold tab. | **Rate buyer** opens the form for the buyer; after submitting, the card shows **You reviewed this sale.** |
| 14.7 | Stop the API and reload Profile. | The stat shows `—`, the shop rating `★ —`, and the panels show an error banner with retry; restart the API and **Try again** reloads the list. |
| 14.8 | Try to review yourself or review the same sale twice through a forced call. | Rejected by `reviewsApi`; no duplicate row is written. |

## 15. Known limits

- No server authentication: `json-server` accepts raw requests. Ownership is
  enforced in the app and the API service layer only.
- Chat has no realtime backend; it polls every 10 seconds while the chat is
  focused. Presence and location sharing are intentionally absent.
- Passwords are plain text in `server/db.json` for the prototype. A real backend
  must hash them.
- Photos are base64 data URIs in the mock DB. Production should use cloud
  storage with signed URLs.
- The APK and physical-phone checks need an Expo login and a demo device.
