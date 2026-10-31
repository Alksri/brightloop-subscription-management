async function requestGemini(path, data) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Gemini request failed.');
  }
  return result;
}

let pendingInsights;

export async function getAIInsights(data) {
  if (!pendingInsights) {
    pendingInsights = requestGemini('/api/gemini/insights', { data })
      .finally(() => { pendingInsights = undefined; });
  }
  return pendingInsights;
}

export async function getRevenueForecasts(historicalData) {
  return requestGemini('/api/gemini/forecast', { historicalData });
}
