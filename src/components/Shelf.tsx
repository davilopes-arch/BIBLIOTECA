import React from 'react';
import { 
  ChevronRight, 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical,
  Inbox
} from 'lucide-react';
import { Category, Tutorial } from '../types';
import { TutorialCard } from './TutorialCard';

interface ShelfProps {
  category: Category;
  filteredTutorials: Tutorial[];
  isOpen: boolean;
  onToggleOpen: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectTutorial: (tutorial: Tutorial) => void;
  isEditMode: boolean;
  canEditCategory?: boolean;
  canManageCategoryStructure?: boolean;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onAddTutorial: () => void;
  onEditTutorial: (t: Tutorial) => void;
  onDuplicateTutorial: (t: Tutorial) => void;
  onDeleteTutorial: (t: Tutorial) => void;
  onReorderCategories?: (fromId: string, toId: string) => void;
  onReorderTutorials?: (catId: string, fromId: string, toId: string) => void;
}

export const Shelf: React.FC<ShelfProps> = ({
  category,
  filteredTutorials,
  isOpen,
  onToggleOpen,
  favorites,
  onToggleFavorite,
  onSelectTutorial,
  isEditMode,
  canEditCategory = true,
  canManageCategoryStructure = true,
  onEditCategory,
  onDeleteCategory,
  onAddTutorial,
  onEditTutorial,
  onDuplicateTutorial,
  onDeleteTutorial,
  onReorderCategories,
  onReorderTutorials
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Effective edit mode for this specific shelf
  const isShelfEditable = isEditMode && canEditCategory;

  // Group tutorials by subcategory if applicable
  const subcategoryMap = React.useMemo(() => {
    const map = new Map<string, Tutorial[]>();
    filteredTutorials.forEach(t => {
      const key = t.subcategoria?.trim() || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [filteredTutorials]);

  const hasMultipleSubcategories = subcategoryMap.size > 1 || (subcategoryMap.size === 1 && !subcategoryMap.has(''));

  return (
    <div
      draggable={isEditMode && canManageCategoryStructure}
      onDragStart={e => {
        if (!isEditMode || !canManageCategoryStructure) return;
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'category', catId: category.id }));
      }}
      onDragOver={e => {
        if (!isEditMode || !canManageCategoryStructure) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        if (!isEditMode || !canManageCategoryStructure) return;
        e.preventDefault();
        setIsDragOver(false);
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (data.type === 'category' && data.catId !== category.id && onReorderCategories) {
            onReorderCategories(data.catId, category.id);
          }
        } catch (err) {}
      }}
      className={`rounded-2xl border bg-white dark:bg-neutral-900 transition-all duration-150 shadow-xs overflow-hidden ${
        isOpen ? 'border-neutral-300 dark:border-neutral-700' : 'border-neutral-200 dark:border-neutral-800'
      } ${isDragOver ? 'ring-2 ring-orange-500' : ''}`}
    >
      {/* Category Header Tab */}
      <div
        onClick={onToggleOpen}
        className="group flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isEditMode && canManageCategoryStructure && (
            <span
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing shrink-0"
              title="Arraste para reordenar esta categoria"
              onClick={e => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </span>
          )}

          {/* Color Indicator Dot */}
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-neutral-900"
            style={{ backgroundColor: category.cor || '#FF5A1F' }}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 truncate">
                {category.nome}
              </h2>
              {isEditMode && !canEditCategory && (
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  Somente Leitura
                </span>
              )}
            </div>
            {category.descricao && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate hidden sm:block">
                {category.descricao}
              </p>
            )}
          </div>
        </div>

        {/* Right Tab Meta and Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
            {filteredTutorials.length} {filteredTutorials.length === 1 ? 'tutorial' : 'tutoriais'}
          </span>

          {isEditMode && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              {isShelfEditable && (
                <button
                  onClick={onAddTutorial}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                  title="Adicionar tutorial nesta categoria"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              {canManageCategoryStructure && (
                <>
                  <button
                    onClick={onEditCategory}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                    title="Editar categoria (Super Admin)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDeleteCategory}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Excluir categoria (Super Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}

          <ChevronRight
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-90 text-neutral-800 dark:text-neutral-200' : ''
            }`}
          />
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30">
              {/* Empty State */}
          {filteredTutorials.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-neutral-400 gap-2">
              <Inbox className="w-8 h-8 opacity-50" />
              <p className="text-sm font-medium">Nenhum tutorial encontrado nesta categoria.</p>
              {isShelfEditable && (
                <button
                  onClick={onAddTutorial}
                  className="mt-1 text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
                >
                  + Criar o primeiro tutorial
                </button>
              )}
            </div>
          ) : !hasMultipleSubcategories ? (
            // Simple Single Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTutorials.map(tut => (
                <TutorialCard
                  key={tut.id}
                  category={category}
                  tutorial={tut}
                  isFavorite={favorites.includes(tut.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={() => onSelectTutorial(tut)}
                  isEditMode={isShelfEditable}
                  onEdit={() => onEditTutorial(tut)}
                  onDuplicate={() => onDuplicateTutorial(tut)}
                  onDelete={() => onDeleteTutorial(tut)}
                  onDragStart={e => {
                    if (!isShelfEditable) return;
                    e.stopPropagation();
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'tutorial', catId: category.id, tutId: tut.id }));
                  }}
                  onDrop={e => {
                    if (!isShelfEditable) return;
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'tutorial' && data.catId === category.id && data.tutId !== tut.id && onReorderTutorials) {
                        onReorderTutorials(category.id, data.tutId, tut.id);
                      }
                    } catch (err) {}
                  }}
                />
              ))}
            </div>
          ) : (
            // Grouped by Subcategories
            <div className="space-y-5">
              {Array.from(subcategoryMap.entries()).map(([subName, tuts]) => (
                <div key={subName || 'geral'} className="space-y-2.5">
                  {subName && (
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        {subName}
                      </span>
                      <div className="flex-1 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {tuts.map(tut => (
                      <TutorialCard
                        key={tut.id}
                        category={category}
                        tutorial={tut}
                        isFavorite={favorites.includes(tut.id)}
                        onToggleFavorite={onToggleFavorite}
                        onClick={() => onSelectTutorial(tut)}
                        isEditMode={isShelfEditable}
                        onEdit={() => onEditTutorial(tut)}
                        onDuplicate={() => onDuplicateTutorial(tut)}
                        onDelete={() => onDeleteTutorial(tut)}
                        onDragStart={e => {
                          if (!isShelfEditable) return;
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'tutorial', catId: category.id, tutId: tut.id }));
                        }}
                        onDrop={e => {
                          if (!isShelfEditable) return;
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                            if (data.type === 'tutorial' && data.catId === category.id && data.tutId !== tut.id && onReorderTutorials) {
                              onReorderTutorials(category.id, data.tutId, tut.id);
                            }
                          } catch (err) {}
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
