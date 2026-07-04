import { NextResponse } from 'next/server';
import { updateImage, deleteImage } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { url, prompt, category_ids, actress_ids } = await request.json();
    if (!prompt || !actress_ids || !Array.isArray(actress_ids) || actress_ids.length === 0) {
      return NextResponse.json({ error: 'Prompt and at least one actress are required' }, { status: 400 });
    }
    const data = await updateImage(id, url || null, prompt, category_ids || [], actress_ids);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const data = await deleteImage(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
