-- WhatsApp templates pulled from Nextel (our source of truth is Nextel's
-- approved templates; this table caches them so ops/UI can show what exists,
-- approval status, and variable counts without calling Nextel on every render).
-- Schema is deliberately permissive: the full Nextel payload is kept in `raw`
-- and a few commonly-used fields are promoted to columns for indexing.
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  name text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  category text,
  status text,
  body text,
  variables integer DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, language)
);

CREATE INDEX IF NOT EXISTS whatsapp_templates_name_idx ON public.whatsapp_templates (name);
CREATE INDEX IF NOT EXISTS whatsapp_templates_status_idx ON public.whatsapp_templates (status);

GRANT SELECT ON public.whatsapp_templates TO anon, authenticated;
GRANT INSERT, UPDATE, SELECT ON public.whatsapp_templates TO service_role;
