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
        story_images: []
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Get all image actress links
    const { data: imageActresses, error: iaError } = await supabase
      .from('image_actresses')
      .select('*, actress:actresses(*)');
    if (iaError) throw iaError;

    return images.map(img => {
      const actresses = imageActresses
        .filter(ia => ia.image_id === img.id)
        .map(ia => ia.actress);
      return {
        ...img,
        actresses
      };
    });
  } else {
    const db = readLocalDb();
    if (!db.image_actresses) db.image_actresses = [];
    return db.images.map(img => {
      const category = db.categories.find(c => c.id === img.category_id) || null;
      const actresses = db.image_actresses
        .filter(ia => ia.image_id === img.id)
        .map(ia => db.actresses.find(a => a.id === ia.actress_id))
        .filter(Boolean);
      return {
        ...img,
        category,
        actresses
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function createImage(url, prompt, category_id, actress_ids = []) {
  if (isSupabaseConfigured) {
    // 1. Insert Image
    const { data: image, error } = await supabase
      .from('images')
      .insert([{ url, prompt, category_id, favorite: false }])
      .select()
      .single();
    if (error) throw error;

    // 2. Link multiple actresses
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
    const imageId = generateUUID();
    const newImage = {
      id: imageId,
      url,
      prompt,
      category_id,
      favorite: false,
      created_at: new Date().toISOString()
    };
    db.images.push(newImage);

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
        images
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
        images
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export async function createStory(title, content, actress_ids = [], images = []) {
  // images parameter is array of { image_id, description }
  if (isSupabaseConfigured) {
    // Insert Story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert([{ title, content }])
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
export async function updateImage(id, url, prompt, category_id, actress_ids = []) {
  if (isSupabaseConfigured) {
    const updateObj = { prompt, category_id };
    if (url) updateObj.url = url;
    
    const { data: image, error } = await supabase
      .from('images')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

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
    db.images[index].category_id = category_id || null;
    if (url) db.images[index].url = url;

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
    if (db.story_images) {
      db.story_images = db.story_images.filter(si => si.image_id !== id);
    }
    writeLocalDb(db);
    return { success: true };
  }
}

// D. Stories
export async function updateStory(id, title, content, actress_ids = [], images = []) {
  if (isSupabaseConfigured) {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .update({ title, content })
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
    db.story_images = db.story_images.filter(si => si.story_id !== id);
    writeLocalDb(db);
    return { success: true };
  }
}
