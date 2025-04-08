import React, { useState } from 'react';
import { Column } from '@/types/list';

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

interface ColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Column, 'id' | 'order'>) => void;
  initialData?: Partial<Column>;
  mode: 'add' | 'edit';
}

export const ColumnDialog: React.FC<ColumnDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}) => {
  const [header, setHeader] = useState(initialData?.header || '');
  const [headerError, setHeaderError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!header.trim()) {
      setHeaderError('Header is required');
      return;
    }
    
    onSubmit({ header });
    setHeader('');
    setHeaderError('');
    onOpenChange(false);
  };

  return (
    <SimpleDialog 
      open={open} 
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add Column' : 'Edit Column'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium block text-foreground">
            Header
          </label>
          <input 
            value={header}
            onChange={(e) => {
              setHeader(e.target.value);
              if (e.target.value.trim()) setHeaderError('');
            }}
            placeholder="Enter column header"
            className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          {headerError && (
            <p className="text-sm text-red-500">{headerError}</p>
          )}
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
            {mode === 'add' ? 'Add Column' : 'Save Changes'}
          </SimpleButton>
        </div>
      </form>
    </SimpleDialog>
  );
}; 