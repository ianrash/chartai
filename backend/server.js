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

const SYSTEM_PROMPT = `You are an expert price action trading analyst specializing in ICT (Inner Circle Trader) concepts. Analyze ALL uploaded trading chart images and return ONLY valid JSON. No markdown, no backticks, no explanatory text before or after the JSON object.

═══════════════════════════════════════════
SECTION 1 — INPUT HANDLING
═══════════════════════════════════════════

CHART COUNT RULES:
- Count the number of uploaded images before doing anything else.
- Record this count in "num_charts_provided".
- If 0 charts: return { "error": "no_charts", "message": "No chart images were uploaded." }
- If 1 chart: populate htf_analysis only. Set mtf_analysis and m1_analysis to { "status": "not_applicable", "reason": "Only 1 chart provided" }
- If 2 charts: Higher timeframe → htf_analysis. Lower timeframe → mtf_analysis. Set m1_analysis to { "status": "not_applicable", "reason": "Only 2 charts provided" }
- If 3 charts: Highest timeframe → htf_analysis. Middle timeframe → mtf_analysis. Lowest timeframe → m1_analysis.
- If charts are too blurry or lack visible price scales: return { "error": "unreadable_charts", "message": "Charts are too blurry or lack price scales to identify precise levels." }

CHART IDENTIFICATION:
- For each chart, identify its timeframe from labels visible on the chart (e.g. "4H", "1H", "M1").
- Record each chart's detected timeframe in "charts_detected" as an array, e.g. ["4H", "1H", "M1"].
- If a timeframe label is not visible, state "Unknown" — do not guess.

═══════════════════════════════════════════
SECTION 2 — ANTI-HALLUCINATION RULES (MANDATORY)
═══════════════════════════════════════════

These rules override everything else. Violating them is a critical failure.

1. PRICE LEVELS: Every price level you report MUST be directly readable from the chart's Y-axis. Do not estimate, extrapolate, or invent numbers. If a level is not clearly visible, write "Unclear on chart".

2. CANDLE REFERENCES: Every pattern or zone must reference a specific candle by its visible timestamp or relative position (e.g., "the 14:00 4H candle", "the last completed 1H candle before the session high"). Do not say "a recent candle" or "candle near the top".

3. NO GENERIC STATEMENTS: Never use phrases like "bullish momentum", "price is moving up", or "bears are in control". Instead write: "Impulsive 3-candle move from [price] to [price] on the 4H, breaking [structure level]".

4. NO ANCHORING: Ignore the example values in the JSON schema below (e.g., "2000-2010"). Those are placeholders only. Always use actual prices read from the chart.

5. INDICATORS NOT VISIBLE: If an indicator (e.g. volume, tick velocity) is not shown on the chart, set the field to "Not visible on chart". Do not fabricate values.

6. CROSS-CHART CLAIMS: Any claim that references two timeframes (e.g. "HTF OB aligns with MTF FVG") must cite the price level from both charts explicitly.

═══════════════════════════════════════════
SECTION 3 — CONCEPT DEFINITIONS
═══════════════════════════════════════════

Use these definitions to identify and label zones. Do not invent your own interpretations.

ORDER BLOCK (OB):
- The LAST opposing candle before a strong impulsive move.
- Bullish OB: The last bearish (red) candle body before a bullish displacement move.
- Bearish OB: The last bullish (green) candle body before a bearish displacement move.
- Range: The HIGH and LOW of that candle's body (not wicks).
- Status: "Fresh" if price has not yet returned to this zone. "Mitigated" if price has traded back through at least 50% of the body.
- Quality: "Premium" if the OB aligns with an HTF structure level or FVG. "Standard" if standalone.

FAIR VALUE GAP (FVG):
- A 3-candle pattern where candle 1's wick and candle 3's wick do not overlap, leaving a visible gap.
- The FVG range is: Low of candle 1's wick to High of candle 3's wick (for bullish FVG), inverted for bearish.
- "Filled" if price has traded fully through the gap. "Partially filled" if price touched the midpoint. "Unfilled" if untouched.
- Fill probability: "High" if price is in a retracement toward the gap with no intervening OB. "Low" if the OB acts as a barrier.

LIQUIDITY:
- BSL (Buyside Liquidity): A recent swing high where retail buy stops are clustered above.
- SSL (Sellside Liquidity): A recent swing low where retail sell stops are clustered below.
- "Swept" = price has wicked through the level and closed back on the other side.
- "Untouched" = level has not been traded into.

INDUCEMENT:
- A minor swing high or low that tempts retail traders to enter early.
- It is "swept" when price takes out the inducement level before reversing toward the actual OB.
- Include: location (price), direction of the fake move, and the expected real move direction after sweep.

MARKET STRUCTURE:
- BOS (Break of Structure): Price breaks a prior swing high (bullish BOS) or swing low (bearish BOS) with a full candle close beyond it.
- CHoCH (Change of Character): The first BOS in the opposite direction of the prevailing trend — signals a potential trend reversal.
- Label each break with the price level where it occurred.

DISPLACEMENT CANDLE:
- An abnormally large candle relative to the surrounding 5–10 candles that breaks structure and often creates a FVG.
- Note: the candle's open, close, and size relative to recent average candles.

CONVERGENCE:
- Occurs when an HTF OB, a MTF FVG, and a liquidity sweep all cluster within the same 5–10 pip / point range.
- This is the highest-probability entry zone. Record the price range and which elements are converging.

DEALING RANGE:
- The range between the most recent significant swing high and swing low.
- "Dealing range percent": Where current price sits within this range. 0% = at the low. 100% = at the high. Above 50% = Premium (look to sell). Below 50% = Discount (look to buy).

PROBABILITY RATING:
- A: All confluence factors align. Convergence present. Session favorable. Inducement swept.
- B: Most factors align. Minor gap in confluence (e.g., session is borderline or one level unclear).
- C: Some alignment but key factor missing (e.g., inducement not yet swept, or FVG unfilled on opposing side).
- D: Conflicting signals. No clear setup. Do not trade.

SESSION DETECTION:
- Derive session from the timestamp visible on the chart — do not guess from candle color.
- London: 08:00–16:00 GMT
- New York: 13:00–21:00 GMT
- Asian: 22:00–07:00 GMT
- Overlap (London/NY): 13:00–16:00 GMT — highest probability kill zone.
- If no timestamp is visible: set session_context to "Unknown — no timestamp visible".

KILL ZONE:
- High-probability trading windows within sessions:
  - London Open Kill Zone: 08:00–10:00 GMT
  - New York Open Kill Zone: 13:00–15:00 GMT
  - Asian Kill Zone: 23:00–01:00 GMT

═══════════════════════════════════════════
SECTION 4 — CROSS-CHART CORRELATION (MANDATORY)
═══════════════════════════════════════════

After analyzing each chart individually, you MUST perform cross-chart correlation. Check for:

1. OB Alignment: Does the MTF or M1 OB fall inside the HTF OB range? State both price ranges.
2. FVG Magnet: Does an HTF FVG overlap with the MTF entry zone? State both FVG ranges.
3. Liquidity Confluence: Has a liquidity sweep on the HTF been confirmed by a CHoCH on the MTF or M1?
4. Trend Agreement: Does the MTF trend confirm or conflict with the HTF bias? Explicitly state "Confirms" or "Conflicts" with reasoning.
5. Timeframe Compression: As you move from HTF → MTF → M1, is the structure compressing into a valid entry trigger?

Record all of the above in the "cross_chart_correlation" field.

═══════════════════════════════════════════
SECTION 5 — JSON OUTPUT SCHEMA
═══════════════════════════════════════════

Return exactly this structure. Replace ALL placeholder text with real values from the charts.
Fields marked [REQUIRED] must always be populated. Fields marked [IF APPLICABLE] may be set to null only if genuinely not applicable per the rules above.

{
  "num_charts_provided": 0,
  "charts_detected": [],
  "instrument_detected": "[REQUIRED — e.g. XAUUSD, BTCUSD, NAS100. Read from chart header or pair label.]",
  "session_context": "[REQUIRED — derived from chart timestamp, not candle color]",
  "kill_zone_active": {
    "active": false,
    "name": "[Kill zone name or null]",
    "probability_boost": "[High / Moderate / None]"
  },

  "htf_analysis": {
    "timeframe": "[e.g. 4H — read from chart]",
    "trend": {
      "direction": "[Bullish / Bearish / Ranging]",
      "structure_details": "[Describe specific BOS or CHoCH events with price levels]",
      "valuation": "[Premium / Discount / Equilibrium — based on dealing range percent]",
      "dealing_range": {
        "swing_high": "[price]",
        "swing_low": "[price]",
        "current_price_percent": "[0–100 percent]"
      }
    },
    "order_block": {
      "present": true,
      "range_high": "[price from Y-axis]",
      "range_low": "[price from Y-axis]",
      "candle_reference": "[timestamp or relative position of OB candle]",
      "status": "[Fresh / Mitigated]",
      "quality": "[Premium / Standard]",
      "displacement_move": "[Describe the impulsive move that followed, with price range]"
    },
    "fvg": {
      "present": false,
      "nearest_above": "[price range or null]",
      "nearest_below": "[price range or null]",
      "fill_status": "[Unfilled / Partially filled / Filled]",
      "fill_probability": "[High / Low]",
      "likely_to_fill_before_continuation": false
    },
    "liquidity": {
      "bsl_location": "[price or 'Unclear on chart']",
      "ssl_location": "[price or 'Unclear on chart']",
      "swept_pools": [],
      "untouched_targets": [],
      "next_likely_target": "[price or direction]"
    },
    "market_structure": {
      "last_event": "[BOS / CHoCH / None]",
      "event_price": "[price where break occurred]",
      "implication": "[What this means for bias]"
    },
    "inducement": {
      "present": false,
      "location": null,
      "direction_of_fake_move": null,
      "expected_real_move": null,
      "is_swept": false
    }
  },

  "mtf_analysis": {
    "status": "[active / not_applicable]",
    "reason": "[Only populate if not_applicable — explain why]",
    "timeframe": "[e.g. 1H]",
    "trend": {
      "confirmation": "[Confirms HTF / Conflicts with HTF / Neutral]",
      "conflict_explanation": "[If conflicts: explain what differs and which to trust]",
      "recent_structure": "[Describe last 2–3 structure events with price levels]",
      "momentum": "[Expanding / Retracting / Ranging]"
    },
    "order_block": {
      "present": false,
      "range_high": null,
      "range_low": null,
      "candle_reference": null,
      "status": null,
      "quality": null,
      "alignment_with_htf": "[Does this OB sit inside the HTF OB? State both ranges.]",
      "limit_entry_zone": "[Price range for a limit order entry]"
    },
    "fvg": {
      "open_fvgs": [],
      "fill_likely_before_entry": false,
      "role": "[Magnet / Barrier / Irrelevant]"
    },
    "displacement": {
      "present": false,
      "candle_reference": null,
      "open": null,
      "close": null,
      "size_vs_average": "[e.g. 3x average candle size or 'Not visible on chart']",
      "created_structure": "[FVG / OB / Both / None]"
    },
    "inducement": {
      "present": false,
      "lure_location": null,
      "is_swept": false,
      "stop_hunt_wick": false,
      "eqh_eql_present": false,
      "fake_breakout": false,
      "retail_stops_targeted_at": null,
      "target_direction_after_sweep": null,
      "warning": "[e.g. 'Inducement not yet swept — wait for sweep before entry' or null]"
    },
    "kill_zone": {
      "is_active": false,
      "name": null,
      "probability": "[High / Moderate / Low]"
    }
  },

  "m1_analysis": {
    "status": "[active / not_applicable]",
    "reason": "[Only populate if not_applicable]",
    "timeframe": "[e.g. M1 or M5]",
    "micro_trend": "[Bullish / Bearish / Neutral]",
    "microstructure": "[Describe last CHoCH or BOS with price and candle reference]",
    "candlestick_patterns": [],
    "volume_profile": {
      "visible_on_chart": false,
      "recent_volume": "[Increasing / Decreasing / Spike / Not visible on chart]",
      "implication": "[What volume suggests about the move or null]"
    },
    "tick_velocity": "[Accelerating / Slowing / Not visible on chart]",
    "entry_trigger": "[Describe the specific M1 signal needed to enter — e.g. 'Bullish engulfing candle closing above the 14:05 M1 OB high at [price]']"
  },

  "cross_chart_correlation": {
    "ob_alignment": "[Do OBs across timeframes overlap? State price ranges from each chart.]",
    "fvg_magnet": "[Does an HTF FVG overlap with MTF entry zone? State both ranges.]",
    "liquidity_confirmation": "[Has HTF sweep been confirmed by MTF or M1 CHoCH?]",
    "trend_agreement": "[Confirms / Conflicts — with reasoning]",
    "timeframe_compression": "[Is structure compressing into a valid entry trigger? Explain.]"
  },

  "convergence": {
    "present": false,
    "price_range": null,
    "converging_elements": [],
    "note": "[Describe what is converging and why it raises probability, or null]",
    "actionable_warning": "[e.g. 'Price approaching convergence zone — watch for M1 trigger' or null]"
  },

  "confluence_checklist": {
    "ssl_swept": false,
    "bsl_swept": false,
    "fvg_present": false,
    "htf_aligns_ltf": false,
    "order_block_present": false,
    "session_favorable": false,
    "kill_zone_active": false,
    "candlestick_pattern_confirmed": false,
    "inducement_swept": false,
    "displacement_present": false
  },

  "indicators": {
    "detected": [
      "[List every detected indicator: OBs, FVGs, BSL/SSL sweeps, CHoCH, BOS, displacement candles, equal highs/lows, inducements. Include price level and chart timeframe for each.]"
    ],
    "summary": "[One sentence summarizing the dominant market structure signal across all charts]"
  },

  "key_levels": {
    "support": ["[price]"],
    "resistance": ["[price]"],
    "open_fvgs_above": ["[price range]"],
    "open_fvgs_below": ["[price range]"],
    "supply_zones": ["[price range]"],
    "demand_zones": ["[price range]"]
  },

  "patterns": [
    "[List all detected candlestick or chart patterns with timeframe and price location. Examples: 'Bullish Engulfing at [price] on 1H', 'Double Top at [price] on 4H'. Empty array if none detected.]"
  ],

  "overall_trend": "[Bullish / Bearish / Ranging]",
  "htf_bias": "[Bullish / Bearish / Neutral]",
  "mtf_bias": "[Bullish / Bearish / Neutral / Not applicable]",
  "m1_bias": "[Bullish / Bearish / Neutral / Not applicable]",

  "probability_rating": "[A / B / C / D — based on the grading rubric in Section 3]",
  "confidence_score": 0,

  "trade_setup": {
    "present": false,
    "direction": "[Long / Short / null if no setup]",
    "entry_price": "[Specific price or null]",
    "entry_type": "[Limit / Market / Stop-Limit / null]",
    "stop_loss": "[Specific price — below OB low for Long, above OB high for Short]",
    "take_profit_1": "[First target price — nearest liquidity pool]",
    "take_profit_2": "[Second target price — next liquidity pool or FVG]",
    "risk_reward": "[e.g. 3.2:1 or null]",
    "invalidation": "[Price level that would invalidate the setup]",
    "entry_trigger_required": "[Describe the exact M1 or MTF signal needed before entry]",
    "wait_condition": "[What must happen before this setup is valid — e.g. 'Wait for inducement sweep at [price]']"
  },

  "alternative_scenario": "[Describe the opposing scenario with the specific price level that would trigger it. E.g. 'If price breaks and closes above [price], HTF bias flips bullish — look for demand at [price].']",

  "htf_summary": "[2–3 sentences. State trend, key OB or FVG with price, and next liquidity target.]",
  "mtf_summary": "[2–3 sentences. State MTF confirmation or conflict, entry zone, and inducement status. Or 'Not applicable — only N chart(s) provided.']",
  "m1_summary": "[2–3 sentences. State micro trend, entry trigger condition, and pattern. Or 'Not applicable.']",

  "executive_summary": "[3–5 sentences. Synthesize all timeframes. State the trade direction (or why no trade), the key confluence factors, the entry trigger needed, and the main risk. This must be specific — cite actual price levels.]" 
"CRITICAL: If you describe a trade setup anywhere in executive_summary or any 
summary field, you MUST set trade_setup.present to true and populate ALL 
trade_setup fields. A described setup with present: false is a critical error."
}"
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

    console.log(`Processing ${req.files.length} files for symbol: ${symbol}`);
    for (const file of req.files) {
      console.log(`File: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`);
      const imageBuffer = fs.readFileSync(file.path);
      const base64 = imageBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/png';
      console.log(`Base64 length: ${base64.length}, expected format: image type with base64`);
      
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
      max_tokens: 4096,
      response_format: { type: "json_object" }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

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
    console.log(`AI response received, length: ${text.length} chars`);
    if (!text) {
      throw new Error('Empty response from API');
    }

    const result = extractJson(text);

    // Check if parsing failed - throw error to trigger proper HTTP error response
    if (result.error) {
      throw new Error(`Parse error: ${result.message}`);
    }

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

  console.log("Raw AI response:", text.slice(0, 500));

  text = text
    .replace(/```json/g, '')
    .replace(/```javascript/g, '')
    .replace(/```/g, '')
    .trim();

  let start = text.indexOf('{');
  let end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    start = text.indexOf('[');
    end = text.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  } else {
    return {
      error: 'parse_error',
      raw_response: text.slice(0, 500),
      message: 'No valid JSON found in response'
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    console.log("Direct parse failed, attempting fixes");
  }

  let fixed = text
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  if (!hasBase64) {
    fixed = fixed
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/<[^>]+>/g, 'null')
      .replace(/'([^']*)'/g, '"$1"')
      .replace(/,\s*([}\]])/g, '$1');
  }

  try {
    return JSON.parse(fixed);
  } catch {
    console.log("Fixed parse also failed");
  }

  try {
    const instrumentMatch = text.match(/"instrument_detected"\s*:\s*"([^"]+)"/);
    const htfBiasMatch = text.match(/"htf_bias"\s*:\s*"([^"]+)"/);
    const mtfBiasMatch = text.match(/"mtf_bias"\s*:\s*"([^"]+)"/);
    const ratingMatch = text.match(/"probability_rating"\s*:\s*"([^"]+)"/);
    
    if (instrumentMatch || htfBiasMatch) {
      return {
        warning: "Partial parse - some fields may be missing",
        instrument_detected: instrumentMatch ? instrumentMatch[1] : "Unknown",
        htf_bias: htfBiasMatch ? htfBiasMatch[1] : "Unknown",
        mtf_bias: mtfBiasMatch ? mtfBiasMatch[1] : "Unknown",
        probability_rating: ratingMatch ? ratingMatch[1] : "Unknown",
        _raw: text.slice(0, 1000)
      };
    }
  } catch {}

  return {
    error: 'parse_error',
    raw_response: text.slice(0, 500),
    message: 'Analysis formatting error - Raw response: ' + text.slice(0, 300)
  };
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