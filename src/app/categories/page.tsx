'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Category } from '@/types/list';
import { categoryService } from '@/lib/services/categoryService';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LuTrash, LuPencil, LuPlus, LuGripVertical } from 'react-icons/lu';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { deleteField } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { LoadingOverlay } from '@/components/ui/spinner';

// Lista de emojis comunes para categorías
const COMMON_ICONS = ['📁', '📚', '🎬', '🎮', '🛍️', '✅', '🎵', '🍽️', '💼', '🏠', '🎨', '✈️', '💪', '📝'];

// Add this type definition for the category with children
type CategoryWithChildren = Category & { children: Category[] };

// Add this type for drag and drop events
type DragEndResult = {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: '',
    parentId: '',
    isSubcategory: false,
  });
  
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('app.categories');
  const tCommon = useTranslations('app.common');

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
          title: tCommon('error'),
          description: t('errorLoading'),
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user, router, toast, t, tCommon]);

  const handleAddCategory = () => {
    setCurrentCategory(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      icon: '',
      parentId: '',
      isSubcategory: false,
    });
    setDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || '',
      parentId: category.parentId || '',
      isSubcategory: !!category.parentId,
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
        title: t('categoryDeleted'),
        description: t('categoryDeletedDesc'),
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: tCommon('error'),
        description: t('errorDeleting'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: tCommon('error'),
        description: t('nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const updates: Partial<Category> & { icon?: any, parentId?: string | null | undefined } = {
        name: formData.name,
        color: formData.color,
      };

      if (formData.isSubcategory && formData.parentId) {
        updates.parentId = formData.parentId;
      } else if (!formData.isSubcategory) {
        updates.parentId = null; // Explicitly set to null for root categories
      }

      if (currentCategory) {
        if (formData.icon !== currentCategory.icon) {
          updates.icon = formData.icon || deleteField();
        }
        // Only update parentId if it has changed
        if (updates.parentId !== undefined && updates.parentId !== currentCategory.parentId) {
          // parentId is included in updates
        } else if (updates.parentId === undefined && currentCategory.parentId !== null) {
          // If parentId is not in updates, but was previously set, we need to unset it
          updates.parentId = null; 
        }

        await categoryService.updateCategory(currentCategory.id, updates);
        setCategories(prev => 
          prev.map(c => c.id === currentCategory.id 
            ? { 
                ...c, 
                ...updates,
                icon: formData.icon || undefined // Use undefined for local state
              }
            : c
          )
        );

        toast({
          title: t('categoryUpdated'),
          description: t('categoryUpdatedDesc'),
        });
      } else {
        const newCategoryData: Omit<Category, 'id'> = {
          name: formData.name,
          color: formData.color,
          userId: user!.uid,
          parentId: formData.isSubcategory && formData.parentId ? formData.parentId : null
        };
        if (formData.icon) newCategoryData.icon = formData.icon;
        const newCategoryId = await categoryService.createCategory(newCategoryData);
        const newCategory: Category = { id: newCategoryId, ...newCategoryData };
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: t('categoryCreated'),
          description: t('categoryCreatedDesc'),
        });
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: tCommon('error'),
        description: t('errorSaving'),
        variant: 'destructive',
      });
    }
  };

  // Update the helper function with proper types
  const organizeCategoriesIntoTree = (categories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First, create all category nodes with empty children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Then, organize them into a tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId)!.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  };

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedCategory = categories.find(c => c.id === draggableId);
    if (!draggedCategory) return;

    // If dropped on itself or its children (prevent circular references)
    const isDroppedOnChild = (parentId: string, childId: string): boolean => {
      const child = categories.find(c => c.id === childId);
      if (!child) return false;
      if (child.id === parentId) return true;
      if (child.parentId) return isDroppedOnChild(parentId, child.parentId);
      return false;
    };

    const targetParentId = destination.droppableId === 'root' ? null : destination.droppableId;

    if (targetParentId && isDroppedOnChild(draggableId, targetParentId)) {
      toast({
        title: t('invalidMove'),
        description: t('invalidMoveDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await categoryService.updateCategory(draggableId, { parentId: targetParentId });
      setCategories(prev => prev.map(c => c.id === draggableId ? { ...c, parentId: targetParentId || undefined } : c));
      toast({
        title: t('categoryUpdated'),
        description: t('categoryUpdatedDesc'),
      });
    } catch (error) {
      console.error('Error moving category:', error);
      toast({
        title: tCommon('error'),
        description: t('errorSaving'),
        variant: 'destructive',
      });
    }
  };

  // Update the CategoryItem component
  const CategoryItem: React.FC<{
    category: CategoryWithChildren;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    index: number;
    level?: number;
  }> = ({ category, onEdit, onDelete, index, level = 0 }) => {
    return (
      <>
        <Draggable draggableId={category.id} index={index}>
          {(provided, snapshot) => (
            <li
              ref={provided.innerRef}
              {...provided.draggableProps}
              className={`relative ${
                snapshot.isDragging ? 'z-50' : 'z-0'
              }`}
              style={{
                ...provided.draggableProps.style,
              }}
            >
              <div 
                className={`
                  flex items-center justify-between group
                  px-4 py-4 sm:px-6
                  ${level > 0 ? 'ml-6 border-l border-gray-200 dark:border-gray-700' : ''}
                  ${snapshot.isDragging ? 'bg-white dark:bg-gray-800 shadow-lg rounded-lg' : 'bg-transparent'}
                `}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div
                    {...provided.dragHandleProps}
                    className="mr-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                  >
                    <LuGripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <div 
                    className="w-6 h-6 rounded mr-3 flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="mr-2 flex-shrink-0">{category.icon || '📁'}</span>
                  <span className="text-gray-900 dark:text-white font-medium truncate">
                    {category.name}
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onEdit(category)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                    aria-label={tCommon('edit') + ' ' + category.name}
                  >
                    <LuPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
                    aria-label={tCommon('delete') + ' ' + category.name}
                  >
                    <LuTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          )}
        </Draggable>
        <Droppable droppableId={category.id} type="category">
          {(provided, snapshot) => (
            <ul
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                divide-y divide-gray-200 dark:divide-gray-700
                ${snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
              `}
            >
              {category.children.map((child, childIndex) => (
                <CategoryItem
                  key={child.id}
                  category={child as CategoryWithChildren}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  index={childIndex}
                  level={level + 1}
                />
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </>
    );
  };

  if (loading) {
    return (
      <LoadingOverlay text={tCommon('loading')} />
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
            {t('manageTitle')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('manageDescription')}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleAddCategory}>
            <LuPlus className="mr-2 h-4 w-4" />
            {t('addCategory')}
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('noCategories')}
            </p>
            <Button onClick={handleAddCategory}>
              <LuPlus className="mr-2 h-4 w-4" />
              {t('createFirst')}
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <Droppable droppableId="root" type="category">
              {(provided, snapshot) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    divide-y divide-gray-200 dark:divide-gray-700
                    ${snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                  `}
                >
                  {organizeCategoriesIntoTree(categories).map((category, index) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      onEdit={handleEditCategory}
                      onDelete={handleDeleteCategory}
                      index={index}
                    />
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>
        )}
      </DragDropContext>

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {currentCategory ? t('editCategory') : t('addCategory')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {tCommon('name')}
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={t('categoryNamePlaceholder')}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSubcategory"
                checked={formData.isSubcategory}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    isSubcategory: e.target.checked,
                    parentId: e.target.checked ? prev.parentId : '', // Clear parentId if unchecked
                  }));
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isSubcategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tCommon('isSubcategory')}
              </label>
            </div>

            {formData.isSubcategory && (
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tCommon('parentCategory')}
                </label>
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required={formData.isSubcategory}
                >
                  <option value="">{tCommon('selectParentCategory')}</option>
                  {categories
                    .filter(c => !c.parentId && c.id !== currentCategory?.id) // Only show top-level categories
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
              </div>
            )}

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {tCommon('color')}
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
                  placeholder={t('hexColorPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tCommon('icon')}
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
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit">
                {currentCategory ? tCommon('saveChanges') : tCommon('create') + ' ' + tCommon('category')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t('deleteDialogTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-foreground">
              {t('deleteConfirmation', { categoryName: currentCategory?.name || tCommon('category') })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('deleteWarning')}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 