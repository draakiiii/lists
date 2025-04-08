import React, { useMemo } from 'react';
import { List, ListItem, Category } from '@/types/list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface StatisticsProps {
  list: List;
  categories: Category[];
}

export const Statistics: React.FC<StatisticsProps> = ({ list, categories }) => {
  const stats = useMemo(() => {
    const totalItems = list.items.length;
    
    // Items by Column
    const itemsByColumn = list.columns.map(column => ({
      header: column.header,
      count: list.items.filter(item => item.columnId === column.id).length,
      percentage: totalItems > 0 
        ? (list.items.filter(item => item.columnId === column.id).length / totalItems) * 100 
        : 0
    })).filter(column => column.count > 0);

    // Get parent categories (categories without parentId)
    const parentCategories = categories.filter(category => !category.parentId);
    
    // Get subcategories
    const subcategories = categories.filter(category => !!category.parentId);
    
    // Create a map to quickly access categories by ID and name
    const categoryMapById = new Map();
    const categoryMapByName = new Map();
    categories.forEach(category => {
      categoryMapById.set(category.id, category);
      categoryMapByName.set(category.name.toLowerCase(), category);
    });
    
    // Create a map of parent categories to their subcategories
    const categoryHierarchy = parentCategories.map(parentCategory => {
      const childCategories = subcategories.filter(
        subcategory => subcategory.parentId === parentCategory.id
      );
      
      // All items in this parent category (not considering subcategories yet)
      const categoryItems = list.items.filter(item => 
        item.categoryId === parentCategory.id
      );
      
      // Map of items to their matching subcategory based on tags
      const itemSubcategoryMap = new Map();
      
      // For each item in this category, check if it has a tag matching a subcategory name
      categoryItems.forEach(item => {
        if (item.tags && item.tags.length > 0) {
          // For each tag, check if it matches a subcategory name
          for (const tag of item.tags) {
            const subcategory = childCategories.find(
              sub => sub.name.toLowerCase() === tag.toLowerCase()
            );
            if (subcategory) {
              itemSubcategoryMap.set(item.id, subcategory);
              break; // Stop at the first match
            }
          }
        }
      });
      
      // Count items by subcategory based on the mapping
      const subcategoryItemsMap = new Map();
      childCategories.forEach(subcat => {
        subcategoryItemsMap.set(subcat.id, []);
      });
      
      // Assign items to subcategories based on tags
      categoryItems.forEach(item => {
        const matchingSubcategory = itemSubcategoryMap.get(item.id);
        if (matchingSubcategory) {
          const items = subcategoryItemsMap.get(matchingSubcategory.id) || [];
          items.push(item);
          subcategoryItemsMap.set(matchingSubcategory.id, items);
        }
      });
      
      // Items that have the category but don't match any subcategory by tag
      const directItems = categoryItems.filter(item => !itemSubcategoryMap.has(item.id));
      
      // Create subcategory statistics
      const subcategoryItems = childCategories.map(subcategory => {
        const items = subcategoryItemsMap.get(subcategory.id) || [];
        const subcategoryPercentage = categoryItems.length > 0 
          ? (items.length / categoryItems.length) * 100 
          : 0;
          
        return {
          category: subcategory,
          items,
          count: items.length,
          percentage: totalItems > 0 ? (items.length / totalItems) * 100 : 0,
          categoryPercentage: subcategoryPercentage
        };
      }).filter(subcategory => subcategory.count > 0);
      
      // Calculate percentage of direct items within this category
      const directCategoryPercentage = categoryItems.length > 0 
        ? (directItems.length / categoryItems.length) * 100 
        : 0;
      
      return {
        category: parentCategory,
        directItems,
        directCount: directItems.length,
        directPercentage: totalItems > 0 ? (directItems.length / totalItems) * 100 : 0,
        directCategoryPercentage,
        subcategories: subcategoryItems,
        totalCount: categoryItems.length,
        totalPercentage: totalItems > 0 
          ? (categoryItems.length / totalItems) * 100 
          : 0
      };
    }).filter(category => category.totalCount > 0);
    
    // Items without any category
    const uncategorizedItems = list.items.filter(item => !item.categoryId);
    const uncategorizedCount = uncategorizedItems.length;
    const uncategorizedPercentage = totalItems > 0 ? (uncategorizedCount / totalItems) * 100 : 0;

    return {
      totalItems,
      itemsByColumn,
      categoryHierarchy,
      uncategorizedItems,
      uncategorizedCount,
      uncategorizedPercentage
    };
  }, [list.items, list.columns, categories]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>List Statistics</CardTitle>
        <CardDescription>
          Analysis of your list items and their distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="columns">By Column</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <ScrollArea className="h-[400px] pr-4">
              {/* Uncategorized items */}
              {stats.uncategorizedCount > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Uncategorized</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.uncategorizedCount} items ({stats.uncategorizedPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={stats.uncategorizedPercentage} className="h-2 mb-4" />
                </div>
              )}

              {/* Category hierarchy with expandable subcategories */}
              <Accordion type="multiple" className="w-full">
                {stats.categoryHierarchy.map((categoryData) => (
                  <AccordionItem key={categoryData.category.id} value={categoryData.category.id}>
                    <AccordionTrigger className="py-2">
                      <div className="flex justify-between items-center w-full pr-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: categoryData.category.color }}
                          />
                          <span className="text-sm font-medium">
                            {categoryData.category.icon} {categoryData.category.name}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {categoryData.totalCount} items ({categoryData.totalPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {/* Direct items in this category (not in subcategories) */}
                      {categoryData.directCount > 0 && (
                        <div className="ml-6 mb-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Without subcategory</span>
                            <span className="text-sm text-muted-foreground">
                              {categoryData.directCount} items ({categoryData.directCategoryPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={categoryData.directCategoryPercentage} className="h-1.5 mb-2" />
                        </div>
                      )}

                      {/* Items in subcategories */}
                      {categoryData.subcategories.map((subcategoryData) => (
                        <div key={subcategoryData.category.id} className="ml-6 mb-2">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: subcategoryData.category.color }}
                              />
                              <span className="text-sm">
                                {subcategoryData.category.icon} {subcategoryData.category.name}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {subcategoryData.count} items ({subcategoryData.categoryPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={subcategoryData.categoryPercentage} className="h-1.5 mb-2" />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="columns">
            <ScrollArea className="h-[300px] pr-4">
              {stats.itemsByColumn.map((column, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{column.header}</span>
                    <span className="text-sm text-muted-foreground">
                      {column.count} items ({column.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={column.percentage} className="h-2" />
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 