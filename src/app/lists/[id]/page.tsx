'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { List as ListComponent } from '@/components/List/List';
import { ColumnDialog } from '@/components/List/ColumnDialog';
import { ItemDialog } from '@/components/List/ItemDialog';
import { List, ListItem, Column, Category } from '@/types/list';
import { useToast } from '@/components/ui/use-toast';
import { listService } from '@/lib/services/listService';
import { categoryService } from '@/lib/services/categoryService';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { LuPencil } from 'react-icons/lu';
import { settingsService } from '@/lib/services/settingsService';
import { LoadingOverlay } from '@/components/ui/spinner';

export default function ListPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<List | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Cargar datos de la lista
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchListData = async () => {
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

        const columnsData = await listService.getColumns(params.id as string);
        const itemsData = await listService.getItems(params.id as string);
        const categoriesData = await categoryService.getCategories(user.uid);

        setList(listData);
        setColumns(columnsData);
        setItems(itemsData);
        setCategories(categoriesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading list:', error);
        toast({
          title: 'Error',
          description: 'Failed to load list data',
          variant: 'destructive',
        });
      }
    };

    fetchListData();
  }, [params.id, user, router, toast]);

  // Dialog states
  const [columnDialog, setColumnDialog] = useState({
    open: false,
    mode: 'add' as 'add' | 'edit',
    data: undefined as Column | undefined,
  });

  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    data?: ListItem;
    columnId: string;
  }>({ open: false, mode: 'add', columnId: '' });

  // Column handlers
  const handleAddColumn = useCallback(() => {
    setColumnDialog({ open: true, mode: 'add', data: undefined });
  }, []);

  const handleEditColumn = useCallback((column: Column) => {
    setColumnDialog({ open: true, mode: 'edit', data: column });
  }, []);

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    try {
      await listService.deleteColumn(params.id as string, columnId);
      setColumns(prev => prev.filter(col => col.id !== columnId));
      setItems(prev => prev.filter(item => item.columnId !== columnId));

      toast({
        title: 'Column deleted',
        description: 'The column and its items have been deleted.',
      });
    } catch (error) {
      console.error('Error deleting column:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete column',
        variant: 'destructive',
      });
    }
  }, [params.id, toast]);

  const handleColumnSubmit = useCallback(async (data: Omit<Column, 'id' | 'order'>) => {
    try {
      if (columnDialog.mode === 'add') {
        const order = columns.length;
        const columnId = await listService.addColumn(params.id as string, {
          ...data,
          order
        });
        
        const newColumn: Column = {
          ...data,
          id: columnId,
          order
        };
        
        setColumns(prev => [...prev, newColumn]);
      } else if (columnDialog.data) {
        await listService.updateColumn(params.id as string, columnDialog.data.id, data);
        setColumns(prev => prev.map(col =>
          col.id === columnDialog.data!.id ? { ...col, ...data } : col
        ));
      }

      setColumnDialog(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error('Error saving column:', error);
      toast({
        title: 'Error',
        description: 'Failed to save column',
        variant: 'destructive',
      });
    }
  }, [columnDialog.mode, columnDialog.data, columns.length, params.id, toast]);

  // Item handlers
  const handleAddItem = useCallback((columnId: string) => {
    setItemDialog({
      open: true,
      mode: 'add',
      data: undefined,
      columnId,
    });
  }, []);

  const handleEditItem = useCallback((item: ListItem) => {
    setItemDialog({
      open: true,
      mode: 'edit',
      data: item,
      columnId: item.columnId,
    });
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      await listService.deleteItem(params.id as string, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: 'Item deleted',
        description: 'The item has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  }, [params.id, toast]);

  const handleDuplicateItem = useCallback(async (item: ListItem) => {
    if (!user) return;
    
    try {
      // Obtener la configuración del usuario
      const userSettings = await settingsService.getUserSettings(user.uid);

      // Función para extraer número de un string
      const extractNumber = (str: string) => {
        const match = str.match(/\d+$/);
        return match ? parseInt(match[0]) : null;
      };

      // Función para incrementar el número en un string
      const incrementNumber = (str: string) => {
        const number = extractNumber(str);
        if (number === null) return str;
        const baseStr = str.replace(/\d+$/, '');
        return `${baseStr}${number + 1}`;
      };

      // Preparar los datos del nuevo item
      const itemData: any = {
        title: userSettings.autoIncrementDuplicates && extractNumber(item.title) !== null 
          ? incrementNumber(item.title) 
          : `${item.title}`,
        description: item.description && item.description.trim() !== '' ? item.description : null,
        columnId: item.columnId,
        categoryId: item.categoryId && item.categoryId.trim() !== '' ? item.categoryId : null,
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        order: items.filter(i => i.columnId === item.columnId).length,
        tags: item.tags && Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : null
      };

      // Añadir el nuevo item
      const itemId = await listService.addItem(params.id as string, itemData);
      const newItem = { ...itemData, id: itemId };
      setItems(prev => [...prev, newItem as ListItem]);

      toast({
        title: 'Item duplicated',
        description: 'The item has been duplicated successfully.',
      });
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate item',
        variant: 'destructive',
      });
    }
  }, [items, params.id, toast, user]);

  const handleItemSubmit = useCallback(async (data: Omit<ListItem, 'id' | 'columnId' | 'order'>) => {
    try {
      if (!data.title || data.title.trim() === '') {
        toast({
          title: 'Error',
          description: 'Title is required',
          variant: 'destructive',
        });
        return;
      }
      
      const itemData: any = {
        title: data.title,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        tags: data.tags && Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        categoryId: data.categoryId && data.categoryId.trim() !== '' ? data.categoryId : null
      };
      
      if (itemDialog.mode === 'add') {
        const columnItems = items.filter(item => item.columnId === itemDialog.columnId);
        const order = columnItems.length;
        
        itemData.columnId = itemDialog.columnId;
        itemData.order = order;
        
        console.log('Sending to Firebase:', JSON.stringify(itemData));
        
        const itemId = await listService.addItem(params.id as string, itemData);
        
        const newItem = {
          ...itemData,
          id: itemId
        };

        setItems(prev => [...prev, newItem as unknown as ListItem]);
      } else if (itemDialog.data) {
        await listService.updateItem(params.id as string, itemDialog.data.id, itemData);
        setItems(prev => prev.map(item =>
          item.id === itemDialog.data!.id ? { ...item, ...itemData } : item
        ));
      }

      setItemDialog(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save item',
        variant: 'destructive',
      });
    }
  }, [itemDialog.mode, itemDialog.data, itemDialog.columnId, items, params.id, toast]);

  if (loading || !list) {
    return (
      <LoadingOverlay text="Loading..." />
    );
  }

  return (
    <div className="h-full">
      
      <ListComponent
        list={{
          ...list,
          columns,
          items
        }}
        categories={categories}
        onUpdateList={setList}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onDuplicateItem={handleDuplicateItem}
        onAddColumn={handleAddColumn}
        onEditColumn={handleEditColumn}
        onDeleteColumn={handleDeleteColumn}
      />

      <ColumnDialog
        open={columnDialog.open}
        onOpenChange={(open) => setColumnDialog((prev) => ({ ...prev, open }))}
        onSubmit={handleColumnSubmit}
        initialData={columnDialog.data}
        mode={columnDialog.mode}
      />

      <ItemDialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((prev) => ({ ...prev, open }))}
        onSubmit={handleItemSubmit}
        initialData={itemDialog.data}
        categories={categories}
        mode={itemDialog.mode}
      />
    </div>
  );
} 