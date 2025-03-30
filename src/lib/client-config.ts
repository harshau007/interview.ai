import { Config } from "./store";

const CONFIG_KEY = "interview_config";

export function getClientConfig(): Config | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setClientConfig(config: Config): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
} 