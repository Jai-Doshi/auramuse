-- SUPABASE DATABASE SETUP SCHEMA
-- Copy and paste this script directly into the Supabase SQL Query Editor.

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create actresses table
CREATE TABLE IF NOT EXISTS actresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  profile_picture TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create images table (No direct actress_id)
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create image_actresses table (many-to-many linking images to multiple actresses)
CREATE TABLE IF NOT EXISTS image_actresses (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  actress_id UUID REFERENCES actresses(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, actress_id)
);

-- 4b. Create image_categories table (many-to-many linking images to multiple categories)
CREATE TABLE IF NOT EXISTS image_categories (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, category_id)
);

-- 5. Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  cover_poster TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration query for existing databases:
-- ALTER TABLE stories ADD COLUMN IF NOT EXISTS cover_poster TEXT DEFAULT '';

-- 6. Create story_actresses table (many-to-many)
CREATE TABLE IF NOT EXISTS story_actresses (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  actress_id UUID REFERENCES actresses(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, actress_id)
);

-- 7. Create story_images table (many-to-many)
CREATE TABLE IF NOT EXISTS story_images (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  description TEXT,
  PRIMARY KEY (story_id, image_id)
);

-- Enable indexes for faster query performance
CREATE INDEX IF NOT EXISTS idx_image_categories_category_id ON image_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_image_actresses_actress_id ON image_actresses(actress_id);
CREATE INDEX IF NOT EXISTS idx_story_actresses_actress_id ON story_actresses(actress_id);
CREATE INDEX IF NOT EXISTS idx_story_images_image_id ON story_images(image_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) FIXES
-- Copy and run these commands in the Supabase SQL Query Editor to resolve policy violations.
-- =========================================================================

-- 1. Disable RLS on Database Tables (allows public reading/writing for personal local dashboard)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE actresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE images DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_actresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_actresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_images DISABLE ROW LEVEL SECURITY;

-- Migration script for existing database:
-- CREATE TABLE IF NOT EXISTS image_categories (
--   image_id UUID REFERENCES images(id) ON DELETE CASCADE,
--   category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
--   PRIMARY KEY (image_id, category_id)
-- );
-- CREATE INDEX IF NOT EXISTS idx_image_categories_category_id ON image_categories(category_id);
-- ALTER TABLE image_categories DISABLE ROW LEVEL SECURITY;
-- INSERT INTO image_categories (image_id, category_id) SELECT id, category_id FROM images WHERE category_id IS NOT NULL ON CONFLICT DO NOTHING;
-- ALTER TABLE images DROP COLUMN IF EXISTS category_id;

-- 2. Configure Permissive Storage Policies for upload buckets
-- (Ensure buckets 'actress', 'posters', and 'ai-images' are set to Public in Supabase Storage)

CREATE POLICY "Allow Public Storage Select" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id IN ('actress', 'posters', 'ai-images'));

CREATE POLICY "Allow Public Storage Insert" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id IN ('actress', 'posters', 'ai-images'));

CREATE POLICY "Allow Public Storage Update" 
ON storage.objects FOR UPDATE 
TO public 
USING (bucket_id IN ('actress', 'posters', 'ai-images'));

CREATE POLICY "Allow Public Storage Delete" 
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id IN ('actress', 'posters', 'ai-images'));

-- =========================================================================
-- USER SYSTEM & COLLECTIONS
-- =========================================================================

-- 8. Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable row level security for app_users (matching other tables for ease of local configuration)
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 9. Create user_cards table (many-to-many linking users to images they collected)
CREATE TABLE IF NOT EXISTS user_cards (
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1,
  favorite BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, image_id)
);

ALTER TABLE user_cards DISABLE ROW LEVEL SECURITY;

-- 10. Create user_claims table (storing last claimed timestamps for daily packs)
CREATE TABLE IF NOT EXISTS user_claims (
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE PRIMARY KEY,
  last_claimed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_claims DISABLE ROW LEVEL SECURITY;

-- 11. Seed default accounts
INSERT INTO app_users (username, password, name, role)
VALUES
  ('admin', 'admin', 'System Admin', 'admin'),
  ('user', 'user', 'Aura Collector', 'user')
ON CONFLICT (username) DO NOTHING;

