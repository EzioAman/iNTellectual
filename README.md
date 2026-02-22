# 🎮 Game Drifters — Valorant Analytics Dashboard

<div align="center">

![Streamlit](https://img.shields.io/badge/Built%20With-Streamlit-ff4b4b?style=for-the-badge\&logo=streamlit)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge\&logo=python)
![Google Sheets](https://img.shields.io/badge/Data-Google%20Sheets-34A853?style=for-the-badge\&logo=google-sheets)
![API](https://img.shields.io/badge/API-HenrikDev%20Valorant-red?style=for-the-badge)

### ⚡ Live Esports Performance Intelligence Platform

**Track. Analyze. Improve. Win.**

👉 **Live App:** https://intellectual.streamlit.app/

</div>

---

## 🧠 Overview

**Game Drifters Analytics** is a real-time Valorant team performance dashboard built for competitive teams.

It automatically pulls match data, evaluates player performance, and visualizes analytics used for roster decisions, form tracking, and improvement analysis.

Designed like a **real esports analyst panel**.

---

## ✨ Features

✅ Automatic Valorant stat fetching
✅ Competitive match analysis (last 10 ranked games)
✅ Player performance scoring system
✅ Dynamic team rankings
✅ Performance consistency tracking
✅ Form & Impact evaluation
✅ Agent visualization
✅ Google Sheets live sync
✅ Rate-limit safe API updating
✅ Fully deployed Streamlit Cloud app

---

## 📊 Analytics Engine

Each player receives an **Overall Rating (0–10)** calculated using:

* Aim
* Utility Usage
* Communication
* Entry Impact
* Clutch Performance
* Headshot %
* Average Combat Score
* Kill/Death Ratio

### Performance Metrics

| Metric      | Meaning                    |
| ----------- | -------------------------- |
| Performance | Career average             |
| Form        | Last matches trend         |
| Consistency | Stability across games     |
| Impact      | Weighted competitive value |

---

## 🏗️ Tech Stack

* **Python**
* **Streamlit**
* **Plotly**
* **Pandas / NumPy**
* **Google Sheets API**
* **HenrikDev Valorant API**
* **OAuth2 Service Accounts**

---

## ⚙️ Architecture

```
Google Sheets
      ↓
Roster Data
      ↓
HenrikDev API
      ↓
Stat Processing Engine
      ↓
Normalization System
      ↓
Streamlit Dashboard
```

---

## 🚀 Installation (Local)

### 1. Clone Repository

```bash
git clone https://github.com/EzioAman/iNTellectual.git
cd iNTellectual
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Add Secrets

Create:

```
.streamlit/secrets.toml
```

Add:

```toml
API_KEY="YOUR_API_KEY"

[gcp_service_account]
# Google service account credentials
```

---

### 4. Run App

```bash
streamlit run app.py
```

---

## 🔐 Security

Sensitive credentials are **never stored** in the repository.

* API keys → Streamlit Secrets
* Google Service Account → Secrets Manager
* Repository remains public & secure

---

## 📈 Workflow

1. Add roster to Google Sheet
2. Press **Update Stats**
3. Dashboard fetches live match data
4. Ratings auto-calculate
5. Team rankings update instantly

---

## 🧩 Problem Solved

Most amateur esports teams lack:

* objective performance tracking
* consistent evaluation metrics
* historical analytics

This dashboard solves that by turning raw match history into actionable insight.

---

## 🎯 Future Improvements

* Match heatmaps
* Role-based analytics
* Automated weekly reports
* Player comparison mode
* Coach dashboard
* Tournament performance tracking

---

## 👨‍💻 Author

**Aman Sinha**

Student Developer • Analytics Enthusiast • Esports Systems Builder

GitHub: https://github.com/EzioAman

---

## ⭐ Support

If you like this project:

⭐ Star the repository
🍴 Fork it
🎮 Improve competitive analytics

---

<div align="center">

### Built for Competitive Valorant Teams

**Data Wins Games.**

</div>
