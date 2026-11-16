# UniSell — Live Demo Script

A 7-minute demo for the ITMSD1 Inter-Class Mobile Hackathon. The timings are a
guide, not a race; protect the three required flows (verified login, browse and
favorites, post a listing) before adding extras. If time allows, the optional
90-second block after the post flow shows the Figma Phase 3 features: reserve,
seller dashboard, chat and reviews.

> **Demo path:** Expo Go on the demo phone + `npm run api` on the laptop. The
> preview APK is a backup, not the primary live path. See
> [`BUILD_AND_RELEASE.md`](BUILD_AND_RELEASE.md).

---

## Before the room fills

- [ ] Laptop and demo phone are on the same Wi-Fi network.
- [ ] `npm run db:reset` has restored **4 users / 18 listings / 6 categories /
      6 reservations / 6 notifications / 6 chats / 16 messages / 1 review**.
- [ ] Terminal 1: `npm run api` is running on port 3001.
- [ ] Terminal 2: `$env:EXPO_PUBLIC_API_URL="http://<LAN-IP>:3001"; npm start`.
- [ ] Phone opens the app in Expo Go; the Home feed shows 18 items.
- [ ] The device is signed out and `unisell.favorites` is empty.
- [ ] Demo account is ready: `mika.santos@dorsu.edu.ph` / `unisell123`.
- [ ] Browser fallback is ready: `http://<LAN-IP>:3001/listings` returns JSON.
- [ ] Notifications, auto-lock, low-power mode and random app updates are off.
- [ ] Backup: the EAS APK opens to the bundled feed and a seeded login.
- [ ] After the demo (or before submission), run `npm run db:reset` again.

The clean seed is `server/db.seed.json`. Never edit `server/db.json` by hand
while json-server is running; stop the API and use `npm run db:reset` instead.

---

## 0:00–0:30 — Hook

**Say:**

> “Every semester, DOrSU students buy textbooks, uniforms and calculators they use
> for one or two terms. Then those items sit unused while another student pays
> full price. UniSell is a verified campus marketplace that gives those items a
> second life.”

**Show:** Welcome screen.

---

## 0:30–1:15 — Problem, persona and SDG 12

**Say:**

> “Mika is a third-year BSIT student with a ₱1,500 semester budget. She needs a
> Calculus book and a PE uniform, and she has a calculator she no longer uses.
> Facebook groups are noisy, hard to search and open to non-students. UniSell is
> campus-only: every account uses an official `@dorsu.edu.ph` email.”

**Point to the SDG line:** Target 12.5 — reuse and waste reduction. Every reused
item keeps money and materials on campus.

---

## 1:15–2:00 — Verified login

1. Tap **I already have an account**.
2. Type `test@gmail.com` and a password. Tap **Log in**.
3. Point out the inline message:
   “Use your official @dorsu.edu.ph email.”
4. Replace it with `mika.santos@dorsu.edu.ph` / `unisell123`.
5. Tap **Log in**. The Home feed opens with 18 listings.

**Say:** “The domain is checked on the screen and again in the API layer. The
password is used only for login and is never saved in AsyncStorage.”

If the API is offline, use a seeded account and mention that reads fall back to
bundled data; sign-up still needs the mock server.

---

## 2:00–3:00 — Browse, search and save

1. On **Home**, tap **Textbooks**. The count changes to 4 and the section title
   changes.
2. Tap **All**, then the search shortcut.
3. Search `calculator`. Point out the live result count.
4. Narrow to **Gadgets** or **Used**; then tap **Clear filters**.
5. Open a listing. Show price, condition, meet-up spot, seller card and safety
   note.
6. Tap the heart, then open **Saved**.
7. Reload the app (or close/reopen in Expo Go). The session and the saved item
   are still there.

**Say:** “Search is an in-memory pure function because the demo catalogue is
small. Favorites are device-scoped in the MVP, saved under `unisell.favorites`.”

**One-line defense:** “The heart is a separate button from the card, so saving an
item never opens it by accident.”

---

## 3:00–3:45 — Listing details and trust

1. Return to the saved item.
2. Point out the category art, status badge, seller course/year and the campus
   meet-up reminder.
3. If a reserved item is visible, show its orange **Reserved** notice.

**Say:** “The trust promise is the verified account, the seller snapshot and a
safe campus meet-up. If a buyer wants to talk first, **Message seller** opens a
thread with that seller — no phone numbers are exposed.”

---

## 3:45–5:00 — Post a listing

1. Tap the orange **Sell** button in the centre of the tab bar.
2. Tap **Publish listing** with the form empty. Point out the field errors.
3. Enter:
   - Title: `Calculus Textbook — Stewart 8th Edition`
   - Price: `450`
   - Category: `Textbooks`
   - Condition: `Used`
   - Meet-up spot: `Student Center`
   - Description: “Complete pages, light cover wear. Meet at the Student Center
     after class.”
