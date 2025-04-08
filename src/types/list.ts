export interface Column {
  id: string;
  header: string;
  order: number;
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  order: number;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentId?: string | null;
  userId: string;
}

export interface List {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  items: ListItem[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export type ListTemplate = {
  id: string;
  name: string;
  description: string;
  columns: Omit<Column, 'id'>[];
  suggestedCategories?: Omit<Category, 'id'>[];
}; 