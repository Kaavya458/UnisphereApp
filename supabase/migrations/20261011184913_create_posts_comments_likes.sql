/*
# Create posts, comments, likes tables and uploads storage bucket for UniSphere

1. New Tables
- `posts`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, defaults to auth.uid())
  - `type` (text, not null, check: 'general', 'doubt', 'seminar')
  - `content` (text, not null)
  - `file_url` (text, nullable — URL to uploaded file in storage)
  - `file_type` (text, nullable — 'image' or 'pdf')
  - `is_solved` (boolean, default false — only relevant for doubt posts)
  - `solved_comment_id` (uuid, nullable — references comments, the accepted answer)
  - `created_at` (timestamptz, default now())
- `comments`
  - `id` (uuid, primary key)
  - `post_id` (uuid, references posts ON DELETE CASCADE)
  - `user_id` (uuid, references auth.users, defaults to auth.uid())
  - `content` (text, not null)
  - `is_accepted` (boolean, default false — true if the post author accepted this answer)
  - `created_at` (timestamptz, default now())
- `likes`
  - `id` (uuid, primary key)
  - `post_id` (uuid, references posts ON DELETE CASCADE)
  - `user_id` (uuid, references auth.users, defaults to auth.uid())
  - `created_at` (timestamptz, default now())
  - UNIQUE constraint on (post_id, user_id) — one like per user per post

2. Storage
- Create public bucket "uploads" for images and PDFs
- Policy: authenticated users can upload and read files; users can delete only their own files

3. Security (RLS)
- posts: all authenticated users can SELECT. Users can INSERT as themselves (type 'general' or 'doubt'); only admins can INSERT type 'seminar'. Users can UPDATE only their own posts (for marking solved). Users can DELETE only their own posts.
- comments: all authenticated users can SELECT. Users can INSERT as themselves. Post authors can UPDATE is_accepted on comments on their own posts (for marking answers). Users can DELETE only their own comments.
- likes: all authenticated users can SELECT. Users can INSERT/DELETE only their own likes.

4. Indexes
- posts.created_at for feed ordering
- comments.post_id for fetching comments by post
- likes.post_id for counting likes by post
*/

-- ===================== POSTS =====================
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('general', 'doubt', 'seminar')),
  content text NOT NULL,
  file_url text,
  file_type text CHECK (file_type IS NULL OR file_type IN ('image', 'pdf')),
  is_solved boolean NOT NULL DEFAULT false,
  solved_comment_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all"
ON posts FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    type IN ('general', 'doubt')
    OR (
      type = 'seminar'
      AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  )
);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);

-- ===================== COMMENTS =====================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all"
ON comments FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_post_author" ON comments;
CREATE POLICY "comments_update_post_author"
ON comments FOR UPDATE
TO authenticated
USING (
  -- post author can update is_accepted on comments on their post
  EXISTS (SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = comments.post_id AND posts.user_id = auth.uid())
);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own"
ON comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

-- ===================== LIKES =====================
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all"
ON likes FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);

-- ===================== STORAGE =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated can upload and read; users delete only their own
DROP POLICY IF EXISTS "uploads_read_all" ON storage.objects;
CREATE POLICY "uploads_read_all"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "uploads_insert_own" ON storage.objects;
CREATE POLICY "uploads_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads' AND auth.uid() = owner);

DROP POLICY IF EXISTS "uploads_delete_own" ON storage.objects;
CREATE POLICY "uploads_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid() = owner);
