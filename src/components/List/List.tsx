import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { List as ListType, ListItem, Column, Category } from '@/types/list';
import { useRouter } from 'next/navigation';
import { Statistics } from './Statistics';
import { Button } from '@/components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LuArrowLeft, LuPlus, LuSettings2, LuCalendar, LuCheck, LuCopy, LuTrash2, LuPencil, LuTrash } from 'react-icons/lu';
import { useAuth } from '@/providers/AuthProvider';
import { settingsService } from '@/lib/services/settingsService';
import { UserSettings } from '@/types/settings';
import { listService } from '@/lib/services/listService';
import { Timestamp } from 'firebase/firestore';
import { Trash2 } from "lucide-react";
import { createPortal } from 'react-dom';
import { SearchFilter } from './SearchFilter';
import { useTranslations } from 'next-intl';

// Componentes simplificados para evitar dependencias problemáticas
const SimpleButton = ({ onClick, className, children, variant = "default" }: { 
  onClick?: () => void, 
  className?: string, 
  children: React.ReactNode,
  variant?: "default" | "ghost" | "outline" | "destructive"
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "ghost": return "bg-transparent hover:bg-secondary/30 text-foreground transition-all duration-200";
      case "outline": return "border border-input bg-background text-foreground hover:bg-secondary/30 hover:border-primary/50 transition-all duration-200";
      case "destructive": return "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm transition-all duration-200";
      default: return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200";
    }
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${getVariantClass()} rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-primary/25 focus:outline-none active:scale-95 ${className || ''}`}
    >
      {children}
    </button>
  );
};

// Componentes simplificados para el menú desplegable
const SimpleDropdown = ({ trigger, children }: { 
  trigger: React.ReactNode, 
  children: React.ReactNode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (triggerRef.current && isOpen) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    updatePosition();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleItemClick = (callback: () => void) => {
    setIsOpen(false);
    callback();
  };
  
  return (
    <>
      <div 
        ref={triggerRef} 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-50 min-w-56 rounded-lg shadow-lg bg-background border border-border animate-in fade-in-50 duration-100 overflow-hidden"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            {React.Children.map(children, child => {
              if (React.isValidElement(child) && typeof child.props.onClick === 'function') {
                return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                  onClick: () => handleItemClick(child.props.onClick as () => void)
                });
              }
              return child;
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const SimpleDropdownItem = ({ onClick, className, children }: { 
  onClick?: () => void, 
  className?: string, 
  children: React.ReactNode 
}) => (
  <div 
    onClick={onClick} 
    className={`block px-4 py-3 text-base text-foreground hover:bg-secondary/30 transition-colors duration-150 cursor-pointer ${className || ''}`}
  >
    {children}
  </div>
);

// Iconos simplificados
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const MoreHorizontalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

interface ListProps {
  list: ListType;
  categories: Category[];
  onUpdateList: (list: ListType) => void;
  onAddItem: (columnId: string) => void;
  onEditItem: (item: ListItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDuplicateItem: (item: ListItem) => void;
  onAddColumn: () => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string) => void;
}

// Función auxiliar para formatear fechas de forma segura
const safeFormatDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  try {
    // Si es un timestamp de Firestore
    if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
      return new Date(dateValue.seconds * 1000);
    }
    
    // Si es una fecha normal
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

export const List: React.FC<ListProps> = ({
  list,
  categories,
  onUpdateList,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const t = useTranslations('app');
  const tCommon = useTranslations('app.common');
  const tList = useTranslations('app.list');
  
  // Estado para elementos filtrados por búsqueda
  const [filteredItems, setFilteredItems] = useState<ListItem[]>(list.items);
  
  // Estado para determinar si hay búsqueda activa
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Mouse event handlers for desktop drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    e.preventDefault(); // Prevent text selection
    setIsScrolling(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    
    e.preventDefault(); // Prevent text selection
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsScrolling(false);
  };

  const handleMouseLeave = () => {
    setIsScrolling(false);
  };

  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        const userSettings = await settingsService.getUserSettings(user.uid);
        setSettings(userSettings);
      }
    };

    loadSettings();

    // Escuchar cambios en la configuración
    const handleSettingsChange = () => {
      loadSettings();
    };

    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
    };
  }, [user]);
  
  // Determinar si hay búsqueda activa comparando la longitud de los items filtrados con los originales
  useEffect(() => {
    setIsSearchActive(filteredItems.length !== list.items.length);
  }, [filteredItems, list.items]);

  // Función para manejar el auto-scroll
  const handleAutoScroll = useCallback((clientX: number) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollSpeed = 10;
    const scrollTriggerDistance = 100;

    // Calcular las distancias desde los bordes
    const distanceFromLeft = clientX - containerRect.left;
    const distanceFromRight = containerRect.right - clientX;

    // Limpiar el intervalo existente
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Si estamos cerca del borde izquierdo o derecho, iniciamos el auto-scroll
    if (distanceFromLeft < scrollTriggerDistance || distanceFromRight < scrollTriggerDistance) {
      autoScrollIntervalRef.current = setInterval(() => {
        if (distanceFromLeft < scrollTriggerDistance) {
          // Scroll hacia la izquierda
          container.scrollBy({
            left: -scrollSpeed,
            behavior: 'auto'
          });
        } else if (distanceFromRight < scrollTriggerDistance) {
          // Scroll hacia la derecha
          container.scrollBy({
            left: scrollSpeed,
            behavior: 'auto'
          });
        }
      }, 16);
    }
  }, [isDragging]);

  // Manejador de eventos de mouse/touch
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e 
      ? e.touches[0].clientX 
      : (e as MouseEvent).clientX;

    handleAutoScroll(clientX);
  }, [isDragging, handleAutoScroll]);

  // Limpiar el intervalo cuando se detiene el arrastre
  useEffect(() => {
    if (!isDragging && autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
      dragStartRef.current = null;
    }
  }, [isDragging]);

  // Agregar/remover event listeners para el auto-scroll
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isDragging, handleDragMove]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      setIsDragging(false);
      const { source, destination, type } = result;

      if (!destination) return;

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      if (type === 'COLUMN') {
        console.log('DRAG END - Initial columns:', list.columns);
        
        // Get sorted columns first
        const sortedColumns = [...list.columns].sort((a, b) => a.order - b.order);
        console.log('DRAG END - Sorted columns before move:', sortedColumns);
        
        const [removed] = sortedColumns.splice(source.index, 1);
        sortedColumns.splice(destination.index, 0, removed);
        console.log('DRAG END - Columns after move:', sortedColumns);

        // Update order
        const updatedColumns = sortedColumns.map((column, index) => ({
          ...column,
          order: index
        }));
        console.log('DRAG END - Updated columns with new order:', updatedColumns);

        // Immediately update the local state with sorted columns
        const newList = { 
          ...list,
          columns: updatedColumns.sort((a, b) => a.order - b.order)
        };
        console.log('DRAG END - New list being set:', newList);
        onUpdateList(newList);

        // Persist column order changes to Firebase
        try {
          console.log('DRAG END - Updating Firebase...');
          await Promise.all(
            updatedColumns.map(column =>
              listService.updateColumn(list.id, column.id, { order: column.order })
            )
          );
          console.log('DRAG END - Firebase update completed');
        } catch (error) {
          console.error('Error updating column order:', error);
          return;
        }
      } else {
        const sourceColumn = list.columns.find(col => col.id === source.droppableId);
        const destColumn = list.columns.find(col => col.id === destination.droppableId);

        if (!sourceColumn || !destColumn) return;

        // Create a new list with a shallow copy of items
        const newList = {
          ...list,
          items: [...list.items]
        };

        // Get all items for the affected columns, properly sorted
        const isInSameColumn = source.droppableId === destination.droppableId;
        
        // Get and sort source column items
        const sourceItems = [...newList.items]
          .filter(item => item.columnId === source.droppableId)
          .sort((a, b) => a.order - b.order);

        // Get and sort destination column items
        const destItems = isInSameColumn 
          ? sourceItems 
          : [...newList.items]
              .filter(item => item.columnId === destination.droppableId)
              .sort((a, b) => a.order - b.order);

        // Remove the dragged item from source
        const [movedItem] = sourceItems.splice(source.index, 1);
        
        // Update the columnId if moving between columns
        if (!isInSameColumn) {
          movedItem.columnId = destination.droppableId;
        }

        // Insert the item at the new position
        destItems.splice(destination.index, 0, movedItem);

        // Calculate new orders for affected items
        if (isInSameColumn) {
          // Update orders in the same column
          sourceItems.forEach((item, index) => {
            const listItem = newList.items.find(i => i.id === item.id);
            if (listItem) {
              listItem.order = index;
            }
          });
        } else {
          // Update orders in both columns
          // First update source column orders
          sourceItems.forEach((item, index) => {
            const listItem = newList.items.find(i => i.id === item.id);
            if (listItem) {
              listItem.order = index;
            }
          });

          // Then update destination column orders
          destItems.forEach((item, index) => {
            const listItem = newList.items.find(i => i.id === item.id);
            if (listItem) {
              listItem.order = index;
            }
          });
        }

        // Immediately update the state
        onUpdateList(newList);

        // Persist changes to Firebase
        try {
          const itemsToUpdate = [];

          // Always include items from source column
          itemsToUpdate.push(...sourceItems);

          // If moving between columns, include destination items
          if (!isInSameColumn) {
            itemsToUpdate.push(...destItems);
          }

          // Update all affected items in Firebase
          await Promise.all(
            itemsToUpdate.map(item => {
              const listItem = newList.items.find(i => i.id === item.id);
              if (listItem) {
                return listService.updateItem(list.id, item.id, {
                  columnId: listItem.columnId,
                  order: listItem.order
                });
              }
            }).filter(Boolean)
          );
        } catch (error) {
          console.error('Error updating items:', error);
        }
      }
    },
    [list, onUpdateList]
  );

  // Memoize the sorted items for each column
  const getColumnItems = useCallback((columnId: string) => {
    return filteredItems
      .filter(item => item.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }, [filteredItems]);
  
  // Obtener solo las columnas que tienen elementos filtrados
  const getFilteredColumns = useCallback(() => {
    console.log('getFilteredColumns - Current list:', list);
    console.log('getFilteredColumns - Current list.columns:', list.columns);
    
    // Asegurarse de que list.columns existe y no está vacío
    if (!list.columns || list.columns.length === 0) {
      console.log('getFilteredColumns - No columns found');
      return [];
    }
    
    // Siempre ordenar las columnas por order
    const sortedColumns = [...list.columns].sort((a, b) => a.order - b.order);
    console.log('getFilteredColumns - Sorted columns:', sortedColumns);
    
    if (!isSearchActive) {
      return sortedColumns;
    }
    
    // Filtrar las columnas para mostrar solo las que tienen elementos
    // que coinciden con el filtro, manteniendo el orden
    const filteredAndSorted = sortedColumns.filter(column => {
      // Verificar si hay al menos un elemento filtrado en esta columna
      const hasItems = filteredItems.some(item => item.columnId === column.id);
      return hasItems;
    });
    
    return filteredAndSorted;
  }, [list, list.columns, filteredItems, isSearchActive]);

  // Effect para actualizar los items filtrados cuando cambia la lista
  useEffect(() => {
    setFilteredItems(list.items);
  }, [list.items]);

  const handleSettingsChange = async (newSettings: UserSettings) => {
    if (user) {
      try {
        await settingsService.updateUserSettings(user.uid, newSettings);
        setSettings(newSettings);
      } catch (error) {
        console.error('Error updating settings:', error);
      }
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-secondary/10">
        <div className="flex items-center">
          <SimpleButton 
            variant="ghost" 
            className="mr-4 text-foreground flex items-center hover:bg-secondary/30 group transition-all duration-200"
            onClick={() => router.push('/dashboard')}
          >
            <LuArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="ml-2">{tList('backToDashboard')}</span>
          </SimpleButton>
          <h1 className="text-2xl font-bold text-foreground">{list.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton 
            variant="outline"
            className="group"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? (
              <>
                <span className="group-hover:opacity-70 transition-opacity duration-200">{tList('hideStats')}</span>
              </>
            ) : (
              <>
                <span className="group-hover:opacity-70 transition-opacity duration-200">{tList('showStats')}</span>
              </>
            )}
          </SimpleButton>
        </div>
      </div>

      {/* Componente de búsqueda por título y descripción */}
      <div className="p-4">
        <SearchFilter 
          items={list.items} 
          onFilteredItemsChange={setFilteredItems} 
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <DragDropContext
            onDragStart={(start) => {
              setIsDragging(true);
              if (scrollContainerRef.current) {
                const containerRect = scrollContainerRef.current.getBoundingClientRect();
                dragStartRef.current = {
                  x: containerRect.left + scrollContainerRef.current.scrollLeft,
                  y: containerRect.top + scrollContainerRef.current.scrollTop
                };
              }
            }}
            onDragEnd={(result) => {
              setIsDragging(false);
              if (autoScrollIntervalRef.current) {
                clearInterval(autoScrollIntervalRef.current);
                autoScrollIntervalRef.current = null;
              }
              onDragEnd(result);
            }}
          >
            <div 
              ref={scrollContainerRef}
              className={`flex-1 overflow-x-auto overflow-y-hidden p-4 touch-pan-x cursor-grab active:cursor-grabbing ${isScrolling ? 'select-none' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex gap-4 items-start">
                <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex gap-4 min-h-[calc(100vh-12rem)]"
                    >
                      {getFilteredColumns().map((column, index) => (
                        <Draggable
                          key={column.id}
                          draggableId={column.id}
                          index={index}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex flex-col bg-secondary/20 rounded-lg w-80 shadow-sm border border-border/30"
                              style={{ 
                                ...provided.draggableProps.style,
                                height: 'fit-content',
                                maxHeight: 'calc(100vh - 12rem)'
                              }}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between p-3 bg-secondary/30 rounded-t-lg border-b border-border/30"
                              >
                                <h3 className="font-semibold text-foreground">{column.header}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {isSearchActive 
                                      ? getColumnItems(column.id).length 
                                      : list.items.filter(item => item.columnId === column.id).length}
                                  </span>
                                  <SimpleDropdown 
                                    trigger={
                                      <SimpleButton variant="ghost" className="h-10 w-10 p-0 flex items-center justify-center text-foreground hover:bg-secondary/40 rounded-full">
                                        <LuSettings2 className="h-5 w-5" />
                                      </SimpleButton>
                                    }
                                  >
                                    <SimpleDropdownItem onClick={() => onEditColumn(column)} className="text-foreground bg-background hover:bg-secondary/30 flex items-center">
                                      <LuPencil className="h-5 w-5 mr-2" />
                                      {t('editColumn')}
                                    </SimpleDropdownItem>
                                    <SimpleDropdownItem 
                                      className="text-red-500 dark:text-red-400 bg-background hover:bg-secondary/30 flex items-center"
                                      onClick={() => onDeleteColumn(column.id)}
                                    >
                                      <LuTrash className="h-5 w-5 mr-2" />
                                      {t('deleteColumn')}
                                    </SimpleDropdownItem>
                                  </SimpleDropdown>
                                </div>
                              </div>

                              <Droppable droppableId={column.id} type="ITEM">
                                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 p-2 overflow-y-auto ${
                                      snapshot.isDraggingOver ? 'bg-secondary/50' : ''
                                    }`}
                                    style={{
                                      minHeight: '100px',
                                      maxHeight: 'calc(100vh - 16rem)'
                                    }}
                                  >
                                    {getColumnItems(column.id).map((item, index) => (
                                      <Draggable
                                        key={item.id}
                                        draggableId={item.id}
                                        index={index}
                                      >
                                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`p-3 mb-2 bg-background rounded-lg shadow hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 ${
                                              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 scale-[1.02]' : ''
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 mb-2">
                                              <div 
                                                className="flex-grow cursor-pointer" 
                                                onClick={() => onEditItem(item)}
                                              >
                                                <h4 className="font-medium text-foreground break-words">
                                                  {item.title}
                                                </h4>
                                              </div>
                                              <div onClick={(e) => e.stopPropagation()}>
                                                <SimpleDropdown 
                                                  trigger={
                                                    <SimpleButton variant="ghost" className="h-10 w-10 p-0 flex items-center justify-center text-foreground hover:bg-secondary/40 rounded-full">
                                                      <LuSettings2 className="h-5 w-5" />
                                                    </SimpleButton>
                                                  }
                                                >
                                                  <SimpleDropdownItem onClick={() => onEditItem(item)} className="text-foreground bg-background hover:bg-secondary/30 flex items-center">
                                                    <LuPencil className="h-5 w-5 mr-2" />
                                                    {t('editItem')}
                                                  </SimpleDropdownItem>
                                                  <SimpleDropdownItem onClick={() => onDuplicateItem(item)} className="text-foreground bg-background hover:bg-secondary/30 flex items-center">
                                                    <LuCopy className="h-5 w-5 mr-2" />
                                                    {t('duplicateItem')}
                                                  </SimpleDropdownItem>
                                                  <SimpleDropdownItem 
                                                    onClick={() => onDeleteItem(item.id)} 
                                                    className="text-red-500 dark:text-red-400 bg-background hover:bg-secondary/30 flex items-center"
                                                  >
                                                    <LuTrash2 className="h-5 w-5 mr-2" />
                                                    {t('deleteItem')}
                                                  </SimpleDropdownItem>
                                                </SimpleDropdown>
                                              </div>
                                              {item.categoryId && (settings?.showCategoryLabels || settings?.showCategoryIcons) && (
                                                <Badge 
                                                  variant={settings?.disableCategoryColors ? "secondary" : "outline"}
                                                  className="text-xs flex items-center gap-1 whitespace-nowrap"
                                                  style={!settings?.disableCategoryColors && categories.find(c => c.id === item.categoryId)?.color ? {
                                                    backgroundColor: categories.find(c => c.id === item.categoryId)?.color,
                                                    color: '#fff',
                                                    borderColor: 'transparent'
                                                  } : undefined}
                                                >
                                                  {settings?.showCategoryIcons && (
                                                    <span className="flex-shrink-0">
                                                      {categories.find(c => c.id === item.categoryId)?.icon}
                                                    </span>
                                                  )}
                                                  {settings?.showCategoryLabels && (
                                                    <span className="truncate">
                                                      {getCategoryName(item.categoryId)}
                                                    </span>
                                                  )}
                                                </Badge>
                                              )}
                                            </div>
                                            {settings?.showItemDescription && item.description && (
                                              <div className="cursor-pointer" onClick={() => onEditItem(item)}>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                  {item.description}
                                                </p>
                                              </div>
                                            )}
                                            {settings?.showItemDates && (item.startDate || item.endDate) && (
                                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground cursor-pointer" onClick={() => onEditItem(item)}>
                                                {item.startDate && item.endDate ? (
                                                  <span className="flex items-center gap-1">
                                                    <LuCalendar className="h-3 w-3" />
                                                    {safeFormatDate(item.startDate)?.toLocaleDateString() || tCommon('na')} - {safeFormatDate(item.endDate)?.toLocaleDateString() || tCommon('na')}
                                                  </span>
                                                ) : (
                                                  <>
                                                    {item.startDate && (
                                                      <span className="flex items-center gap-1">
                                                        <LuCalendar className="h-3 w-3" />
                                                        {safeFormatDate(item.startDate)?.toLocaleDateString() || tCommon('na')}
                                                      </span>
                                                    )}
                                                    {item.endDate && (
                                                      <span className="flex items-center gap-1">
                                                        <LuCalendar className="h-3 w-3" />
                                                        {safeFormatDate(item.endDate)?.toLocaleDateString() || tCommon('na')}
                                                      </span>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            )}
                                            {settings?.showItemTags && item.tags && item.tags.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-2 cursor-pointer" onClick={() => onEditItem(item)}>
                                                {item.tags.map((tag, index) => (
                                                  <Badge key={index} variant="outline" className="text-xs">
                                                    {tag}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    <SimpleButton
                                      variant="ghost"
                                      className="w-full mt-2 text-foreground hover:bg-secondary/40 group transition-all duration-200 flex items-center justify-center"
                                      onClick={() => onAddItem(column.id)}
                                    >
                                      <LuPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                      {t('addItem')}
                                    </SimpleButton>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {!isSearchActive && (
                        <div className="flex items-start">
                          <SimpleButton
                            onClick={onAddColumn}
                            className="h-10 whitespace-nowrap inline-flex items-center bg-primary/90 hover:bg-primary transition-all duration-200 shadow-sm group"
                          >
                            <LuPlus className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                            {t('addColumn')}
                          </SimpleButton>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
          {showStats && (
            <div className="w-96 p-4 border-l overflow-y-auto">
              <Statistics 
                list={list} 
                categories={categories} 
                isSearchActive={isSearchActive}
                filteredItems={filteredItems}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 