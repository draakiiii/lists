'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listService } from '@/lib/services/listService';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export default function EditListPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchList = async () => {
      try {
        const listData = await listService.getList(params.id as string);
        if (!listData) {
          toast({
            title: 'Error',
            description: 'List not found',
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }

        // Check if list belongs to current user
        if (listData.userId !== user.uid) {
          toast({
            title: 'Access denied',
            description: 'You do not have permission to edit this list',
            variant: 'destructive',
          });
          router.push('/dashboard');
          return;
        }

        setName(listData.name);
        setDescription(listData.description || '');
        setLoading(false);
      } catch (error) {
        console.error('Error loading list:', error);
        toast({
          title: 'Error',
          description: 'Failed to load list data',
          variant: 'destructive',
        });
        router.push('/dashboard');
      }
    };

    fetchList();
  }, [params.id, user, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'List name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await listService.updateList(params.id as string, {
        name,
        description: description.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: 'List updated successfully',
      });
      
      router.push(`/lists/${params.id}`);
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: 'Error',
        description: 'Failed to update list',
        variant: 'destructive',
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
            Edit List
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                List Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter list name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter a description for your list"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !name.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 