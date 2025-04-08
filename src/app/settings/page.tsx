'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { UserSettings } from '@/types/settings';
import { settingsService } from '@/lib/services/settingsService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LuDownload, LuUpload, LuTrash2 } from 'react-icons/lu';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const userSettings = await settingsService.getUserSettings(user.uid);
        setSettings(userSettings);
        setLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      }
    };

    loadSettings();
  }, [user, router, toast]);

  const handleSettingChange = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!user || !settings) return;

    try {
      const newSettings = { ...settings, [key]: value };
      await settingsService.updateUserSettings(user.uid, { [key]: value });
      setSettings(newSettings);

      // Update theme if that setting was changed
      if (key === 'theme') {
        setTheme(value as 'light' | 'dark' | 'system');
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    if (!user) return;

    try {
      await settingsService.exportUserData(user.uid);
      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.length) return;

    try {
      await settingsService.importUserData(user.uid, event.target.files[0]);
      // Reload settings after import
      const newSettings = await settingsService.getUserSettings(user.uid);
      setSettings(newSettings);
      toast({
        title: 'Success',
        description: 'Data imported successfully',
      });
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to import data',
        variant: 'destructive',
      });
    }
  };

  const handleReset = async () => {
    if (!user) return;

    try {
      await settingsService.resetUserData(user.uid);
      const newSettings = await settingsService.getUserSettings(user.uid);
      setSettings(newSettings);
      setResetDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Settings reset successfully',
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset data',
        variant: 'destructive',
      });
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Display Settings */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Display Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Show Category Labels</h3>
                <p className="text-sm text-muted-foreground">Show or hide category labels on items</p>
              </div>
              <Switch
                checked={settings.showCategoryLabels}
                onCheckedChange={(checked: boolean) => handleSettingChange('showCategoryLabels', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Show Category Icons</h3>
                <p className="text-sm text-muted-foreground">Show or hide category icons on items</p>
              </div>
              <Switch
                checked={settings.showCategoryIcons}
                onCheckedChange={(checked: boolean) => handleSettingChange('showCategoryIcons', checked)}
              />
            </div>

            {/* Compact Mode and Default View hidden for now */}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Theme</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                className="block w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              >
                <option value="light" className="bg-background text-foreground">Light</option>
                <option value="dark" className="bg-background text-foreground">Dark</option>
                <option value="system" className="bg-background text-foreground">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleExport} 
                variant="outline" 
                className="w-full sm:w-auto text-foreground opacity-50 cursor-not-allowed"
                disabled
              >
                <LuDownload className="mr-2 h-4 w-4" />
                Export Data (Coming Soon)
              </Button>
              <p className="text-sm text-muted-foreground">Download a backup of your data</p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-foreground opacity-50 cursor-not-allowed"
                disabled
              >
                <LuUpload className="mr-2 h-4 w-4" />
                Import Data (Coming Soon)
              </Button>
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled
              />
              <p className="text-sm text-muted-foreground">Restore data from a backup file</p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => setResetDialogOpen(true)}
              >
                <LuTrash2 className="mr-2 h-4 w-4" />
                Reset All Settings
              </Button>
              <p className="text-sm text-muted-foreground">Reset all settings to their defaults</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Reset Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">Are you sure you want to reset all settings to their defaults?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="text-foreground">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} className="text-destructive-foreground">
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 