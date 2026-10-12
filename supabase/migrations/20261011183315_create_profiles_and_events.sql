/*
# Create profiles and events tables for UniSphere

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text, not null)
  - `email` (text, not null)
  - `role` (text, default 'student', values: 'student' or 'admin')
  - `course` (text)
  - `semester` (text)
  - `avatar_url` (text)
  - `created_at` (timestamptz, default now())
- `events`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text)
  - `event_date` (date, not null)
  - `venue` (text)
  - `created_by` (uuid, references auth.users)
  - `created_at` (timestamptz, default now())

2. Security
- profiles: RLS enabled. Users can read and update their own profile. Any authenticated user can read all profiles (community feature). Only self can update own row.
- events: RLS enabled. Any authenticated user can read events. Only admins can insert, update, delete events. Admin check is done via subquery on profiles table where role = 'admin'.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  course text,
  semester text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  venue text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all"
ON events FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "events_insert_admin" ON events;
CREATE POLICY "events_insert_admin"
ON events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "events_update_admin" ON events;
CREATE POLICY "events_update_admin"
ON events FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "events_delete_admin" ON events;
CREATE POLICY "events_delete_admin"
ON events FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
