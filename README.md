# 🚭 Assist-You (Smoke Timer)

**Assist-You** is a lightweight, privacy-focused Progressive Web App (PWA) designed as a harm-reduction tool. It helps users gain control over smoking habits by enforcing "cooldown" periods between logs, tracking daily intake, and visualizing long-term recovery patterns.

---

## ✨ Key Features

### ⏱️ Smart Cooldown Timer
- **Visual Countdown:** Features a circular SVG progress ring that tracks your current cooldown.
- **Preset Intervals:** Quick-select buttons for 45m, 60m, or 90m gaps.
- **Skip Logic:** Includes a "Skip this cigarette" feature to reinforce positive behavior.

### 📊 Deep Analytics & Insights
- **Financial & Health Tracking:** Calculates money spent and "life-time" lost based on your specific cigarette pack price and currency.
- **Urge Mapping:** Log the intensity of cravings and identify triggers (e.g., Coffee, Stress, Social, Boredom).
- **Risk Analysis:** Automatically identifies your "Most Risky Hour" based on historical data.

### 🏆 Progress & Achievements
- **Streak System:** Tracks consecutive days stayed under your self-defined daily limit.
- **Milestones:** Visual progress bars for 3, 7, 14, and 30-day goals.
- **Weekly Comparison:** Compare this week's performance against the previous week with percentage-based improvement metrics.

### ☁️ Data & Privacy
- **Local First:** All data is stored in your browser's `localStorage`.
- **Google Drive Sync:** Integrated backup and restore functionality using the Google Drive API.
- **Export/Import:** Manual JSON file handling for total data portability.

---

## 🛠️ Tech Stack

This project is built purely with **Vanilla Web Technologies**, ensuring maximum speed and offline capability without the overhead of heavy frameworks.

* **HTML5:** Semantic structure and SVG-based UI elements.
* **CSS3:** Modular architecture (Base, Layout, Timer, Analytics, etc.) with CSS variables for **Night Mode**.
* **JavaScript (ES6+):** Pure JS logic for state management, charting, and calculations.
* **PWA:** Manifest and service worker ready for "Add to Home Screen" support on iOS and Android.

---

## 📂 Project Structure

```text
assist-you/
├── index.html          # Core application & Tab structure
├── app.js              # State management & timer logic
├── drive.js            # Google Drive API & Backup logic
├── manifest.json       # PWA metadata for mobile installation
└── style/              # Modular CSS system
    ├── base.css        # Resets & Global Variables
    ├── timer.css       # SVG Ring animations
    ├── analytics.css   # Progress bars & metric cards
    ├── settings.css    # Form elements & steppers
    └── ...             # Tab-specific styling
