import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBots, addTelegramBot, deleteTelegramBot } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bots = await getTelegramBots();
    return NextResponse.json({ bots });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bot_token, chat_id } = await request.json();
    
    if (!bot_token || !chat_id) {
      return NextResponse.json({ error: 'Token and Chat ID are required' }, { status: 400 });
    }

    await addTelegramBot(bot_token, chat_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add bot' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteTelegramBot(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 });
  }
}
