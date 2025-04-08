'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Category } from '@/types/list';
import { categoryService } from '@/lib/services/categoryService';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LuTrash, LuPencil, LuPlus } from 'react-icons/lu';

// Lista de emojis comunes para categorías
const COMMON_ICONS = ['📁', '📚', '🎬', '🎮', '🛍️', '✅', '🎵', '🍽️', '💼', '🏠', '🎨', '✈️', '💪', '📝'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6', // Default blue color
    icon: '',
  });
  
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories(user.uid);
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user, router, toast]);

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      icon: '',
    });
    setDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCurrentCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!currentCategory) return;
    
    try {
      await categoryService.deleteCategory(currentCategory.id);
      setCategories(prev => prev.filter(c => c.id !== currentCategory.id));
      
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully',
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the category',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (currentCategory) {
        // Update existing category
        await categoryService.updateCategory(currentCategory.id, {
          name: formData.name,
          color: formData.color,
          ...(formData.icon ? { icon: formData.icon } : {}),
        });

        setCategories(prev => 
          prev.map(c => c.id === currentCategory.id 
            ? { ...c, name: formData.name, color: formData.color, ...(formData.icon ? { icon: formData.icon } : {}) }
            : c
          )
        );

        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        // Create new category
        const newCategoryId = await categoryService.createCategory({
          name: formData.name,
          color: formData.color,
          ...(formData.icon ? { icon: formData.icon } : {}),
          userId: user!.uid,
        });

        const newCategory: Category = {
          id: newCategoryId,
          name: formData.name,
          color: formData.color,
          ...(formData.icon ? { icon: formData.icon } : {}),
          userId: user!.uid,
        };

        setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));

        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the category',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground"> Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
            Manage Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage categories for organizing your list items
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleAddCategory}>
            <LuPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You haven&apos;t created any categories yet. Categories help you organize items in your lists.
          </p>
          <Button onClick={handleAddCategory}>
            <LuPlus className="mr-2 h-4 w-4" />
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <li key={category.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded mr-3" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="mr-2">{category.icon || '📁'}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{category.name}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                    aria-label={`Edit ${category.name}`}
                  >
                    <LuPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
                    aria-label={`Delete ${category.name}`}
                  >
                    <LuTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {currentCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Category name"
                required
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="ml-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="#HEX color"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-7 gap-2">
                {COMMON_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 text-xl rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none ${
                      formData.icon === icon ? 'bg-gray-200 dark:bg-gray-600' : ''
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">Are you sure you want to delete the category <strong className="text-foreground">{currentCategory?.name}</strong>?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This action cannot be undone. Items using this category will no longer be categorized.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 