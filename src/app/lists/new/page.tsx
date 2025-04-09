'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { listService } from '@/lib/services/listService';
import { List } from '@/types/list';
import { useTranslations } from 'next-intl';

export default function NewList() {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('app.lists');
  const tCommon = useTranslations('app.common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!name.trim()) {
      setError(tCommon('listNameEmptyError'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const newList: Omit<List, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        description: description.trim(),
        userId: user.uid,
        columns: [],
        items: []
      };
      const listId = await listService.createList(newList);
      router.push(`/lists/${listId}`);
    } catch (err) {
      setError(t('errorCreating'));
      console.error('Error creating list:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('createTitle')}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tCommon('listName')}</label>
                <div className="mt-1">
                  <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder={tCommon('enterListName')} />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tCommon('descriptionOptional')}</label>
                <div className="mt-1">
                  <textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder={tCommon('enterListDescription')} />
                </div>
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              <div>
                <button type="submit" disabled={loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {loading ? tCommon('creating') : tCommon('createList')}
                </button>
              </div>
            </form>
            <div className="mt-4">
              <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:text-indigo-500">{tCommon('backToDashboard')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 