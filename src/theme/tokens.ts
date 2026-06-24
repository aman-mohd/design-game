import type { ToolCategory } from '../data/types';

// Category → color mapping (kept in sync with tailwind.config.ts `cat`).
export const CATEGORY_COLOR: Record<ToolCategory, string> = {
  compute: '#1CB0F6',
  network: '#CE82FF',
  data: '#FF9600',
  messaging: '#FF4B4B',
  client: '#2B70C9',
};

export const CATEGORY_LABEL: Record<ToolCategory, string> = {
  compute: 'Compute',
  network: 'Networking',
  data: 'Data',
  messaging: 'Messaging',
  client: 'Client',
};

export const SEVERITY_COLOR = {
  critical: '#FF4B4B',
  warn: '#FFC800',
  info: '#1CB0F6',
} as const;
