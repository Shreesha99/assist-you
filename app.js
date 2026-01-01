const $ = (id) => document.getElementById(id);
const jget = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const jset = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const ring = $("ring"),
  time = $("time"),
  status = $("status"),
  since = $("since");
const start = $("start"),
  pause = $("pause"),
  reset = $("reset"),
  presets = $("presets");
const today = $("today"),
  streak = $("streak"),
  chart = $("chart"),
  recent = $("recent");
const moneyToday = $("moneyToday"),
  lifeToday = $("lifeToday"),
  stepsToday = $("stepsToday"),
  timeSaved = $("timeSaved");
const limit = $("limit"),
  silent = $("silent"),
  price = $("price"),
  perpack = $("perpack");
const addPreset = $("addPreset"),
  file = $("file"),
  exportBtn = $("export"),
  toast = $("toast"),
  ding = $("ding");
const limitBar = $("limitBar"),
  limitBadge = $("limitBadge");
const undo = $("undo"),
  clearToday = $("clearToday"),
  clearAll = $("clearAll");
const achievementsBox = $("achievements"),
  insightsBox = $("insights");
const currencySel = $("currency"),
  soundSel = $("soundSel"),
  manualNight = $("manualNight");
const skipBtn = $("skip");

let minutes = 60,
  interval,
  paused = false,
  left = 0,
  urgeValue = null,
  reasonValue = null;

const CIRC = 2 * Math.PI * 80;
ring.style.strokeDasharray = CIRC;

const daily = () => jget("daily", {});
const history = () => jget("history", []);
const urgeLog = () => jget("urgeLog", []);
const skipLog = () => jget("skips", []);

