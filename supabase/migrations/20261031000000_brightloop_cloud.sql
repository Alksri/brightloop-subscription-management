CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'staff', 'customer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_records (
  id text PRIMARY KEY,
  collection text NOT NULL CHECK (
    collection IN (
      'products',
      'plans',
      'subscriptions',
      'quotations',
      'invoices',
      'payments',
      'discountRules',
      'taxRules',
      'activityLog'
    )
  ),
  owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_records_collection_owner
  ON public.business_records (collection, owner_id);

CREATE INDEX IF NOT EXISTS business_records_created_at
  ON public.business_records (created_at DESC);

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.create_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, company, avatar, role)
  VALUES (
    NEW.id,
    lower(NEW.email),
    coalesce(NEW.raw_user_meta_data ->> 'name', ''),
    coalesce(NEW.raw_user_meta_data ->> 'company', ''),
    upper(left(coalesce(NEW.raw_user_meta_data ->> 'name', ''), 2)),
    'customer'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_customer_profile_after_signup ON auth.users;
CREATE TRIGGER create_customer_profile_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_customer_profile();

CREATE OR REPLACE FUNCTION public.protect_customer_subscription_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.current_profile_role() = 'customer' AND (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.collection IS DISTINCT FROM OLD.collection
    OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.payload - 'status' IS DISTINCT FROM OLD.payload - 'status'
    OR NEW.payload ->> 'status' NOT IN ('active', 'paused')
  ) THEN
    RAISE EXCEPTION 'Customers may only pause or resume their own subscriptions.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_customer_subscription_updates
  ON public.business_records;
CREATE TRIGGER protect_customer_subscription_updates
  BEFORE UPDATE ON public.business_records
  FOR EACH ROW
  WHEN (OLD.collection = 'subscriptions' OR NEW.collection = 'subscriptions')
  EXECUTE FUNCTION public.protect_customer_subscription_updates();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_read_self_or_internal ON public.profiles;
CREATE POLICY profiles_read_self_or_internal
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.current_profile_role()) IN ('admin', 'staff')
  );

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY profiles_update_self_or_admin
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT public.current_profile_role()) = 'admin'
  )
  WITH CHECK (
    (id = (SELECT auth.uid()) AND role = 'customer')
    OR (SELECT public.current_profile_role()) = 'admin'
  );

DROP POLICY IF EXISTS records_read_by_role ON public.business_records;
CREATE POLICY records_read_by_role
  ON public.business_records FOR SELECT TO authenticated
  USING (
    (SELECT public.current_profile_role()) IN ('admin', 'staff')
    OR (
      owner_id = (SELECT auth.uid())
      AND collection IN ('subscriptions', 'quotations', 'invoices', 'payments')
    )
    OR (
      collection IN ('products', 'plans')
      AND payload ->> 'status' = 'active'
    )
  );

DROP POLICY IF EXISTS records_insert_admin ON public.business_records;
CREATE POLICY records_insert_admin
  ON public.business_records FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.current_profile_role()) = 'admin');

DROP POLICY IF EXISTS records_insert_staff ON public.business_records;
CREATE POLICY records_insert_staff
  ON public.business_records FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.current_profile_role()) = 'staff'
    AND collection IN (
      'subscriptions', 'quotations', 'invoices', 'payments', 'activityLog'
    )
  );

DROP POLICY IF EXISTS records_update_admin ON public.business_records;
CREATE POLICY records_update_admin
  ON public.business_records FOR UPDATE TO authenticated
  USING ((SELECT public.current_profile_role()) = 'admin')
  WITH CHECK ((SELECT public.current_profile_role()) = 'admin');

DROP POLICY IF EXISTS records_update_staff ON public.business_records;
CREATE POLICY records_update_staff
  ON public.business_records FOR UPDATE TO authenticated
  USING (
    (SELECT public.current_profile_role()) = 'staff'
    AND collection IN (
      'subscriptions', 'quotations', 'invoices', 'payments', 'activityLog'
    )
  )
  WITH CHECK (
    (SELECT public.current_profile_role()) = 'staff'
    AND collection IN (
      'subscriptions', 'quotations', 'invoices', 'payments', 'activityLog'
    )
  );

DROP POLICY IF EXISTS records_update_customer_subscription ON public.business_records;
CREATE POLICY records_update_customer_subscription
  ON public.business_records FOR UPDATE TO authenticated
  USING (
    (SELECT public.current_profile_role()) = 'customer'
    AND owner_id = (SELECT auth.uid())
    AND collection = 'subscriptions'
  )
  WITH CHECK (
    (SELECT public.current_profile_role()) = 'customer'
    AND owner_id = (SELECT auth.uid())
    AND collection = 'subscriptions'
  );

DROP POLICY IF EXISTS records_delete_admin ON public.business_records;
CREATE POLICY records_delete_admin
  ON public.business_records FOR DELETE TO authenticated
  USING ((SELECT public.current_profile_role()) = 'admin');

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_records TO authenticated;
GRANT ALL ON public.profiles, public.business_records TO service_role;
