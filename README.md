# BrightLoop

BrightLoop is a subscription operations dashboard for products, plans, subscriptions, quotations, invoices, payments, customers, discounts, tax rules, team access, and customer self-service.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```powershell
npm install
npm run dev
```

Open the URL printed by Vite (normally [http://localhost:5173](https://brightloop-7ejv.onrender.com/)).

## Build

```powershell
npm run build
npm run preview
```

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml`. Connect your Render account to the public GitHub repository and create the static site from the blueprint. Render builds with `npm ci && npm run build`, publishes `dist`, and rewrites app routes to `index.html`.

Live site: https://brightloop-7ejv.onrender.com/

## Current deployment and data limitations

The UI can be statically hosted, but the current app is still a demo: authentication and business records are stored in the browser, and Gemini requests use a Vite development-only server endpoint. Production Gemini insights, shared cloud data/auth, password reset delivery, and payment processing are not configured. Do not use real customer data or credentials until production services and authorization are implemented.

Supabase migration files are in `supabase/migrations`; provisioning a database does not automatically connect the current UI or apply those migrations.
