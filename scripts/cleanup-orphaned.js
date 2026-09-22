const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Polyfill WebSocket for Node.js
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const missingIds = [
  '3468280a-0a3d-486b-94a2-14583d9cd9de',
  'fa722449-70a0-4ad4-8d94-b0e6a24e561b',
  '650782e3-2ce8-44fe-ad16-ac474232788e',
  'eb4c3e72-0400-4274-b72a-27ad6b0bd085',
  'd538263d-236d-423e-964a-069c0b677ec8',
  'ba446d8e-2ea4-42f9-97ed-62eae11889ab',
  'ab4eed8b-d81d-45be-8009-90bd26288ad0',
  'c6be01d9-6240-4024-86f1-d33d303c95f4',
  '3fad93cd-e93e-4682-8399-ea46c506551a',
  '31f4d3be-3772-40d9-9592-1c6dd38f1606'
];

async function cleanup() {
  console.log('🚀 Cleaning up 10 orphaned image records...');

  // 1. Delete from child tables first to ensure no constraint violations
  console.log('Deleting from user_cards...');
  const { error: errUC } = await supabase.from('user_cards').delete().in('image_id', missingIds);
  if (errUC) console.warn('user_cards delete notice:', errUC.message);

  console.log('Deleting from story_images...');
  const { error: errSI } = await supabase.from('story_images').delete().in('image_id', missingIds);
  if (errSI) console.warn('story_images delete notice:', errSI.message);

  console.log('Deleting from image_actresses...');
  const { error: errIA } = await supabase.from('image_actresses').delete().in('image_id', missingIds);
  if (errIA) console.warn('image_actresses delete notice:', errIA.message);

  console.log('Deleting from image_categories...');
  const { error: errIC } = await supabase.from('image_categories').delete().in('image_id', missingIds);
  if (errIC) console.warn('image_categories delete notice:', errIC.message);

  // 2. Delete from images table
  console.log('Deleting from images...');
  const { data, error: errImg } = await supabase.from('images').delete().in('id', missingIds).select();
  if (errImg) {
    console.error('❌ Error deleting from images table:', errImg.message);
  } else {
    console.log(`✅ Successfully deleted ${data ? data.length : missingIds.length} records from images table.`);
  }

  // 3. Verify images table count & consistency
  const { count, error: countErr } = await supabase.from('images').select('*', { count: 'exact', head: true });
  console.log(`Total remaining images in database: ${count}`);

  // 4. Double check if any missing images remain
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;
  let remainingMissing = 0;

  while (hasMore) {
    const { data: images } = await supabase.from('images').select('id, url').range(page * pageSize, (page + 1) * pageSize - 1);
    if (!images || images.length === 0) break;
    images.forEach(img => {
      if (img.url && img.url.startsWith('/ai-graphics/')) {
        const filePath = path.join(__dirname, '..', 'public', img.url);
        if (!fs.existsSync(filePath)) {
          remainingMissing++;
        }
      }
    });
    if (images.length < pageSize) hasMore = false;
    else page++;
  }

  console.log(`\n🎉 Verification complete! Missing images in database now: ${remainingMissing}`);
}

cleanup().catch(console.error);
