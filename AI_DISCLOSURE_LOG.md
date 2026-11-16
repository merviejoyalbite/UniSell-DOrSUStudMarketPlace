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
|### Week 2 (Oct 21-27)

| # | Date | Tool | What we asked | What we did with it |
| --- | --- | --- | --- | --- |
| 8 | Oct 22 | OpenCode (flint-40b-free) | Review our Figma link, then "continue" [P01-P02] | **No response.** The provider returned "Endpoint is unavailable". Nothing was done. |
| 9 | Oct 22 | OpenCode (DeepSeek V4.1 Flash) | Review the Figma Make prototype link again [P03] | It listed the UniSell screens, copy and flows. No files changed. |
| 10 | Oct 22 | OpenCode (DeepSeek V4.1 Flash) | A phased build brief: Expo + TypeScript, Context state, json-server mock API, @dorsu.edu.ph login, and our 5 deliverables [P04-P05] | It scaffolded the Expo app with theme tokens, navigation shell, and seed `db.json`. We told it to stop after each phase and wait for "continue". |
| 11 | Oct 22-23 | OpenCode (DeepSeek V4.1 Flash) | "continue" through Phases 2-6 [P06-P12] | It built auth, Home/Search/Details/Favorites, Post Listing, Profile, the accessibility pass, docs, the EAS preview (APK) config, and Lighthouse SEO fixes. |
| 12 | Oct 23 | OpenCode (DeepSeek V4.1 Flash) | Run the server and give a QR [P13] | It started the API and Expo and gave the phone connection details. |
| 13 | Oct 24 | OpenCode (DeepSeek V4.1 Flash) | Fix "Could not reach the UniSell mock API" in Expo Go [P14] | The cause was a stale LAN IP. It fixed the base-URL logic to use `.env` or the Expo host, and added error logging. |
| 14 | Oct 24 | OpenCode (DeepSeek V4.1 Flash) | UI polish: Welcome hero, seller-photo capture, tab bar fixes [P15-P17] | It added the Welcome illustration and value props, fixed safe-area/tab-bar spacing, and added the camera photo flow. |
| 15 | Oct 24 | OpenCode (DeepSeek V4.1 Flash) | "continue" twice [P18-P19] | **No response.** The first hit a connection reset (ECONNRESET) and the second a failed DNS lookup. No files changed. |
| 16 | Oct 24 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P20] | It closed the three UI-polish tasks. Typecheck and web export passed. |
| 17 | Oct 25 | OpenCode (DeepSeek V4.1 Flash) | Fix missing listing photos, plan real seed photos, remove the SDG chip [P21-P22] | It fixed the photo pipeline. It could not create real photos, so it documented a manual photo workflow. |
| 18 | Oct 26 | OpenCode (DeepSeek V4.1 Flash) | "Still not showing the pictures" / "put pictures on the products" [P23-P25] | It confirmed the files were missing (404), asked how to supply real photos, then generated 18 labelled sample images after we clarified "for sample only". |
| 19 | Oct 26 | OpenCode (DeepSeek V4.1 Flash) | Give every seeded listing a sample picture [P26] | It replaced the cards with 18 original vector illustrations, added a "Sample image" badge and `imageType`, and fixed the Laptop category. |
| 20 | Oct 27 | OpenCode (DeepSeek V4.1 Flash) | Let sellers take a photo or choose from the gallery (max 3) [P27-P28] | It added the camera/gallery flow, compression, per-photo badges, and "Make cover". This replaced the earlier camera-only rule. |
| 21 | Oct 27 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P29] | **No response.** Free usage limit reached. No files changed. |

### Week 3 (Oct 28-Nov 3)

| # | Date | Tool | What we asked | What we did with it |
| --- | --- | --- | --- | --- |
| 22 | Oct 28 | OpenCode (DeepSeek V4.1 Flash, Nemotron 3 Ultra, Nemotron 3.5 Super VL) | The seller-tools + edit-profile prompt sent 5 times across different models, then "continue", plus one stray prompt in a second session [P30-P36] | **No response** to any of them. These were free usage limits, and the Nemotron 3 Ultra model was unavailable (HTTP 400). The session compacted and no files changed. |
| 23 | Oct 29 | OpenCode (DeepSeek V4.1 Flash) | Strict ownership rules for listings [P37] | It added `canManageListing`, owner-only edit/delete/status, API-layer checks, and saved-item cleanup. |
| 24 | Oct 30 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P38] | **No response.** Connection reset (ECONNRESET). No files changed. |
| 25 | Oct 30 | OpenCode (DeepSeek V4.1 Flash) | "continue", then pasted terminal errors (`npx run expo` typo, stale API URL) [P39-P41] | It verified the ownership and edit-profile flows and fixed accessibility gaps. It corrected the command and updated `.env`/README for the current Wi-Fi IP. |
| 26 | Oct 30-Nov 3 | OpenCode (DeepSeek V4.1 Flash) | Responsive layout, a colorful button system, and dark mode [P42-P45] | It added breakpoints, a shared Button component, and light/dark themes. It also fixed zero-width desktop cards. |

