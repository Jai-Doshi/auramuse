import { NextResponse } from 'next/server';
import { createAppUser } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password, name, email } = await request.json();
    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password, and name are required' }, { status: 400 });
    }
    const user = await createAppUser(username, password, name, email || '');
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
