import { NextResponse } from 'next/server';
import { toggleUserCardFavorite } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId, imageId } = await request.json();
    if (!userId || !imageId) {
      return NextResponse.json({ error: 'User ID and Image ID are required' }, { status: 400 });
    }
    const result = await toggleUserCardFavorite(userId, imageId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
