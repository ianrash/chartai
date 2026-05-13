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

function getBackendUrl() {
  return import.meta.env.VITE_BACKEND_URL || 'https://chartai-wy7a.onrender.com';
}

export async function analyzeImages(charts, symbol = "Unknown", sessionDate = "Unknown") {
  if (!charts || charts.length < 2) {
    throw new Error("Minimum 2 charts required for analysis.");
  }

  if (charts.length > 3) {
    throw new Error("Maximum 3 charts allowed.");
  }

  const formData = new FormData();
  
  for (const chart of charts) {
    formData.append('charts', chart.file);
  }
  
  formData.append('symbol', symbol);
  formData.append('sessionDate', sessionDate);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(`${getBackendUrl()}/api/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const errorData = await response.json();
      throw new Error(`429: ${JSON.stringify(errorData)}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return data;
    }

    return data;

  } catch (error) {
    console.error('Analysis Error:', error.message || String(error));
    
    if (error.name === 'AbortError') {
      return {
        error: 'timeout',
        message: 'Request timed out. Please try again.'
      };
    }

    const errorStr = String(error);

    if (errorStr.includes('429') || errorStr.includes('rate limit') || errorStr.includes('RESOURCE_EXHAUSTED')) {
      return {
        error: 'quota_exhausted',
        message: 'API quota exhausted. Please wait or try again.',
        retry_after: 60,
        original_error: errorStr
      };
    }

    if (errorStr.includes('fetch failed') || errorStr.includes('NetworkError')) {
      return {
        error: 'network_error',
        message: 'Unable to connect to analysis server. Please check your connection.',
        original_error: errorStr
      };
    }

    return {
      error: 'api_error',
      message: `Analysis failed: ${error.message || errorStr}`,
      original_error: errorStr
    };
  }
}