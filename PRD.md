# Product Requirements Document (PRD)

## Product: BrightLoop SaaS Dashboard

### Overview
A subscription-billing and invoicing dashboard for SaaS businesses, with AI-powered insights (Gemini), Firebase auth/data, and rich analytics.

### Goals
- Centralize revenue, subscriptions, invoices, payments visibility
- Provide AI insights for business decisions
- Support customer management and product catalog

### Core Features
1. Authentication (Firebase)
2. Dashboard with KPIs, charts, AI insights
3. Products management
4. Subscriptions lifecycle
5. Invoices & payments
6. Customers

### Enterprise Enhancements
- Payment Processor Integration (Stripe/Razorpay) for real transactions
- RBAC via Firebase custom claims (Admin, Billing Manager, Viewer)
- Automated billing workflows via Cloud Functions (renewals, proration, dunning)
- Export & reporting (PDF invoices, CSV KPI/revenue)
- Pagination, search, filtering server-side
- Optimistic UI + offline persistence
- AI insight caching (daily/triggered)
- Error boundaries + toast notifications
- Testing: Vitest (utils) + Cypress (E2E)

### Critique & Improvements
- Add RBAC, pagination/search, optimistic UI, AI caching, error boundaries.
