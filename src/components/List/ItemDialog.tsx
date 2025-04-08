import React, { useState, useEffect } from 'react';
import { ListItem, Category } from '@/types/list';

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
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
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

export const ItemDialog: React.FC<ItemDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  categories,
  mode,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [startDate, setStartDate] = useState(safeFormatDate(initialData?.startDate));
  const [endDate, setEndDate] = useState(safeFormatDate(initialData?.endDate));
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [titleError, setTitleError] = useState('');

  // Actualizar estados cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategoryId(initialData.categoryId || '');
      setStartDate(safeFormatDate(initialData.startDate));
      setEndDate(safeFormatDate(initialData.endDate));
      setTags(initialData.tags || []);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    
    const itemData: any = {
      title,
      description: description.trim() !== '' ? description : null,
      categoryId: categoryId !== '' ? categoryId : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      tags: tags.length > 0 ? tags : null,
    };
    
    onSubmit(itemData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setCategoryId('');
    setStartDate('');
    setEndDate('');
    setTags([]);
    setTitleError('');
    onOpenChange(false);
  };

  return (
    <SimpleDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add Item' : 'Edit Item'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium block text-foreground">
            Title
          </label>
          <input 
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError('');
            }}
            placeholder="Enter item title"
            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          {titleError && (
            <p className="text-sm text-red-500 dark:text-red-400">{titleError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium block text-foreground">
            Description (optional)
          </label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter item description"
            className="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium block text-foreground">
            Category (optional)
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block text-foreground">
              Start Date (optional)
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
              End Date (optional)
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
            Cancel
          </SimpleButton>
          <SimpleButton 
            type="submit"
          >
            {mode === 'add' ? 'Add Item' : 'Save Changes'}
          </SimpleButton>
        </div>
      </form>
    </SimpleDialog>
  );
}; 