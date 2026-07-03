import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename using timestamp and random number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.name) || '.png';
    const filename = `img_${timestamp}_${random}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    // Return the dynamic API serving path for immediate availability
    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl, filename });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
