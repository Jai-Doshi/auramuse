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
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create image_actresses table (many-to-many linking images to multiple actresses)
CREATE TABLE IF NOT EXISTS image_actresses (
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  actress_id UUID REFERENCES actresses(id) ON DELETE CASCADE,
  PRIMARY KEY (image_id, actress_id)
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
CREATE INDEX IF NOT EXISTS idx_images_category_id ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_image_actresses_actress_id ON image_actresses(actress_id);
CREATE INDEX IF NOT EXISTS idx_story_actresses_actress_id ON story_actresses(actress_id);
CREATE INDEX IF NOT EXISTS idx_story_images_image_id ON story_images(image_id);
