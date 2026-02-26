const ESC = '\u001b[';

export const ansi = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  fg: (r, g, b) => `${ESC}38;2;${r};${g};${b}m`,
  bg: (r, g, b) => `${ESC}48;2;${r};${g};${b}m`,
};

export const color = (text, ...styles) => `${styles.join('')}${text}${ansi.reset}`;

export const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

export const padRight = (text, width) => {
  const visible = stripAnsi(text).length;
  if (visible >= width) return text;
  return text + ' '.repeat(width - visible);
};

export const padLeft = (text, width) => {
  const visible = stripAnsi(text).length;
  if (visible >= width) return text;
  return ' '.repeat(width - visible) + text;
};

export const wrapText = (text, width) => {
  if (!text) return [''];
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      if (word.length <= width) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width));
        }
      }
      continue;
    }

    const candidate = `${current} ${word}`;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    lines.push(current);
    if (word.length <= width) {
      current = word;
    } else {
      for (let i = 0; i < word.length; i += width) {
        const chunk = word.slice(i, i + width);
        if (chunk.length === width) {
          lines.push(chunk);
        } else {
          current = chunk;
        }
      }
    }
  }

  if (current) lines.push(current);
  return lines;
};

export const centerText = (text, width) => {
  const visible = stripAnsi(text).length;
  if (visible >= width) return text;
  const left = Math.floor((width - visible) / 2);
  const right = width - visible - left;
  return `${' '.repeat(left)}${text}${' '.repeat(right)}`;
};

export const formatClock = (unixSeconds) => {
  if (!unixSeconds) return '--:--';
  const date = new Date(unixSeconds * 1000);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = String(hours % 12 || 12).padStart(2, '0');
  return `${hour12}:${minutes}${ampm}`;
};
