import { NextResponse } from 'next/server';
import { updateActress, deleteActress } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, profile_picture, bio } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const data = await updateActress(id, name, profile_picture || null, bio);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const data = await deleteActress(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
