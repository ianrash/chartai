import { SYSTEM_PROMPT } from "./prompts";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractJson(text) {
  console.log("Raw AI response:", text.slice(0, 1000));

  // Strip markdown code fences if present
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Locate outermost { … } (or [ … ] as fallback)
  let start = text.indexOf("{");
  let end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    start = text.indexOf("[");
    end = text.lastIndexOf("]");
  }

  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  } else {
    console.error("[extractJson] No JSON object/array found in response.");
    return {
      error: "parse_error",
      raw_response: text.slice(0, 500),
      message: "No valid JSON found — AI response may be empty or malformed"
    };
  }

  // Attempt direct parse first
  try {
    return JSON.parse(text);
  } catch (firstErr) {
    // Fallback: fix common issues (trailing commas, unquoted keys, single-quotes)
    let fixed = text
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, '"$1"');

    try {
      return JSON.parse(fixed);
    } catch (secondErr) {
      // Log full text for debugging, but limit what's returned to the user
      console.error("[extractJson] Failed to parse response. Full text:", text.slice(0, 3000));
      console.error("[extractJson] Parse error:", secondErr.message);
      return {
        error: "parse_error",
        raw_response: text.slice(0, 500),
        message: "Failed to parse AI response. The model returned unexpected output. Please try again."
      };
    }
  }
}

function getApiKey() {
  return import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY || "";
}
function getSelectedModel(){ try{ return localStorage.getItem('chartai_model')||'gemini-3.6-flash'; }catch{return 'gemini-3.6-flash';}}
function getCustomPrompt(){ try{ return localStorage.getItem('chartai_custom_prompt')||''; }catch{return ''}}
function getTemp(){ try{ const v=Number(localStorage.getItem('chartai_temp')); return isNaN(v)?0:v; }catch{return 0}}

