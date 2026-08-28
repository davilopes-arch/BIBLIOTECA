import React from 'react';
import { Star, Flame, Clock } from 'lucide-react';
import { Category, Tutorial } from '../types';

interface QuickSectionProps {
  categories: Category[];
  favorites: string[];
  onSelectTutorial: (category: Category, tutorial: Tutorial) => void;
}

export const QuickSection: React.FC<QuickSectionProps> = ({
  categories,
  favorites,
  onSelectTutorial
}) => {
  // Collect all tutorials with their parent category
  const allTutorialsWithCat = React.useMemo(() => {
    const list: Array<{ category: Category; tutorial: Tutorial }> = [];
    categories.forEach(category => {
      category.tutoriais.forEach(tutorial => {
        list.push({ category, tutorial });
      });
    });
    return list;
  }, [categories]);

  // Favorites list
  const favoriteItems = React.useMemo(() => {
    return allTutorialsWithCat.filter(({ tutorial }) => favorites.includes(tutorial.id));
  }, [allTutorialsWithCat, favorites]);

  // Most viewed list (top 6 with views > 0)
  const popularItems = React.useMemo(() => {
    return [...allTutorialsWithCat]
      .filter(({ tutorial }) => (tutorial.visualizacoes || 0) > 0)
      .sort((a, b) => (b.tutorial.visualizacoes || 0) - (a.tutorial.visualizacoes || 0))
      .slice(0, 6);
  }, [allTutorialsWithCat]);

  if (favoriteItems.length === 0 && popularItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 mb-3">
      {/* Favorites Carousel */}
      {favoriteItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Seus Favoritos ({favoriteItems.length})</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
            {favoriteItems.map(({ category, tutorial }) => (
              <div
                key={tutorial.id}
                onClick={() => onSelectTutorial(category, tutorial)}
                className="flex-shrink-0 w-52 p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer shadow-2xs"
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: category.cor || '#FF5A1F'
                }}
              >
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 truncate mb-0.5">
                  {category.nome}
                </p>
                <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1">
                  {tutorial.titulo}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-neutral-400" />
                    {tutorial.duracao}
                  </span>
                  <span>·</span>
                  <span>{tutorial.visualizacoes || 0} acessos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Carousel */}
      {popularItems.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>Mais Acessados</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
            {popularItems.map(({ category, tutorial }) => (
              <div
                key={tutorial.id}
                onClick={() => onSelectTutorial(category, tutorial)}
                className="flex-shrink-0 w-52 p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer shadow-2xs"
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: category.cor || '#FF5A1F'
                }}
              >
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 truncate mb-0.5">
                  {category.nome}
                </p>
                <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1">
                  {tutorial.titulo}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-neutral-400" />
                    {tutorial.duracao}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {tutorial.visualizacoes || 0} acessos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
