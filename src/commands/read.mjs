import { getClient, disconnectClient } from '../client.mjs';
import { ansi, color, centerText, formatClock, padLeft, padRight, wrapText } from '../terminal-ui.mjs';
import { resolveEntityPreferDialogs } from '../recipient-resolver.mjs';

const VIEW_WIDTH = 80;
const BUBBLE_TEXT_WIDTH = 54;

const dayKeyFromUnix = (unixSeconds) => {
  const date = new Date(unixSeconds * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const dayLabelFromUnix = (unixSeconds) => {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const renderBubble = ({ text, time, isMine }) => {
  const bubbleBg = isMine ? ansi.bg(95, 65, 160) : ansi.bg(40, 40, 46);
  const bubbleFg = ansi.fg(255, 255, 255);
  const timeColor = ansi.fg(190, 190, 200);
  const wrapped = wrapText(text, BUBBLE_TEXT_WIDTH);
  const contentWidth = Math.max(...wrapped.map((line) => line.length), time.length);
  const lineWidth = contentWidth + 2;
  const lines = wrapped.map((line) => {
    const filled = ` ${padRight(line, contentWidth)} `;
    return color(filled, bubbleBg, bubbleFg);
  });

  const timeLine = color(` ${padLeft(time, contentWidth)} `, bubbleBg, timeColor);
  lines.push(timeLine);

  if (isMine) {
    return lines.map((line) => padLeft(line, VIEW_WIDTH));
  }

  return lines.map((line) => padRight(line, lineWidth));
};

export const read = async (chatId, limit = 10) => {
  if (!chatId) {
    console.error('Usage: telegram read <username|phone|chat_id> [limit]');
    console.error('Examples:');
    console.error('  telegram read @username');
    console.error('  telegram read @username 20');
    console.error('  telegram read -100123456789 50');
    process.exit(1);
  }

  try {
    const client = await getClient();
    const { entity, resolvedLabel, dialog } = await resolveEntityPreferDialogs(client, chatId);
    
    // Get messages
    const messages = await client.getMessages(entity, { limit });
    
    // Get entity display name
    let chatName = resolvedLabel || chatId;
    let chatPhone = '-';
    const entityForDisplay = dialog?.entity || entity;

    if ('title' in entityForDisplay) {
      chatName = entityForDisplay.title;
    } else if ('firstName' in entityForDisplay) {
      chatName = `${entityForDisplay.firstName} ${entityForDisplay.lastName || ''}`.trim();
    }
    if ('phone' in entityForDisplay && entityForDisplay.phone) {
      chatPhone = `+${entityForDisplay.phone}`;
    }
    
    console.log(color(`Conversation with ${chatName} ${chatPhone}`, ansi.bold, ansi.fg(180, 220, 255)));
    
    // Reverse to show oldest first
    const sortedMessages = [...messages].reverse();
    
    let lastDayKey = null;
    for (const msg of sortedMessages) {
      if (!msg.message && !msg.media) continue;

      if (!msg.date) continue;
      const dayKey = dayKeyFromUnix(msg.date);
      if (dayKey !== lastDayKey) {
        const label = `--- ${dayLabelFromUnix(msg.date)} ---`;
        console.log(color(centerText(label, VIEW_WIDTH), ansi.dim, ansi.fg(150, 150, 150)));
        lastDayKey = dayKey;
      }

      let text = msg.message || '';
      if (!text && msg.media) {
        text = `[Media: ${msg.media.className}]`;
      }

      const compactText = text.replace(/\s+/g, ' ').trim();
      const time = formatClock(msg.date);
      const renderedLines = renderBubble({
        text: compactText,
        time,
        isMine: Boolean(msg.out),
      });
      for (const line of renderedLines) {
        console.log(line);
      }
    }

    console.log(color(`Showing ${messages.length} messages`, ansi.dim, ansi.fg(170, 170, 170)));
    
    await disconnectClient();
  } catch (error) {
    if (error.message?.includes('Cannot find any entity') || error.message?.includes('Cannot find user/chat')) {
      console.error(`Error: Cannot find user/chat: ${chatId}`);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
};
