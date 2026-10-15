# NutriPulse Pro — Clinical BMR/TDEE & AI Nutrition Meal Planner

![NutriPulse Pro](https://img.shields.io/badge/NutriPulse_Pro-Full_Stack_Vite_%2B_Vercel-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/Copyright-Ballapuram_Prakash_Royal-06b6d4?style=for-the-badge)

Full-stack clinical nutrition, meal planning, biometric BMR/TDEE, Intermittent Fasting, and AI macro-gap coaching web application.

---

## 📁 Project Architecture (Frontend + Backend)

```text
nutripulse-pro-fullstack/
├── index.html                        # Root HTML entry
├── package.json                      # Dependencies & build scripts
├── vite.config.js                    # Vite + React + Tailwind v4 config
├── vercel.json                       # Vercel SPA + Serverless API routing
├── src/                              # FRONTEND (React 18 + Tailwind CSS)
│   ├── main.jsx                      # React DOM root mount
│   ├── index.css                     # Tailwind CSS imports & utilities
│   ├── App.jsx                       # Complete NutriPulse Pro Application
│   ├── components/
│   │   ├── FoodImage.jsx             # Shimmer & Fallback Food Image Component
│   │   └── VegBadge.jsx              # FSSAI Veg / Non-Veg Badge Component
│   ├── data/
│   │   └── foodDatabase.js           # 41+ Indian & Global Foods + Smart Templates
│   ├── services/
│   │   └── apiClient.js              # Frontend-to-Backend REST API client
│   └── constants/
│       └── nutritionConstants.js     # Clinical Atwater 4-4-9 constants
├── api/                              # BACKEND 1: Vercel Node.js Serverless API
│   ├── health.js                     # GET /api/health endpoint
│   ├── foods.js                      # GET /api/foods endpoint
│   └── tdee.js                       # POST /api/tdee clinical calculator
└── backend/                          # BACKEND 2: Python FastAPI Microservice
    ├── main.py                       # FastAPI server (Port 8000)
    └── requirements.txt              # Python dependencies
```

---

## 🚀 Quick Start (Run Locally)

```bash
# 1. Install frontend dependencies
npm install

# 2. Start Vite local server (http://localhost:5173)
npm run dev
```
---

## © Copyright & Intellectual Property

© 2026 **Ballapuram Prakash Royal**. All Rights Reserved.  
Protected under the Indian Copyright Act, 1957 & International Intellectual Property Laws.
