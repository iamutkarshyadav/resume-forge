## Stripe Webhook & CLI (Windows-friendly)

- Endpoint: POST `/api/v1/stripe/webhook`
- Stripe CLI (Windows PowerShell): `.\stripe.exe listen --forward-to http://localhost:4000/api/v1/stripe/webhook`
- Secrets:
  - Test mode uses `STRIPE_TEST_WEBHOOK_SECRET` (starts with `whsec_`)
  - Live mode uses `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)
  - Secret keys start with `sk_` and are **not** the same as webhook signing secrets.

### If credits are stuck in pending, check these five things
- Stripe CLI is forwarding to `http://localhost:4000/api/v1/stripe/webhook`.
- The `stripe-signature` header is present on the request.
- The webhook body arrives as a raw Buffer (no prior JSON parsing).
- The correct signing secret is set for the mode (test vs live) and begins with `whsec_`.
- Logs show the `stripeSessionId`; if verification fails, fix the secret/body and replay the event.
