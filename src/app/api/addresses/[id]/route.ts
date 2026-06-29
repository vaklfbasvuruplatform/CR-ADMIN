import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// DELETE address
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idInt = parseInt(id);
    console.log('Attempting to delete address with ID:', id, 'Parsed:', idInt);
    
    // Check if ID is valid
    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'Geçersiz ID formatı' }, { status: 400 });
    }

    const result: any = await query('DELETE FROM addresses WHERE id = ?', [idInt]);
    console.log('Delete result:', result);

    return NextResponse.json({ success: true, affectedRows: result.affectedRows });
  } catch (error) {
    console.error('Address DELETE error:', error);
    return NextResponse.json({ error: 'Adres silinemedi' }, { status: 500 });
  }
}