4. Tap **Publish listing**.
5. The new Listing Details opens. Go back to **Home** and show the new item first
   and the count at 19.
6. Open **Profile**: My listings count and the new row update immediately.

**Say:** “Seller name, course and year come from the session, not editable form
fields. The reducer inserts the card immediately, then a silent refresh reconciles
it with json-server.”

**If the API is unavailable:** show the inline error and state clearly that the
draft is preserved and no fake card is created. Do not claim the write succeeded.

**Do not** leave the demo item in the submission database. Run
`npm run db:reset` after the demo.

---

## Optional +90 seconds — Reserve, dashboard, chat and reviews

Use this only if the three required flows are already done and the clock allows.
Have two demo accounts ready (for example Carlo as buyer and Ana as seller).

1. As the buyer, open the seller's listing → **Reserve** → choose a meet-up
   date/time/spot → send.
2. As the seller, open **Profile → Seller dashboard → Requests** → **Accept** →
   **View item** → **Mark as sold**.
3. As the buyer, reopen the sold listing → **Rate & review** → 5 stars + a tag →
   **Submit review**. Point out that the thanks panel waits for the button.
4. Optional: open **Messages**, show the thread and unread dot, and send one
   quick reply.

**Say:** “Reservations, notifications, chat and reviews all repeat the same
ownership check in the API layer: only the buyer can cancel, only the seller can
accept, and only the two parties can read the thread or review the sale.”

**If time is tight:** skip this block entirely. Do not cut login, search/save or
posting.

---

## 5:00–5:45 — Profile and accessibility

1. On **Profile**, point out the verified badge, school email, course/year,
   reviews/sold/listings stats and the **Profile | Seller shop** tabs.
2. Show the menu card: My Listings, Saved, My reviews, Notifications, Settings,
   Log out, plus the verified footer.
3. Tap a My Listings row; it opens the real Listing Details screen.
4. Mention the safety card and **Log out**.
5. Optional: save/remove an item and show the Saved count change on Profile.

**Say:** “Phase 5 added labels for screen readers, separate card/heart actions,
live search announcements, larger touch targets and contrast-adjusted colours.
The Figma Phase 3 screens keep the same conventions: the star picker is a
radiogroup, tags are checkboxes, unread state has text as well as colour, and
chat controls are labelled. It is a focused accessibility pass, not a claim of
full WCAG certification.”

---

## 5:45–6:30 — Architecture and AI disclosure

**Say:**

> “The UI only reads context and calls typed actions. AuthContext owns the
> session; ListingsContext owns the feed, favorites and publishing;
> ReservationsContext, NotificationsContext, MessagesContext and ReviewsContext
> own their own resources. One apiClient owns the base URL, timeout and error
> mapping. json-server is the mock backend; AsyncStorage holds the session and
> favorites. Network failures fall back to bundled JSON for reads, but writes
> never pretend to succeed.”

Point to `AI_DISCLOSURE_LOG.md`:

> “AI assisted with scaffolding and documentation. Every phase is logged with what
> was generated and what still needs human review. We are not claiming that a
> teammate reviewed code that they have not actually reviewed.”

---

## 6:30–7:00 — Close and Q&A

**Say:**

> “UniSell makes reuse the easiest option on campus: verified students, searchable
> listings, and a short post flow. Every item reused is money kept by a student
> and waste kept out of the landfill.”

**Then:** stop talking, leave the Home feed visible, and invite questions.

---

## If the demo goes wrong

| Problem | Recovery |
| --- | --- |
| API is down | Show the offline banner and bundled feed; seeded login still works. Do not demo posting until the API is back. |
| Phone cannot reach the laptop | Check same Wi-Fi, firewall and `EXPO_PUBLIC_API_URL`; open `http://<LAN-IP>:3001/listings` in the phone browser. |
| Expo Go shows a version warning | Update Expo Go, or switch to the preview APK/backup device. |
| Fonts/icons are missing | Reload the app; if it persists, restart Metro with `npx expo start -c`. |
| A test listing is already at the top | Run `npm run db:reset`, reload the app and start the demo again. |
| Posting fails mid-demo | Show the inline error and preserved draft; state the MVP boundary honestly. |
| Time is short | Cut the optional reserve/chat/review block and the accessibility section; keep login, search/save and post. |

---

## Cleanup

```powershell
npm run db:reset
```

Then confirm the counts are **4 users / 18 listings / 6 categories /
6 reservations / 6 notifications / 6 chats / 16 messages / 1 review**, and clear
the device session/favorites if the phone is shared. If you reset while the API
is still running, a watcher may log a transient `EBUSY`; restart it before the
next rehearsal. Stop both terminals before the reset.