### Week 4 (Nov 4-10)

| # | Date | Tool | What we asked | What we did with it |
| --- | --- | --- | --- | --- |
| 27 | Nov 4 | OpenCode (DeepSeek V4.1 Flash) | Compare our build to the Figma, then "stop right tere" [P46-P48] | It wrote a gap analysis, then stopped on request. No files changed. |
| 28 | Nov 4 | OpenCode (DeepSeek V4.1 Flash) | Match our Figma Make design: audit first [P49-P53] | It wrote `docs/DESIGN_GAP.md` (Phase 0). We stopped it once to review before it continued. |
| 29 | Nov 4-7 | OpenCode (DeepSeek V4.1 Flash) | "continue", with a reminder not to change the splash screen [P54-P61] | It restyled tokens, Login/Sign Up, Home, Listing Details, Post Listing and Saved Items, and started inspecting Search. The splash screen was left untouched. |
| 30 | Nov 8 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P62-P63] | It restyled Profile (hero, tabs, Seller shop) and started the Settings screen. |
| 31 | Nov 9 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P64] | **No response.** Connection refused (ECONNREFUSED). No files changed. |
| 32 | Nov 9 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P65-P68] | It built Settings and the Design System screen, and completed the Search restyle. |
| 33 | Nov 9-10 | OpenCode (DeepSeek V4.1 Flash) | "continue" into Phase 3 [P69-P71] | It built the reservations API and Reserve flow, seeded the data, and built the seller dashboard. |

### Week 5 (Nov 11-16)

| # | Date | Tool | What we asked | What we did with it |
| --- | --- | --- | --- | --- |
| 34 | Nov 11 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P72-P73] | It verified the dashboard, fixed dark-mode status-pill contrast, and started notifications. |
| 35 | Nov 12 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P74-P76] | It built notifications with lifecycle types, then Messages (threads and chat screen). |
| 36 | Nov 13 | OpenCode (DeepSeek V4.1 Flash) | "continue", "continue", "proceed" [P77-P79] | **No response.** Two TLS certificate errors (CERT_NOT_YET_VALID), and the third turn ended with nothing captured. No files changed. |
| 37 | Nov 13-14 | OpenCode (DeepSeek V4.1 Flash) | "continue" / "proceed" [P80-P83] | It built reviews, removed the thanks-screen auto-return, and completed the Phase 4 docs and test checklist. |
| 38 | Nov 14 | OpenCode (DeepSeek V4.1 Flash) | "Is the flash screen still there?" then "okay" [P84-P85] | It confirmed the in-app splash is intact, then generated splash/icon assets and previews. |
| 39 | Nov 15 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P86] | **No response.** DNS lookup for opencode.ai failed. No files changed. |
| 40 | Nov 15 | OpenCode (DeepSeek V4.1 Flash) | "continue" [P87] | It generated the native splash image and configured the expo-splash-screen plugin. |
| 41 | Nov 15 | OpenCode (DeepSeek V4.1 Flash) | "proceed", "continue" [P88-P89] | **No response.** Connection refused (ECONNREFUSED) twice. No files changed. |
| 42 | Nov 15 | OpenCode (DeepSeek V4.1 Flash) | "continue", "okay" [P90-P91] | It added native splash config and docs, and generated the app icon set. |
| 43 | Nov 15 | OpenCode (DeepSeek V4.1 Flash) | Restore the removed Welcome screen, fix a stale API URL error, remove the SDG pill [P92-P94] | It restored Welcome with login routing, reset the API URL to localhost, and removed the pill. |
| 44 | Nov 16 | OpenCode (DeepSeek V4.1 Flash) | Extract every prompt for this transparency log [P95] | It created `ai-transparency/` with `prompt-log.md`, `prompt-log.csv` and `summary.md`. |













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
