# VESPER – The FT.com-Inspired Offline RSS Reader
**Tagline:** "Where the day settles."

An elegant, sophisticated, completely offline-first RSS reader that looks and feels exactly like reading the Financial Times in 2025 — salmon accents, perfect typography, generous whitespace, dark-mode-first, installable PWA.

## Tech Stack
- **Framework:** SvelteKit 2.x (static adapter → 100% client-side)
- **Storage:** Dexie.js (IndexedDB)
- **Parsing:** rss-parser
- **Security:** dompurify (Required for HTML sanitization)
- **Styling:** Tailwind CSS + Skeleton.dev (FT Theme)
- **PWA:** Vite PWA plugin
- **Philosophy:** No backend, no accounts, no tracking

## Development Plan

### Stage 0: Setup & Design Tokens
- [ ] Initialize SvelteKit project + Tailwind CSS
- [ ] Install dependencies: `dexie`, `rss-parser`, `dompurify`, `@skeletonlabs/skeleton`
- [ ] Configure `tailwind.config.js` with Vesper/FT color palette
- [ ] Set up Fonts: "Playfair Display" (Headlines) & "IBM Plex Sans" (Body)
- [ ] Create `app.html` base styles

### Stage 1: Database Architecture
- [ ] Create `src/lib/db.ts`
- [ ] Define Dexie Schema:
    - `feeds` (id, url, title, folderId, lastFetched)
    - `articles` (id, feedId, guid, title, content, read, starred, date)
    - `folders` (id, name)
    - `settings` (key, value)
- [ ] Setup `liveQuery` stores for reactive UI

### Stage 2: RSS Engine
- [ ] Implement `fetchFeed` in `src/lib/rss.ts`
- [ ] **Security:** Implement `dompurify` to sanitize feed content
- [ ] Implement CORS proxy logic (Default: corsproxy.io, but user-configurable)

### Stage 3: Feed Management
- [ ] UI: Add Feed Input & Validation
- [ ] Action: Persist feed metadata to DB
- [ ] Action: Bulk add initial articles to DB

### Stage 4: OPML Support
- [ ] Implement OPML Import (Parse XML -> DB)
- [ ] Implement OPML Export (DB -> Generate XML Blob)
- [ ] UI: Import/Export buttons with Salmon styling

### Stage 5: The Vesper Layout
- [ ] Implement 3-Panel Grid (CSS Grid: 280px 380px 1fr)
- [ ] **Left Panel:** Navigation/Folders
- [ ] **Middle Panel:** Article List
- [ ] **Right Panel:** Reading View
- [ ] Apply FT "Generous Vertical Rhythm" spacing

### Stage 6: Article List (Middle Panel)
- [ ] Component: Article Card
- [ ] Feature: Unread Badges (Salmon background, Dark text)
- [ ] Feature: Grouping by Date
- [ ] *Optimization:* Virtual scrolling for large lists

### Stage 7: Reader View (Right Panel)
- [ ] Typography: "Prose" classes, justified text toggle
- [ ] Header: Big Headline, Date, Domain
- [ ] Content: Render sanitized HTML
- [ ] Feature: Readability fallback (optional)

### Stage 8: Interactions
- [ ] Action: Mark as Read/Unread
- [ ] Action: Star/Unstar
- [ ] Keyboard Shortcuts (`j`/`k` nav, `m` mark read)

### Stage 9: Background & Sync
- [ ] Implement Auto-refresh interval (poll every X mins)
- [ ] Service Worker setup for offline asset caching

### Stage 10: PWA Finalization
- [ ] Create `manifest.json` (Name: Vesper, Theme: #990f3d)
- [ ] Generate Icons (Salmon "V" on Dark background)
- [ ] Test "Add to Home Screen"

### Stage 11: Settings & Polish
- [ ] Settings Page: Proxy URL, Dark/Light Toggle
- [ ] Data Management: "Clear All Data"
- [ ] Final Design Review: Check contrast and FT aesthetics

### Stage 12: Deployment
- [ ] Build static adapter
- [ ] Deploy (Vercel/Netlify/GitHub Pages)
