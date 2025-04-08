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
        const updates: Partial<Category> & { icon?: any } = {
          name: formData.name,
          color: formData.color,
        };

        // Only include parentId if it's a subcategory
        if (formData.isSubcategory && formData.parentId) {
          updates.parentId = formData.parentId;
        } else if (!formData.isSubcategory) {
          // If it's not a subcategory, use null for parentId
          updates.parentId = null;
        }

        // Handle icon updates
        if (formData.icon !== currentCategory.icon) {
          updates.icon = formData.icon || deleteField(); // Use deleteField() when icon is empty
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
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        // Create new category
        const newCategoryData: Omit<Category, 'id'> = {
          name: formData.name,
          color: formData.color,
          userId: user!.uid,
        };

        // Only add parentId if it's a subcategory
        if (formData.isSubcategory && formData.parentId) {
          newCategoryData.parentId = formData.parentId;
        }

        // Only add icon if one was selected
        if (formData.icon) {
          newCategoryData.icon = formData.icon;
        }

        const newCategoryId = await categoryService.createCategory(newCategoryData);

        const newCategory: Category = {
          id: newCategoryId,
          ...newCategoryData
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

    // If dropped on a category (becomes a child)
    if (destination.droppableId !== 'root') {
      if (isDroppedOnChild(draggableId, destination.droppableId)) {
        toast({
          title: 'Invalid Operation',
          description: 'Cannot move a category into its own subcategory',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Update the category's parent
        await categoryService.updateCategory(draggableId, {
          parentId: destination.droppableId
        });

        // Update local state
        setCategories(prev => prev.map(c => 
          c.id === draggableId 
            ? { ...c, parentId: destination.droppableId }
            : c
        ));

        toast({
          title: 'Success',
          description: 'Category moved successfully',
        });
      } catch (error) {
        console.error('Error moving category:', error);
        toast({
          title: 'Error',
          description: 'Failed to move the category',
          variant: 'destructive',
        });
      }
    } else {
      // Dropped in root level
      try {
        // Remove parent
        await categoryService.updateCategory(draggableId, {
          parentId: undefined
        });

        // Update local state
        setCategories(prev => prev.map(c => 
          c.id === draggableId 
            ? { ...c, parentId: undefined }
            : c
        ));

        toast({
          title: 'Success',
          description: 'Category moved successfully',
        });
      } catch (error) {
        console.error('Error moving category:', error);
        toast({
          title: 'Error',
          description: 'Failed to move the category',
          variant: 'destructive',
        });
      }
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
                    aria-label={`Edit ${category.name}`}
                  >
                    <LuPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
                    aria-label={`Delete ${category.name}`}
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
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
            Create and manage categories for organizing your list items. Drag categories to create subcategories.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleAddCategory}>
            <LuPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
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
                This is a subcategory
              </label>
            </div>

            {formData.isSubcategory && (
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parent Category
                </label>
                <select
                  id="parentId"
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required={formData.isSubcategory}
                >
                  <option value="">Select a parent category</option>
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
                Icon (optional)
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
            <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
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