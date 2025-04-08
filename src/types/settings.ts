export interface UserSettings {
  showCategoryLabels: boolean;
  showCategoryIcons: boolean;
  compactMode: boolean;
  defaultView: 'board' | 'list';
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: UserSettings = {
  showCategoryLabels: true,
  showCategoryIcons: true,
  compactMode: false,
  defaultView: 'board',
  theme: 'system'
}; 