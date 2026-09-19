# SleepLab — 30-Day Personal Sleep & Recovery Experiment

**SleepLab** is a personal 30-day N=1 longitudinal sleep and recovery tracking application built to collect repeated observations over time, examine empirical patterns between sleep duration, consistency, subjective recovery, cognitive alertness, and daily functioning, and export research-notebook reports.

---

## 🔬 Experimental Methodology & Design Philosophy

SleepLab treats personal sleep tracking as a rigorous empirical experiment:
- **Consistent Data Collection**: Fast, minimal friction daily logging (~2 minutes).
- **Raw Data Preservation**: Raw observations (lights out time, sleep time, wake time, awakenings, subjective ratings 1–10) are strictly preserved separately from computed metrics.
- **Calculated Recovery Index**: Unweighted daily index ($Score / 50$ and $\%$ score) calculated automatically from 5 core subjective markers:
  1. Morning Alertness (1–10)
  2. Mood (1–10)
  3. Skin Health Observation (1–10)
  4. Muscle Fullness (1–10)
  5. Afternoon Energy (1–10)
- **Local Privacy**: 100% client-side persistence in browser `localStorage` with zero backend requirement.

---

## 🚀 Features & Phase Progress

- [x] **Phase 1 — Data Collection MVP**
  - Daily logging form for Sleep, Morning Assessment, Recovery, Afternoon Functioning, Evening Readiness, and Potential Confounding Factors.
  - Automatic sleep duration calculation handling overnight midnight crossing.
  - Real-time Recovery Index score calculation.
  - Canonical date protection (1 entry per calendar day).
- [x] **Phase 2 — Research-Style Daily Reports**
  - Scientific paper view for every logged day.
  - Section hierarchy (`01 — Sleep Parameters`, `02 — Morning Assessment`, `03 — Physical Recovery`, `04 — Afternoon Functioning`, `05 — Evening Readiness & Notes`, `06 — Confounding Factors`).
  - Sequential day navigation (`← Previous Day` / `Next Day →`).
- [x] **Phase 2.1 & 2.2 — Dual Presentation Print / PDF Export**
  - Interactive Web Dashboard for screen use + Dedicated 2-Page Print Layout for PDF exports.
  - **Page 1**: All 6 mandatory core experimental sections formatted with compact line-height.
  - **Page 2**: Section 07 Additional (user custom metrics) + Document Signoff Footer.
  - Suppresses browser URLs (`localhost:3000`), timestamps, and default headers.
- [x] **Phase 2.3 — Custom Additional Metrics**
  - Section 07 user-defined tracking (Checkbox, Slider, Number with units, Time, Duration, Text).
  - Metric templates persist in `localStorage` and automatically populate future daily logs.
  - Archiving support (hides metrics from future logs while preserving historical records on past reports).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/SleepLab.git
cd SleepLab
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
```

---

## 📜 License

Private Personal Research Project. All rights reserved.
