import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all addresses
export async function GET() {
  try {
    const addresses = await query('SELECT * FROM addresses ORDER BY id DESC');
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'Adresler yüklenemedi' }, { status: 500 });
  }
}
