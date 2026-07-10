import { NextResponse } from 'next/server';
import { claimDailyPack } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const claimedCards = await claimDailyPack(userId);
    return NextResponse.json(claimedCards);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
