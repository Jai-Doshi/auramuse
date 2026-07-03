import { NextResponse } from 'next/server';
import { getActresses, createActress } from '@/lib/db';

export async function GET() {
  try {
    const data = await getActresses();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, profile_picture, bio } = await request.json();
    if (!name || !profile_picture) {
      return NextResponse.json({ error: 'Name and profile picture are required' }, { status: 400 });
    }
    const data = await createActress(name, profile_picture, bio);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
