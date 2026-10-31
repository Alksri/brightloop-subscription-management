# BrightLoop Subscription Management

BrightLoop is a local subscription-operations demo for product and plan setup, quotations, subscriptions, invoices, payments, customers, discounts, tax rules, team access, and customer self-service.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to a Gemini API key.
3. Start the app with `npm run dev`.

The Vite development server handles Gemini requests so the key is not included in browser bundles. Restart the dev server after changing `.env.local`.

## App structure

- `src/App.jsx`: role-filtered navigation and subscription expiry/billing-state updates.
- `src/context`: demo authentication and browser-local data persistence.
- `src/pages`: dashboard, products, subscriptions, invoices, authentication, and management workflows.
- `src/config/gemini.js`: browser calls to the local Gemini API route.
- `vite.config.js`: development-only server-side Gemini integration.

## Demo limitations

Business records and demo sign-in credentials are stored in browser `localStorage`; this is not production authentication or a shared database. Password-reset emails and real payment processing are not configured. The Gemini proxy in `vite.config.js` is for local development; production deployment needs a server-side API endpoint and secure user/data storage.
