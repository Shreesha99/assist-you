# 🚭 Smoke Timer — Harm Reduction Cooldown App

Smoke Timer is a **progressive harm-reduction web app** that helps reduce smoking frequency by enforcing **cooldown periods** between cigarettes and tracking behavior, urges, and progress over time.

> ⚠️ This app is **not medical advice**.  
> It does **not encourage smoking** — the goal is to increase gaps, reduce dependency, and build control.

---

## ✨ Core Features

### ⏳ Cooldown Timer
- Log a cigarette to start a cooldown
- Circular animated progress ring
- Pause / Resume / Reset
- Smart motivational messages
- Suggested next cooldown based on history

### 📅 Daily Tracking
- Cigarettes smoked today
- Daily limit indicator
- Longest cooldown gap
- Skipped cigarettes
- Time saved
- Money spent
- Health approximations (life minutes, steps)

### 📈 Progress
- 7-day bar chart
- Weekly averages
- Best day
- Week-over-week comparison
- Streak tracking

### 🧠 Urge Logging & Insights
- Urge strength (1–5)
- Trigger reasons (coffee, stress, boredom, etc.)
- Most risky hours
- Urge pressure score
- Behavioral insights & tips

### 🏆 Achievements
- 3-day, 7-day, 14-day, 30-day streaks
- Auto-unlock with confetti celebration

### ⚙️ Settings
- Daily cigarette limit
- Cooldown presets
- Currency selection
- Cost per pack
- Cigarettes per pack
- Night mode (auto/manual)
- Sound & silent mode
- Notifications
- Import / Export data
- Undo & clear data actions

### 📱 Progressive Web App (PWA)
- Installable
- Offline support
- Service worker
- Local storage persistence

---

## 📂 Project Structure

```text
Test/
├─ style/
│ ├─ analytics.css
│ ├─ base.css
│ ├─ components.css
│ ├─ layout.css
│ ├─ popups.css
│ ├─ settings.css
│ ├─ tabs.css
│ └─ timer.css
├─ app.js
├─ drive.js
├─ index.html
├─ manifest.json
├─ style.css
└─ sw.js

```



---

## 🧭 App Architecture Overview

### index.html
Defines:
- App shell
- Tabs (Timer, Today, Progress, Insights, Settings)
- Modals (confirm, urge logging, picker, disclaimer)
- Toasts & overlays
- Audio & notification hooks

Tab switching is handled via CSS class toggling.

---

### Styling (`/style`)
CSS is split by responsibility:
- `base.css` → typography, colors, resets
- `layout.css` → app layout & spacing
- `components.css` → buttons, cards, pills
- `timer.css` → circular timer visuals
- `tabs.css` → bottom navigation
- `popups.css` → overlays & dialogs
- `settings.css` → controls & forms
- `analytics.css` → charts & insight cards

---

### app.js (Core Logic)

Handles:
- Timer engine
- LocalStorage persistence
- Daily logs & history
- Streak calculations
- Achievements
- Charts
- Insights & analytics
- Notifications
- Confetti animation
- Import / Export
- UX enhancements

All state is stored locally using `localStorage`.

---

### drive.js
Prepares Google Sign-In and Drive API integration:
- Backup
- Restore
- Authentication

(UI ready, backend integration ongoing.)

---

## 🔔 Notifications

- Daily reminder (10 AM)
- Cooldown completion alerts
- Optional vibration
- Optional sound

Permissions requested automatically.

---

## 🔄 Backup & Restore

### Export
Downloads a JSON file containing:
- daily logs
- history
- presets
- urge logs
- skips

### Import
Restores data from a valid JSON backup.

---

## ⚠️ Disclaimer

Smoke Timer is a **harm-reduction tool**, not a medical product.

It aims to:
- Increase time between cigarettes
- Reduce daily intake
- Build awareness of triggers
- Encourage gradual improvement

Use at your own discretion.
