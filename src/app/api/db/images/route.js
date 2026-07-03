import { NextResponse } from 'next/server';
import { getImages, createImage } from '@/lib/db';

export async function GET() {
  try {
    const data = await getImages();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { url, prompt, category_id, actress_ids } = await request.json();
    if (!url || !prompt || !actress_ids || !Array.isArray(actress_ids) || actress_ids.length === 0) {
      return NextResponse.json({ error: 'Image URL, prompt, and at least one actress are required' }, { status: 400 });
    }
    const data = await createImage(url, prompt, category_id || null, actress_ids);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
