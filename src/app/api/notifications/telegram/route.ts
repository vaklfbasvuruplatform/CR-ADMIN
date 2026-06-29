import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessageToAll } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Format the message from the body
    // Expecting keys like: ip, message, details, or just generic object
    
    const time = new Date().toLocaleString('tr-TR');
    
    let messageText = `🔔 <b>Yeni Log Kaydı</b>\n\n`;
    messageText += `🕒 <b>Zaman:</b> ${time}\n`;
    
    if (body.ip) messageText += `🌐 <b>IP:</b> <code>${body.ip}</code>\n`;
    if (body.page) messageText += `📄 <b>Sayfa:</b> ${body.page}\n`;
    
    // Add other generic fields
    Object.entries(body).forEach(([key, value]) => {
      if (['ip', 'page'].includes(key)) return; // Skip already added
      messageText += `🔹 <b>${key.toUpperCase()}:</b> ${value}\n`;
    });

    await sendTelegramMessageToAll(messageText);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
