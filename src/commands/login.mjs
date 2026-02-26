import { createInterface } from 'readline';
import { createClient, saveSession } from '../client.mjs';
import { loadConfig, saveConfig } from '../config.mjs';
import { ansi, color } from '../terminal-ui.mjs';

const prompt = (question) => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

export const login = async () => {
  console.log(color('Telegram Login (User/Self-bot)', ansi.bold, ansi.fg(180, 220, 255)));
  console.log(color('==============================', ansi.fg(120, 160, 220)));
  console.log(color('\nYou need API credentials from https://my.telegram.org/apps\n', ansi.fg(190, 190, 190)));

  let config = loadConfig();
  
  // Get API credentials
  let apiId = config.apiId;
  let apiHash = config.apiHash;
  
  if (apiId && apiHash) {
    const reuse = await prompt(`Use existing API credentials (ID: ${apiId})? [Y/n]: `);
    if (reuse.toLowerCase() === 'n') {
      apiId = undefined;
      apiHash = undefined;
    }
  }
  
  if (!apiId || !apiHash) {
    const apiIdStr = await prompt('API ID: ');
    apiId = parseInt(apiIdStr, 10);
    if (isNaN(apiId)) {
      console.error('Invalid API ID');
      process.exit(1);
    }
    apiHash = await prompt('API Hash: ');
  }
  
  // Save credentials
  saveConfig({ ...config, apiId, apiHash });
  
  console.log(color('\nConnecting to Telegram...', ansi.fg(255, 215, 140)));
  const client = await createClient(apiId, apiHash);
  
  // Start interactive login
  await client.start({
    phoneNumber: async () => await prompt('Phone number (with country code): '),
    phoneCode: async () => await prompt('Verification code: '),
    password: async () => await prompt('2FA Password (if enabled): '),
    onError: (err) => {
      console.error('Login error:', err.message);
    },
  });
  
  // Save session
  saveSession(client);
  
  const me = await client.getMe();
  console.log(color(`\nLogged in as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'no username'})`, ansi.bold, ansi.fg(170, 235, 180)));
  console.log(color('Session saved to .tokens.yaml', ansi.fg(170, 235, 180)));
  
  await client.disconnect();
};
