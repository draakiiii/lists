import { UserSettings } from '@/types/settings';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { List, ListItem, Column, Category } from '@/types/list';

const defaultSettings: UserSettings = {
  showCategoryLabels: true,
  showCategoryIcons: true,
  showItemDescription: true,
  showItemDates: true,
  showItemTags: true,
  compactMode: false,
  defaultView: 'board',
  theme: 'system',
  disableCategoryColors: false,
  autoIncrementDuplicates: true
};

export const settingsService = {
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const docRef = doc(db, 'settings', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { ...defaultSettings, ...docSnap.data() } as UserSettings;
      }
      
      // If no settings exist, create default settings
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return defaultSettings;
    }
  },

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const docRef = doc(db, 'settings', userId);
      await updateDoc(docRef, settings);
      
      // Aplicar cambios inmediatamente
      if (settings.compactMode !== undefined) {
        document.body.classList.toggle('compact-mode', settings.compactMode);
      }
      
      if (settings.showCategoryLabels !== undefined || settings.showCategoryIcons !== undefined) {
        // Forzar re-render de los componentes que muestran categorías
        window.dispatchEvent(new Event('settingsChanged'));
      }
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  async exportUserData(userId: string): Promise<void> {
    try {
      // Obtener configuración
      const settingsDoc = await getDoc(doc(db, 'settings', userId));
      const settings = settingsDoc.exists() ? settingsDoc.data() : defaultSettings;

      // Obtener listas
      const listsDoc = await getDoc(doc(db, 'lists', userId));
      const lists = listsDoc.exists() ? listsDoc.data() : { lists: [] };

      // Obtener columnas
      const columnsDoc = await getDoc(doc(db, 'columns', userId));
      const columns = columnsDoc.exists() ? columnsDoc.data() : { columns: [] };

      // Obtener items
      const itemsDoc = await getDoc(doc(db, 'items', userId));
      const items = itemsDoc.exists() ? itemsDoc.data() : { items: [] };

      // Obtener categorías
      const categoriesDoc = await getDoc(doc(db, 'categories', userId));
      const categories = categoriesDoc.exists() ? categoriesDoc.data() : { categories: [] };

      const exportData = {
        settings,
        lists: lists.lists || [],
        columns: columns.columns || [],
        items: items.items || [],
        categories: categories.categories || [],
        exportDate: new Date().toISOString(),
      };

      // Crear y descargar el archivo
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskify-backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },

  async importUserData(userId: string, file: File): Promise<void> {
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);

      // Validar estructura de datos
      if (!importData.settings || !importData.lists || !importData.columns || !importData.items || !importData.categories) {
        throw new Error('Invalid import file structure');
      }

      // Importar configuración
      await setDoc(doc(db, 'settings', userId), importData.settings);

      // Importar listas
      await setDoc(doc(db, 'lists', userId), { lists: importData.lists });

      // Importar columnas
      await setDoc(doc(db, 'columns', userId), { columns: importData.columns });

      // Importar items
      await setDoc(doc(db, 'items', userId), { items: importData.items });

      // Importar categorías
      await setDoc(doc(db, 'categories', userId), { categories: importData.categories });

      // Aplicar configuración inmediatamente
      document.body.classList.toggle('compact-mode', importData.settings.compactMode);
      window.dispatchEvent(new Event('settingsChanged'));
    } catch (error) {
      console.error('Error importing user data:', error);
      throw error;
    }
  },

  async resetUserData(userId: string): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', userId), defaultSettings);
      document.body.classList.remove('compact-mode');
      window.dispatchEvent(new Event('settingsChanged'));
    } catch (error) {
      console.error('Error resetting user data:', error);
      throw error;
    }
  },
}; 