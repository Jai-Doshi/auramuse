import { NextResponse } from 'next/server';
import { getUserCards, getUserClaims } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const cards = await getUserCards(userId);
    const claim = await getUserClaims(userId);
    return NextResponse.json({ cards, claim });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
