require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

const ALLOWED_NETLIFY_URLS = [
  'https://chartaanalyst.netlify.app',
  'https://*.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    
    const isAllowed = ALLOWED_NETLIFY_URLS.some(allowed => {
      if (allowed.includes('*')) {
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = process.env.UPLOADS_DIR || '/tmp/chartai-uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const SYSTEM_PROMPT = `You are an expert price action trading analyst. Analyze the trading chart images and return ONLY valid JSON with no markdown, no backticks, no extra text before or after the JSON object.

CRITICAL INSTRUCTIONS:
1. Detect instrument from chart (XAUUSD, BTCUSD, etc.)
2. Detect the TIME from chart timestamp - determine session:
   - London: 8am-4pm GMT (red/orange candles)
   - New York: 1pm-9pm GMT (blue/green candles)  
   - Asian: 11pm-7am GMT (dim/small candles)
3. Look at candle colors and volatility to identify session

CRITICAL: ANTI-HALLUCINATION RULES:
- VISUAL PROOF: For EVERY zone (OB, FVG, Liquidity), you MUST cite the exact price visible on the chart's Y-axis.
- CANDLE TIMING: For EVERY pattern, you MUST identify the specific candle by its time or relative position (e.g., "the last 4H candle", "the 15:30 M1 candle").
- NO GUESSING: If price levels are not clear, state "Unclear on chart". Do not invent numbers.
- REJECTION: If the charts are too blurry or lack price scales, return an error in the JSON: { "error": "blurry_image", "message": "Charts are too blurry to identify precise levels." }
- SPECIFICITY: Avoid generic terms like "bullish momentum". Use "Strong impulsive move from 2040 to 2065".

ZONE IDENTIFICATION - EXPLICIT INDICATOR DETECTION:

YOU MUST DETECT AND RETURN THESE SPECIFIC INDICATORS:

1. ORDER BLOCKS (OB) - Most Important Indicator:
   - Look for the LAST IMPULSIVE CANDLE before price reversal
   - This is where institutions placed large orders
   - OB is the candle body (not wicks) that caused the big move in opposite direction
   - Example: After a bearish move, look for the LAST GREEN candle that started the bullish move - that's the OB
   - Return: range (High to Low of that candle body), status (Fresh/Mitigated), quality (Premium/Standard)

2. FAIR VALUE GAPS (FVG):
   - Identified by 3 candles: candle body gap from candle 1 to candle 3
   - Mid candle has wicks that created the gap
   - Return: nearest_above, nearest_below, fill_probability

3. LIQUIDITY SWEEPS:
   - Price wicks above recent high (BSL) or below recent low (SSL)
   - Returns to trap retail traders
   - Identify if BSL/SSL has been swept (hunted)

4. INDUCEMENT (Trap Patterns):
   - Price makes a false break beyond structure to trap traders
   - Then reverses violently in opposite direction
   - Identify location, direction, and if swept

5. MARKET STRUCTURE:
   - BOS (Break of Structure): Higher high/higher low (bullish) or lower high/lower low (bearish)
   - CHoCH (Change of Character): Structure break followed by retracement and continuation
   - Identify current structure and recent breaks

6. DISPLACEMENT CANDLES:
   - Large impulsive candle that breaks structure
   - Often creates new OB or FVG
   - Note the size relative to average candles

DEMAND ZONES (buy zones): Always BELOW current price - where buyers have historically bought
SUPPLY ZONES (sell zones): Always ABOVE current price - where sellers have historically sold

PATTERN DETECTION - MUST DETECT ALL VISIBLE INDICATORS:

"indicators" FIELD - YOU MUST POPULATE THIS:
- Return ALL technical indicators and price action signals you see
- Include: Order Blocks, FVGs, Liquidity Sweeps, Inducements, Displacement Candles, Market Structure Breaks, OB Rejections, Volume Anomalies

"patterns" FIELD - REQUIRED:
- Detect and list ALL candlestick and chart patterns
- Examples: Bullish Engulfing, Double Top, Head & Shoulders, Flag, Triangle, Quasimodo

Return JSON with these exact fields only:

{
  "instrument_detected": "XAUUSD",
  "timeframe_detected": "4H",
  "session_context": "London",
  "htf_summary": "Brief summary",
  "mtf_summary": "Brief summary",
  "m1_summary": "Brief summary",
  "htf_analysis": {
    "trend": { "direction": "Bearish", "structure_details": "text", "valuation": "Premium" },
    "order_block": { "range": "2000-2010", "status": "Fresh", "quality": "Premium", "displacement_move": "text" },
    "fvg": { "nearest_above": "2000-2010", "nearest_below": "1990-1995", "fill_probability": "Low", "likely_to_fill_before_continuation": false },
    "liquidity": { "bsl_location": "1980", "ssl_location": "2020", "swept_pools": ["2020"], "untouched_targets": ["1980"], "next_target": "1980" },
    "market_phase": { "phase": "Continuation", "implication": "text", "dealing_range_percent": "25 percent" },
    "inducement": { "present": false, "trap_location": null, "trap_type": null, "direction": null, "real_move_direction": null, "flag_message": null }
  },
  "mtf_analysis": {
    "trend": { "confirmation": "Confirms HTF", "recent_structure": "text", "momentum": "Retracting" },
    "order_block": { "range": "2000-2010", "status": "Fresh", "quality": "Standard", "alignment_with_htf": "text", "limit_entry_zone": "2000-2010" },
    "fvg": { "open_fvgs": [], "likely_to_fill_before_entry": false, "role": "Magnet" },
    "displacement": { "strongest_candle": "text", "implication": "text", "created_structure": "FVG" },
    "inducement": { "present": false, "lure_location": null, "stop_hunt_wick": false, "eqh_eql_present": false, "fake_breakout": false, "is_swept": false, "retail_stops_at": null, "target_direction": null, "flag_message": null, "not_swept_warning": null, "wait_warning": null },
    "kill_zone": { "is_active": true, "name": "London", "probability": "High" }
  },
  "m1_analysis": {
    "micro_trend": "Neutral",
    "microstructure": "text",
    "candlestick_patterns": [],
    "volume_profile": { "recent_volume": "Decreasing", "implication": "text" },
    "tick_velocity": "Slowing",
    "entry_trigger": "text"
  },
  "convergence": { "present": false, "convergence_price": null, "note": null, "actionable_warning": null },
  "confluence_checklist": {
    "ssl_swept": true,
    "fvg_present": true,
    "htf_aligns_ltf": true,
    "order_block_present": true,
    "session_favorable": true,
    "pattern_confirmed": false,
    "inducement_swept": true
  },
  "indicators": { "detected": [], "summary": "text" },
  "key_levels": {
    "support": [],
    "resistance": [],
    "bsl_swept": false,
    "ssl_swept": false,
    "open_fvg": [],
    "supply_zones": [],
    "demand_zones": []
  },
  "patterns": [],
  "overall_trend": "Bearish",
  "htf_bias": "Bearish",
  "mtf_bias": "Bearish",
  "m1_bias": "Neutral",
  "probability_rating": "B",
  "confidence_score": 75,
  "trade_setup": null,
  "alternative_scenario": "If HTF and LTF align, look for confirmed setup.",
  "executive_summary": "No valid setup — waiting for HTF and LTF alignment"
}`;

function cleanupUploadedFiles(files) {
  if (!files || !Array.isArray(files)) return;
  files.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file ${file.path}:`, err);
      });
    }
  });
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'cors_error', message: 'Origin not allowed' });
  }
  
  if (err.message.includes('file size')) {
    return res.status(400).json({ error: 'file_size_error', message: 'File too large. Max 10MB allowed.' });
  }
  
  if (err.message.includes('file type')) {
    return res.status(400).json({ error: 'file_type_error', message: 'Invalid file type' });
  }
  
  res.status(500).json({ error: 'server_error', message: 'Internal server error' });
});

