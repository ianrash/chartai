function getBackendUrl() {
  return import.meta.env.VITE_BACKEND_URL || 'https://chartai-wy7a.onrender.com';
}

async function wakeUpBackend() {
  try {
    await fetch(`${getBackendUrl()}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) {
    // Ignore - just trying to wake up the service
  }
}

export async function analyzeImages(charts, symbol = "Unknown", sessionDate = "Unknown") {
  if (!charts || charts.length < 2) {
    throw new Error("Minimum 2 charts required for analysis.");
  }

  if (charts.length > 3) {
    throw new Error("Maximum 3 charts allowed.");
  }

  // Wake up backend if sleeping (Render free tier)
  await wakeUpBackend();

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
        message: 'Unable to connect to analysis server. Backend may be starting up - please try again.',
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