# 📊 BigQuery Release Notes Tracker

A premium, dark-themed, glassmorphic web dashboard built using **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that fetches Google Cloud's BigQuery Release Notes, parses them, organizes them, and allows sharing specific updates directly on **X (formerly Twitter)**.

---

## ✨ Features

- **🚀 Live Feed Integration**: Fetches release notes from the official [Google Cloud Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml).
- **🧩 Smart Note Splitting**: Release notes are grouped by date in the source XML, but this app splits them by `<h3>` tags to present every feature, deprecation, and issue as an individual, clean card.
- **📊 Real-time Dashboard Analytics**: Displays animated counters for Total Updates, Features, and Issues/Fixes, alongside the Latest Release Date.
- **🔍 Quick Search & Filter**:
  - Filter updates instantly using interactive Category Chips (*Features, Issues, Changes, Announcements, Other*).
  - Search notes dynamically using the real-time search box.
- **🐦 Custom X (Twitter) Composer Modal**: 
  - Preview card summary before tweeting.
  - Interactive tweet draft editor with a live character counter (280 limit indicator).
  - Smart hashtag helpers (`#BigQuery`, `#GoogleCloud`, `#DataAnalytics`).
  - Seamless publishing using the X Web Intent API.
- **⏳ Loading Skeleton Screens**: Sleek shimmery placeholder cards load while fetching to ensure a smooth, premium user experience.
- **🛡️ Resilient Caching & Offline Fallback**: In-memory caching for 5 minutes limits API overhead. If the live feed fails (e.g. rate limit, offline), the server falls back to cached data and alerts the user transparently.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, Flask
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Grid, Flexbox, Variable Tokens, Backdrop Blur), Vanilla ES6 JavaScript
- **Icons**: Lucide Icons CDN
- **Fonts**: *Plus Jakarta Sans* (Body/UI) & *Outfit* (Metrics/Headers) via Google Fonts

---

## 🚀 Setup & Launch Instructions

### Prerequisites
Make sure you have **Python 3.12** or higher installed. (If you ran the automated workspace script, it's already set up!)

### Step 1: Clone or Open Workspace
Navigate to the directory containing this project:
```bash
cd C:\Users\tourm\agy-cli-projects\bq-release-notes
```

### Step 2: Set Up Virtual Environment & Install Dependencies
A virtual environment `venv` is already created for you in this workspace. Activate it and install dependencies:

**On Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**On macOS/Linux:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Run the Server
Launch the Flask development server:
```bash
python app.py
```
By default, the server will start at: **`http://127.0.0.1:5000`**

### Step 4: Open Dashboard
Open your web browser and go to `http://127.0.0.1:5000` to start exploring BigQuery Release Notes and tweeting about updates!

---

## 📂 Project Structure

```
bq-release-notes/
├── app.py                  # Flask server containing feed fetch, parsing, and caching API
├── requirements.txt        # Flask dependency specification
├── README.md               # Setup and launch guide
├── templates/
│   └── index.html          # Structure template with metrics, feed containers, skeletons, and modal
└── static/
    ├── css/
    │   └── styles.css      # Premium styling (Glassmorphism, color schemes, animations, layout)
    └── js/
        └── app.js          # Client-side state, event handlers, filtering, rendering, and tweeting
```
