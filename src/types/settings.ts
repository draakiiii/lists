export interface UserSettings {
  showCategoryLabels: boolean;
  showCategoryIcons: boolean;
  showItemDescription: boolean;
  showItemDates: boolean;
  showItemTags: boolean;
  compactMode: boolean;
  defaultView: 'board' | 'list';
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_SETTINGS: UserSettings = {
  showCategoryLabels: true,
  showCategoryIcons: true,
  showItemDescription: true,
  showItemDates: true,
  showItemTags: true,
  compactMode: false,
  defaultView: 'board',
  theme: 'system'
}; 