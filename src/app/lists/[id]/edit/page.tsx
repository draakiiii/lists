'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listService } from '@/lib/services/listService';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { LoadingOverlay } from '@/components/ui/spinner';

export default function EditListPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const tLists = useTranslations('app.lists');
  const tCommon = useTranslations('app.common');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const fetchList = async () => {
      try {
        const listData = await listService.getList(params.id as string);
        if (!listData) {
          toast({ title: tCommon('error'), description: tCommon('listNotFound'), variant: 'destructive' });
          router.push('/dashboard');
          return;
        }
        if (listData.userId !== user.uid) {
          toast({ title: tCommon('accessDenied'), description: tCommon('noPermission'), variant: 'destructive' });
          router.push('/dashboard');
          return;
        }
        setName(listData.name);
        setDescription(listData.description || '');
        setLoading(false);
      } catch (error) {
        console.error('Error loading list:', error);
        toast({ title: tCommon('error'), description: tCommon('errorLoadingList'), variant: 'destructive' });
        router.push('/dashboard');
      }
    };
    fetchList();
  }, [params.id, user, router, toast, tCommon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: tCommon('error'), description: tCommon('listNameEmptyError'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await listService.updateList(params.id as string, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast({ title: tCommon('success'), description: tCommon('listUpdated') });
      router.push(`/lists/${params.id}`);
    } catch (error) {
      console.error('Error updating list:', error);
      toast({ title: tCommon('error'), description: tCommon('errorUpdatingList'), variant: 'destructive' });
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay text={tCommon('loading')} />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">{tLists('editTitle')}</h1>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tCommon('listName')}</label>
              <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={tCommon('enterListName')} required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tCommon('descriptionOptional')}</label>
              <textarea id="description" name="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={tCommon('enterListDescription')} />
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => router.back()} disabled={saving}>{tCommon('cancel')}</Button>
              <Button type="submit" disabled={saving || !name.trim()}>{saving ? tCommon('saving') : tCommon('saveChanges')}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 