function formatMinutes(m) {
  m = Math.round(m);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

function show(m) {
  toast.textContent = m;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function sinceText() {
  const t = parseInt(localStorage.getItem("last") || 0);
  const targetTop = document.getElementById("sinceTop");

  if (!t) {
    since.textContent = "";
    if (targetTop) targetTop.textContent = "";
    return;
  }

  const diff = Date.now() - t;
  const w = Math.floor(diff / 6048e5),
    dd = Math.floor((diff % 6048e5) / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5),
    m = Math.floor((diff % 36e5) / 6e4),
    s = Math.floor((diff % 6e4) / 1e3);

  let txt = "Last: ";
  if (w) txt += `${w}w `;
  if (dd) txt += `${dd}d `;
  if (h) txt += `${h}h `;
  txt += `${m}m ${s}s ago`;

  since.textContent = txt;
  if (targetTop) targetTop.textContent = txt;
}

const reminder = $("reminder");
reminder.checked = localStorage.getItem("reminder") === "true";

reminder.onchange = () => {
  localStorage.setItem("reminder", reminder.checked);
  if (reminder.checked) Notification.requestPermission();
};

setInterval(() => {
  if (!reminder.checked) return;
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  const now = new Date();
  if (now.getHours() === 10 && now.getMinutes() === 0) {
    new Notification("Check your progress today 💪");
  }
}, 60000);

// longest gap
function longestGap() {
  const h = history();
  if (h.length < 2) return "-";

  let best = 0;
  for (let i = 0; i < h.length - 1; i++) {
    best = Math.max(best, h[i] - h[i + 1]);
  }

  const m = Math.floor(best / 60000);
  return formatMinutes(m);
}

function achievementToast(msg) {
  show(`🎉 ${msg}`);
  fireConfetti();
}

function applyNightMode() {
  if (manualNight.checked) {
    document.body.classList.add("night");
    return;
  }
  const h = new Date().getHours();
  if (h >= 19 || h < 6) document.body.classList.add("night");
  else document.body.classList.remove("night");
}

// achievements
function buildAchievements() {
  const s = streakDays();
  let html = "";

  const goals = [
    { d: 3, label: "⭐ 3-day streak" },
    { d: 7, label: "🥈 7-day streak" },
    { d: 14, label: "🥇 14-day streak" },
    { d: 30, label: "🔥 30-day streak" },
  ];

  goals.forEach((g) => {
    const pct = Math.min(100, (s / g.d) * 100);
    const done = s >= g.d;

    if (done && !localStorage.getItem("ach_" + g.d)) {
      localStorage.setItem("ach_" + g.d, "true");
      achievementToast(`${g.d}-day streak unlocked!`);
    }

    html += `
      <div class="funCard" style="flex-direction: column; align-items: flex-start;">
        <div style="display:flex; justify-content:space-between; width:100%; font-size:.85rem;">
          <div>${g.label}</div>
          <div style="opacity:.8">${Math.min(s, g.d)} / ${g.d}</div>
        </div>
        <div style="width:100%;height:8px;border-radius:10px;background:#1f1f1f;margin-top:6px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${
      done ? "#4ade80" : "#38bdf8"
    };transition:.3s;"></div>
        </div>
      </div>`;
  });

  achievementsBox.innerHTML = html;
}

// logs
function logCig() {
  const d = daily(),
    k = new Date().toDateString();
  d[k] = (d[k] || 0) + 1;
  jset("daily", d);
}

function pushHistory() {
  const h = history();
  h.unshift(Date.now());
  jset("history", h);
}

// streak
function streakDays() {
  const d = daily();
  const lim = parseInt(limit.value || 8);
  const now = Date.now();
  let s = 0;
  let seenAny = false;

  for (let i = 0; i < 60; i++) {
    const k = new Date(now - i * 864e5).toDateString();
    if (!(k in d)) break;
    seenAny = true;
    if (d[k] > lim) break;
    s++;
  }

  return seenAny ? s : 0;
}

// dashboard summaries
function updateMoneyAndHealth() {
  const d = daily(),
    k = new Date().toDateString(),
    n = d[k] || 0;
  const perCig =
    parseFloat(price.value || 200) / parseFloat(perpack.value || 20);
  const cur = currencySel.value || "₹";
  moneyToday.textContent = cur + (n * perCig).toFixed(0);
  lifeToday.textContent = `~${n * 11} min`;
  stepsToday.textContent = `~${(n * 700).toLocaleString()} steps`;

  const skips = skipLog().filter(
    (x) => new Date(x).toDateString() === k
  ).length;

  timeSaved.textContent = `${formatMinutes(skips * minutes)} saved`;

  $("skipsCount").textContent = `${skips} skipped`;

  const lim = parseInt(limit.value || 8),
    pct = Math.min(100, (n / lim) * 100);
  limitBar.style.width = pct + "%";

  if (n === 0) {
    limitBadge.textContent = "Great start!";
    limitBadge.className = "badge good";
  } else if (n < lim) {
    limitBadge.textContent = "Under limit";
    limitBadge.className = "badge good";
  } else if (n === lim) {
    limitBadge.textContent = "Limit reached";
    limitBadge.className = "badge warn";
  } else {
    limitBadge.textContent = "Over limit";
    limitBadge.className = "badge danger";
  }
}

function updateCounts() {
  const d = daily(),
    k = new Date().toDateString(),
    n = d[k] || 0;
  today.textContent = n + " cig";
  $("bestGap").textContent = longestGap();

  sinceText();
  streak.textContent = streakDays() + " days";
  updateMoneyAndHealth();
  buildAchievements();
  buildInsights();
}

function sinceText() {
  const t = parseInt(localStorage.getItem("last") || 0);
  if (!t) {
    since.textContent = "";
    return;
  }
  const diff = Date.now() - t;
  const w = Math.floor(diff / 6048e5),
    dd = Math.floor((diff % 6048e5) / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5),
    m = Math.floor((diff % 36e5) / 6e4),
    s = Math.floor((diff % 6e4) / 1e3);

  let txt = "Last: ";
  if (w) txt += `${w}w `;
  if (dd) txt += `${dd}d `;
  if (h) txt += `${h}h `;
  txt += `${m}m ${s}s ago`;
  since.textContent = txt;
}
setInterval(sinceText, 1000);

// mini chart
function draw() {
  const ctx = chart.getContext("2d");
  ctx.clearRect(0, 0, chart.width, chart.height);

  const d = daily(),
    now = Date.now(),
    bars = [];

  for (let i = 6; i >= 0; i--) {
    const k = new Date(now - i * 864e5).toDateString();
    bars.push(d[k] || 0);
  }

  const max = Math.max(5, ...bars),
    w = (chart.width - 20) / 7;

  ctx.strokeStyle = "#333";
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(10, 120);
  ctx.lineTo(chart.width - 10, 120);
  ctx.stroke();

  ctx.fillStyle = "#4ade80";
  bars.forEach((v, i) => {
    const h = (v / max) * 100;
    ctx.fillRect(12 + i * w, 120 - h, w - 14, h);
  });

  recent.textContent =
    "Recent: " +
    history()
      .slice(0, 4)
      .map((t) => new Date(t).toLocaleTimeString())
      .join(" · ");
}

/* ---- PROGRESS TAB UPGRADES (NO EXISTING CODE CHANGED) ---- */

function enhanceProgress() {
  const box = document.querySelector("#tab-progress .metricBox");
  if (!box) return;

  // remove previous injected section (so it refreshes cleanly)
  const old = box.querySelector(".progress-extra");
  if (old) old.remove();

  const d = daily();
  const now = Date.now();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const k = new Date(now - i * 864e5).toDateString();
    days.push({ label: k.slice(0, 3), value: d[k] || 0 });
  }

  const total = days.reduce((a, b) => a + b.value, 0);
  const avg = (total / 7).toFixed(1);

  const best = [...days].sort((a, b) => a.value - b.value)[0];

  const wrap = document.createElement("div");
  wrap.className = "progress-extra";

  wrap.innerHTML = `
    <div class="funCard">📊 Weekly average — <span>${avg} cig/day</span></div>
    <div class="funCard">🏅 Best day — <span>${best.label}: ${
    best.value
  } cig</span></div>

    <div class="funCard" style="flex-direction:column;align-items:flex-start">
      <div style="opacity:.8;margin-bottom:4px;font-size:.78rem">Last 7 days</div>
      ${days
        .map(
          (d) =>
            `<div style="display:flex;justify-content:space-between;width:100%;font-size:.8rem">
              <span>${d.label}</span>
              <span>${d.value}</span>
            </div>`
        )
        .join("")}
    </div>
  `;

  box.appendChild(wrap);
}

// monkey-patch draw() to refresh our new section too
const _origDraw = draw;
draw = function () {
  _origDraw();
  enhanceProgress();
};

/* ---- PROGRESS TAB: MORE STATS ---- */

function enhanceProgressMore() {
  const box = document.querySelector("#tab-progress .metricBox");
  if (!box) return;

  // clear if re-rendering
  const old = box.querySelector(".progress-extra-2");
  if (old) old.remove();

  const d = daily();
  const now = Date.now();

  const last7 = [];
  const prev7 = [];

  for (let i = 6; i >= 0; i--) {
    const k = new Date(now - i * 864e5).toDateString();
    last7.push(d[k] || 0);
  }

  for (let i = 13; i >= 7; i--) {
    const k = new Date(now - i * 864e5).toDateString();
    prev7.push(d[k] || 0);
  }

  const totalThis = last7.reduce((a, b) => a + b, 0);
  const totalPrev = prev7.reduce((a, b) => a + b, 0);

  let changeText = "-";
  let changeEmoji = "➖";

  if (totalPrev > 0) {
    const diff = totalThis - totalPrev;
    const pct = Math.abs((diff / totalPrev) * 100).toFixed(1);
    if (diff < 0) {
      changeText = `↓ ${pct}% better`;
      changeEmoji = "💚";
    } else if (diff > 0) {
      changeText = `↑ ${pct}% worse`;
      changeEmoji = "⚠️";
    }
  }

  // streak summary (uses your existing streakDays())
  const streak = streakDays();

  const wrap = document.createElement("div");
  wrap.className = "progress-extra-2";

  wrap.innerHTML = `
    <div class="funCard">📦 Weekly total — <span>${totalThis} cigarettes</span></div>
    <div class="funCard">${changeEmoji} Compared to last week — <span>${changeText}</span></div>
    <div class="funCard">🔥 Current streak — <span>${streak} days</span></div>
  `;

  box.appendChild(wrap);
}

// patch current draw hook again to include these too
const _draw2 = draw;
draw = function () {
  _draw2();
  enhanceProgressMore();
};

// presets
function renderPresets() {
  const arr = jget("presets", [60, 45, 90]);
  presets.innerHTML = "";
  arr.forEach((m) => {
    const d = document.createElement("div");
    d.className = "pill" + (m === minutes ? " active" : "");
    d.textContent = m + "m";
    d.onclick = () => {
      minutes = m;
      renderPresets();
    };
    presets.appendChild(d);
  });
}

// insights
function buildInsights() {
  const u = urgeLog();
  const todayKey = new Date().toDateString();

  const todayUrges = u.filter((x) => new Date(x.t).toDateString() === todayKey);

  const d = daily();
  const todayCount = d[todayKey] || 0;
  const lim = parseInt(limit.value || 8);

  let avgText = "-";

  if (todayUrges.length) {
    const avg = todayUrges.reduce((a, b) => a + b.v, 0) / todayUrges.length;

    const pressure = Math.min(5, avg * (todayCount / lim) || 0);
    avgText = pressure.toFixed(1) + "/5";
  }

  const hours = {};
  history().forEach((t) => {
    const h = new Date(t).getHours();
    hours[h] = (hours[h] || 0) + 1;
  });

  const best = Object.entries(hours).sort((a, b) => b[1] - a[1])[0] || [
    null,
    0,
  ];
  const riskyText = best[0] !== null ? best[0] + ":00" : "-";

  insightsBox.innerHTML = `
    <div class="funCard">📈 Urge pressure (adjusted): <span>${avgText}</span></div>
    <div class="funCard">⏰ Most risky hour: <span>${riskyText}</span></div>
  `;

  const reasons = {};
  urgeLog().forEach((u) => {
    if (u.reason) reasons[u.reason] = (reasons[u.reason] || 0) + 1;
  });

  const sorted = Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const icons = {
    Coffee: "☕",
    Stress: "😤",
    Bored: "😴",
    Social: "🍻",
    "After food": "🍽️",
    Driving: "🚗",
  };

  let reasonHtml = sorted.length
    ? sorted
        .map(
          (r) =>
            `<div class="funCard">${icons[r[0]] || "🔎"} ${r[0]} — <span>${
              r[1]
            } urges</span></div>`
        )
        .join("")
    : `<div class="funCard">🔎 <span>Log urges to see patterns</span></div>`;

  insightsBox.innerHTML += reasonHtml;

  let msg = "";
  if (streakDays() >= 5)
    msg = "You’re doing great — consider lowering your limit by 1 next week.";
  else msg = "Focus on staying under your limit consistently first.";

  insightsBox.innerHTML += `<div class="funCard">🎯 <span>${msg}</span></div>`;
}

/* ---- INSIGHTS: EXTRA ANALYTICS ---- */

function enhanceInsights() {
  const box = document.getElementById("insights");
  if (!box) return;

  // avoid duplicates on refresh
  const old = box.querySelector(".insights-extra");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.className = "insights-extra";

  const d = daily();
  const h = history();
  const skips = skipLog();

  // --- 1) Weekend vs Weekday ---
  let weekend = 0,
    weekday = 0;
  Object.entries(d).forEach(([k, v]) => {
    const day = new Date(k).getDay();
    if (day === 0 || day === 6) weekend += v;
    else weekday += v;
  });

  const wwMsg =
    weekend < weekday
      ? "You smoke less on weekends 🎉"
      : weekend > weekday
      ? "Weekends seem riskier — plan distractions 📅"
      : "Pretty balanced across the week";

  // --- 2) Skip success rate ---
  const totalLogs = h.length;
  const skipRate = totalLogs
    ? Math.min(100, ((skips.length / totalLogs) * 100).toFixed(1))
    : "-";

  // --- 3) Most improved day ---
  const now = Date.now();
  let changeMsg = "-";

  const thisWeek = [];
  const lastWeek = [];

  for (let i = 6; i >= 0; i--) {
    thisWeek.push(d[new Date(now - i * 864e5).toDateString()] || 0);
  }
  for (let i = 13; i >= 7; i--) {
    lastWeek.push(d[new Date(now - i * 864e5).toDateString()] || 0);
  }

  if (thisWeek.length === 7 && lastWeek.length === 7) {
    let bestDay = null;
    let bestDiff = 0;

    thisWeek.forEach((v, i) => {
      const diff = (lastWeek[i] || 0) - v;
      if (diff > bestDiff) {
        bestDiff = diff;
        bestDay = i;
      }
    });

    if (bestDay !== null) {
      const label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][bestDay];
      changeMsg = `${label} improved most — ${bestDiff} fewer cig`;
    }
  }

  // --- 4) Suggestion tip ---
  let tip = "Log urges — they reveal powerful patterns.";
  if (skipRate !== "-" && skipRate >= 20)
    tip = "Great skipping habit — try pushing your cooldown +5 min.";
  else if (streakDays() >= 7)
    tip = "Strong streak — consider lowering your limit slightly.";
  else if (weekend > weekday)
    tip = "Weekends are tricky — plan non-smoke activities ahead.";

  wrap.innerHTML = `
    <div class="funCard">📅 Weekends vs weekdays — <span>${wwMsg}</span></div>
    <div class="funCard">🙅 Skip success rate — <span>${skipRate}%</span></div>
    <div class="funCard">📉 Biggest improvement — <span>${changeMsg}</span></div>
    <div class="funCard">💡 Tip — <span>${tip}</span></div>
  `;

  box.appendChild(wrap);
}

