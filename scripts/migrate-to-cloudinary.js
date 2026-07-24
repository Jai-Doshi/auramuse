const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');

// 1. Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
  console.log('✅ Loaded environment variables from .env.local');
} else {
  console.warn('⚠️ .env.local file not found. Using system environment variables.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

if (!isCloudinaryConfigured) {
  console.error('❌ Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Polyfill WebSocket for Node.js to prevent Supabase Realtime check failure
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client initialized.');
} else {
  console.log('ℹ️ Supabase not configured. Operating on local JSON db if present.');
}

// Helper function to upload an image from a URL to Cloudinary
async function migrateImageUrl(url, folderName) {
  if (!url || typeof url !== 'string') return null;
  // Check if URL points to Supabase storage
  if (!url.includes('supabase.co')) {
    console.log(`   ⏭️ Skipping URL (not a Supabase URL): ${url}`);
    return null;
  }

  console.log(`   📥 Downloading from Supabase: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract original filename to use as public_id
    const urlParts = url.split('/');
    const originalFilename = urlParts[urlParts.length - 1] || 'image';
    const publicId = path.parse(originalFilename).name;

    console.log(`   📤 Uploading to Cloudinary folder "${folderName}" as "${publicId}"...`);
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          public_id: publicId,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log(`   ✨ Uploaded successfully! New URL: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (error) {
    console.error(`   ❌ Failed to migrate URL "${url}":`, error.message);
    return null;
  }
}

async function runMigration() {
  console.log('🚀 Starting Image Migration to Cloudinary...');

  // --- SUPABASE DATABASE MIGRATION ---
  if (supabase) {
    // 1. Migrate images table (url)
    console.log('\n--- Migrating Supabase images table ---');
    try {
      const { data: images, error } = await supabase.from('images').select('id, url, prompt');
      if (error) throw error;
      console.log(`Found ${images ? images.length : 0} images in database.`);
      
      for (const img of (images || [])) {
        console.log(`🖼️ Image ID: ${img.id} ("${img.prompt ? img.prompt.substring(0, 30) : ''}...")`);
        const newUrl = await migrateImageUrl(img.url, 'ai-graphics/ai-images');
        if (newUrl) {
          const { error: updateError } = await supabase
            .from('images')
            .update({ url: newUrl })
            .eq('id', img.id);
          if (updateError) {
            console.error(`   ❌ Failed to update image URL in Supabase table:`, updateError.message);
          } else {
            console.log(`   ✅ Supabase DB updated successfully.`);
          }
        }
      }
    } catch (e) {
      console.error('❌ Error migrating images table:', e.message);
    }

    // 2. Migrate actresses table (profile_picture)
    console.log('\n--- Migrating Supabase actresses table ---');
    try {
      const { data: actresses, error } = await supabase.from('actresses').select('id, name, profile_picture');
      if (error) throw error;
      console.log(`Found ${actresses ? actresses.length : 0} actresses in database.`);
      
      for (const actress of (actresses || [])) {
        console.log(`👤 Actress Name: ${actress.name}`);
        const newUrl = await migrateImageUrl(actress.profile_picture, 'ai-graphics/actress');
        if (newUrl) {
          const { error: updateError } = await supabase
            .from('actresses')
            .update({ profile_picture: newUrl })
            .eq('id', actress.id);
          if (updateError) {
            console.error(`   ❌ Failed to update actress URL in Supabase table:`, updateError.message);
          } else {
            console.log(`   ✅ Supabase DB updated successfully.`);
          }
        }
      }
    } catch (e) {
      console.error('❌ Error migrating actresses table:', e.message);
    }

    // 3. Migrate stories table (cover_poster)
    console.log('\n--- Migrating Supabase stories table ---');
    try {
      const { data: stories, error } = await supabase.from('stories').select('id, title, cover_poster');
      if (error) throw error;
      console.log(`Found ${stories ? stories.length : 0} stories in database.`);
      
      for (const story of (stories || [])) {
        console.log(`📖 Story Title: ${story.title}`);
        const newUrl = await migrateImageUrl(story.cover_poster, 'ai-graphics/posters');
        if (newUrl) {
          const { error: updateError } = await supabase
            .from('stories')
            .update({ cover_poster: newUrl })
            .eq('id', story.id);
          if (updateError) {
            console.error(`   ❌ Failed to update story URL in Supabase table:`, updateError.message);
          } else {
            console.log(`   ✅ Supabase DB updated successfully.`);
          }
        }
      }
    } catch (e) {
      console.error('❌ Error migrating stories table:', e.message);
    }

    // 4. Migrate app_users table (avatar)
    console.log('\n--- Migrating Supabase app_users table ---');
    try {
      const { data: users, error } = await supabase.from('app_users').select('id, username, avatar');
      if (error) throw error;
      console.log(`Found ${users ? users.length : 0} users in database.`);
      
      for (const user of (users || [])) {
        console.log(`👤 User: ${user.username}`);
        const newUrl = await migrateImageUrl(user.avatar, 'ai-graphics/avatar');
        if (newUrl) {
          const { error: updateError } = await supabase
            .from('app_users')
            .update({ avatar: newUrl })
            .eq('id', user.id);
          if (updateError) {
            console.error(`   ❌ Failed to update user avatar URL in Supabase table:`, updateError.message);
          } else {
            console.log(`   ✅ Supabase DB updated successfully.`);
          }
        }
      }
    } catch (e) {
      console.error('❌ Error migrating app_users table:', e.message);
    }
  }

  // --- LOCAL JSON DATABASE MIGRATION ---
  const dbFilePath = path.join(__dirname, '..', 'data', 'db.json');
  if (fs.existsSync(dbFilePath)) {
    console.log('\n--- Migrating local JSON database (data/db.json) ---');
    try {
      const dbContent = fs.readFileSync(dbFilePath, 'utf-8');
      const db = JSON.parse(dbContent);
      let localModified = false;

      // Migrate local images
      if (db.images && Array.isArray(db.images)) {
        console.log(`Found ${db.images.length} local images.`);
        for (const img of db.images) {
          console.log(`🖼️ Local Image ID: ${img.id}`);
          const newUrl = await migrateImageUrl(img.url, 'ai-graphics/ai-images');
          if (newUrl) {
            img.url = newUrl;
            localModified = true;
          }
        }
      }

      // Migrate local actresses
      if (db.actresses && Array.isArray(db.actresses)) {
        console.log(`Found ${db.actresses.length} local actresses.`);
        for (const act of db.actresses) {
          console.log(`👤 Local Actress Name: ${act.name}`);
          const newUrl = await migrateImageUrl(act.profile_picture, 'ai-graphics/actress');
          if (newUrl) {
            act.profile_picture = newUrl;
            localModified = true;
          }
        }
      }

      // Migrate local stories
      if (db.stories && Array.isArray(db.stories)) {
        console.log(`Found ${db.stories.length} local stories.`);
        for (const story of db.stories) {
          console.log(`📖 Local Story Title: ${story.title}`);
          const newUrl = await migrateImageUrl(story.cover_poster, 'ai-graphics/posters');
          if (newUrl) {
            story.cover_poster = newUrl;
            localModified = true;
          }
        }
      }

      // Migrate local users
      if (db.app_users && Array.isArray(db.app_users)) {
        console.log(`Found ${db.app_users.length} local users.`);
        for (const user of db.app_users) {
          console.log(`👤 Local User: ${user.username}`);
          const newUrl = await migrateImageUrl(user.avatar, 'ai-graphics/avatar');
          if (newUrl) {
            user.avatar = newUrl;
            localModified = true;
          }
        }
      }

      if (localModified) {
        fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), 'utf-8');
        console.log('✅ Local JSON database (db.json) updated and saved successfully.');
      } else {
        console.log('ℹ️ No local JSON database changes needed.');
      }
    } catch (e) {
      console.error('❌ Error migrating local JSON database:', e.message);
    }
  }

  console.log('\n🏁 Migration process completed!');
}

runMigration().catch(err => {
  console.error('❌ Critical migration error:', err);
});
