import { getClient, disconnectClient } from '../client.mjs';
import { ansi, color, padRight } from '../terminal-ui.mjs';

const formatDialogName = (dialog) => {
  if (dialog?.name) return dialog.name;
  if (dialog?.title) return dialog.title;
  if (dialog?.entity?.firstName || dialog?.entity?.lastName) {
    return `${dialog.entity.firstName || ''} ${dialog.entity.lastName || ''}`.trim();
  }
  if (dialog?.entity?.username) return `@${dialog.entity.username}`;
  return 'Unknown';
};

const formatPhone = (dialog) => {
  const phone = dialog?.entity?.phone;
  return phone ? `+${phone}` : '-';
};

const formatUsername = (dialog) => {
  const username = dialog?.entity?.username;
  return username ? `@${username}` : '-';
};

export const list = async (limit = 50) => {
  const parsedLimit = Number.parseInt(String(limit), 10);
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    console.error('Usage: telegram list [limit]');
    console.error('Example: telegram list 100');
    process.exit(1);
  }

  try {
    const client = await getClient();
    const dialogs = await client.getDialogs({ limit: parsedLimit });

    if (!dialogs.length) {
      console.log(color('No open chats found.', ansi.dim, ansi.fg(170, 170, 170)));
      await disconnectClient();
      return;
    }

    const rows = dialogs.map((dialog) => ({
      name: formatDialogName(dialog),
      phone: formatPhone(dialog),
      username: formatUsername(dialog),
      unread: String(dialog.unreadCount ?? 0),
      mentions: String(dialog.unreadMentionsCount ?? 0),
    }));

    const headers = {
      name: 'Name',
      phone: 'Phone',
      username: 'Username',
      unread: 'Unread',
      mentions: 'Mentions',
    };

    const widths = {
      name: Math.max(headers.name.length, ...rows.map((r) => r.name.length)),
      phone: Math.max(headers.phone.length, ...rows.map((r) => r.phone.length)),
      username: Math.max(headers.username.length, ...rows.map((r) => r.username.length)),
      unread: Math.max(headers.unread.length, ...rows.map((r) => r.unread.length)),
      mentions: Math.max(headers.mentions.length, ...rows.map((r) => r.mentions.length)),
    };

    const headerLine = [
      padRight(headers.name, widths.name),
      padRight(headers.phone, widths.phone),
      padRight(headers.username, widths.username),
      padRight(headers.unread, widths.unread),
      padRight(headers.mentions, widths.mentions),
    ].join('  ');
    console.log(color(headerLine, ansi.bold, ansi.fg(140, 190, 255)));

    for (const row of rows) {
      const line = [
        padRight(color(row.name, ansi.fg(240, 240, 240)), widths.name),
        padRight(color(row.phone, ansi.fg(170, 220, 255)), widths.phone),
        padRight(color(row.username, ansi.fg(175, 240, 175)), widths.username),
        padRight(color(row.unread, ansi.fg(255, 200, 120)), widths.unread),
        padRight(color(row.mentions, ansi.fg(255, 150, 200)), widths.mentions),
      ].join('  ');
      console.log(line);
    }

    await disconnectClient();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};
