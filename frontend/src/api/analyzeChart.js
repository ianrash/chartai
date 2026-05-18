import { analyzeImages } from "./backendAdapter";

export async function analyzeChart(charts, symbol, sessionDate) {
  if (!charts || charts.length < 2) {
    throw new Error("Minimum 2 charts required for analysis.");
  }
  
  if (charts.length > 3) {
    throw new Error("Maximum 3 charts allowed.");
  }
  
  return analyzeImages(charts, symbol, sessionDate);
}