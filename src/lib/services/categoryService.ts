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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '@/types/list';

export const categoryService = {
  async getCategories(userId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      // Use only the where clause to fetch the data
      const q = query(
        categoriesRef,
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      // Sort the results on the client side instead of using orderBy
      return categories.sort((a, b) => {
        const nameA = a.name ? a.name.toLowerCase() : '';
        const nameB = b.name ? b.name.toLowerCase() : '';
        return nameA.localeCompare(nameB);
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Return empty array if there's an error
      return [];
    }
  },

  async getCategory(categoryId: string): Promise<Category | null> {
    const docRef = doc(db, 'categories', categoryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Category;
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const categoriesRef = collection(db, 'categories');
    const timestamp = serverTimestamp();
    
    const docRef = await addDoc(categoriesRef, {
      ...category,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    return docRef.id;
  },

  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    const docRef = doc(db, 'categories', categoryId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  }
}; 