// patch insights renderer so extras load automatically
const _oldInsights = buildInsights;
buildInsights = function () {
  _oldInsights();
  enhanceInsights();
};

// notifications
function notify() {
  if (!silent.checked) {
    if ("vibrate" in navigator) navigator.vibrate(300);
    if (soundSel.value !== "off") {
      try {
        ding.play();
      } catch {}
    }
  }
  if ("Notification" in window && Notification.permission === "granted")
    new Notification("Cooldown done", { body: "You can smoke now" });

  show("Cooldown finished");
  ring.classList.remove("cooling");
}

// timer engine
function tick(end, total) {
  const rem = end - Date.now();
  if (rem <= 0) {
    clearInterval(interval);
    localStorage.removeItem("until");
    localStorage.removeItem("total");
    ring.style.strokeDashoffset = 0;
    time.textContent = "00:00";
    start.style.display = "block";
    pause.style.display = "none";
    status.textContent = "Done";
    paused = false;
    notify();
    return;
  }

  left = rem;
  const m = Math.floor(rem / 6e4),
    s = Math.floor((rem % 6e4) / 1e3);
  time.textContent = `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
  ring.style.strokeDashoffset = CIRC * (1 - rem / total);
  if (!paused) ring.classList.add("cooling");
  else ring.classList.remove("cooling");

  status.textContent = paused ? "Paused" : coolingMessage(rem);

  enhanceTimer();
}

// START button
start.onclick = async () => {
  const ok = await niceConfirm("Log a cigarette and start cooldown?");
  if (!ok) return false;

  const lim = parseInt(limit.value || 8),
    d = daily(),
    k = new Date().toDateString();
  if ((d[k] || 0) >= lim) show("Limit reached today");

  const dur = minutes * 6e4,
    end = Date.now() + dur;

  localStorage.setItem("until", end);
  localStorage.setItem("last", Date.now());
  localStorage.setItem("total", dur);

  logCig();
  pushHistory();

  updateCounts();
  draw();

  start.style.display = "none";
  pause.style.display = "block";
  paused = false;

  interval = setInterval(() => tick(end, dur), 1000);
  tick(end, dur);

  return true;
};

// pause/resume
pause.onclick = () => {
  if (!paused) {
    paused = true;
    clearInterval(interval);
    localStorage.setItem("remain", left);
    localStorage.removeItem("until");
    pause.textContent = "Resume";
  } else {
    paused = false;
    pause.textContent = "Pause";
    const left = parseInt(localStorage.getItem("remain") || 0),
      total = parseInt(localStorage.getItem("total")) || minutes * 6e4,
      end = Date.now() + left;
    localStorage.removeItem("remain");
    localStorage.setItem("until", end);
    interval = setInterval(() => tick(end, total), 1000);
    tick(end, total);
  }
};

// reset
reset.onclick = () => {
  clearInterval(interval);
  localStorage.removeItem("until");
  localStorage.removeItem("remain");
  localStorage.removeItem("total");
  ring.style.strokeDashoffset = 0;
  time.textContent = "00:00";
  start.style.display = "block";
  pause.style.display = "none";
  status.textContent = "";
};

// confetti
function fireConfetti() {
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight - 6;

  const gravity = 0.12;
  const drag = 0.992;

  const pieces = Array.from({ length: 70 }, () => {
    const spread = ((Math.random() - 0.5) * Math.PI) / 1.5;
    const power = 3.2 + Math.random() * 2.5;

    return {
      x: originX,
      y: originY,
      vx: Math.sin(spread) * power,
      vy: -Math.cos(spread) * power * 1.25,
      size: 5 + Math.random() * 4,
      color: `hsl(${Math.random() * 360}, 85%, 60%)`,
      life: 1,
    };
  });

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    pieces.forEach((p) => {
      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;

      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.01;

      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(draw);
  }

  draw();
  setTimeout(() => canvas.remove(), 2600);
}

// skip button
skipBtn.onclick = async () => {
  const ok = await niceConfirm("Skip this cigarette and log it as resisted?");
  if (!ok) return;

  const s = skipLog();
  s.push(Date.now());
  jset("skips", s);

  show("Logged as skipped — proud of you 👊");
  fireConfetti();
  updateCounts();
};

// add preset
addPreset.onchange = () => {
  const v = parseInt(addPreset.value || 0);
  if (!v || v <= 0) return;

  const arr = jget("presets", [60, 45, 90]);
  if (!arr.includes(v)) arr.push(v);

  jset("presets", arr);
  addPreset.value = "";
  renderPresets();
  show("Preset added");
};

// settings persistence
silent.checked = localStorage.getItem("silent") === "true";
silent.onchange = () => localStorage.setItem("silent", silent.checked);

// ----- DAILY LIMIT (STEPPER + PERSIST) -----

const limitMinus = $("limitMinus");
const limitPlus = $("limitPlus");
const limitDisplay = $("limitDisplay");

// always load from storage (fallback = 8)
limit.value = parseInt(localStorage.getItem("limit") || "8");
limitDisplay.textContent = limit.value;

function saveLimit(v) {
  limit.value = v;
  limitDisplay.textContent = v;
  localStorage.setItem("limit", v);
  updateCounts();
}

limitMinus.onclick = () => {
  let v = parseInt(limit.value);
  if (v > 1) saveLimit(v - 1);
};

limitPlus.onclick = () => {
  let v = parseInt(limit.value);
  if (v < 40) saveLimit(v + 1);
};

price.value = localStorage.getItem("price") || 200;
price.onchange = () => {
  localStorage.setItem("price", price.value);
  updateMoneyAndHealth();
};

perpack.value = localStorage.getItem("perpack") || 20;
perpack.onchange = () => {
  localStorage.setItem("perpack", perpack.value);
  updateMoneyAndHealth();
};

currencySel.value = localStorage.getItem("currency") || "₹";
currencySel.onchange = () => {
  localStorage.setItem("currency", currencySel.value);
  updateMoneyAndHealth();
};

soundSel.value = localStorage.getItem("sound") || "ding";
soundSel.onchange = () => localStorage.setItem("sound", soundSel.value);

manualNight.checked = localStorage.getItem("manualNight") === "true";
manualNight.onchange = () => {
  localStorage.setItem("manualNight", manualNight.checked);
  applyNightMode();
};

// export
exportBtn.onclick = () => {
  const data = {
    daily: daily(),
    history: history(),
    presets: jget("presets", [60, 45, 90]),
    urgeLog: urgeLog(),
    skips: skipLog(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "smoketimer-backup.json";
  a.click();
};

// import file
file.onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;

  f.text().then((t) => {
    try {
      const d = JSON.parse(t);
      Object.entries(d).forEach(([k, v]) => jset(k, v));
      show("Restored");
      location.reload();
    } catch {
      show("Invalid file");
    }
  });
};

// undo
undo.onclick = () => {
  let h = history(),
    d = daily();
  if (!h.length) return show("Nothing to undo");

  const last = h.shift();
  jset("history", h);

  const dayKey = new Date(last).toDateString();
  if (d[dayKey] && d[dayKey] > 0) {
    d[dayKey]--;
    if (d[dayKey] === 0) delete d[dayKey];
    jset("daily", d);
  }

  show("Last entry removed");
  updateCounts();
  draw();
};

// clear today
clearToday.onclick = async () => {
  const ok = await niceConfirm("🗑️ Clear only TODAY'S records?");
  if (!ok) return;

  const d = daily();
  const key = new Date().toDateString();
  delete d[key];
  jset("daily", d);

  show("Today cleared");
  updateCounts();
  draw();
};

// clear all
clearAll.onclick = async () => {
  const ok = await niceConfirm(
    "🗑️ Delete ALL data — cigarettes, urges, skips, streaks, everything?"
  );
  if (!ok) return;

  localStorage.removeItem("daily");
  localStorage.removeItem("history");
  localStorage.removeItem("urgeLog");
  localStorage.removeItem("skips");

  [3, 7, 14, 30].forEach((d) => localStorage.removeItem("ach_" + d));

  localStorage.removeItem("last");
  localStorage.removeItem("until");
  localStorage.removeItem("total");
  localStorage.removeItem("remain");

  show("All data cleared");
  updateCounts();
  draw();
};

// urge popup (post-smoke)
const urgePopup = document.getElementById("urgePopup");
const pUrges = document.getElementById("pUrges");
const pReasons = document.getElementById("pReasons");
const pSave = document.getElementById("pSave");
const pSkipPopup = document.getElementById("pSkip");

let pVal = null,
  pReason = null;

pUrges.querySelectorAll(".urge-btn").forEach((b) => {
  b.onclick = () => {
    pUrges
      .querySelectorAll(".urge-btn")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    pVal = parseInt(b.dataset.v);
  };
});

pReasons.querySelectorAll(".reason").forEach((b) => {
  b.onclick = () => {
    pReasons
      .querySelectorAll(".reason")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    pReason = b.dataset.r;
  };
});

function askUrgePopup() {
  urgePopup.style.display = "flex";
  pVal = null;
  pReason = null;

  return new Promise((resolve) => {
    pSave.onclick = () => {
      urgePopup.style.display = "none";

      if (pVal) {
        const arr = JSON.parse(localStorage.getItem("urgeLog") || "[]");
        arr.push({
          t: Date.now(),
          v: pVal,
          skipped: false,
          reason: pReason || null,
        });
        localStorage.setItem("urgeLog", JSON.stringify(arr));
      }
      resolve();
    };

    pSkipPopup.onclick = () => {
      urgePopup.style.display = "none";
      resolve();
    };
  });
}

// confirm dialog
const confirmWrap = $("confirmWrap"),
  confirmMsg = $("confirmMsg"),
  confirmYes = $("confirmYes"),
  confirmNo = $("confirmNo");

function niceConfirm(message) {
  return new Promise((resolve) => {
    confirmMsg.textContent = message;
    confirmWrap.style.display = "flex";

    const close = (v) => {
      confirmWrap.style.display = "none";
      confirmYes.onclick = confirmNo.onclick = null;
      resolve(v);
    };

    confirmYes.onclick = () => close(true);
    confirmNo.onclick = () => close(false);
  });
}

// patch start to show urge popup
const _origStart = start.onclick;
start.onclick = async (...args) => {
  const didLog = await _origStart.apply(start, args);
  if (didLog) await askUrgePopup();
};

/* ---- TIMER TAB ENHANCEMENTS ---- */

function enhanceTimer() {
  const card = document.querySelector("#tab-timer .card");
  if (!card) return;

  let extra = document.getElementById("timer-extra");
  if (!extra) {
    extra = document.createElement("div");
    extra.id = "timer-extra";
    extra.style.marginTop = "10px";
    card.appendChild(extra);
  }

  const d = daily();
  const k = new Date().toDateString();
  const todayCount = d[k] || 0;
  const lim = parseInt(limit.value || 8);

  // cigarettes left today
  const left = Math.max(0, lim - todayCount);

  // cooldown recommender (slightly pushes user, but realistic)
  const gaps = history()
    .slice(0, 8)
    .map((t, i, a) => (a[i + 1] ? Math.floor((t - a[i + 1]) / 60000) : null))
    .filter(Boolean);

  const avg = gaps.length
    ? Math.round(
        gaps.reduce((a, b) => a + b, 0) / gaps.length + 5 /* tiny push */
      )
    : minutes;

  // motivational tip
  let tip = "Log urges when they happen they reveal triggers.";
  if (left === 0) tip = "Limit reached focus on stretching the gaps. 💪";
  else if (streakDays() >= 5) tip = "Great streak. Tiny increases work best.";
  else if (avg > minutes) tip = "You’re already improving keep going.";
  else if (todayCount === 0) tip = "Perfect start today. Stay steady.";

  extra.innerHTML = `
    <div class="funCard">⏳ Suggested next cooldown — <span>${formatMinutes(
      avg
    )}</span></div>
    <div class="funCard">📦 Cigarettes left today — <span>${left}</span></div>
    <div class="funCard">💡 Tip — <span>${tip}</span></div>
  `;
}

function coolingMessage(remMs) {
  const mins = Math.ceil(remMs / 60000);
  const s = streakDays();

  const list = [
    "Buying you some willpower…",
    "Your lungs are loving this 😌",
    "Cravings fade — you don’t.",
    "Stretching the gap = winning.",
    "Future-you says thanks 🙏",
    "Breathe. You’ve got this.",
  ];

  if (mins <= 1) return "Almost there… stay with it 👀";
  if (mins <= 5) return "Short cooldown — perfect discipline.";
  if (s >= 5) return "Streak mindset — small wins stack 💪";
  return list[Math.floor(Date.now() / 5000) % list.length];
}

// init
(function init() {
  renderPresets();
  updateCounts();
  enhanceTimer();

  if (localStorage.getItem("until")) {
    start.style.display = "none";
    pause.style.display = "block";

    const until = parseInt(localStorage.getItem("until"));
    const total = parseInt(localStorage.getItem("total")) || minutes * 6e4;

    requestAnimationFrame(() => tick(until, total));
    interval = setInterval(() => tick(until, total), 1000);
  }

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

  if ("Notification" in window && Notification.permission === "default")
    Notification.requestPermission();

  applyNightMode();
  draw();
})();
