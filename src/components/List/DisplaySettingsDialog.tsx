import React from 'react';
import { UserSettings } from '@/types/settings';
import { LuCalendar } from 'react-icons/lu';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

// Componente de Switch simplificado
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`
      relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent
      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      ${checked ? 'bg-primary' : 'bg-muted'}
    `}
    onClick={() => onCheckedChange(!checked)}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0
        transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
      data-state={checked ? 'checked' : 'unchecked'}
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
  const t = useTranslations('app.displaySettings');
  const tCommon = useTranslations('app.common');

  const previewItem = {
    title: t('exampleTask'),
    description: t('exampleDescription'),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tags: [t('exampleTag1'), t('exampleTag2')],
    categoryId: "preview",
  };

  const previewCategory = {
    id: "preview",
    name: t('previewCategoryName'),
    color: "#7C3AED",
    icon: "🎨"
  };

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('title')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">{t('itemContent')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t('description')}</label>
                    <p className="text-sm text-muted-foreground">{t('descriptionDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.showItemDescription}
                    onCheckedChange={(checked) => handleSettingChange('showItemDescription', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t('dates')}</label>
                    <p className="text-sm text-muted-foreground">{t('datesDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.showItemDates}
                    onCheckedChange={(checked) => handleSettingChange('showItemDates', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t('tags')}</label>
                    <p className="text-sm text-muted-foreground">{t('tagsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.showItemTags}
                    onCheckedChange={(checked) => handleSettingChange('showItemTags', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">{t('categoryDisplay')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t('categoryLabels')}</label>
                    <p className="text-sm text-muted-foreground">{t('categoryLabelsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.showCategoryLabels}
                    onCheckedChange={(checked) => handleSettingChange('showCategoryLabels', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t('categoryIcons')}</label>
                    <p className="text-sm text-muted-foreground">{t('categoryIconsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.showCategoryIcons}
                    onCheckedChange={(checked) => handleSettingChange('showCategoryIcons', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t('disableCategoryColors')}</label>
                    <p className="text-sm text-muted-foreground">{t('disableCategoryColorsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.disableCategoryColors}
                    onCheckedChange={(checked) => handleSettingChange('disableCategoryColors', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sticky top-4">
            <h3 className="text-sm font-medium text-foreground mb-4">{t('preview')}</h3>
            <div className="border rounded-lg p-4 bg-card dark:bg-card/50">
              <div className="p-3 bg-background rounded-md shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-foreground truncate flex-grow">
                    {previewItem.title}
                  </h4>
                  {previewItem.categoryId && (settings.showCategoryLabels || settings.showCategoryIcons) && (
                    <Badge 
                      variant={settings.disableCategoryColors ? "secondary" : "outline"}
                      className="text-xs"
                      style={!settings.disableCategoryColors ? { backgroundColor: previewCategory.color, color: '#fff', borderColor: 'transparent' } : undefined}
                    >
                      {settings.showCategoryIcons && previewCategory.icon}
                      {settings.showCategoryLabels && <>{' '}{previewCategory.name}</>}
                    </Badge>
                  )}
                </div>
                {settings.showItemDescription && previewItem.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {previewItem.description}
                  </p>
                )}
                {settings.showItemDates && (previewItem.startDate || previewItem.endDate) && (
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {previewItem.startDate && previewItem.endDate ? (
                      <span className="flex items-center gap-1">
                        <LuCalendar className="h-3 w-3" />
                        {previewItem.startDate.toLocaleDateString()} - {previewItem.endDate.toLocaleDateString()}
                      </span>
                    ) : (
                      <>
                        {previewItem.startDate && <span className="flex items-center gap-1"><LuCalendar className="h-3 w-3" />{previewItem.startDate.toLocaleDateString()}</span>}
                        {previewItem.endDate && <span className="flex items-center gap-1"><LuCalendar className="h-3 w-3" />{previewItem.endDate.toLocaleDateString()}</span>}
                      </>
                    )}
                  </div>
                )}
                {settings.showItemTags && previewItem.tags && previewItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {previewItem.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{t('previewDesc')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('featureSettings')}</h2>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">{t('autoIncrementDuplicates')}</label>
                <p className="text-sm text-muted-foreground">{t('autoIncrementDuplicatesDesc')}</p>
              </div>
              <Switch
                checked={settings.autoIncrementDuplicates}
                onCheckedChange={(checked) => handleSettingChange('autoIncrementDuplicates', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 