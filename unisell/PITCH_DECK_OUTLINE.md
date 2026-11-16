# UniSell — Pitch Deck Outline

Use this as the slide script for the 5–7 minute demo. Each heading matches a
slide. The timed live walkthrough, pre-flight checks and fallback lines are in
[`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). Speaker notes are prompts, not final
copy.

---

## 1. Title

- **UniSell** — the verified marketplace for DOrSU students.
- ITMSD1 Inter-Class Mobile Hackathon · SDG 12: Responsible Consumption and
  Production.
- Team name, members, date.

**Speaker note:** One sentence on what UniSell is and who it is for.

---

## 2. Community Problem

- Students buy textbooks, uniforms, lab gowns and calculators for one or two
  semesters, then leave them unused.
- Graduating students have usable items but no trusted, searchable place to
  sell them.
- Facebook groups and chat threads are noisy, hard to search, and open to
  non-students (scams, no-shows).
- Result: waste, repeated spending, and missed savings for students on tight
  budgets.

**SDG 12 link:** Target 12.5 — reduce waste through reuse and recycling.

---

## 3. Persona and User Journey

**Primary persona — Mika, 3rd year BSIT**

- Budget: ₱1,500 per semester for school needs.
- Needs a cheaper Calculus textbook and a PE uniform.
- Has a working calculator she no longer uses.

**Journey**

1. Opens UniSell and signs up with `mika.santos@dorsu.edu.ph`.
2. Browses **Textbooks**, searches “Calculus”.
3. Opens a listing, checks the price and seller’s course.
4. Saves it, then posts her old calculator.
5. Meets the buyer at a campus meet-up spot.

**Pain points addressed:** trust, searchability, and posting effort.

---

## 4. Solution and 3 Value Props

**Solution:** a campus-only marketplace where every account is tied to an
official DOrSU email.

1. **Trusted by design** — only `@dorsu.edu.ph` accounts can join, and only the
   seller who posted an item can edit, reserve, sell or delete it.
2. **Fast to use** — search, category chips, a short validated post flow, and
   one-tap owner actions from Listing Details or Profile.
3. **Sustainable by default** — every reused item keeps money and materials on
   campus, and sold items leave the feed while staying in the seller's record.

**Demo line:** “In under a minute, Mika can find a book, save it, and list her
old calculator.”

---

## 5. Figma Design System

- Teal `#0E6A5F` primary, orange `#F2994A` accent, soft mint background.
- Poppins type scale; 4-point spacing grid; 16/24 px card radii.
- Shared components: pill buttons, chips, listing cards, status badges,
  bottom navigation with centre Sell action.
- Phase 5 added screen-reader labels, visible headers, larger touch targets and
  darker text/status colours for contrast while keeping the teal/orange brand.
- Code mirrors the Figma tokens in `src/theme/` and shared components in
  `src/components/`.

**Slide visual:** side-by-side Figma frame and app screenshot for Home and
Listing Details. The current files in `docs/screenshots/` are web-preview captures
at 390 × 844, so label them honestly until phone captures replace them.

---

## 6. Technical Architecture

```
UI layer (screens + components)
        ↓
Context state (AuthContext, ListingsContext — useReducer)
        ↓
API service (apiClient → authApi / listingsApi)
        ↓                              ↓
json-server :3001                AsyncStorage
(users, listings)                (session, favorites)
        ↓ reads if unreachable
bundled JSON fallback
```

- Expo managed workflow + TypeScript.
- React Navigation: native stack for auth/details, bottom tabs for the main app.
- One `apiClient` owns the base URL, timeout, and error mapping.
- `AuthContext` owns the session; `ListingsContext` owns the feed, favorites,
  publish and owner actions. Profile is a filtered view of that same feed, not a
  second API.
- `canManageListing(user, listing)` decides whether owner controls render. The
  API service layer repeats the check with the persisted session before every
  PATCH/DELETE. json-server has no auth, so production needs row-level security.
- Profile saves also update the denormalized seller name/course/year on the
  user's listings, so feed cards stay self-contained.
- Fallback JSON keeps browsing and seeded login alive without the mock server;
  signing up and posting still require json-server.

**Speaker note:** explain one data path end to end (tap Favorites → context →
AsyncStorage → UI).

---

## 7. AI-Assisted Workflow

- AI used for scaffolding, boilerplate, and documentation drafts.
- Every phase logged in `AI_DISCLOSURE_LOG.md`: prompt summary, generated
  files, checks actually run, and the human review checklist.
- The team must still review and be able to explain every file during Q&A.
- AI did **not** replace design decisions. Final phone verification and a
  screen-reader pass remain human checklist items before submission.

**Slide visual:** the phase table from the README and one log entry.

---

## 8. Live Demo

1. Welcome → sign up with a DOrSU email (show the rejected non-DOrSU email).
2. Home feed → filter **Textbooks** → open a listing.
3. Search “calculator” → narrow by condition → clear filters.
4. Save it → show the Saved tab, then reload to prove persistence.
5. Post an item → show one validation error, then fix it and publish. The new
   card appears at the top of the feed and opens in Listing Details.
6. As the owner, show **Mark as reserved** then **Mark as sold**. The item leaves
   Home/Search but stays in **Profile > My listings > Sold** with a SOLD ribbon.
   Show the owner menu (…) and **Delete all sold** count confirmation.
7. Sign in as a second account and open the same listing: only **Save this item**
   and the meet-up info appear. Mention that the service layer rejects a forced
   PATCH/DELETE with “You can only change your own listings.”
8. Open **Profile > Edit profile** → change the name or add a photo → save, then
   show the new name on Home, Posting as and the listing seller card. Show the
   masked student ID with **Show**, and the read-only email/student ID helper.
9. Log out and log back in → session restored and favorites remain.

**Backup plan:** if Wi-Fi or the mock server fails, log in with a seeded demo
account (the auth fallback works offline) and show the bundled fallback data;
call it a deliberate resilience feature. Creating an account or posting still
needs the mock server, so keep `npm run api` running during the live demo.

---

## 9. Impact and Roadmap

**Impact**

- Lower semester costs for students.
- Less usable-item waste on campus.
- A searchable, trusted campus marketplace instead of scattered group chats.

**Metrics we would track:** active listings, items marked sold, repeat sellers,
estimated pesos saved per student.

**Roadmap**

- Phases 2–5: authentication, browsing, posting, Profile/My Listings and the
  accessibility pass (done, web-verified).
- Phase 7: strict seller ownership, sold/reserved lifecycle, edit mode, profile
  editing and password change (done, typecheck and web export verified).
- Next: delivery, then a phone/screen-reader check and an EAS preview build.
- Later: in-app chat, meet-up scheduling, ratings, and cloud-hosted image storage.
- Longer term: student-org stores, a donation/free-item section and admin
  verification.

---

## 10. Team and Q&A

| Member | Role | Contribution |
| --- | --- | --- |
| _(name)_ | Product / UI | Figma, pitch deck |
| _(name)_ | Frontend | Screens, navigation, theme |
| _(name)_ | Data / QA | Mock API, testing, README |

**Likely questions — prepare answers**

- How is a student verified? → Only the school email domain is accepted in the
  MVP; a production system would send a verification link.
- What if the server is down? → Reads fall back to bundled JSON; writes show an
  error instead of pretending to save.
- Why Context instead of Redux? → The app has two small state slices; Context
  keeps the code explainable.
- Where is data stored? → Mock server + AsyncStorage for session/favorites.

**Closing line:** “UniSell turns unused campus items into savings — one verified
student at a time.”
