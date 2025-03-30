import { promises as fs } from 'fs';
import path from 'path';
import { Config } from './store';

const CONFIG_FILE = path.join(process.cwd(), '.secure', 'config.json');

export async function saveConfig(config: Config): Promise<void> {
  try {
    // Create .secure directory if it doesn't exist
    await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
    
    // Save encrypted config
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config), 'utf-8');
    
    // Set restrictive permissions (readable only by owner)
    await fs.chmod(CONFIG_FILE, 0o600);
  } catch (error) {
    console.error('Error saving config:', error);
    throw new Error('Failed to save configuration');
  }
}

export async function loadConfig(): Promise<Config | null> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error('Error loading config:', error);
    throw new Error('Failed to load configuration');
  }
} 