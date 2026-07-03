import { NextResponse } from 'next/server';
import { toggleImageFavorite } from '@/lib/db';

export async function POST(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }
    const data = await toggleImageFavorite(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
