import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Scale, FileText, Wrench, Sparkles, Navigation,
  BookOpen, HelpCircle, GraduationCap, Brain, Library,
  GitBranch, Calendar, PlayCircle, Headphones, MessageCircle,
  Newspaper, Film, Book, Eye, Menu, Monitor, Search
} from 'lucide-react';
import { TutorialCategoria } from '@/config/tutorialCategories';

const iconMap: Record<string, React.ComponentType<any>> = {
  Home, Scale, FileText, Wrench, Sparkles, Navigation,
  BookOpen, HelpCircle, GraduationCap, Brain, Library,
  GitBranch, Calendar, PlayCircle, Headphones, MessageCircle,
  Newspaper, Film, Book, Eye, Menu, Monitor, Search,
};

interface TutorialCategoryCarouselProps {
  categories: TutorialCategoria[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export function TutorialCategoryCarousel({
  categories,
  selectedCategory,
  onSelectCategory,
}: TutorialCategoryCarouselProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-3 pb-2">
        {categories.map((category, index) => {
          const Icon = iconMap[category.icone] || HelpCircle;
          const isSelected = selectedCategory === category.id;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectCategory(category.id)}
              className={`
                flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl
                transition-all duration-200 min-w-[90px]
                ${isSelected 
                  ? `bg-gradient-to-br ${category.cor} text-white shadow-lg` 
                  : 'bg-card border border-border hover:border-primary/30'
                }
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${isSelected ? 'bg-white/20' : 'bg-muted'}
              `}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <span className={`
                text-xs font-medium text-center leading-tight
                ${isSelected ? 'text-white' : 'text-foreground'}
              `}>
                {category.nome}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
