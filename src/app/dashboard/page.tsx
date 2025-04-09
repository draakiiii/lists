'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { listService } from '@/lib/services/listService';
import { List } from '@/types/list';
import Link from 'next/link';
import { LuTrash, LuPencil, LuPlus, LuInfo, LuRefreshCw, LuBug, LuSend } from 'react-icons/lu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import { useOnboardingTour } from '@/components/OnboardingTour';
import { LoadingOverlay } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Dashboard() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    listId: '',
    listName: '',
  });
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'bug',
    subject: '',
    message: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('app');
  const { startTour, hasSeenTour, markTourAsSeen } = useOnboardingTour();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Comprobar si el usuario es administrador
    // Protegemos el email de admin mediante variables de entorno
    const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAIL 
      ? [process.env.NEXT_PUBLIC_ADMIN_EMAIL] 
      : ['ordenadorsolo@gmail.com']; // Valor por defecto en caso de que no exista la variable
    
    setIsAdmin(ADMIN_EMAILS.includes(user.email as string));

    const fetchLists = async () => {
      try {
        const fetchedLists = await listService.getLists(user.uid);
        setLists(fetchedLists.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lists:', error);
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load your lists',
          variant: 'destructive',
        });
      }
    };

    fetchLists();
  }, [user, router, toast]);

  const createNewList = () => {
    router.push('/lists/new');
  };

  const handleEditList = (listId: string) => {
    router.push(`/lists/${listId}/edit`);
  };

  const handleDeleteList = async () => {
    if (!deleteDialog.listId) return;
    
    try {
      await listService.deleteList(deleteDialog.listId);
      setLists(prev => prev.filter(list => list.id !== deleteDialog.listId));
      
      toast({
        title: 'List deleted',
        description: 'Your list has been successfully deleted',
      });
      
      setDeleteDialog({ open: false, listId: '', listName: '' });
    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the list',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (list: List, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialog({
      open: true,
      listId: list.id,
      listName: list.name,
    });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedbackForm.subject || !feedbackForm.message) {
      toast({
        title: t('feedback.missingInfo'),
        description: t('feedback.fillAllFields'),
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
        title: t('feedback.sendFeedback'),
        description: t('feedback.thankYou'),
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
        title: t('common.error'),
        description: t('feedback.errorSending'),
        variant: 'destructive',
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingOverlay text={t('common.loading')} />
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('list.yourLists')}
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={createNewList}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LuPlus className="mr-2 h-4 w-4" />
              {t('list.createNew')}
            </button>
          </div>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('list.noLists')}
            </p>
            <button
              onClick={createNewList}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LuPlus className="mr-2 h-4 w-4" />
              {t('list.createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="block bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 relative"
              >
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditList(list.id);
                    }}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                    aria-label="Edit list"
                  >
                    <LuPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => openDeleteDialog(list, e)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
                    aria-label="Delete list"
                  >
                    <LuTrash className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {list.name}
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Created on {new Date(list.createdAt).toLocaleDateString()}
                  </div>
                  {list.description && (
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {list.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 pb-4">
        <p>Created by <a href="https://x.com/draakiiii" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">@draakiiii</a></p>
      </footer>

      {/* Delete List Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(prev => ({ ...prev, open }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('common.delete')}</DialogTitle>
            <DialogDescription>
              {t('list.deleteConfirmation', { listName: deleteDialog.listName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('list.deleteWarning')}</p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialog({ open: false, listId: '', listName: '' })}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteList}
            >
              {t('common.delete')}
            </Button>
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
            <DialogTitle className="text-foreground">{t('feedback.sendFeedback')}</DialogTitle>
            <DialogDescription>
              {t('feedback.messagePlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="feedback-type">{t('feedback.feedbackType')}</Label>
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
                      {t('feedback.bugReport')}
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
                      {t('feedback.featureRequest')}
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
                      {t('feedback.other')}
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="subject">{t('feedback.subject')}</Label>
                <Input
                  id="subject"
                  placeholder={t('feedback.subjectPlaceholder')}
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                  required
                  className="text-foreground"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="message">{t('feedback.message')}</Label>
                <Textarea
                  id="message"
                  placeholder={t('feedback.messagePlaceholder')}
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
                {t('feedback.cancel')}
              </Button>
              <Button type="submit" disabled={feedbackSubmitting}>
                {feedbackSubmitting ? (
                  <>
                    <LuRefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t('feedback.sending')}
                  </>
                ) : (
                  <>
                    <LuSend className="mr-2 h-4 w-4" />
                    {t('feedback.send')}
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