app.get('/api/health', asyncHandler(async (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}));

app.post('/api/analyze', upload.array('charts', 3), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length < 2) {
    cleanupUploadedFiles(req.files);
    return res.status(400).json({ 
      error: 'validation_error', 
      message: 'Minimum 2 charts required for analysis.' 
    });
  }

  if (req.files.length > 3) {
    cleanupUploadedFiles(req.files);
    return res.status(400).json({ 
      error: 'validation_error', 
      message: 'Maximum 3 charts allowed.' 
    });
  }

  const { symbol, sessionDate } = req.body;
  
  if (!symbol) {
    cleanupUploadedFiles(req.files);
    return res.status(400).json({ 
      error: 'validation_error', 
      message: 'Symbol is required.' 
    });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    cleanupUploadedFiles(req.files);
    return res.status(500).json({ 
      error: 'server_config_error', 
      message: 'OpenRouter API key not configured on server.' 
    });
  }

  try {
    const chartMeta = req.files.map((f, i) => `${i + 1}. ${f.originalname}`).join(', ');
    const contextStr = `Context:
- Asset/Symbol: ${symbol || 'Unknown'}
- Current Date/Time: ${sessionDate || 'Unknown'}
- Timeframes uploaded (in order): ${chartMeta}

CRITICAL: Image 1 = first uploaded chart, Image 2 = second, Image 3 = third (if any).`;

    const content = [
      { type: "text", text: `${SYSTEM_PROMPT}\n\n${contextStr}Analyze these trading charts and return only valid JSON.` }
    ];

    for (const file of req.files) {
      const imageBuffer = fs.readFileSync(file.path);
      const base64 = imageBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/png';
      
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64}`
        }
      });
    }

    const requestBody = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content }],
      temperature: 0.0,
      max_tokens: 8192,
      response_format: { type: "json_object" }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': process.env.REFERRER_URL || 'https://chartai.netlify.app',
        'X-Title': 'ChartAI'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const errorText = await response.text();
      throw new Error(`429: ${errorText}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error('No response from API');
    }

    const text = data.choices[0].message?.content || '';
    if (!text) {
      throw new Error('Empty response from API');
    }

    const result = extractJson(text);
    res.json(result);

  } catch (error) {
    console.error('Analysis Error:', error.message);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'timeout', 
        message: 'Request timed out. Please try again.' 
      });
    }

    const errorStr = String(error);
    if (errorStr.includes('429') || errorStr.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'quota_exhausted', 
        message: 'API quota exhausted. Please wait and try again.',
        retry_after: 60
      });
    }

    return res.status(500).json({ 
      error: 'api_error', 
      message: `Analysis failed: ${error.message}` 
    });
  } finally {
    cleanupUploadedFiles(req.files);
  }
}));

function extractJson(text) {
  const hasBase64 = text.includes('base64');

  text = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  } else {
    text = text.trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    let fixed = text
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    if (!hasBase64) {
      fixed = fixed
        .replace(/(?<!")(\w+):(?!")/g, '"$1":')
        .replace(/<[^>]+>/g, 'null');
    }

    try {
      return JSON.parse(fixed);
    } catch {
      return {
        error: 'parse_error',
        raw_response: text.slice(0, 500),
        message: 'Analysis formatting error'
      };
    }
  }
}

app.use((req, res) => {
  res.status(404).json({ 
    error: 'not_found', 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

const server = app.listen(PORT, () => {
  console.log(`ChartAI Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;