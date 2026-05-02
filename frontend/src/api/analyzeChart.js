/**
 * Sends multiple chart images to the FastAPI backend and returns the unified analysis.
 * @param {Array<{file: File, timeframe: string}>} charts - Array of charts
 * @param {string} symbol - Trading pair/asset
 * @param {string} sessionDate - Session date and time
 * @returns {Promise<Object>} Structured analysis JSON
 */
export async function analyzeChart(charts, symbol, sessionDate) {
  const formData = new FormData();
  
  charts.forEach(chart => {
    formData.append("files", chart.file);
    formData.append("timeframes", chart.timeframe);
  });
  
  formData.append("symbol", symbol || "Unknown");
  formData.append("sessionDate", sessionDate || "Unknown");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const res = await fetch(`${API_URL}/analyze-charts/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error (${res.status}): ${text}`);
  }

  return res.json();
}
