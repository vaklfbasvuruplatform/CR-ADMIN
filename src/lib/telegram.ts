import { query } from '@/lib/db';

export interface TelegramBot {
  id: number;
  bot_token: string;
  chat_id: string;
  created_at: string;
}

export async function getTelegramBots(): Promise<TelegramBot[]> {
  const bots = await query<TelegramBot[]>('SELECT * FROM telegram_bots ORDER BY id DESC');
  return bots;
}

export async function addTelegramBot(bot_token: string, chat_id: string) {
  await query('INSERT INTO telegram_bots (bot_token, chat_id) VALUES (?, ?)', [bot_token, chat_id]);
}

export async function deleteTelegramBot(id: number) {
  await query('DELETE FROM telegram_bots WHERE id = ?', [id]);
}

export async function sendTelegramMessageToAll(message: string) {
  const bots = await getTelegramBots();
  
  const promises = bots.map(async (bot) => {
    try {
      const url = `https://api.telegram.org/bot${bot.bot_token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: bot.chat_id,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      
      if (!response.ok) {
        console.error(`Failed to send telegram message to bot ${bot.id}:`, await response.text());
      }
    } catch (error) {
      console.error(`Error sending telegram message to bot ${bot.id}:`, error);
    }
  });

  await Promise.all(promises);
}
