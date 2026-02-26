#!/usr/bin/env bun

import { login } from './src/commands/login.mjs';
import { send } from './src/commands/send.mjs';
import { read } from './src/commands/read.mjs';
import { list } from './src/commands/list.mjs';
import { setVerboseLogging } from './src/client.mjs';

const showHelp = () => {
  console.log(`
Telegram CLI - User/Self-bot Client

Usage: telegram <command> [options]

Global options:
  -v, --verbose                  Show gram.js INFO/WARN logs

Commands:
  login                          Authenticate with Telegram
  send <recipient> <message>     Send a message
  read <chat> [limit]            Read messages (default: 10)
  list [limit]                   List open chats (default: 50)

Examples:
  telegram login
  telegram send @username "Hello!"
  telegram send +1234567890 "Hello!"
  telegram read @username
  telegram read -100123456789 20
  telegram list
  telegram -v read @username 10

Recipient formats:
  @username      Telegram username
  +1234567890    Phone number with country code
  -100123456789  Chat/Channel ID (negative number)
`);
};

const main = async () => {
  const cliArgs = process.argv.slice(2);
  const verbose = cliArgs.includes('-v') || cliArgs.includes('--verbose');
  const argsWithoutGlobals = cliArgs.filter((arg) => arg !== '-v' && arg !== '--verbose');
  const [command, ...args] = argsWithoutGlobals;

  setVerboseLogging(verbose);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'login':
        await login();
        break;
      
      case 'send': {
        const [recipient, ...messageParts] = args;
        const message = messageParts.join(' ');
        await send(recipient, message);
        break;
      }
      
      case 'read': {
        const [chatId, limitStr] = args;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        await read(chatId, limit);
        break;
      }

      case 'list': {
        const [limitStr] = args;
        const limit = limitStr ? parseInt(limitStr, 10) : 50;
        await list(limit);
        break;
      }
      
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

main();
