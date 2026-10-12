/*
# Create marketplace_listings table for UniSphere Marketplace

1. New Table
- `marketplace_listings`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, defaults to auth.uid())
  - `title` (text, not null)
  - `description` (text, not null)
  - `price` (numeric, not null, check >= 0)
  - `category` (text, not null — e.g. Books, Electronics, Furniture, Other)
  - `image_url` (text, nullable — path to image in storage)
  - `status` (text, default 'available', check: 'available' or 'sold')
  - `created_at` (timestamptz, default now())

2. Security (RLS)
- All authenticated users can SELECT (browse marketplace)
- Users can INSERT as themselves
- Users can UPDATE only their own listings (e.g. mark as sold)
- Users can DELETE only their own listings

3. Index
- created_at DESC for newest-first ordering
*/

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text NOT NULL DEFAULT 'Other',
  image_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_select_all" ON marketplace_listings;
CREATE POLICY "marketplace_select_all"
ON marketplace_listings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "marketplace_insert_own" ON marketplace_listings;
CREATE POLICY "marketplace_insert_own"
ON marketplace_listings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "marketplace_update_own" ON marketplace_listings;
CREATE POLICY "marketplace_update_own"
ON marketplace_listings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "marketplace_delete_own" ON marketplace_listings;
CREATE POLICY "marketplace_delete_own"
ON marketplace_listings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_created_at ON marketplace_listings (created_at DESC);
