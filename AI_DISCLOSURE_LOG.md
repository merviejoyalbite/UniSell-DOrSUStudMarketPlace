# AI Disclosure & Prompt Audit Log

This is our Week 1 record (problem framing, personas, and low-fi wireframes) of where we used AI on UniSell DOrSU, what we asked, and what we did with the results. We updated it as we went.

## Project info

| Field | Entry |
| --- | --- |
| Event | ITMSD1 Inter-Class Mobile Hackathon |
| Section / Team | 3C - ZeroEight |
| Project | UniSell DOrSU: Student Marketplace |
| SDG | SDG 8: Decent Work and Economic Growth |
| Team | \[Mervie Joy Albite\] (Lead UI/UX, Leader), \[Mc Lloyd Duazo\] (Lead Mobile Dev), \[Edito Balayo\] (Product & AI Specialist) |
| Last updated | 2026-10-22 |

## 2. AI tools we used

| Tool | What we used it for |
| --- | --- |
| Claude (Anthropic) \[confirm model shown in the app\] | Brainstorming, planning, and drafting Week 1 documents and prompts |
| Figma / Figma Make \[confirm which one we used\] | Making the low-fi wireframes from our prompts, which we then edited ourselves |

## Prompt log

| # | Date | Tool | What we asked | What we did with it |
| --- | --- | --- | --- | --- |
| 1 | Oct 14 | Claude | Name ideas and a campus marketplace concept that fits the exclusivity rule | We chose UniSell and set the scope: new or used, anything school-related. |
| 2 | Oct 14 | Claude | A tech stack and 4-week plan for UniSell based on the announcement | Used as a guide. |
| 3 | Oct 14 | Claude | How reserving, chat, and meetups should work in UniSell | We went with Reserve, in-app chat, seller-chosen meetup spots, and cash at meetup. No cart. |
| 4 | Oct 14 | Claude | A summary doc of the UniSell concept, flow, screens, and data | We reviewed and edited it. |
| 5 | Oct 16 | Claude | Explanations of problem framing, personas, wireframes, user flow, and IA for UniSell, plus a Week 1 guide and blockers table | Used as drafts. |
| 6 | Oct 16 | Claude | A first draft of this log | We checked it against what really happened. |
| 7 | Oct 19 | Claude | A prompt for black and white low-fi wireframes of all UniSell screens | confirm what we generated and edited |
| 8 | Oct 22 | OpenCode (DeepSeek V4.1 Flash) | Review our Figma Make prototype link | It listed the UniSell screens, copy and flows. No files changed. |
| 9 | Oct 22 | OpenCode (DeepSeek V4.1 Flash) | A phased build brief: Expo + TypeScript, Context state, json-server mock API, @dorsu.edu.ph login, browse/search, post listing, and our 5 deliverables | It scaffolded the Expo app with theme tokens, navigation shell, and seed `db.json`. We told it to stop after each phase and wait for "continue". |
| 10 | Oct 22–23 | OpenCode (DeepSeek V4.1 Flash) | "continue" through Phases 2–6 | It built auth, Home/Search/Details/Favorites, Post Listing, Profile, the accessibility pass, docs, the EAS preview (APK) config, and Lighthouse SEO fixes. |
| 11 | Oct 23–24 | OpenCode (DeepSeek V4.1 Flash) | Run the server and give a QR, then fix "Could not reach the UniSell mock API" in Expo Go | The cause was a stale LAN IP. It fixed the base-URL logic to use `.env` or the Expo host, and added error logging. |
| 12 | Oct 24 | OpenCode (DeepSeek V4.1 Flash) | UI polish: Welcome hero, seller-photo capture, tab bar fixes | It added the Welcome illustration and value props, fixed safe-area/tab-bar spacing, and added the camera photo flow. |
| 13 | Oct 25 | OpenCode (DeepSeek V4.1 Flash) | Fix missing listing photos, plan real seed photos, remove the SDG chip from Welcome | It fixed the photo pipeline. It could not create real photos, so it documented a manual photo workflow. |
| 14 | Oct 26 | OpenCode (DeepSeek V4.1 Flash) | Put sample pictures on the seed listings | It generated 18 original vector illustrations, added a "Sample image" badge and an `imageType` field, and fixed the Laptop category. We chose illustrations over fake "real" photos to stay honest. |
| 15 | Oct 27 | OpenCode (DeepSeek V4.1 Flash) | Let sellers take a photo or choose from the gallery (max 3) | It added the camera/gallery flow, compression, per-photo badges, and a "Make cover" option. This replaced the earlier camera-only rule. |
| 16 | Oct 28–29 | OpenCode (DeepSeek V4.1 Flash) | Seller listing management and profile editing, then strict ownership rules | The first prompt was blocked by the free usage limit. The Oct 29 ownership prompt worked: `canManageListing`, owner-only edit/delete/status, API-layer checks, and saved-item cleanup. |
| 17 | Oct 30 | OpenCode (DeepSeek V4.1 Flash) | Pasted terminal errors: wrong `npx run expo` command and a stale API URL | It corrected the command and updated `.env`/README for the current Wi-Fi IP. |
| 18 | Oct 30–Nov 3 | OpenCode (DeepSeek V4.1 Flash) | Responsive layout, a colorful button system, and dark mode | It added breakpoints, a shared Button component, and semantic light/dark themes. It also fixed zero-width desktop cards. |
| 19 | Nov 4 | OpenCode (DeepSeek V4.1 Flash) | Match our Figma design: audit first, then restyle | It wrote `docs/DESIGN_GAP.md` (Phase 0). We stopped it twice to review before it continued. We told it to leave the splash screen alone. |
| 20 | Nov 4–9 | OpenCode (DeepSeek V4.1 Flash) | "continue" through the Figma restyle | It restyled Login/Sign Up, Home, Listing Details, Post Listing, Saved, Profile, Search and Settings, and built the Design System screen. |
| 21 | Nov 9–12 | OpenCode (DeepSeek V4.1 Flash) | Phase 3: new features from the design | It built reservations (Reserve flow), the seller dashboard, notifications, and messages/chat, all through the mock API with seed data. |
| 22 | Nov 13–14 | OpenCode (DeepSeek V4.1 Flash) | Reviews and Phase 4 docs | It added the review flow, README, architecture, accessibility and walkthrough docs, and the test checklist. |
| 23 | Nov 14–15 | OpenCode (DeepSeek V4.1 Flash) | Check the splash screen, then generate branding assets | It confirmed the in-app splash is intact and generated the native splash and app icon set. |
| 24 | Nov 15 | OpenCode (DeepSeek V4.1 Flash) | Restore the removed Welcome screen, fix the API error, remove the SDG pill | It restored Welcome with login routing, reset the API URL to localhost, and removed the pill. |
| 25 | Nov 16 | OpenCode (DeepSeek V4.1 Flash) | Extract every prompt we sent for this transparency log | It created `ai-transparency/` with `prompt-log.md`, `prompt-log.csv` and `summary.md`. |













## How we checked the AI's work

- We read and edited everything the AI wrote before using it.
- We didn't put anyone's private information into the AI tools.
- The interview questions were drafted with AI help. The answers in WEEK1\_VALIDATION.md are from the real people we asked.
- The personas are drafts until we check them against our interviews.


## Team declaration

We confirm that this log is accurate to the best of our knowledge.

| Name | Role | Date |
| --- | --- | --- |
| Mervie Joy Albite | Lead UI/UX (Leader) |  |
| Mc Lloyd Duazo | Lead Mobile Dev |  |
| Edito Balayo | Product & AI Specialist |  |
