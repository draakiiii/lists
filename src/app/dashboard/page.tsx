'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { listService } from '@/lib/services/listService';
import { List } from '@/types/list';
import Link from 'next/link';
import { LuTrash, LuPencil, LuPlus } from 'react-icons/lu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    listId: '',
    listName: '',
  });
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Lists
          </h1>
          <button
            onClick={createNewList}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LuPlus className="mr-2 h-4 w-4" />
            Create New List
          </button>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven&apos;t created any lists yet. Create your first list to get started!
            </p>
            <button
              onClick={createNewList}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LuPlus className="mr-2 h-4 w-4" />
              Create First List
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

      <Dialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(prev => ({ ...prev, open }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">Are you sure you want to delete the list <strong className="text-foreground">{deleteDialog.listName}</strong>?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This action cannot be undone. All columns and items in this list will be permanently deleted.</p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialog({ open: false, listId: '', listName: '' })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteList}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 