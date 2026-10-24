# ⚡ WorkshopHub — The Modern Tech Atelier

> *Code with craft. Build with soul & scale.*

WorkshopHub is an editorial, high-performance web platform for project-driven engineering masterclasses. Built with a fluid design system, real-time Google Sheets cohort synchronization, and secure Supabase authentication.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-API%20v4-34A853?style=flat-square&logo=googlesheets&logoColor=white)](https://developers.google.com/sheets/api)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌟 Key Features

### 🎨 Editorial Atelier Design System
- **Curated Color Themes**: Includes an interactive 4-palette theme switcher:
  - 🌾 **Cashmere Linen**: Warm ivory, deep pine, spiced saffron, antique gold.
  - 🌲 **Highland Pine**: Sage paper, deep forest green, jade, terracotta.
  - 🌌 **Obsidian Dark**: Sleek deep space slate, neon flame, cyan highlights.
  - 🔮 **Royal Iris**: Twilight navy, violet indigo, golden accent.
- **Fluid & Fully Responsive**: Built mobile-first using CSS `clamp()`, dynamic viewport units (`100dvh`), and custom CSS variables.
- **Micro-Interactions**: Smooth card elevations, custom category pill toolbar with horizontal scroll, live indicator dots, and accessible dialogs.

### ⚡ Curriculum & Workshop Catalog
- **Multi-Track Filter Toolbar**: Instant client-side filtering across AI & ML, Backend, Full-Stack Web, Cloud & DevOps, Cybersecurity, and Data Pipelines.
- **Seat Capacity Counters**: Real-time capacity vs. enrolled tracking with dynamic status badges (`FLAGSHIP`, `POPULAR`, `INTERMEDIATE`, `ADVANCED`).
- **Deep Workshop Detail Pages**: Comprehensive curriculum outlines, prerequisites, instructor profiles, and quick enrollment modals.

### 🔐 Supabase Authentication
- **User Authentication**: Secure signup, login, session persistence, and logout powered by Supabase GoTrue Auth JS SDK v2.
- **Dynamic Client Injection**: Automatically configures the client-side Supabase SDK using server environment variables.
- **Protected Student Dashboard**: Personalized booking overview and account status.

### 📊 Real-Time Google Sheets Cohort Logging
- **Instant Reservation Sync**: Every confirmed seat reservation is securely appended in real-time to Google Sheets via Google Service Account OAuth2 and `gspread`.
- **Structured Schema**: Automatically writes `[Timestamp, Name, Email, Workshop Title, Date, Level]`.
- **Graceful Degradation**: Fallback local logging ensures reservations are never lost if external APIs encounter network timeouts.

### 📡 Telemetry & Analytics Pipeline
- Built-in `/api/activity` endpoint capturing client telemetry (page views, track filter selections, theme toggles, and reservation conversion funnels).

---

## 🏗️ Project Architecture

```
project-ai/
├── api/
│   └── index.py            # Flask application entry point, routes & Google Sheets handler
├── static/
│   ├── css/
│   │   └── style.css       # Complete Atelier Design System & responsive styles
│   └── js/
│       ├── app.js          # Client-side routing, filtering, telemetry & UI logic
│       └── auth.js         # Supabase client wrapper & session management
├── templates/
│   ├── base.html           # Shared layout, navigation, auth modal & footer
│   ├── index.html          # Homepage with Hero, Tracks, Curriculum & Reservation form
│   ├── workshops.html      # Comprehensive searchable workshops catalog
│   ├── workshop_detail.html# Single workshop breakdown & enrollment
│   ├── dashboard.html      # User dashboard & enrolled tracks
│   ├── auth.html           # Standalone authentication page
│   └── 404.html            # Custom 404 error page
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules (protects .env and build artifacts)
├── requirements.txt        # Python package dependencies
├── run.py                  # Local development runner
└── vercel.json             # Vercel serverless deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- A [Supabase](https://supabase.com) account & project
- A [Google Cloud Console](https://console.cloud.google.com) Service Account with Google Sheets API enabled

### 1. Clone the Repository
```bash
git clone https://github.com/CHIRAYU-365/project-ai.git
cd project-ai
```

### 2. Create and Activate Virtual Environment
```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the project root (see [`.env.example`](.env.example)):

```ini
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Sheets Configuration
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_SHEETS_CREDENTIALS={"type": "service_account", "project_id": "...", ...}

# Flask Security
FLASK_SECRET_KEY=generate-a-random-32-byte-hex-key
```

> **Google Sheet Setup**: Open your Google Sheet, click **Share**, and grant **Editor** access to the `client_email` specified in your `GOOGLE_SHEETS_CREDENTIALS`.

### 5. Run Locally
```bash
python run.py
```
Visit `http://127.0.0.1:5000` in your browser.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `SUPABASE_URL` | **Yes** | Base URL for your Supabase project instance (e.g. `https://xyz.supabase.co`). |
| `SUPABASE_ANON_KEY` | **Yes** | Client-safe anonymous public API key for browser authentication. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Admin secret key for backend administrative tasks. |
| `GOOGLE_SHEET_ID` | **Yes** | Spreadsheet ID extracted from the Google Sheet URL `/d/<ID>/edit`. |
| `GOOGLE_SHEETS_CREDENTIALS` | **Yes** | Service Account JSON string downloaded from Google Cloud Console. |
| `FLASK_SECRET_KEY` | **Yes** | Random secret string for signing session cookies. |

---

## ☁️ Deployment on Vercel

This repository is pre-configured for seamless deployment to **Vercel**:

1. Push your code to GitHub:
   ```bash
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and click **Import** on the `project-ai` repository.
3. Keep the defaults (**Framework Preset**: `Other`, **Root Directory**: `./`).
4. Add the 6 variables from your `.env` into the **Environment Variables** section.
5. Click **Deploy**.

Vercel will package `api/index.py` using `@vercel/python`, serve static assets via edge CDN, and bundle the Jinja templates defined in `vercel.json`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
