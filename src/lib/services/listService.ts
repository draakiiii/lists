import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { List, ListItem, Column } from '@/types/list';

export const listService = {
  // Lists
  async getLists(userId: string): Promise<List[]> {
    const listsRef = collection(db, 'lists');
    const q = query(
      listsRef,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const lists = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }) as List[];

    return lists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getList(listId: string): Promise<List | null> {
    const docRef = doc(db, 'lists', listId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as List;
  },

  async createList(list: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const listsRef = collection(db, 'lists');
    const timestamp = serverTimestamp();
    
    const docRef = await addDoc(listsRef, {
      ...list,
      columns: [],
      items: [],
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    return docRef.id;
  },

  async updateList(listId: string, updates: Partial<List>): Promise<void> {
    const docRef = doc(db, 'lists', listId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteList(listId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete list document
    const listRef = doc(db, 'lists', listId);
    batch.delete(listRef);
    
    // Delete all columns
    const columnsRef = collection(db, 'lists', listId, 'columns');
    const columnsSnap = await getDocs(columnsRef);
    columnsSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete all items
    const itemsRef = collection(db, 'lists', listId, 'items');
    const itemsSnap = await getDocs(itemsRef);
    itemsSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  },

  // Columns
  async getColumns(listId: string): Promise<Column[]> {
    const columnsRef = collection(db, 'lists', listId, 'columns');
    const q = query(columnsRef, orderBy('order'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Column[];
  },

  async addColumn(listId: string, column: Omit<Column, 'id'>): Promise<string> {
    const columnsRef = collection(db, 'lists', listId, 'columns');
    const docRef = await addDoc(columnsRef, column);
    return docRef.id;
  },

  async updateColumn(listId: string, columnId: string, updates: Partial<Column>): Promise<void> {
    const docRef = doc(db, 'lists', listId, 'columns', columnId);
    await updateDoc(docRef, updates);
  },

  async deleteColumn(listId: string, columnId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete column document
    const columnRef = doc(db, 'lists', listId, 'columns', columnId);
    batch.delete(columnRef);
    
    // Delete all items in the column
    const itemsRef = collection(db, 'lists', listId, 'items');
    const q = query(itemsRef, where('columnId', '==', columnId));
    const itemsSnap = await getDocs(q);
    itemsSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  },

  // Items
  async getItems(listId: string): Promise<ListItem[]> {
    const itemsRef = collection(db, 'lists', listId, 'items');
    const q = query(itemsRef, orderBy('order'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ListItem[];
  },

  async addItem(listId: string, item: Omit<ListItem, 'id'>): Promise<string> {
    const itemsRef = collection(db, 'lists', listId, 'items');
    const docRef = await addDoc(itemsRef, item);
    return docRef.id;
  },

  async updateItem(listId: string, itemId: string, updates: Partial<ListItem>): Promise<void> {
    const docRef = doc(db, 'lists', listId, 'items', itemId);
    await updateDoc(docRef, updates);
  },

  async deleteItem(listId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'lists', listId, 'items', itemId);
    await deleteDoc(docRef);
  }
}; 