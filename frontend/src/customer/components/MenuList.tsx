import { useState } from 'react';
import { MenuCategory } from '../services/menuService';
import { MenuItem } from './MenuItem';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';

interface MenuListProps {
  menu: MenuCategory[];
  onSearch?: (query: string) => void;
}

export const MenuList = ({ menu, onSearch }: MenuListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'veg' | 'vegan'>('all');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const filterItems = (items: any[]) => {
    let filtered = items;
    
    if (selectedFilter === 'veg') {
      filtered = filtered.filter((item) => item.isVegetarian);
    } else if (selectedFilter === 'vegan') {
      filtered = filtered.filter((item) => item.isVegan);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
            className="whitespace-nowrap"
          >
            All Items
          </Button>
          <Button
            variant={selectedFilter === 'veg' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('veg')}
            className="whitespace-nowrap"
          >
            🥬 Vegetarian
          </Button>
          <Button
            variant={selectedFilter === 'vegan' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('vegan')}
            className="whitespace-nowrap"
          >
            🌱 Vegan
          </Button>
        </div>
      </div>

      {/* Menu Categories */}
      <Accordion type="multiple" defaultValue={menu.map((cat) => cat.id)} className="space-y-4">
        {menu.map((category) => {
          const filteredItems = filterItems(category.items);
          
          if (filteredItems.length === 0) return null;
          
          return (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border rounded-xl bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                <div className="text-left">
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-4 pt-2">
                  {filteredItems.map((item) => (
                    <MenuItem key={item.id} item={item} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {menu.every((cat) => filterItems(cat.items).length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No items found</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};
