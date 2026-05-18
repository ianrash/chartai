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
  const hasBase64 = text.includes('base64');
  
  // Log the raw response for debugging
  console.log("Raw AI response:", text.slice(0, 1000));

  // Remove markdown code blocks
  text = text
    .replace(/```json/g, "")
    .replace(/```javascript/g, "")
    .replace(/```/g, "")
    .trim();

  // Try to find JSON object in the text
  let start = text.indexOf("{");
  let end = text.lastIndexOf("}");
  
  // If no object found, try array
  if (start === -1 || end === -1 || end <= start) {
    start = text.indexOf("[");
    end = text.lastIndexOf("]");
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  } else {
    // No JSON found at all - return error with raw text
    return {
      error: "parse_error",
      raw_response: text.slice(0, 500),
      message: "Analysis formatting error - No valid JSON found in response"
    };
  }

  // Try direct parsing first
  try {
    return JSON.parse(text);
  } catch {
    console.log("Direct parse failed, attempting fixes");
  }

  // Try fixing common JSON issues
  let fixed = text
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");

  // If response doesn't look like it contains base64, try fixing unquoted keys
  if (!hasBase64) {
    fixed = fixed
      // Fix unquoted keys (but be careful with existing quoted ones)
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Remove HTML tags
      .replace(/<[^>]+>/g, "null")
      // Fix single quotes to double quotes (simple cases)
      .replace(/'([^']*)'/g, '"$1"')
      // Fix trailing commas in objects/arrays
      .replace(/,\s*([}\]])/g, "$1");
  }

  try {
    return JSON.parse(fixed);
  } catch {
    console.log("Fixed parse also failed");
  }

  // Try more aggressive parsing - extract just the key fields we need
  try {
    // Look for specific patterns in the response
    const instrumentMatch = text.match(/"instrument_detected"\s*:\s*"([^"]+)"/);
    const htfBiasMatch = text.match(/"htf_bias"\s*:\s*"([^"]+)"/);
    const mtfBiasMatch = text.match(/"mtf_bias"\s*:\s*"([^"]+)"/);
    const ratingMatch = text.match(/"probability_rating"\s*:\s*"([^"]+)"/);
    
    if (instrumentMatch || htfBiasMatch) {
      // At least we got some fields - return partial data with warning
      return {
        warning: "Partial parse - some fields may be missing",
        instrument_detected: instrumentMatch ? instrumentMatch[1] : "Unknown",
        htf_bias: htfBiasMatch ? htfBiasMatch[1] : "Unknown",
        mtf_bias: mtfBiasMatch ? mtfBiasMatch[1] : "Unknown",
        probability_rating: ratingMatch ? ratingMatch[1] : "Unknown",
        _raw: text.slice(0, 1000)
      };
    }
  } catch {
    console.log("Partial extraction also failed");
  }

  // All attempts failed - return error
  return {
    error: "parse_error",
    raw_response: text.slice(0, 500),
    message: "Analysis formatting error - Raw response: " + text.slice(0, 300)
  };
}

function getApiKey() {
  return import.meta.env.VITE_OPENROUTER_API_KEY || "";
}

async function analyzeWithGemma(images, symbol = "Unknown", sessionDate = "Unknown", retries = 3) {
  const apiKey = getApiKey();
  console.log("Using API Key:", apiKey.substring(0, 10) + "...");
  console.log("API Base:", "https://openrouter.ai/api/v1");
  
  if (!apiKey) {
    return {
      error: "missing_api_key",
      message: "OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in environment variables."
    };
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log("Processing images:", images.length, "charts");
  const chartMeta = images.map((c, i) => `${i + 1}. ${c.timeframe || 'Unknown TF'}`).join(', ');
  const contextStr = `Context:
- Asset/Symbol: ${symbol}
- Current Date/Time: ${sessionDate}
- Timeframes uploaded (in order): ${chartMeta}

CRITICAL: Image 1 = first uploaded chart, Image 2 = second, Image 3 = third (if any).
Analyze each chart in context of its timeframe.`;

      const content = [
        { type: "text", text: `${SYSTEM_PROMPT}\n\n${contextStr}Analyze these trading charts and return only valid JSON.` }
      ];

      for (const chart of images) {
        const base64 = await fileToBase64(chart.file);
        console.log(`Converted ${chart.timeframe} chart to base64, size: ${base64.length} chars`);
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${chart.file.type || "image/png"};base64,${base64}`
          }
        });
      }
      console.log(`Total images prepared: ${images.length}`);

      const requestBody = {
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content }],
        temperature: 0.0,
        max_tokens: 8192,
        response_format: { type: "json_object" }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      console.log("Calling OpenRouter API...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
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
        console.error("HTTP Error:", response.status, errorText);
        alert("API Error: " + response.status + " - " + errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        throw new Error("No response from API: " + JSON.stringify(data));
      }

      const text = data.choices[0].message?.content || "";
      if (!text) {
        throw new Error("Empty response from API");
      }

      const result = extractJson(text);
      
      // Debug logging for pattern detection
      console.log('AI Response Debug:', {
        hasError: !!result.error,
        hasPatterns: !!result.patterns,
        patternsCount: result.patterns?.length || 0,
        patterns: result.patterns,
        m1Patterns: result.m1_analysis?.candlestick_patterns,
        mtfPatterns: result.mtf_analysis?.candlestick_patterns,
        allKeys: Object.keys(result)
      });

      // If parse error and we have retries left, retry with stricter prompt
      if (result.error === "parse_error" && attempt < retries - 1) {
        console.log("Parse error detected, retrying with stricter prompt...");
        // Modify prompt to be more explicit about JSON format
        const stricterContent = content.map(item => {
          if (item.type === "text") {
            return {
              ...item,
              text: item.text + "\n\nIMPORTANT: Response must be ONLY valid JSON. No explanations, no markdown, just JSON. Start with { and end with }."
            };
          }
          return item;
        });
        
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 60000);
        
        try {
          const retryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: stricterContent }],
              temperature: 0.0,
              max_tokens: 8192,
              response_format: { type: "json_object" }
            }),
            signal: retryController.signal
          });
          clearTimeout(retryTimeoutId);
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryText = retryData.choices?.[0]?.message?.content || "";
            if (retryText) {
              const retryResult = extractJson(retryText);
              if (!retryResult.error) {
                console.log("Retry succeeded!");
                return retryResult;
              }
            }
          }
        } catch (retryError) {
          console.log("Retry also failed:", retryError.message);
          clearTimeout(retryTimeoutId);
        }
      }
      
      return result;
    } catch (error) {
      console.error("API Error:", error.message || String(error));
      
      if (error.name === 'AbortError') {
        return {
          error: "timeout",
          message: "Request timed out after 60 seconds. Please try again."
        };
      }

      const errorStr = String(error);

      if (errorStr.includes("429") || errorStr.includes("rate limit") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        let waitSeconds = 60;
        const retryMatch = errorStr.match(/retry in ([\d.]+)s/i);
        if (retryMatch) {
          waitSeconds = Math.ceil(parseFloat(retryMatch[1]));
        }

        if (attempt < retries - 1 && waitSeconds < 30) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 2000));
          continue;
        }
        return {
          error: "quota_exhausted",
          message: `API quota exhausted. Please wait ${waitSeconds} seconds or check your OpenRouter quota.`,
          retry_after: waitSeconds,
          original_error: errorStr
        };
      }

      if (errorStr.includes("403") || errorStr.includes("quota")) {
        return {
          error: "quota_exceeded",
          message: "API quota exceeded. Please check your OpenRouter account.",
          original_error: errorStr
        };
      }

      return {
        error: "api_error",
        message: `Analysis failed: ${errorStr}`,
        original_error: errorStr
      };
    }
  }
}

export async function analyzeImages(charts, symbol, sessionDate) {
  return analyzeWithGemma(charts, symbol, sessionDate);
}