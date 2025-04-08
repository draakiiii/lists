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

interface StatisticsProps {
  list: List;
  categories: Category[];
}

export const Statistics: React.FC<StatisticsProps> = ({ list, categories }) => {
  const stats = useMemo(() => {
    const totalItems = list.items.length;
    const itemsByColumn = list.columns.map(column => ({
      header: column.header,
      count: list.items.filter(item => item.columnId === column.id).length,
      percentage: totalItems > 0 
        ? (list.items.filter(item => item.columnId === column.id).length / totalItems) * 100 
        : 0
    }));

    const itemsByCategory = categories.map(category => ({
      name: category.name,
      color: category.color,
      icon: category.icon,
      count: list.items.filter(item => item.categoryId === category.id).length,
      percentage: totalItems > 0 
        ? (list.items.filter(item => item.categoryId === category.id).length / totalItems) * 100 
        : 0
    }));

    const itemsWithDates = list.items.filter(item => item.startDate || item.endDate).length;
    const itemsWithTags = list.items.filter(item => item.tags && item.tags.length > 0).length;
    const itemsWithDescription = list.items.filter(item => item.description).length;
    const itemsWithCategory = list.items.filter(item => item.categoryId).length;

    const completionStats = {
      withDates: {
        count: itemsWithDates,
        percentage: totalItems > 0 ? (itemsWithDates / totalItems) * 100 : 0
      },
      withTags: {
        count: itemsWithTags,
        percentage: totalItems > 0 ? (itemsWithTags / totalItems) * 100 : 0
      },
      withDescription: {
        count: itemsWithDescription,
        percentage: totalItems > 0 ? (itemsWithDescription / totalItems) * 100 : 0
      },
      withCategory: {
        count: itemsWithCategory,
        percentage: totalItems > 0 ? (itemsWithCategory / totalItems) * 100 : 0
      }
    };

    return {
      totalItems,
      itemsByColumn,
      itemsByCategory,
      completionStats
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
        <Tabs defaultValue="columns" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="columns">By Column</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>

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

          <TabsContent value="categories">
            <ScrollArea className="h-[300px] pr-4">
              {stats.itemsByCategory.map((category, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">
                        {category.icon} {category.name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.count} items ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="completion">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Items with Dates</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completionStats.withDates.count} items ({stats.completionStats.withDates.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.completionStats.withDates.percentage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Items with Tags</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completionStats.withTags.count} items ({stats.completionStats.withTags.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.completionStats.withTags.percentage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Items with Description</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completionStats.withDescription.count} items ({stats.completionStats.withDescription.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.completionStats.withDescription.percentage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Items with Category</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completionStats.withCategory.count} items ({stats.completionStats.withCategory.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={stats.completionStats.withCategory.percentage} className="h-2" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 