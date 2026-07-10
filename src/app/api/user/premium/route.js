import { NextResponse } from 'next/server';
import { setUserPremiumStatus } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId, premium } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const updatedUser = await setUserPremiumStatus(userId, premium);
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
