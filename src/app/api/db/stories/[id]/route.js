import { NextResponse } from 'next/server';
import { updateStory, deleteStory } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { title, content, actress_ids, images } = await request.json();
    if (!title || !actress_ids || actress_ids.length === 0) {
      return NextResponse.json({ error: 'Title and at least one actress are required' }, { status: 400 });
    }
    const data = await updateStory(id, title, content || '', actress_ids, images || []);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const data = await deleteStory(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
