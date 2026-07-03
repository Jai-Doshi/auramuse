import { NextResponse } from 'next/server';
import { getStories, createStory } from '@/lib/db';

export async function GET() {
  try {
    const data = await getStories();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, content, actress_ids, images } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const data = await createStory(title, content || '', actress_ids || [], images || []);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
