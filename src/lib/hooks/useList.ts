import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { listService } from '../services/listService';
import { List, Column, ListItem } from '@/types/list';

export function useList(listId?: string) {
  const { user } = useAuth();
  const [list, setList] = useState<List | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch list data
  useEffect(() => {
    if (!listId || !user) return;

    const fetchListData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch list details
        const listData = await listService.getList(listId);
        if (!listData) {
          setError('List not found');
          return;
        }
        setList(listData);

        // Fetch columns
        const columnsData = await listService.getColumns(listId);
        setColumns(columnsData);

        // Fetch items
        const itemsData = await listService.getItems(listId);
        setItems(itemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchListData();
  }, [listId, user]);

  // Create new list
  const createList = async (data: Omit<List, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const listId = await listService.createList(data);
      return listId;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create list');
    }
  };

  // Update list
  const updateList = async (updates: Partial<List>) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      await listService.updateList(listId, updates);
      setList(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update list');
    }
  };

  // Delete list
  const deleteList = async () => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      await listService.deleteList(listId);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete list');
    }
  };

  // Column operations
  const addColumn = async (column: Omit<Column, 'id'>) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      const columnId = await listService.addColumn(listId, column);
      const newColumn = { ...column, id: columnId };
      setColumns(prev => [...prev, newColumn]);
      return columnId;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add column');
    }
  };

  const updateColumn = async (columnId: string, updates: Partial<Column>) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      await listService.updateColumn(listId, columnId, updates);
      setColumns(prev => prev.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update column');
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      await listService.deleteColumn(listId, columnId);
      setColumns(prev => prev.filter(col => col.id !== columnId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete column');
    }
  };

  // Item operations
  const addItem = async (item: Omit<ListItem, 'id'>) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      const itemId = await listService.addItem(listId, item);
      const newItem = { ...item, id: itemId };
      setItems(prev => [...prev, newItem]);
      return itemId;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const updateItem = async (itemId: string, updates: Partial<ListItem>) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      await listService.updateItem(listId, itemId, updates);
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!listId || !user) throw new Error('Invalid operation');
    
    try {
      await listService.deleteItem(listId, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  return {
    list,
    columns,
    items,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    addColumn,
    updateColumn,
    deleteColumn,
    addItem,
    updateItem,
    deleteItem
  };
} 