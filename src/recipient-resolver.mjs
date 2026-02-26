const normalize = (value) => String(value || '').trim().toLowerCase();
const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const dialogName = (dialog) => {
  if (dialog?.name) return dialog.name;
  if (dialog?.title) return dialog.title;
  if (dialog?.entity?.firstName || dialog?.entity?.lastName) {
    return `${dialog.entity.firstName || ''} ${dialog.entity.lastName || ''}`.trim();
  }
  if (dialog?.entity?.username) return `@${dialog.entity.username}`;
  return 'Unknown';
};

const scoreDialogMatch = (query, queryDigits, dialog) => {
  const name = normalize(dialogName(dialog));
  const username = normalize(dialog?.entity?.username);
  const usernameWithAt = username ? `@${username}` : '';
  const phone = dialog?.entity?.phone ? `+${dialog.entity.phone}` : '';
  const phoneDigits = digitsOnly(phone);

  if (queryDigits && phoneDigits && queryDigits === phoneDigits) return 140;
  if (query && username && (query === username || query === usernameWithAt)) return 130;
  if (query && name && query === name) return 120;

  if (queryDigits && phoneDigits && phoneDigits.endsWith(queryDigits)) return 110;
  if (query && username && username.startsWith(query.replace(/^@/, ''))) return 100;
  if (query && name && name.startsWith(query)) return 95;

  if (queryDigits && phoneDigits && phoneDigits.includes(queryDigits)) return 85;
  if (query && username && username.includes(query.replace(/^@/, ''))) return 80;
  if (query && name && name.includes(query)) return 75;

  return 0;
};

export const resolveRecipientFromDialogs = async (client, recipient) => {
  const query = normalize(recipient);
  const queryDigits = digitsOnly(recipient);
  const dialogs = await client.getDialogs({ limit: 200 });

  const ranked = dialogs
    .map((dialog, index) => ({
      dialog,
      index,
      score: scoreDialogMatch(query, queryDigits, dialog),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    });

  const best = ranked[0];
  if (!best) return null;

  return {
    entity: best.dialog.inputEntity || best.dialog.entity,
    display: dialogName(best.dialog),
    dialog: best.dialog,
    score: best.score,
  };
};

export const resolveEntityPreferDialogs = async (client, recipient) => {
  const dialogMatch = await resolveRecipientFromDialogs(client, recipient);
  if (dialogMatch?.entity) {
    return {
      entity: dialogMatch.entity,
      resolvedLabel: dialogMatch.display,
      dialog: dialogMatch.dialog,
    };
  }

  try {
    const entity = await client.getEntity(recipient);
    return {
      entity,
      resolvedLabel: recipient,
      dialog: null,
    };
  } catch {
    throw new Error(`Cannot find user/chat: ${recipient}`);
  }
};
