'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { UserSettings } from '@/types/settings';
import { settingsService } from '@/lib/services/settingsService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LuDownload, LuUpload, LuTrash2, LuGlobe, LuBug, LuSend, LuRefreshCw } from 'react-icons/lu';
import { DisplaySettings } from '@/components/List/DisplaySettingsDialog';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingOverlay } from '@/components/ui/spinner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'bug',
    subject: '',
    message: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const t = useTranslations('app');
  const tSettings = useTranslations('app.settings');
  const tCommon = useTranslations('app.common');
  const tFeedback = useTranslations('app.feedback');
  const tAdmin = useTranslations('app.admin');

  // Comprobar si el usuario es administrador
  const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAIL 
    ? [process.env.NEXT_PUBLIC_ADMIN_EMAIL] 
    : ['ordenadorsolo@gmail.com']; // Valor por defecto en caso de que no exista la variable
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

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
        toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
      }
    };
    loadSettings();
  }, [user, router, toast]);

  const handleSettingChange = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    if (!user) return;
    try {
      await settingsService.updateUserSettings(user.uid, newSettings);
      // Dispatch event to notify other components (like List.tsx) about settings changes
      window.dispatchEvent(new Event('settingsChanged'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      await settingsService.exportUserData(user.uid);
      toast({ title: 'Success', description: 'Data exported successfully' });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({ title: 'Error', description: 'Failed to export data', variant: 'destructive' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.length) return;
    try {
      await settingsService.importUserData(user.uid, event.target.files[0]);
      const newSettings = await settingsService.getUserSettings(user.uid);
      setSettings(newSettings);
      toast({ title: 'Success', description: 'Data imported successfully' });
      window.dispatchEvent(new Event('settingsChanged')); // Update settings elsewhere
    } catch (error) {
      console.error('Error importing data:', error);
      toast({ title: 'Error', description: 'Failed to import data', variant: 'destructive' });
    }
  };

  const handleReset = async () => {
    if (!user) return;
    try {
      await settingsService.resetUserData(user.uid);
      const newSettings = await settingsService.getUserSettings(user.uid);
      setSettings(newSettings);
      setResetDialogOpen(false);
      toast({ title: 'Success', description: 'Settings reset successfully' });
      window.dispatchEvent(new Event('settingsChanged')); // Update settings elsewhere
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({ title: 'Error', description: 'Failed to reset data', variant: 'destructive' });
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedbackForm.subject || !feedbackForm.message) {
      toast({
        title: tFeedback('missingInfo'),
        description: tFeedback('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }
    
    setFeedbackSubmitting(true);
    
    try {
      // Guardar el feedback en Firestore
      await addDoc(collection(db, 'feedback'), {
        type: feedbackForm.type,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        createdAt: serverTimestamp(),
        status: 'pending', // pending, reviewed, resolved
      });
      
      toast({
        title: tFeedback('sendFeedback'),
        description: tFeedback('thankYou'),
      });
      
      setFeedbackDialog(false);
      setFeedbackForm({
        type: 'bug',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: tCommon('error'),
        description: tFeedback('errorSending'),
        variant: 'destructive',
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading || !settings) {
    return <LoadingOverlay text={tCommon('loading')} />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-foreground">{tSettings('title')}</h1>
      
      <div className="grid gap-8">
        {/* Language Settings */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <LuGlobe className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{tSettings('languageSettings')}</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{t('language.select')}</p>
                <p className="text-sm text-muted-foreground">{tSettings('languageDescription')}</p>
              </div>
              <Select value={language} onValueChange={(value: 'en' | 'es') => setLanguage(value)}>
                <SelectTrigger className="w-[180px] bg-background text-foreground">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('language.en')}</SelectItem>
                  <SelectItem value="es">{t('language.es')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <DisplaySettings 
            settings={settings}
            onSettingsChange={handleSettingChange}
          />
        </div>

        {/* Support & Admin */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <LuBug className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{tFeedback('sendFeedback')}</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{tFeedback('reportIssue')}</p>
                <p className="text-sm text-muted-foreground">{tFeedback('messagePlaceholder')}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setFeedbackDialog(true)}
                className="flex items-center space-x-1 text-foreground"
              >
                <LuBug className="h-4 w-4 mr-1" />
                <span>{tFeedback('reportIssue')}</span>
              </Button>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{tAdmin('adminPanel')}</p>
                  <p className="text-sm text-muted-foreground">{tAdmin('feedbackDashboard')}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/admin/feedback')}
                  className="flex items-center space-x-1 text-foreground"
                >
                  <span>{tAdmin('adminPanel')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <LuDownload className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{tSettings('dataManagement')}</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{tSettings('exportData')}</p>
                <p className="text-sm text-muted-foreground">{tSettings('exportDescription')}</p>
              </div>
              <Button variant="outline" size="sm" disabled className="opacity-50 text-foreground">
                <LuDownload className="h-4 w-4 mr-2" />
                {tSettings('exportButton')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{tSettings('importData')}</p>
                <p className="text-sm text-muted-foreground">{tSettings('importDescription')}</p>
              </div>
              <Button variant="outline" size="sm" disabled className="opacity-50 text-foreground">
                <div className="flex items-center">
                  <LuUpload className="h-4 w-4 mr-2" />
                  {tSettings('importButton')}
                </div>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{tSettings('resetData')}</p>
                <p className="text-sm text-muted-foreground">{tSettings('resetDescription')}</p>
              </div>
              <Button variant="destructive" size="sm" disabled className="opacity-50">
                <LuTrash2 className="h-4 w-4 mr-2" />
                {tSettings('resetButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tSettings('resetDialogTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {tSettings('resetDialogDescription')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleReset}>{tSettings('deleteEverythingButton')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog 
        open={feedbackDialog} 
        onOpenChange={setFeedbackDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{tFeedback('sendFeedback')}</DialogTitle>
            <DialogDescription>
              {tFeedback('messagePlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="feedback-type">{tFeedback('feedbackType')}</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="type-bug"
                      name="feedback-type"
                      value="bug"
                      checked={feedbackForm.type === 'bug'}
                      onChange={() => setFeedbackForm({...feedbackForm, type: 'bug'})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 text-foreground"
                    />
                    <label htmlFor="type-bug" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {tFeedback('bugReport')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="type-feature"
                      name="feedback-type"
                      value="feature"
                      checked={feedbackForm.type === 'feature'}
                      onChange={() => setFeedbackForm({...feedbackForm, type: 'feature'})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="type-feature" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {tFeedback('featureRequest')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="type-other"
                      name="feedback-type"
                      value="other"
                      checked={feedbackForm.type === 'other'}
                      onChange={() => setFeedbackForm({...feedbackForm, type: 'other'})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="type-other" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {tFeedback('other')}
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="subject">{tFeedback('subject')}</Label>
                <Input
                  id="subject"
                  placeholder={tFeedback('subjectPlaceholder')}
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                  required
                  className="text-foreground"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="message">{tFeedback('message')}</Label>
                <Textarea
                  id="message"
                  placeholder={tFeedback('messagePlaceholder')}
                  rows={5}
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                  required
                  className="text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" type="button" onClick={() => setFeedbackDialog(false)}>
                {tFeedback('cancel')}
              </Button>
              <Button type="submit" disabled={feedbackSubmitting}>
                {feedbackSubmitting ? (
                  <>
                    <LuRefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {tFeedback('sending')}
                  </>
                ) : (
                  <>
                    <LuSend className="mr-2 h-4 w-4" />
                    {tFeedback('send')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 