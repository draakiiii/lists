'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { LoadingOverlay } from '@/components/ui/spinner';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const t = useTranslations('app.profile');
  const tCommon = useTranslations('app.common');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setDisplayName(user.displayName || '');
    setEmail(user.email || '');
    setLoading(false);
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile(user, { displayName });
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = { displayName, updatedAt: new Date() };

      if (userDoc.exists()) {
        await updateDoc(userDocRef, userData);
      } else {
        await setDoc(userDocRef, { ...userData, email: user.email, createdAt: new Date() });
      }

      setMessage({ type: 'success', text: t('updateSuccess') });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
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
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">{t('title')}</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          {message.text && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('displayName')}</label>
              <input type="text" name="displayName" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                value={email} 
                disabled={true}
                readOnly={true}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('emailReadOnly')}</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}>
                {saving ? t('saving') : tCommon('save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 