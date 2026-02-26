import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse, stringify } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', '.tokens.yaml');

export const loadConfig = () => {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_PATH, 'utf8');
    return parse(content) || {};
  } catch {
    return {};
  }
};

export const saveConfig = (config) => {
  writeFileSync(CONFIG_PATH, stringify(config), 'utf8');
};

export const getConfigPath = () => CONFIG_PATH;
