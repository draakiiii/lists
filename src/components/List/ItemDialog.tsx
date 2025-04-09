import React, { useState, useEffect } from 'react';
import { ListItem, Category } from '@/types/list';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslations } from 'next-intl';

// Función auxiliar para convertir fechas de forma segura
const safeFormatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // Si es un timestamp de Firestore
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      const date = new Date(dateValue.seconds * 1000);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    }
    
    // Si es una fecha normal
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Componentes simplificados para evitar dependencias problemáticas
const SimpleDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  children 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  title: string, 
  children: React.ReactNode 
}) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(dialogRef, () => {
    if (open) {
      onOpenChange(false);
    }
  });

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={dialogRef} className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

const SimpleButton = ({ 
  onClick, 
  className, 
  children, 
  type = "button",
  variant = "default" 
}: { 
  onClick?: () => void, 
  className?: string, 
  children: React.ReactNode,
  type?: "button" | "submit" | "reset",
  variant?: "default" | "outline" 
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "outline": return "border border-input bg-background text-foreground hover:bg-secondary/50";
      default: return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      className={`${getVariantClass()} rounded-md px-3 py-2 text-sm font-medium transition-colors ${className || ''}`}
    >
      {children}
    </button>
  );
};

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<ListItem, 'id' | 'columnId' | 'order'>) => void;
  initialData?: Partial<ListItem>;
  categories: Category[];
  mode: 'add' | 'edit';
}

// Add this helper function to get the full category path
const getCategoryPath = (categoryId: string, categories: Category[]): string => {
  const paths: string[] = [];
  let currentCategory = categories.find(c => c.id === categoryId);
  
  while (currentCategory) {
    paths.unshift(currentCategory.name);
    currentCategory = categories.find(c => c.id === currentCategory?.parentId);
  }
  
  return paths.join(' > ');
};

export const ItemDialog: React.FC<ItemDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  categories,
  mode,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [titleError, setTitleError] = useState('');
  const t = useTranslations('app');
  const tCommon = useTranslations('app.common');

  // Organize categories into main categories and subcategories
  const mainCategories = categories.filter(c => !c.parentId);
  const subcategories = categories.filter(c => c.parentId === mainCategoryId);

  // Update all form fields when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStartDate(safeFormatDate(initialData.startDate));
      setEndDate(safeFormatDate(initialData.endDate));

      // Handle category initialization
      if (initialData.categoryId) {
        const category = categories.find(c => c.id === initialData.categoryId);
        if (category) {
          if (category.parentId) {
            setMainCategoryId(category.parentId);
            setSubcategoryId(category.id);
          } else {
            setMainCategoryId(category.id);
            // Check if there's a tag that matches a subcategory name
            if (initialData.tags && initialData.tags.length > 0) {
              const subcategoriesForParent = categories.filter(c => c.parentId === category.id);
              const matchingSubcategoryTag = initialData.tags.find(tag => 
                subcategoriesForParent.some(sub => sub.name.toLowerCase() === tag.toLowerCase())
              );
              const matchingSubcategory = matchingSubcategoryTag 
                ? subcategoriesForParent.find(sub => sub.name.toLowerCase() === matchingSubcategoryTag.toLowerCase())
                : undefined;
              setSubcategoryId(matchingSubcategory?.id || '');
            } else {
              setSubcategoryId('');
            }
          }
        }
      } else {
        setMainCategoryId('');
        setSubcategoryId('');
      }
    } else {
      // Reset form when there's no initialData
      setTitle('');
      setDescription('');
      setMainCategoryId('');
      setSubcategoryId('');
      setStartDate('');
      setEndDate('');
    }
  }, [initialData, categories]);

  // Reset subcategory when main category changes
  useEffect(() => {
    if (!initialData) { // Only reset if we're not initializing from initialData
      setSubcategoryId('');
    }
  }, [mainCategoryId, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setTitleError(tCommon('requiredError', { field: tCommon('title') }));
      return;
    }
    
    const itemData: any = {
      title,
      description: description.trim() !== '' ? description : null,
      categoryId: mainCategoryId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      tags: null
    };

    // Add subcategory as a tag if selected
    if (subcategoryId) {
      const subcategory = categories.find(c => c.id === subcategoryId);
      if (subcategory) {
        itemData.tags = [subcategory.name];
      }
    }
    
    onSubmit(itemData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setMainCategoryId('');
    setSubcategoryId('');
    setStartDate('');
    setEndDate('');
    setTitleError('');
    onOpenChange(false);
  };

  return (
    <SimpleDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title={mode === 'add' ? t('addItem') : t('editItem')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium block text-foreground">
            {tCommon('title')}
          </label>
          <input 
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError('');
            }}
            placeholder={t('placeholder.itemTitle')}
            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          {titleError && (
            <p className="text-sm text-red-500 dark:text-red-400">{titleError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium block text-foreground">
            {tCommon('description')}
          </label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('placeholder.itemDescription')}
            className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
            rows={3}
          />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block text-foreground">
              {tCommon('category')}
            </label>
            <select
              value={mainCategoryId}
              onChange={(e) => setMainCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
            >
              <option value="">{tCommon('selectCategory')}</option>
              {mainCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {mainCategoryId && subcategories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium block text-foreground">
                {tCommon('subcategory')}
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                disabled={!mainCategoryId}
              >
                <option value="">{tCommon('selectSubcategory')}</option>
                {subcategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block text-foreground">
              {tCommon('startDate')}
            </label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium block text-foreground">
              {tCommon('endDate')}
            </label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <SimpleButton 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </SimpleButton>
          <SimpleButton type="submit">
            {mode === 'add' ? t('addItem') : tCommon('saveChanges')}
          </SimpleButton>
        </div>
      </form>
    </SimpleDialog>
  );
}; 