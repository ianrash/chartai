# ChartAI 🧠📊

> Upload any trading chart screenshot → get instant AI-powered technical analysis.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS v3 |
| Backend | FastAPI + Uvicorn |
| AI | GPT-4o Vision (OpenAI) |

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then paste your OpenAI API key
uvicorn main:app --reload
```

Backend runs at → `http://localhost:8000`
API docs at → `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## Usage

1. Open `http://localhost:5173`
2. Drag-and-drop (or click to upload) any chart screenshot
3. Click **Analyze Chart**
4. Receive: trend, structure, key levels, patterns, liquidity zones, and a full trade setup with R:R

---

## Configuration

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-...
```

---

## Project Structure

```
chartai/
├── frontend/
│   ├── src/
│   │   ├── api/analyzeChart.js
│   │   ├── components/
│   │   │   ├── UploadZone.jsx
│   │   │   ├── AnalysisCard.jsx
│   │   │   ├── TradeSetup.jsx
│   │   │   └── ConfidenceBar.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
│
└── backend/
    ├── main.py           # FastAPI server
    ├── analyzer.py       # GPT-4o vision call
    ├── prompt_template.py
    ├── requirements.txt
    └── .env.example
```

---

## Output Schema

```json
{
  "trend": "Bullish | Bearish | Neutral",
  "structure": "Higher highs and higher lows forming...",
  "levels": { "support": 1.22, "resistance": 1.26 },
  "indicators": "RSI showing bullish divergence",
  "patterns": "Bull flag on 4H",
  "liquidity": "Stop hunt below 1.22 likely",
  "trade": {
    "direction": "Buy",
    "entry": 1.235,
    "stop": 1.22,
    "target": 1.26
  },
  "confidence": "Medium"
}
```

---

> **Disclaimer**: ChartAI is a decision-support tool. It is not financial advice.
