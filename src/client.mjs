import { TelegramClient, Logger } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { loadConfig, saveConfig } from './config.mjs';

let clientInstance = null;
let verboseLogging = false;

const buildLogger = () => new Logger(verboseLogging ? 'info' : 'error');

export const setVerboseLogging = (enabled) => {
  verboseLogging = Boolean(enabled);
};

export const getClient = async () => {
  if (clientInstance?.connected) {
    return clientInstance;
  }

  const config = loadConfig();
  
  if (!config.apiId || !config.apiHash) {
    throw new Error('Not logged in. Run: telegram login');
  }

  const session = new StringSession(config.session || '');
  clientInstance = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
    baseLogger: buildLogger(),
  });

  await clientInstance.connect();
  
  if (!await clientInstance.isUserAuthorized()) {
    throw new Error('Session expired. Run: telegram login');
  }

  return clientInstance;
};

export const createClient = async (apiId, apiHash) => {
  const session = new StringSession('');
  clientInstance = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    baseLogger: buildLogger(),
  });
  
  await clientInstance.connect();
  return clientInstance;
};

export const saveSession = (client) => {
  const config = loadConfig();
  const session = String(client.session.save());
  saveConfig({ ...config, session });
};

export const disconnectClient = async () => {
  if (clientInstance) {
    await clientInstance.disconnect();
    clientInstance = null;
  }
};
