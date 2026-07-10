import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let supabase = null;
if (isSupabaseConfigured) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const dbFilePath = path.join(process.cwd(), 'data', 'db.json');

// Ensure database file and uploads directory exist
function ensureLocalDb() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(
      dbFilePath,
      JSON.stringify({
        categories: [],
        actresses: [],
        images: [],
        image_actresses: [],
        stories: [],
        story_actresses: [],
        story_images: [],
        app_users: [
          {
            id: 'default-admin-uuid',
            username: 'admin',
            password: 'admin',
            name: 'System Admin',
            role: 'admin',
            created_at: new Date().toISOString()
          },
          {
            id: 'default-user-uuid',
            username: 'user',
            password: 'user',
            name: 'Aura Collector',
            role: 'user',
            created_at: new Date().toISOString()
          }
        ],
        user_cards: [],
        user_claims: []
      }, null, 2)
    );
  } else {
    // Migrate existing local database to include image_actresses if missing
    try {
      const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
      let modified = false;
      if (!data.image_actresses) {
        data.image_actresses = [];
        modified = true;
      }
      // If there are existing images, migrate their actress_id to image_actresses
      if (data.images && data.images.length > 0 && data.image_actresses.length === 0) {
        data.images.forEach(img => {
          if (img.actress_id) {
            data.image_actresses.push({
              image_id: img.id,
              actress_id: img.actress_id
            });
          }
        });
        modified = true;
      }
      if (!data.image_categories) {
        data.image_categories = [];
        modified = true;
      }
      // If there are existing images, migrate their category_id to image_categories
      if (data.images && data.images.length > 0 && data.image_categories.length === 0) {
        data.images.forEach(img => {
          if (img.category_id) {
            data.image_categories.push({
              image_id: img.id,
              category_id: img.category_id
            });
          }
        });
        modified = true;
      }
      // Migrate users
      if (!data.app_users) {
        data.app_users = [];
        modified = true;
      }
      if (data.app_users.length === 0) {
        data.app_users.push({
          id: 'default-admin-uuid',
          username: 'admin',
          password: 'admin',
          name: 'System Admin',
          role: 'admin',
          created_at: new Date().toISOString()
        });
        data.app_users.push({
          id: 'default-user-uuid',
          username: 'user',
          password: 'user',
          name: 'Aura Collector',
          role: 'user',
          created_at: new Date().toISOString()
        });
        modified = true;
      }
      if (!data.user_cards) {
        data.user_cards = [];
        modified = true;
      } else {
        data.user_cards.forEach(uc => {
          if (uc.favorite === undefined) {
            uc.favorite = false;
            modified = true;
          }
        });
      }
      if (!data.user_claims) {
        data.user_claims = [];
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }
}

function readLocalDb() {
  ensureLocalDb();
  const data = fs.readFileSync(dbFilePath, 'utf8');
  return JSON.parse(data);
}

function writeLocalDb(data) {
  ensureLocalDb();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Generate UUID helper for local JSON
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- DATABASE OPERATIONS ---

// 1. Categories
export async function getCategories() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    return db.categories.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function createCategory(name) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    const normalized = name.trim();
    if (db.categories.some(c => c.name.toLowerCase() === normalized.toLowerCase())) {
      throw new Error('Category already exists');
    }
    const newCat = {
      id: generateUUID(),
      name: normalized,
      created_at: new Date().toISOString()
    };
    db.categories.push(newCat);
    writeLocalDb(db);
    return newCat;
  }
}

