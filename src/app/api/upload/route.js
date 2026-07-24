import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

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

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'ai-images'; // actress, posters, or ai-images

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.name) || '.png';
    const filename = `img_${timestamp}_${random}${ext}`;

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary
      const folderName = `ai-graphics/${type}`;
      const publicId = path.parse(filename).name; // use filename without extension as public_id

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderName,
            public_id: publicId,
            resource_type: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      return NextResponse.json({ url: uploadResult.secure_url, filename: uploadResult.public_id });
    } else if (isSupabaseConfigured && supabase) {
      // 1. Upload to Supabase Storage Bucket matching the type
      let { data, error } = await supabase.storage
        .from(type)
        .upload(filename, buffer, {
          contentType: file.type,
          duplex: 'half'
        });

      // Try creating bucket dynamically if it doesn't exist
      if (error && (error.message === 'Bucket not found' || error.error === 'Bucket not found')) {
        try {
          const { error: createError } = await supabase.storage.createBucket(type, {
            public: true
          });
          if (!createError) {
            // Retry upload
            const retry = await supabase.storage
              .from(type)
              .upload(filename, buffer, {
                contentType: file.type,
                duplex: 'half'
              });
            data = retry.data;
            error = retry.error;
          }
        } catch (e) {
          console.error('Failed to create bucket dynamically:', e);
        }
      }

      if (error) {
        throw error;
      }

      // 2. Fetch the permanent public URL
      const { data: { publicUrl } } = supabase.storage
        .from(type)
        .getPublicUrl(filename);

      return NextResponse.json({ url: publicUrl, filename });
    } else {
      // Fallback: local folder upload
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/api/uploads/${filename}`;
      return NextResponse.json({ url: fileUrl, filename });
    }
  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
