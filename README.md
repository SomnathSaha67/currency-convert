# 💱 Smart Currency Converter

An advanced currency application built with **React**, **Flask**, and **Machine Learning**.

## 🌟 Key Features

- **Real-Time Conversion**: Fetches the latest exchange rates for 160+ currencies.
- **ML Predictions**: Uses Linear Regression to forecast currency trends for the next 7 days.
- **Arbitrage Detector**: Scans for profitable "loops" between multiple currencies (e.g., USD -> EUR -> GBP -> USD).
- **Volatility Heat Map**: Visualizes market stability using historical data.
- **Travel Budget Planner**: Estimates costs for future trips based on current rates and volatility.

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **npm** or **yarn**

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The backend runs on `http://localhost:5000`*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5173`*

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion.
- **Backend**: Flask (Python), Requests.
- **Data & AI**: yfinance (Yahoo Finance API), Scikit-Learn (Linear Regression), Pandas, NumPy.

## 📝 Documentation

All major files are commented with **WHAT**, **WHY**, and **HOW** explanations, making it easy for beginners to understand the code logic.