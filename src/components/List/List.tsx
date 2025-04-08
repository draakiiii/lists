import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { List as ListType, ListItem, Column, Category } from '@/types/list';
import { useRouter } from 'next/navigation';
import { Statistics } from './Statistics';
import { Button } from '@/components/ui/button';
import { LuArrowLeft, LuPlus, LuSettings2 } from 'react-icons/lu';

// Componentes simplificados para evitar dependencias problemáticas
const SimpleButton = ({ onClick, className, children, variant = "default" }: { 
  onClick?: () => void, 
  className?: string, 
  children: React.ReactNode,
  variant?: "default" | "ghost" | "outline" | "destructive"
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "ghost": return "bg-transparent hover:bg-secondary/50 text-foreground";
      case "outline": return "border border-input bg-background text-foreground hover:bg-secondary/50";
      case "destructive": return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      default: return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${getVariantClass()} rounded-md px-3 py-2 text-sm font-medium transition-colors ${className || ''}`}
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
  
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border z-20">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

const SimpleDropdownItem = ({ onClick, className, children }: { 
  onClick?: () => void, 
  className?: string, 
  children: React.ReactNode 
}) => (
  <div 
    onClick={onClick} 
    className={`block px-4 py-2 text-sm text-foreground hover:bg-secondary/50 cursor-pointer ${className || ''}`}
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
  onAddColumn: () => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const List: React.FC<ListProps> = ({
  list,
  categories,
  onUpdateList,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const router = useRouter();

  const onDragEnd = useCallback(
    (result: DropResult) => {
      setIsDragging(false);
      const { source, destination, type } = result;

      if (!destination) return;

      const newList = { ...list };

      if (type === 'COLUMN') {
        const columns = Array.from(list.columns);
        const [removed] = columns.splice(source.index, 1);
        columns.splice(destination.index, 0, removed);

        // Update order
        columns.forEach((column, index) => {
          column.order = index;
        });

        newList.columns = columns;
      } else {
        const sourceColumn = list.columns.find(col => col.id === source.droppableId);
        const destColumn = list.columns.find(col => col.id === destination.droppableId);

        if (!sourceColumn || !destColumn) return;

        const sourceItems = list.items.filter(item => item.columnId === sourceColumn.id);
        const destItems = source.droppableId === destination.droppableId
          ? sourceItems
          : list.items.filter(item => item.columnId === destColumn.id);

        const [removed] = sourceItems.splice(source.index, 1);
        removed.columnId = destColumn.id;
        destItems.splice(destination.index, 0, removed);

        // Update order for affected items
        const updatedItems = list.items.map(item => {
          if (item.columnId === sourceColumn.id) {
            return sourceItems.find(i => i.id === item.id) || item;
          }
          if (item.columnId === destColumn.id) {
            return destItems.find(i => i.id === item.id) || item;
          }
          return item;
        });

        newList.items = updatedItems;
      }

      onUpdateList(newList);
    },
    [list, onUpdateList]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <SimpleButton 
            variant="ghost" 
            className="mr-4 text-foreground"
            onClick={() => router.push('/dashboard')}
          >
            <LuArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </SimpleButton>
          <h1 className="text-2xl font-bold text-foreground">{list.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SimpleButton 
            variant="ghost"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </SimpleButton>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <DragDropContext
            onDragStart={() => setIsDragging(true)}
            onDragEnd={onDragEnd}
          >
            <div className="flex-1 overflow-x-auto p-4">
              <div className="flex gap-4 items-start">
                <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex gap-4 min-h-[calc(100vh-12rem)]"
                    >
                      {list.columns.map((column, index) => (
                        <Draggable
                          key={column.id}
                          draggableId={column.id}
                          index={index}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex flex-col bg-secondary/30 rounded-lg w-80"
                              style={{ ...provided.draggableProps.style }}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-between p-3 bg-secondary/50 rounded-t-lg"
                              >
                                <h3 className="font-semibold text-foreground">{column.header}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {list.items.filter(item => item.columnId === column.id).length}
                                  </span>
                                  <SimpleDropdown 
                                    trigger={
                                      <SimpleButton variant="ghost" className="h-8 w-8 p-0 flex items-center justify-center text-foreground">
                                        <LuSettings2 className="h-4 w-4" />
                                      </SimpleButton>
                                    }
                                  >
                                    <SimpleDropdownItem onClick={() => onEditColumn(column)} className="text-foreground bg-background hover:bg-secondary">
                                      Edit Column
                                    </SimpleDropdownItem>
                                    <SimpleDropdownItem 
                                      className="text-red-500 dark:text-red-400 bg-background hover:bg-secondary"
                                      onClick={() => onDeleteColumn(column.id)}
                                    >
                                      Delete Column
                                    </SimpleDropdownItem>
                                  </SimpleDropdown>
                                </div>
                              </div>

                              <Droppable droppableId={column.id} type="ITEM">
                                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 p-2 min-h-[100px] overflow-y-auto ${
                                      snapshot.isDraggingOver ? 'bg-secondary/50' : ''
                                    }`}
                                  >
                                    {list.items
                                      .filter(item => item.columnId === column.id)
                                      .sort((a, b) => a.order - b.order)
                                      .map((item, index) => (
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
                                              className={`p-3 mb-2 bg-background rounded-md shadow-sm ${
                                                snapshot.isDragging ? 'shadow-lg' : ''
                                              }`}
                                              onClick={() => onEditItem(item)}
                                            >
                                              <h4 className="font-medium text-foreground">{item.title}</h4>
                                              {item.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                  {item.description}
                                                </p>
                                              )}
                                              {item.categoryId && (
                                                <div className="flex items-center gap-1 mt-2">
                                                  {categories.map(category => {
                                                    if (category.id === item.categoryId) {
                                                      return (
                                                        <div 
                                                          key={category.id}
                                                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                                          style={{ 
                                                            backgroundColor: category.color,
                                                            color: '#fff'
                                                          }}
                                                        >
                                                          {category.icon} {category.name}
                                                        </div>
                                                      );
                                                    }
                                                    return null;
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                    {provided.placeholder}
                                    <SimpleButton
                                      variant="ghost"
                                      className="w-full mt-2 text-foreground hover:bg-secondary/50"
                                      onClick={() => onAddItem(column.id)}
                                    >
                                      <LuPlus className="mr-2 h-4 w-4" />
                                      Add Item
                                    </SimpleButton>
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <div className="flex items-start">
                        <SimpleButton
                          onClick={onAddColumn}
                          className="h-10 whitespace-nowrap"
                        >
                          <LuPlus className="mr-2 h-4 w-4" />
                          Add Column
                        </SimpleButton>
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
          {showStats && (
            <div className="w-96 p-4 border-l overflow-y-auto">
              <Statistics list={list} categories={categories} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 