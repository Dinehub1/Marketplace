# RevenueCat Webhook Edge Function

Mirrors RevenueCat subscription and purchase lifecycle events into the Supabase database in real-time.

---

## 1. Webhook Endpoint URL

```text
https://xpfmqpmhmcouwzebfwhb.supabase.co/functions/v1/revenuecat-webhook
```
*(Replace `xpfmqpmhmcouwzebfwhb` with your project reference if deploying to a different project)*

---

## 2. RevenueCat Dashboard Configuration

1. In the **RevenueCat Dashboard**, navigate to **Integrations** → **Webhooks**.
2. Click **+ New**.
3. Configure the fields:
   * **Webhook URL:** `https://xpfmqpmhmcouwzebfwhb.supabase.co/functions/v1/revenuecat-webhook`
   * **Authorization header:** `Bearer YOUR_REVENUECAT_WEBHOOK_SECRET`
4. In Supabase Dashboard or CLI, set the secret:
   ```bash
   npx supabase secrets set REVENUECAT_WEBHOOK_AUTH="YOUR_REVENUECAT_WEBHOOK_SECRET" --project-ref xpfmqpmhmcouwzebfwhb
   ```
   *(Requests without a matching authorization header are rejected with 401 Unauthorized).*
5. Click **Send Test Webhook** in RevenueCat to verify the integration.

---

## 3. Deployment

To deploy this Edge Function to your remote Supabase project:

```bash
npx supabase functions deploy revenuecat-webhook --project-ref xpfmqpmhmcouwzebfwhb
```

To apply the database migration:
```bash
npx supabase db push
# or run the SQL in supabase/migrations/20261010183000_revenuecat_subscriptions.sql in Supabase SQL Editor
```

---

## 4. Database Tables Mirrored

### `public.user_subscriptions`
Stores the **latest snapshot** of each customer's subscription:
* `app_user_id`: Indian phone number (`917566636666`), Supabase auth UUID, or anonymous ID.
* `product_id`: e.g. `pdf_monthly`, `pdf_yearly`.
* `entitlement_ids`: Array of active entitlements (e.g. `['pdf_pro']`).
* `status`: `active`, `cancelled`, `expired`, `in_grace_period`, `paused`, `billing_issue`, `refunded`.
* `environment`: `PRODUCTION` or `SANDBOX`.
* `is_sandbox`: `true` when tested in Test Store or sandbox.
* `purchased_at` & `expires_at`: Validity timestamps.
* `latest_transaction_id` & `original_transaction_id`: Store transaction IDs.

### `public.revenuecat_webhook_events`
Append-only audit log of all raw webhook events. Guarantees **idempotency**: duplicate delivery from RevenueCat retries is automatically detected and skipped.

---

## 5. Querying Subscription State in Backend & Edge Functions

### In PostgreSQL / Supabase SQL:
```sql
-- Check if phone 917566636666 has active pdf_pro access:
SELECT public.check_user_entitlement('917566636666', 'pdf_pro');
```

### In TypeScript / PostgREST:
```ts
const { data: isPro } = await supabase.rpc('check_user_entitlement', {
  p_app_user_id: '917566636666',
  p_entitlement: 'pdf_pro',
});

if (isPro) {
  // Allow high-tier server-side actions (e.g. unlimited PDF processing)
}
```
