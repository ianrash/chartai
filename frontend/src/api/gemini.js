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

  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  } else {
    text = text.trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    let fixed = text
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    if (!hasBase64) {
      fixed = fixed
        .replace(/(?<!")(\w+):(?!")/g, '"$1":')
        .replace(/<[^>]+>/g, "null");
    }

    try {
      return JSON.parse(fixed);
    } catch {
      return {
        error: "parse_error",
        raw_response: text.slice(0, 500),
        message: "Analysis formatting error - please try again"
      };
    }
  }
}

function getApiKey() {
  return "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";
}

async function analyzeWithGemma(images, symbol = "Unknown", sessionDate = "Unknown", retries = 3) {
  const apiKey = getApiKey();
  console.log("Using API Key:", apiKey.substring(0, 10) + "...");
  console.log("API Base:", "https://integrate.api.nvidia.com/v1");
  
  if (!apiKey) {
    return {
      error: "missing_api_key",
      message: "OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in Netlify environment variables."
    };
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const contextStr = `Context:\n- Asset/Symbol: ${symbol}\n- Current Date/Time: ${sessionDate}\n\n`;

      const content = [
        { type: "text", text: `${SYSTEM_PROMPT}\n\n${contextStr}Analyze these trading charts and return only valid JSON.` }
      ];

      for (const chart of images) {
        const base64 = await fileToBase64(chart.file);
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${chart.file.type || "image/png"};base64,${base64}`
          }
        });
      }

      const requestBody = {
        model: "meta/llama-3.1-70b-instruct",
        messages: [{ role: "user", content }],
        temperature: 0.0,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      console.log("Calling NVIDIA API...");
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
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
        throw new Error("No response from API");
      }

      const text = data.choices[0].message?.content || "";
      if (!text) {
        throw new Error("Empty response from API");
      }

      return extractJson(text);
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
        message: "Analysis failed. Please try again.",
        original_error: errorStr
      };
    }
  }
}

export async function analyzeImages(charts, symbol, sessionDate) {
  return analyzeWithGemma(charts, symbol, sessionDate);
}