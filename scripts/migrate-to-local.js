const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

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

// Helper to convert cloud URL to local path
function getLocalUrl(url, type) {
  if (!url || typeof url !== 'string') return url;

  // Ignore default logo placeholders or empty assets
  if (url === '/logo.svg' || url === '/logo.png' || url === '') {
    return url;
  }

  // If it's already a relative local path, check if it needs normalization
  if (url.startsWith('/') && !url.includes('://')) {
    if (url.startsWith('/api/uploads/')) {
      const filename = url.substring('/api/uploads/'.length);
      return `/ai-graphics/${type}/${filename}`;
    }
    if (url.startsWith('/uploads/')) {
      const filename = url.substring('/uploads/'.length);
      return `/ai-graphics/${type}/${filename}`;
    }
    return url; // already /ai-graphics/ path
  }

  try {
    const parsed = new URL(url);
    const filename = path.basename(parsed.pathname);
    if (filename) {
      return `/ai-graphics/${type}/${filename}`;
    }
  } catch (e) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    if (filename) {
      return `/ai-graphics/${type}/${filename}`;
    }
  }

  return url;
}

async function runMigration() {
  console.log('🚀 Starting Database URL Migration to Local Paths...');

  // --- SUPABASE DATABASE MIGRATION ---
  if (supabase) {
    // 1. Migrate images table (url)
    console.log('\n--- Migrating Supabase images table ---');
    try {
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      let totalFound = 0;
      let totalUpdated = 0;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: images, error } = await supabase
          .from('images')
          .select('id, url, prompt')
          .range(from, to);

        if (error) throw error;

        if (images && images.length > 0) {
          totalFound += images.length;
          console.log(`Processing page ${page + 1} (${images.length} images)...`);

          for (const img of images) {
            const newUrl = getLocalUrl(img.url, 'ai-images');
            if (newUrl && newUrl !== img.url) {
              const { error: updateError } = await supabase
                .from('images')
                .update({ url: newUrl })
                .eq('id', img.id);
              if (updateError) {
                console.error(`   ❌ Failed to update image URL for ID ${img.id}:`, updateError.message);
              } else {
                totalUpdated++;
              }
            }
          }

          if (images.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      console.log(`✅ Found ${totalFound} total images in database. Successfully updated ${totalUpdated} image records in Supabase.`);
    } catch (e) {
      console.error('❌ Error migrating images table:', e.message);
    }

    // 2. Migrate actresses table (profile_picture)
    console.log('\n--- Migrating Supabase actresses table ---');
    try {
      const { data: actresses, error } = await supabase.from('actresses').select('id, name, profile_picture');
      if (error) throw error;
      console.log(`Found ${actresses ? actresses.length : 0} actresses in database.`);

      let updatedCount = 0;
      for (const actress of (actresses || [])) {
        const newUrl = getLocalUrl(actress.profile_picture, 'actress');
        if (newUrl && newUrl !== actress.profile_picture) {
          const { error: updateError } = await supabase
            .from('actresses')
            .update({ profile_picture: newUrl })
            .eq('id', actress.id);
          if (updateError) {
            console.error(`   ❌ Failed to update actress ${actress.name}:`, updateError.message);
          } else {
            updatedCount++;
          }
        }
      }
      console.log(`✅ Successfully updated ${updatedCount} actress records in Supabase.`);
    } catch (e) {
      console.error('❌ Error migrating actresses table:', e.message);
    }

    // 3. Migrate stories table (cover_poster)
    console.log('\n--- Migrating Supabase stories table ---');
    try {
      const { data: stories, error } = await supabase.from('stories').select('id, title, cover_poster');
      if (error) throw error;
      console.log(`Found ${stories ? stories.length : 0} stories in database.`);

      let updatedCount = 0;
      for (const story of (stories || [])) {
        const newUrl = getLocalUrl(story.cover_poster, 'posters');
        if (newUrl && newUrl !== story.cover_poster) {
          const { error: updateError } = await supabase
            .from('stories')
            .update({ cover_poster: newUrl })
            .eq('id', story.id);
          if (updateError) {
            console.error(`   ❌ Failed to update story "${story.title}":`, updateError.message);
          } else {
            updatedCount++;
          }
        }
      }
      console.log(`✅ Successfully updated ${updatedCount} story records in Supabase.`);
    } catch (e) {
      console.error('❌ Error migrating stories table:', e.message);
    }

    // 4. Migrate app_users table (avatar)
    console.log('\n--- Migrating Supabase app_users table ---');
    try {
      const { data: users, error } = await supabase.from('app_users').select('id, username, avatar');
      if (error) throw error;
      console.log(`Found ${users ? users.length : 0} users in database.`);

      let updatedCount = 0;
      for (const user of (users || [])) {
        const newUrl = getLocalUrl(user.avatar, 'avatar');
        if (newUrl && newUrl !== user.avatar) {
          const { error: updateError } = await supabase
            .from('app_users')
            .update({ avatar: newUrl })
            .eq('id', user.id);
          if (updateError) {
            console.error(`   ❌ Failed to update avatar for user ${user.username}:`, updateError.message);
          } else {
            updatedCount++;
          }
        }
      }
      console.log(`✅ Successfully updated ${updatedCount} user records in Supabase.`);
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
        let updatedCount = 0;
        for (const img of db.images) {
          const newUrl = getLocalUrl(img.url, 'ai-images');
          if (newUrl && newUrl !== img.url) {
            img.url = newUrl;
            localModified = true;
            updatedCount++;
          }
        }
        console.log(`Migrated ${updatedCount} local image URLs.`);
      }

      // Migrate local actresses
      if (db.actresses && Array.isArray(db.actresses)) {
        let updatedCount = 0;
        for (const act of db.actresses) {
          const newUrl = getLocalUrl(act.profile_picture, 'actress');
          if (newUrl && newUrl !== act.profile_picture) {
            act.profile_picture = newUrl;
            localModified = true;
            updatedCount++;
          }
        }
        console.log(`Migrated ${updatedCount} local actress profile pictures.`);
      }

      // Migrate local stories
      if (db.stories && Array.isArray(db.stories)) {
        let updatedCount = 0;
        for (const story of db.stories) {
          const newUrl = getLocalUrl(story.cover_poster, 'posters');
          if (newUrl && newUrl !== story.cover_poster) {
            story.cover_poster = newUrl;
            localModified = true;
            updatedCount++;
          }
        }
        console.log(`Migrated ${updatedCount} local story covers.`);
      }

      // Migrate local users
      if (db.app_users && Array.isArray(db.app_users)) {
        let updatedCount = 0;
        for (const user of db.app_users) {
          const newUrl = getLocalUrl(user.avatar, 'avatar');
          if (newUrl && newUrl !== user.avatar) {
            user.avatar = newUrl;
            localModified = true;
            updatedCount++;
          }
        }
        console.log(`Migrated ${updatedCount} local user avatars.`);
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