async function analyzeViaOpenRouter(images, symbol, sessionDate, model, news = ""){
  const apiKey = localStorage.getItem('chartai_openrouter_key') || import.meta.env.VITE_OPENROUTER_API_KEY || "";
  if(!apiKey) return { error:'missing_api_key', message:'OpenRouter key missing. Set in Model & Prompt settings or VITE_OPENROUTER_API_KEY.'};
  const custom = getCustomPrompt();
  const sysPrompt = custom? `${SYSTEM_PROMPT}\n\nADDITIONAL USER RULES:\n${custom}`: SYSTEM_PROMPT;
  const chartMeta = images.map((c,i)=> `${i+1}. ${c.timeframe||'Unknown TF'}`).join(', ');
  const newsBlock = news ? `\n\nRECENT MARKET NEWS (may affect this trade today):\n${news}\n\nUse this news only as context. If clearly irrelevant to the setup, ignore it; otherwise factor it into the executive summary, risk assessment, and setup bias.` : "";
  const contextStr = `Context: Asset ${symbol}, Date ${sessionDate}, TFs ${chartMeta}. CRITICAL: Image1=HTF, Image2=LTF, Image3=M1.${newsBlock}`;
  const content = [{type:'text', text:`${contextStr}\nAnalyze these trading charts and return ONLY valid JSON.`}];
  for(const chart of images){
    const base64 = await fileToBase64(chart.file);
    content.push({type:'image_url', image_url:{url:`data:${chart.file.type||'image/png'};base64,${base64}`}});
  }
  const controller=new AbortController(); const to=setTimeout(()=>controller.abort(),90000);
  try{
    const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`,'HTTP-Referer': window.location.origin,'X-Title':'ChartAI'}, signal:controller.signal, body: JSON.stringify({model, messages:[{role:'system', content: sysPrompt},{role:'user', content}], temperature:getTemp(), max_tokens:16384, response_format:{type:'json_object'}})});
    if(!res.ok){ const t=await res.text(); throw new Error(`OpenRouter ${res.status}: ${t.slice(0,500)}`);}
    const data=await res.json();
    const text=data.choices?.[0]?.message?.content||'';
    if(!text) return {error:'empty_response', message:'No response from OpenRouter'};
    return extractJson(text);
  } finally { clearTimeout(to); }
}

async function analyzeWithGemini(images, symbol = "Unknown", sessionDate = "Unknown", news = "") {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      error: "missing_api_key",
      message: "API key not configured. Please set VITE_GOOGLE_API_KEY or VITE_OPENROUTER_API_KEY in .env"
    };
  }

  try {
    const custom = getCustomPrompt();
    const sysPrompt = custom? `${SYSTEM_PROMPT}\n\nADDITIONAL USER RULES:\n${custom}`: SYSTEM_PROMPT;
    const chartMeta = images.map((c, i) => `${i + 1}. ${c.timeframe || 'Unknown TF'}`).join(', ');
    const newsBlock = news ? `\n\nRECENT MARKET NEWS (may affect this trade today):\n${news}\n\nUse this news only as context. If clearly irrelevant to the setup, ignore it; otherwise factor it into the executive summary, risk assessment, and setup bias.` : "";
    const contextStr = `Context:
- Asset/Symbol: ${symbol}
- Current Date/Time: ${sessionDate}
- Timeframes uploaded: ${chartMeta}
${newsBlock}

CRITICAL: Image 1 = HTF, Image 2 = LTF, Image 3 = M1 (if any).`;

    const parts = [
      { text: `${contextStr}\nAnalyze these trading charts and return ONLY valid JSON.` }
    ];

    for (const chart of images) {
      const base64 = await fileToBase64(chart.file);
      parts.push({
        inlineData: {
          mimeType: chart.file.type || "image/png",
          data: base64
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${getSelectedModel()}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: sysPrompt }]
            },
            contents: [{ parts }],
            generationConfig: {
              temperature: getTemp(),
              maxOutputTokens: 16384,
              responseMimeType: "application/json"
            }
          })
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const finishReason = data.candidates?.[0]?.finishReason;
    console.log("Gemini finishReason:", finishReason);

    if (finishReason === "SAFETY" || finishReason === "BLOCKLIST") {
      return { error: "blocked_content", message: "Response blocked by content safety filters. Please review your chart content and try again." };
    }

    const allParts = Array.isArray(data.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts
      : [];
    const textParts = allParts.filter(p => p.text && !p.thought);
    const text = textParts.map(p => p.text).join("") || "";

    console.log("Response parts:", allParts.length, "Text parts:", textParts.length, "Text length:", text.length);

    if (!text) {
      // If no text found, try the raw response as a fallback
      const raw = JSON.stringify(data);
      console.warn("[Gemini] No text parts found. Full response structure:", raw.slice(0, 2000));
      return {
        error: "empty_response",
        raw_response: raw.slice(0, 500),
        message: "No response from API"
      };
    }

    console.log("[Gemini] Text to parse (first 500 chars):", text.slice(0, 500));

    const result = extractJson(text);

    if (finishReason === "MAX_TOKENS") {
      console.warn("Response was truncated by token limit! Trying to parse partial JSON...");
      return {
        ...result,
        warning: "Response was truncated. Analysis may be incomplete. Consider using smaller images or fewer charts."
      };
    }

    // If parse failed, log the text for debugging
    if (result?.error === "parse_error") {
      console.error("[Gemini] JSON parse failure. Full response text follows:");
      console.error(text);
    }

    return result;

  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timed out after 90 seconds");
      return {
        error: "timeout",
        message: "AI analysis timed out. The charts may be too large or the service is busy. Please try again with smaller images."
      };
    }
    console.error("Analysis Error:", error.message);
    return {
      error: "api_error",
      message: error.message
    };
  }
}

export async function analyzeImages(charts, symbol, sessionDate, news = "") {
  const model=getSelectedModel();
  const isOpenRouter = model.includes('/') || model.startsWith('openrouter') || model.startsWith('anthropic')||model.startsWith('openai')||model.startsWith('deepseek');
  if(isOpenRouter && model!=='gemini-2.5-flash' && model!=='gemini-2.5-pro'){
    const r=await analyzeViaOpenRouter(charts, symbol, sessionDate, model==='openrouter/auto'?'openrouter/auto':model, news);
    if(!r.error) return r;
    console.warn('OpenRouter failed, falling back to Gemini', r.message);
  }
  return analyzeWithGemini(charts, symbol, sessionDate, news);
}
