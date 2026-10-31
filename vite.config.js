import { GoogleGenerativeAI } from '@google/generative-ai';
import { loadEnv } from 'vite';

function geminiApi() {
  let apiKey;

  return {
    name: 'brightloop-gemini-api',
    config(_, { mode }) {
      apiKey = loadEnv(mode, process.cwd(), '').GEMINI_API_KEY;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || !req.url?.startsWith('/api/gemini/')) {
          next();
          return;
        }

        if (!apiKey) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Gemini is not configured. Add GEMINI_API_KEY to .env.local and restart the server.' }));
          return;
        }

        let body = '';
        req.setEncoding('utf8');
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 1_000_000) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Request is too large.' }));
            return;
          }
        }

        try {
          const input = JSON.parse(body);
          const endpoint = req.url.split('?')[0];
          let prompt;
          let parseJson;

          if (endpoint === '/api/gemini/insights') {
            if (!input.data || typeof input.data !== 'object') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Insights require a JSON data object.' }));
              return;
            }
            prompt = `Act as a financial analyst for a subscription business. Using only this data, return a JSON array of 3-4 concise, actionable insights. Each object must have string fields "title" and "insight". Do not invent data.\n\n${JSON.stringify(input.data)}`;
            parseJson = (text) => {
              const start = text.indexOf('[');
              const end = text.lastIndexOf(']');
              if (start < 0 || end < start) throw new Error('Gemini returned an invalid insights response.');
              const insights = JSON.parse(text.slice(start, end + 1));
              if (!Array.isArray(insights) || insights.length < 1 || insights.some(item => typeof item.title !== 'string' || typeof item.insight !== 'string')) {
                throw new Error('Gemini returned an invalid insights response.');
              }
              return insights;
            };
          } else if (endpoint === '/api/gemini/forecast') {
            if (!Array.isArray(input.historicalData)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Forecasts require a historical data array.' }));
              return;
            }
            prompt = `Using only this historical subscription revenue data, return a JSON object with a "forecasts" array of three objects containing "month" (string) and "amount" (number), and "confidence" (number from 0 to 100). Do not invent historical values.\n\n${JSON.stringify(input.historicalData)}`;
            parseJson = (text) => {
              const start = text.indexOf('{');
              const end = text.lastIndexOf('}');
              if (start < 0 || end < start) throw new Error('Gemini returned an invalid forecast response.');
              const result = JSON.parse(text.slice(start, end + 1));
              if (!Array.isArray(result.forecasts) || typeof result.confidence !== 'number') {
                throw new Error('Gemini returned an invalid forecast response.');
              }
              return result;
            };
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Unknown Gemini endpoint.' }));
            return;
          }

          const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent(prompt);
          const output = parseJson(result.response.text());
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(output));
        } catch (error) {
          const statusFromMessage = String(error?.message || '').match(/\[(\d{3})\s/);
          const status = Number(error?.status || error?.response?.status || statusFromMessage?.[1] || 0);
          const message = status === 429
            ? 'Gemini API quota exceeded. Check the key quota or billing, then try again later.'
            : status === 400 || status === 403
              ? 'Gemini rejected the request. Check the API key, model access, and request settings.'
              : error instanceof SyntaxError
                ? 'The request or Gemini response contained invalid JSON.'
                : 'Gemini could not complete this request. Try again.';
          console.error('Gemini request failed.', status || message);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Gemini request failed: ${message}` }));
        }
      });
    },
  };
}

export default {
  plugins: [geminiApi()],
};
