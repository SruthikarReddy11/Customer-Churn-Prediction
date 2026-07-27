# Phase 8: Interactive HTML/CSS/JS Executive Web Dashboard

## Overview
This directory contains a standalone, production-ready, interactive **Web Dashboard** built using standard modern front-end technologies: **HTML5, Vanilla CSS3 (Dark Glassmorphism UI), and JavaScript (Chart.js)**.

The dashboard connects seamlessly to the FastAPI backend (`http://localhost:8000/api/v1/predict-churn`) for real-time model inference and LTV estimation, with an offline client calculation fallback.

---

## Technical Stack & Architecture

- **Structure**: HTML5 (`dashboard/index.html`) with semantic layouts, FontAwesome 6 icons, Google Fonts (`Outfit`, `Inter`).
- **Styling System**: CSS3 (`dashboard/styles.css`) implementing dark glassmorphism styling (`backdrop-filter: blur(16px)`), responsive CSS grid layouts, glowing color accents, micro-animations, and pill badges.
- **Visualization Engine**: Chart.js 4.x (`dashboard/app.js`) rendering interactive charts:
  1. *Contract Churn Rate Donut Chart*
  2. *Payment Method Friction Bar Chart*
  3. *Tenure Lifecycle Hazard Line Chart*
  4. *Internet Service vs Tech Support Grouped Bar Chart*
- **REST API Integration**: Dynamic `fetch()` client connecting to FastAPI backend endpoints (`/api/v1/predict-churn` & `/api/v1/predict-ltv`).

---

## How to Launch & Use the Web Dashboard

### Option 1: Direct Browser Launch
Double-click `dashboard/index.html` or open it in any modern browser (Chrome, Edge, Firefox, Safari).

### Option 2: Live Local Development Server
To launch with live reload or host locally:
```bash
# Using Python built-in HTTP server
python -m http.server 3000 --directory dashboard
```
Then visit `http://localhost:3000` in your web browser.

---

## Interactive Features

### 1. Global Controls & Multi-Filter Bar
Filter dataset metrics, charts, and customer tables dynamically by:
- **Contract Type**: Month-to-Month, 1-Year, 2-Year
- **Payment Method**: Electronic Check, Mailed Check, Auto Bank Transfer, Auto Credit Card
- **Internet Technology**: Fiber Optic, DSL, None
- **Risk Tier**: High Risk (>70%), Medium Risk (40-70%), Low Risk (<40%)

### 2. Live Churn Risk & LTV Predictor
Interactive form allowing users to simulate customer profiles (Tenure, Monthly Charges, Contract Type, Tech Support, Internet Service, Payment Method) and instantly compute:
- **Churn Probability Gauge (%)**
- **Risk Tier Badge** (High Risk / Medium Risk / Low Risk)
- **Baseline Historical LTV & Predicted LTV ($)**
- **Expected Remaining Lifespan (Months)**
- **Top Risk Drivers List**
- **Actionable Retention Recommendation**

### 3. Priority At-Risk Customer Table
Interactive CRM table listing high-value customers with live search functionality. Clicking the **Score** button auto-loads any customer profile directly into the live prediction calculator.