// 2. Actresses
export async function getActresses() {
  if (isSupabaseConfigured) {
    // Fetch actresses
    const { data: actresses, error: actError } = await supabase
      .from('actresses')
      .select('*')
      .order('name', { ascending: true });
    if (actError) throw actError;

    // Fetch many-to-many image links
    const { data: imageActresses, error: imgError } = await supabase
      .from('image_actresses')
      .select('actress_id');
    if (imgError) throw imgError;

    // Fetch story relations
    const { data: storyActresses, error: storyError } = await supabase
      .from('story_actresses')
      .select('actress_id');
    if (storyError) throw storyError;

    return actresses.map(actress => {
      const imgCount = imageActresses.filter(ia => ia.actress_id === actress.id).length;
      const storyCount = storyActresses.filter(sa => sa.actress_id === actress.id).length;
      return {
        ...actress,
        activity_stat: `${imgCount} Image${imgCount !== 1 ? 's' : ''}`,
        story_stat: `${storyCount} Story${storyCount !== 1 ? 'ies' : ''}`,
        raw_image_count: imgCount,
        raw_story_count: storyCount
      };
    });
  } else {
    const db = readLocalDb();
    if (!db.image_actresses) db.image_actresses = [];
    return db.actresses.map(actress => {
      const imgCount = db.image_actresses.filter(ia => ia.actress_id === actress.id).length;
      const storyCount = db.story_actresses.filter(sa => sa.actress_id === actress.id).length;
      return {
        ...actress,
        activity_stat: `${imgCount} Image${imgCount !== 1 ? 's' : ''}`,
        story_stat: `${storyCount} Story${storyCount !== 1 ? 'ies' : ''}`,
        raw_image_count: imgCount,
        raw_story_count: storyCount
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }
}

export async function createActress(name, profile_picture, bio = '') {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('actresses')
      .insert([{ name, profile_picture, bio }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    const normalized = name.trim();
    if (db.actresses.some(a => a.name.toLowerCase() === normalized.toLowerCase())) {
      throw new Error('Actress already exists');
    }
    const newActress = {
      id: generateUUID(),
      name: normalized,
      profile_picture,
      bio,
      created_at: new Date().toISOString()
    };
    db.actresses.push(newActress);
    writeLocalDb(db);
    return newActress;
  }
}

// 3. Images
export async function getImages() {
  if (isSupabaseConfigured) {
    // Get all images
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Get all image category links
    const { data: imageCategories, error: icError } = await supabase
      .from('image_categories')
      .select('*, category:categories(*)');
    if (icError) throw icError;

    // Get all image actress links
    const { data: imageActresses, error: iaError } = await supabase
      .from('image_actresses')
      .select('*, actress:actresses(*)');
    if (iaError) throw iaError;

    return images.map(img => {
      const categories = imageCategories
        .filter(ic => ic.image_id === img.id)
        .map(ic => ic.category);
      const actresses = imageActresses
        .filter(ia => ia.image_id === img.id)
        .map(ia => ia.actress);
      return {
        ...img,
        categories,
        actresses
      };
    });
  } else {
    const db = readLocalDb();
    if (!db.image_actresses) db.image_actresses = [];
    if (!db.image_categories) db.image_categories = [];
    return db.images.map(img => {
      const categories = db.image_categories
        .filter(ic => ic.image_id === img.id)
        .map(ic => db.categories.find(c => c.id === ic.category_id))
        .filter(Boolean);
      const actresses = db.image_actresses
        .filter(ia => ia.image_id === img.id)
        .map(ia => db.actresses.find(a => a.id === ia.actress_id))
        .filter(Boolean);
      return {
        ...img,
        categories,
        actresses
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function createImage(url, prompt, category_ids = [], actress_ids = []) {
  if (isSupabaseConfigured) {
    // 1. Insert Image
    const { data: image, error } = await supabase
      .from('images')
      .insert([{ url, prompt, favorite: false }])
      .select()
      .single();
    if (error) throw error;

    // 2. Link multiple categories
    if (category_ids.length > 0) {
      const mappings = category_ids.map(cid => ({
        image_id: image.id,
        category_id: cid
      }));
      const { error: icError } = await supabase
        .from('image_categories')
        .insert(mappings);
      if (icError) throw icError;
    }

    // 3. Link multiple actresses
    if (actress_ids.length > 0) {
      const mappings = actress_ids.map(aid => ({
        image_id: image.id,
        actress_id: aid
      }));
      const { error: iaError } = await supabase
        .from('image_actresses')
        .insert(mappings);
      if (iaError) throw iaError;
    }
    return image;
  } else {
    const db = readLocalDb();
    if (!db.image_actresses) db.image_actresses = [];
    if (!db.image_categories) db.image_categories = [];
    const imageId = generateUUID();
    const newImage = {
      id: imageId,
      url,
      prompt,
      favorite: false,
      created_at: new Date().toISOString()
    };
    db.images.push(newImage);

    // Link categories
    category_ids.forEach(cid => {
      db.image_categories.push({
        image_id: imageId,
        category_id: cid
      });
    });

    // Link actresses
    actress_ids.forEach(aid => {
      db.image_actresses.push({
        image_id: imageId,
        actress_id: aid
      });
    });

    writeLocalDb(db);
    return newImage;
  }
}

export async function toggleImageFavorite(id) {
  if (isSupabaseConfigured) {
    // Get current status
    const { data: img, error: getErr } = await supabase
      .from('images')
      .select('favorite')
      .eq('id', id)
      .single();
    if (getErr) throw getErr;

    const { data, error } = await supabase
      .from('images')
      .update({ favorite: !img.favorite })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    const index = db.images.findIndex(img => img.id === id);
    if (index === -1) throw new Error('Image not found');
    db.images[index].favorite = !db.images[index].favorite;
    writeLocalDb(db);
    return db.images[index];
  }
}

// 4. Stories
export async function getStories() {
  if (isSupabaseConfigured) {
    const { data: stories, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (storyError) throw storyError;

    // Fetch story actresses mapping
    const { data: storyActresses, error: saError } = await supabase
      .from('story_actresses')
      .select('*, actress:actresses(*)');
    if (saError) throw saError;

    // Fetch story images mapping
    const { data: storyImages, error: siError } = await supabase
      .from('story_images')
      .select('*, image:images(*)');
    if (siError) throw siError;

    // Fetch all image_actresses mapping to populate actresses inside story images
    const { data: imageActresses, error: iaError } = await supabase
      .from('image_actresses')
      .select('*, actress:actresses(*)');
    if (iaError) throw iaError;

    return stories.map(story => {
      const actresses = storyActresses
        .filter(sa => sa.story_id === story.id)
        .map(sa => sa.actress);
      const images = storyImages
        .filter(si => si.story_id === story.id)
        .map(si => {
          const imgActresses = imageActresses
            .filter(ia => ia.image_id === si.image.id)
            .map(ia => ia.actress);
          return {
            ...si.image,
            description: si.description,
            actresses: imgActresses
          };
        });
      return {
        ...story,
        actresses,
        images,
        cover_poster: story.cover_poster || (images[0]?.url || '')
      };
    });
  } else {
    const db = readLocalDb();
    if (!db.image_actresses) db.image_actresses = [];
    return db.stories.map(story => {
      const actresses = db.story_actresses
        .filter(sa => sa.story_id === story.id)
        .map(sa => db.actresses.find(a => a.id === sa.actress_id))
        .filter(Boolean);
      const images = db.story_images
        .filter(si => si.story_id === story.id)
        .map(si => {
          const imgObj = db.images.find(i => i.id === si.image_id);
          if (!imgObj) return null;
          const imgActresses = db.image_actresses
            .filter(ia => ia.image_id === imgObj.id)
            .map(ia => db.actresses.find(a => a.id === ia.actress_id))
            .filter(Boolean);
          return {
            ...imgObj,
            description: si.description,
            actresses: imgActresses
          };
        })
        .filter(Boolean);
      return {
        ...story,
        actresses,
        images,
        cover_poster: story.cover_poster || (images[0]?.url || '')
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function createStory(title, content, actress_ids = [], images = [], cover_poster = '') {
  // images parameter is array of { image_id, description }
  if (isSupabaseConfigured) {
    // Insert Story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert([{ title, content, cover_poster }])
      .select()
      .single();
    if (storyError) throw storyError;

    // Insert Actress links
    if (actress_ids.length > 0) {
      const actressInserts = actress_ids.map(aid => ({
        story_id: story.id,
        actress_id: aid
      }));
      const { error: saError } = await supabase
        .from('story_actresses')
        .insert(actressInserts);
      if (saError) throw saError;
    }

    // Insert Image links
    if (images.length > 0) {
      const imageInserts = images.map(img => ({
        story_id: story.id,
        image_id: img.image_id,
        description: img.description || ''
      }));
      const { error: siError } = await supabase
        .from('story_images')
        .insert(imageInserts);
      if (siError) throw siError;
    }

    return story;
  } else {
    const db = readLocalDb();
    const storyId = generateUUID();
    const newStory = {
      id: storyId,
      title,
      content,
      cover_poster,
      created_at: new Date().toISOString()
    };
    db.stories.push(newStory);

    // Link actresses
    actress_ids.forEach(aid => {
      db.story_actresses.push({
        story_id: storyId,
        actress_id: aid
      });
    });

    // Link images
    images.forEach(img => {
      db.story_images.push({
        story_id: storyId,
        image_id: img.image_id,
        description: img.description || null
      });
    });

    writeLocalDb(db);
    return newStory;
  }
}

// 5. CRUD: Update and Delete Operations

// A. Categories
export async function updateCategory(id, name) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    const index = db.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    db.categories[index].name = name.trim();
    writeLocalDb(db);
    return db.categories[index];
  }
}

export async function deleteCategory(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } else {
    const db = readLocalDb();
    db.categories = db.categories.filter(c => c.id !== id);
    // Nullify category references in images
    db.images = db.images.map(img => {
      if (img.category_id === id) {
        return { ...img, category_id: null };
      }
      return img;
    });
    writeLocalDb(db);
    return { success: true };
  }
}

// B. Actresses
export async function updateActress(id, name, profile_picture, bio = '') {
  if (isSupabaseConfigured) {
    const updateObj = { name, bio };
    if (profile_picture) updateObj.profile_picture = profile_picture;
    const { data, error } = await supabase
      .from('actresses')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    const index = db.actresses.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Actress not found');
    db.actresses[index].name = name.trim();
    if (profile_picture) db.actresses[index].profile_picture = profile_picture;
    db.actresses[index].bio = bio;
    writeLocalDb(db);
    return db.actresses[index];
  }
}

export async function deleteActress(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('actresses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } else {
    const db = readLocalDb();
    db.actresses = db.actresses.filter(a => a.id !== id);
    if (db.image_actresses) {
      db.image_actresses = db.image_actresses.filter(ia => ia.actress_id !== id);
    }
    if (db.story_actresses) {
      db.story_actresses = db.story_actresses.filter(sa => sa.actress_id !== id);
    }
    writeLocalDb(db);
    return { success: true };
  }
}

// C. Images
export async function updateImage(id, url, prompt, category_ids = [], actress_ids = []) {
  if (isSupabaseConfigured) {
    const updateObj = { prompt };
    if (url) updateObj.url = url;

    const { data: image, error } = await supabase
      .from('images')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Update categories link table
    const { error: delCatError } = await supabase
      .from('image_categories')
      .delete()
      .eq('image_id', id);
    if (delCatError) throw delCatError;

    if (category_ids.length > 0) {
      const mappings = category_ids.map(cid => ({
        image_id: id,
        category_id: cid
      }));
      const { error: insCatError } = await supabase
        .from('image_categories')
        .insert(mappings);
      if (insCatError) throw insCatError;
    }

    // Update actresses link table
    const { error: delError } = await supabase
      .from('image_actresses')
      .delete()
      .eq('image_id', id);
    if (delError) throw delError;

    if (actress_ids.length > 0) {
      const mappings = actress_ids.map(aid => ({
        image_id: id,
        actress_id: aid
      }));
      const { error: insError } = await supabase
        .from('image_actresses')
        .insert(mappings);
      if (insError) throw insError;
    }
    return image;
  } else {
    const db = readLocalDb();
    const index = db.images.findIndex(img => img.id === id);
    if (index === -1) throw new Error('Image not found');

    db.images[index].prompt = prompt;
    if (url) db.images[index].url = url;

    // Update local categories
    if (!db.image_categories) db.image_categories = [];
    db.image_categories = db.image_categories.filter(ic => ic.image_id !== id);
    category_ids.forEach(cid => {
      db.image_categories.push({
        image_id: id,
        category_id: cid
      });
    });

    // Update local actresses
    if (!db.image_actresses) db.image_actresses = [];
    db.image_actresses = db.image_actresses.filter(ia => ia.image_id !== id);
    actress_ids.forEach(aid => {
      db.image_actresses.push({
        image_id: id,
        actress_id: aid
      });
    });

    writeLocalDb(db);
    return db.images[index];
  }
}

export async function deleteImage(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } else {
    const db = readLocalDb();
    db.images = db.images.filter(img => img.id !== id);
    if (db.image_actresses) {
      db.image_actresses = db.image_actresses.filter(ia => ia.image_id !== id);
    }
    if (db.image_categories) {
      db.image_categories = db.image_categories.filter(ic => ic.image_id !== id);
    }
    if (db.story_images) {
      db.story_images = db.story_images.filter(si => si.image_id !== id);
    }
    writeLocalDb(db);
    return { success: true };
  }
}

// D. Stories
export async function updateStory(id, title, content, actress_ids = [], images = [], cover_poster = '') {
  if (isSupabaseConfigured) {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .update({ title, content, cover_poster })
      .eq('id', id)
      .select()
      .single();
    if (storyError) throw storyError;

    const { error: delSaError } = await supabase
      .from('story_actresses')
      .delete()
      .eq('story_id', id);
    if (delSaError) throw delSaError;

    if (actress_ids.length > 0) {
      const actressInserts = actress_ids.map(aid => ({
        story_id: id,
        actress_id: aid
      }));
      const { error: insSaError } = await supabase
        .from('story_actresses')
        .insert(actressInserts);
      if (insSaError) throw insSaError;
    }

    const { error: delSiError } = await supabase
      .from('story_images')
      .delete()
      .eq('story_id', id);
    if (delSiError) throw delSiError;

    if (images.length > 0) {
      const imageInserts = images.map(img => ({
        story_id: id,
        image_id: img.image_id,
        description: img.description || ''
      }));
      const { error: insSiError } = await supabase
        .from('story_images')
        .insert(imageInserts);
      if (insSiError) throw insSiError;
    }

    return story;
  } else {
    const db = readLocalDb();
    const index = db.stories.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Story not found');

    db.stories[index].title = title;
    db.stories[index].content = content;
    db.stories[index].cover_poster = cover_poster;

    db.story_actresses = db.story_actresses.filter(sa => sa.story_id !== id);
    actress_ids.forEach(aid => {
      db.story_actresses.push({
        story_id: id,
        actress_id: aid
      });
    });

    db.story_images = db.story_images.filter(si => si.story_id !== id);
    images.forEach(img => {
      db.story_images.push({
        story_id: id,
        image_id: img.image_id,
        description: img.description || null
      });
    });

    writeLocalDb(db);
    return db.stories[index];
  }
}

export async function deleteStory(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } else {
    const db = readLocalDb();
    db.stories = db.stories.filter(s => s.id !== id);
    db.story_actresses = db.story_actresses.filter(sa => sa.story_id !== id);
    db.story_images = db.story_images.filter(si => si.image_id !== id);
    writeLocalDb(db);
    return { success: true };
  }
}

// --- USER & COLLECTION OPERATIONS ---

export async function verifyAppUser(username, password) {
  const normUser = username.trim().toLowerCase();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', normUser)
      .single();
    if (error) return null;
    if (data.password === password) {
      const { password: _, ...userWithoutPassword } = data;
      return userWithoutPassword;
    }
    return null;
  } else {
    const db = readLocalDb();
    const found = db.app_users.find(u => u.username.toLowerCase() === normUser);
    if (found && found.password === password) {
      const { password: _, ...userWithoutPassword } = found;
      return userWithoutPassword;
    }
    return null;
  }
}

export async function createAppUser(username, password, name, email = '') {
  const normUser = username.trim();
  const normEmail = email.trim();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('app_users')
      .insert([{ username: normUser, password, name, email: normEmail, role: 'user' }])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new Error('Username already exists');
      }
      throw error;
    }
    const { password: _, ...userWithoutPassword } = data;
    return userWithoutPassword;
  } else {
    const db = readLocalDb();
    if (db.app_users.some(u => u.username.toLowerCase() === normUser.toLowerCase())) {
      throw new Error('Username already exists');
    }
    const newUser = {
      id: generateUUID(),
      username: normUser,
      password,
      name,
      avatar: '',
      role: 'user',
      created_at: new Date().toISOString()
    };
    db.app_users.push(newUser);
    writeLocalDb(db);
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

export async function getUserCards(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('user_cards')
      .select('*, image:images(*)')
      .eq('user_id', userId);
    if (error) throw error;

    // Resolve actresses and categories for each image
    if (data && data.length > 0) {
      const { data: imageActresses, error: iaError } = await supabase
        .from('image_actresses')
        .select('*, actress:actresses(*)');
      if (iaError) throw iaError;

      const { data: imageCategories, error: icError } = await supabase
        .from('image_categories')
        .select('*, category:categories(*)');
      if (icError) throw icError;

      return data.map(uc => {
        if (!uc.image) return uc;
        const actresses = imageActresses
          .filter(ia => ia.image_id === uc.image.id)
          .map(ia => ia.actress);
        const categories = imageCategories
          .filter(ic => ic.image_id === uc.image.id)
          .map(ic => ic.category);
        return {
          ...uc,
          image: {
            ...uc.image,
            actresses,
            categories
          }
        };
      });
    }
    return data;
  } else {
    const db = readLocalDb();
    const userCards = db.user_cards.filter(uc => uc.user_id === userId);
    return userCards.map(uc => {
      const img = db.images.find(i => i.id === uc.image_id);
      let categories = [];
      let actresses = [];
      if (img) {
        categories = db.image_categories
          .filter(ic => ic.image_id === img.id)
          .map(ic => db.categories.find(c => c.id === ic.category_id))
          .filter(Boolean);
        actresses = db.image_actresses
          .filter(ia => ia.image_id === img.id)
          .map(ia => db.actresses.find(a => a.id === ia.actress_id))
          .filter(Boolean);
      }

      return {
        ...uc,
        image: img ? { ...img, categories, actresses } : null
      };
    }).filter(uc => uc.image !== null);
  }
}

export async function getUserClaims(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('user_claims')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } else {
    const db = readLocalDb();
    const claim = db.user_claims.find(uc => uc.user_id === userId);
    return claim || null;
  }
}

export async function resetUserClaim(userId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('user_claims')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  } else {
    const db = readLocalDb();
    db.user_claims = db.user_claims.filter(uc => uc.user_id !== userId);
    writeLocalDb(db);
    return { success: true };
  }
}

export async function toggleUserCardFavorite(userId, imageId) {
  if (isSupabaseConfigured) {
    const { data: uc, error: getErr } = await supabase
      .from('user_cards')
      .select('favorite')
      .eq('user_id', userId)
      .eq('image_id', imageId)
      .single();
    if (getErr) throw getErr;

    const nextFavorite = !uc.favorite;
    const { data, error } = await supabase
      .from('user_cards')
      .update({ favorite: nextFavorite })
      .eq('user_id', userId)
      .eq('image_id', imageId)
      .select('*, image:images(*)')
      .single();
    if (error) throw error;

    // Resolve actresses for the image
    if (data && data.image) {
      const { data: imageActresses, error: iaError } = await supabase
        .from('image_actresses')
        .select('*, actress:actresses(*)')
        .eq('image_id', imageId);
      if (!iaError) {
        data.image.actresses = imageActresses.map(ia => ia.actress);
      }
    }
    return data;
  } else {
    const db = readLocalDb();
    const index = db.user_cards.findIndex(uc => uc.user_id === userId && uc.image_id === imageId);
    if (index === -1) throw new Error('User card not found');
    db.user_cards[index].favorite = !db.user_cards[index].favorite;
    writeLocalDb(db);

    const uc = db.user_cards[index];
    const img = db.images.find(i => i.id === uc.image_id);
    let actresses = [];
    if (img) {
      actresses = db.image_actresses
        .filter(ia => ia.image_id === img.id)
        .map(ia => db.actresses.find(a => a.id === ia.actress_id))
        .filter(Boolean);
    }
    return {
      ...uc,
      image: img ? { ...img, actresses } : null
    };
  }
}

export async function claimDailyPack(userId) {
  const claim = await getUserClaims(userId);
  const now = new Date();

  if (claim) {
    const lastClaimed = new Date(claim.last_claimed_at);
    const isSameDay = lastClaimed.getFullYear() === now.getFullYear() &&
      lastClaimed.getMonth() === now.getMonth() &&
      lastClaimed.getDate() === now.getDate();
    if (isSameDay) {
      throw new Error('You have already claimed your daily pack today!');
    }
  }

  // 1. Get all images
  const allImages = await getImages();
  if (allImages.length === 0) {
    throw new Error('No cards are available yet. Ask Admin to upload images first.');
  }

  // 2. Query and filter out cards that are in story mode
  const storyImageIds = new Set();
  if (isSupabaseConfigured) {
    const { data: storyImages, error: siErr } = await supabase
      .from('story_images')
      .select('image_id');
    if (!siErr && storyImages) {
      storyImages.forEach(si => storyImageIds.add(si.image_id));
    }
  } else {
    const db = readLocalDb();
    if (db.story_images) {
      db.story_images.forEach(si => storyImageIds.add(si.image_id));
    }
  }

  // Claimable pool: exclude images used in stories
  const claimableImages = allImages.filter(img => !storyImageIds.has(img.id));
  if (claimableImages.length === 0) {
    throw new Error('No claimable cards are available (all images are locked in story mode).');
  }

  // 3. Separate pool into Common (not admin favorite) and Rare (admin favorite)
  const rarePool = claimableImages.filter(img => img.favorite === true);
  const commonPool = claimableImages.filter(img => img.favorite !== true);

  // 4. Draw 5 random cards with replacement (up to luck)
  // RARE cards have a 10% chance to be pulled if they exist
  const selectedCards = [];
  for (let i = 0; i < 5; i++) {
    const roll = Math.random();
    let isRare = false;
    let card = null;

    if (roll < 0.10 && rarePool.length > 0) {
      const randIndex = Math.floor(Math.random() * rarePool.length);
      card = rarePool[randIndex];
      isRare = true;
    } else {
      const pool = commonPool.length > 0 ? commonPool : claimableImages;
      const randIndex = Math.floor(Math.random() * pool.length);
      card = pool[randIndex];
    }

    selectedCards.push({ card, isRare });
  }

  // 5. Gather current user collection to see which actress unlocks are new
  const currentCards = await getUserCards(userId);
  const ownedActressIds = new Set();
  currentCards.forEach(uc => {
    if (uc.image && uc.image.actresses) {
      uc.image.actresses.forEach(act => ownedActressIds.add(act.id));
    }
  });

  const results = [];
  const actressesNewlyUnlockedThisPull = new Set();

  for (const item of selectedCards) {
    const card = item.card;
    const isRare = item.isRare;
    let count = 1;
    let newlyUnlockedActresses = [];

    if (card.actresses && card.actresses.length > 0) {
      card.actresses.forEach(act => {
        if (!ownedActressIds.has(act.id) && !actressesNewlyUnlockedThisPull.has(act.id)) {
          newlyUnlockedActresses.push(act);
          actressesNewlyUnlockedThisPull.add(act.id);
        }
      });
    }

    const isNewActressUnlocked = newlyUnlockedActresses.length > 0;

    // Save to user collection (user_cards)
    if (isSupabaseConfigured) {
      const { data: existing, error: fetchErr } = await supabase
        .from('user_cards')
        .select('count')
        .eq('user_id', userId)
        .eq('image_id', card.id)
        .maybeSingle();

      if (existing) {
        count = existing.count + 1;
        const { error: updErr } = await supabase
          .from('user_cards')
          .update({ count })
          .eq('user_id', userId)
          .eq('image_id', card.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from('user_cards')
          .insert([{ user_id: userId, image_id: card.id, count: 1, favorite: false }]);
        if (insErr) throw insErr;
      }
    } else {
      const db = readLocalDb();
      if (!db.user_cards) db.user_cards = [];
      const found = db.user_cards.find(uc => uc.user_id === userId && uc.image_id === card.id);
      if (found) {
        found.count += 1;
        count = found.count;
      } else {
        db.user_cards.push({
          user_id: userId,
          image_id: card.id,
          count: 1,
          favorite: false,
          unlocked_at: new Date().toISOString()
        });
      }
      writeLocalDb(db);
    }

    results.push({
      ...card,
      count,
      isRare,
      isNewActressUnlocked,
      newlyUnlockedActresses
    });
  }

  // Update user claim timestamp
  if (isSupabaseConfigured) {
    if (claim) {
      const { error } = await supabase
        .from('user_claims')
        .update({ last_claimed_at: now.toISOString() })
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_claims')
        .insert([{ user_id: userId, last_claimed_at: now.toISOString() }]);
      if (error) throw error;
    }
  } else {
    const db = readLocalDb();
    if (!db.user_claims) db.user_claims = [];
    const foundIndex = db.user_claims.findIndex(uc => uc.user_id === userId);
    if (foundIndex !== -1) {
      db.user_claims[foundIndex].last_claimed_at = now.toISOString();
    } else {
      db.user_claims.push({
        user_id: userId,
        last_claimed_at: now.toISOString()
      });
    }
    writeLocalDb(db);
  }

  return results;
}

export async function setUserPremiumStatus(userId, isPremium) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('app_users')
      .update({ premium: isPremium })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const db = readLocalDb();
    const index = db.app_users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    db.app_users[index].premium = isPremium;
    writeLocalDb(db);
    return db.app_users[index];
  }
}

export async function getAdminStats() {
  if (isSupabaseConfigured) {
    const { count: usersCount } = await supabase.from('app_users').select('*', { count: 'exact', head: true });
    const { count: premiumCount } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('premium', true);
    const { count: imagesCount } = await supabase.from('app_images').select('*', { count: 'exact', head: true });
    const { count: actressesCount } = await supabase.from('app_actresses').select('*', { count: 'exact', head: true });
    return {
      totalUsers: usersCount || 0,
      premiumUsers: premiumCount || 0,
      totalImages: imagesCount || 0,
      totalActresses: actressesCount || 0
    };
  } else {
    const db = readLocalDb();
    const premiumCount = db.app_users.filter(u => u.premium === true).length;
    return {
      totalUsers: db.app_users.length,
      premiumUsers: premiumCount,
      totalImages: db.app_images?.length || 0,
      totalActresses: db.app_actresses?.length || 0
    };
  }
}
