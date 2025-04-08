import React from 'react';
import { UserSettings } from '@/types/settings';
import { LuCalendar, LuCheck } from 'react-icons/lu';

// Componente de Switch simplificado
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      ${checked ? 'bg-primary' : 'bg-input'}
    `}
    onClick={() => onCheckedChange(!checked)}
  >
    <span
      className={`
        ${checked ? 'translate-x-6' : 'translate-x-1'}
        inline-block h-4 w-4 transform rounded-full bg-background transition-transform
      `}
    />
  </button>
);

interface DisplaySettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  // Item de ejemplo para la previsualización
  const previewItem = {
    title: "Example Task",
    description: "This is an example description to show how your items will look.",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
    tags: ["example", "preview"],
    categoryId: "preview",
  };

  const previewCategory = {
    id: "preview",
    name: "Preview Category",
    color: "#7C3AED",
    icon: "🎨"
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Item Display Settings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Item Content</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <p className="text-sm text-muted-foreground">Show item descriptions</p>
                  </div>
                  <Switch
                    checked={settings.showItemDescription}
                    onCheckedChange={(checked) => handleSettingChange('showItemDescription', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Dates</label>
                    <p className="text-sm text-muted-foreground">Show start and end dates</p>
                  </div>
                  <Switch
                    checked={settings.showItemDates}
                    onCheckedChange={(checked) => handleSettingChange('showItemDates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Tags</label>
                    <p className="text-sm text-muted-foreground">Show item tags</p>
                  </div>
                  <Switch
                    checked={settings.showItemTags}
                    onCheckedChange={(checked) => handleSettingChange('showItemTags', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Category Display</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Category Labels</label>
                    <p className="text-sm text-muted-foreground">Show category names</p>
                  </div>
                  <Switch
                    checked={settings.showCategoryLabels}
                    onCheckedChange={(checked) => handleSettingChange('showCategoryLabels', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Category Icons</label>
                    <p className="text-sm text-muted-foreground">Show category icons</p>
                  </div>
                  <Switch
                    checked={settings.showCategoryIcons}
                    onCheckedChange={(checked) => handleSettingChange('showCategoryIcons', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Preview</h3>
              <div className="border rounded-lg p-4 bg-card dark:bg-card/50">
                <div className="p-3 bg-background dark:bg-background/50 rounded-md shadow-sm">
                  <h4 className="font-medium text-foreground">{previewItem.title}</h4>
                  {settings.showItemDescription && previewItem.description && (
                    <p className="text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">
                      {previewItem.description}
                    </p>
                  )}
                  {settings.showItemDates && (previewItem.startDate || previewItem.endDate) && (
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <LuCalendar className="h-3 w-3" />
                        <span>
                          {previewItem.startDate.toLocaleDateString()} - {previewItem.endDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                  {settings.showItemTags && previewItem.tags && previewItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {previewItem.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary dark:bg-secondary/50 text-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(settings.showCategoryLabels || settings.showCategoryIcons) && previewItem.categoryId && (
                    <div className="flex items-center gap-1 mt-2">
                      <div 
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ 
                          backgroundColor: previewCategory.color,
                          color: '#fff'
                        }}
                      >
                        {settings.showCategoryIcons && previewCategory.icon}
                        {settings.showCategoryLabels && (
                          <span>{previewCategory.name}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                This is a preview of how your items will look with the current settings.
                Changes are saved automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 