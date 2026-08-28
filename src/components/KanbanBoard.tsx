import React from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Inbox, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  List,
  Sparkles,
  Layers
} from 'lucide-react';
import { Category, Tutorial, UserSession } from '../types';
import { TutorialCard } from './TutorialCard';

interface KanbanBoardProps {
  categories: Category[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectTutorial: (category: Category, tutorial: Tutorial) => void;
  isEditMode: boolean;
  user: UserSession;
  canUserEditCategory: (user: UserSession, cat: Category | string) => boolean;
  canUserManageCategories: (user: UserSession) => boolean;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (cat: Category) => void;
  onAddTutorial: (catId: string) => void;
  onEditTutorial: (catId: string, tut: Tutorial) => void;
  onDuplicateTutorial: (cat: Category, tut: Tutorial) => void;
  onDeleteTutorial: (cat: Category, tut: Tutorial) => void;
  onReorderCategories?: (fromId: string, toId: string) => void;
  onReorderTutorials?: (catId: string, fromId: string, toId: string) => void;
  onMoveTutorial?: (fromCatId: string, toCatId: string, tutId: string, targetTutId?: string) => void;
  viewMode: 'kanban' | 'list';
  onToggleViewMode: () => void;
  onOpenNewCategoryModal: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  categories,
  favorites,
  onToggleFavorite,
  onSelectTutorial,
  isEditMode,
  user,
  canUserEditCategory,
  canUserManageCategories,
  onEditCategory,
  onDeleteCategory,
  onAddTutorial,
  onEditTutorial,
  onDuplicateTutorial,
  onDeleteTutorial,
  onReorderCategories,
  onReorderTutorials,
  onMoveTutorial,
  viewMode,
  onToggleViewMode,
  onOpenNewCategoryModal
}) => {
  const boardRef = React.useRef<HTMLDivElement>(null);
  const [draggedOverCatId, setDraggedOverCatId] = React.useState<string | null>(null);
  const [draggedOverTutId, setDraggedOverTutId] = React.useState<string | null>(null);
  const [isDraggingCategory, setIsDraggingCategory] = React.useState(false);

  const canManageCategoryStructure = canUserManageCategories(user);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!boardRef.current) return;
    const scrollAmount = 360;
    boardRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const totalProcedures = React.useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.tutoriais.length, 0);
  }, [categories]);

  return (
    <div className="space-y-3">
      {/* Kanban Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 py-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Quadro Kanban de Departamentos
              <span className="text-xs font-normal text-neutral-500">
                ({categories.length} colunas • {totalProcedures} procedimentos)
              </span>
            </h2>
          </div>
        </div>

        {/* View switcher & Scroll buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Scroll Navigation Buttons */}
          <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => handleScroll('left')}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Rolar colunas para a esquerda"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-1 rounded text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Rolar colunas para a direita"
              aria-label="Rolar para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Switch to List / Gavetas View */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer shadow-2xs"
            title="Alternar entre visualização Kanban e Estantes"
          >
            {viewMode === 'kanban' ? (
              <>
                <List className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Modo Estantes</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Modo Kanban</span>
              </>
            )}
          </button>

          {/* Quick New Category Button in Edit Mode for Admin */}
          {isEditMode && canManageCategoryStructure && (
            <button
              onClick={onOpenNewCategoryModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer shadow-2xs"
              title="Adicionar nova coluna / departamento"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Coluna</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns Container */}
      <div
        ref={boardRef}
        className="flex items-start gap-3.5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scroll-smooth min-h-[500px]"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {categories.map(cat => {
          const isColumnEditable = isEditMode && canUserEditCategory(user, cat);
          const isCategoryDragTarget = draggedOverCatId === cat.id;

          return (
            <div
              key={cat.id}
              draggable={isEditMode && canManageCategoryStructure}
              onDragStart={e => {
                if (!isEditMode || !canManageCategoryStructure) return;
                setIsDraggingCategory(true);
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'category', catId: cat.id }));
              }}
              onDragEnd={() => {
                setIsDraggingCategory(false);
                setDraggedOverCatId(null);
              }}
              onDragOver={e => {
                if (!isEditMode) return;
                e.preventDefault();
                setDraggedOverCatId(cat.id);
              }}
              onDragLeave={() => {
                if (draggedOverCatId === cat.id) {
                  setDraggedOverCatId(null);
                }
              }}
              onDrop={e => {
                if (!isEditMode) return;
                e.preventDefault();
                setDraggedOverCatId(null);
                setDraggedOverTutId(null);

                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  // Handle column reorder
                  if (data.type === 'category' && data.catId !== cat.id && onReorderCategories && canManageCategoryStructure) {
                    onReorderCategories(data.catId, cat.id);
                  }
                  // Handle tutorial move across columns / categories
                  else if (data.type === 'tutorial' && onMoveTutorial) {
                    onMoveTutorial(data.catId, cat.id, data.tutId);
                  }
                } catch (err) {}
              }}
              className={`w-[300px] min-w-[300px] sm:w-[330px] sm:min-w-[330px] max-w-[360px] flex-shrink-0 flex flex-col rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/60 border transition-all duration-150 shadow-2xs overflow-hidden max-h-[calc(100vh-210px)] min-h-[460px] ${
                isCategoryDragTarget && !isDraggingCategory
                  ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 dark:bg-orange-950/20'
                  : 'border-neutral-200/90 dark:border-neutral-800'
              }`}
            >
              {/* Category Color Bar */}
              <div 
                className="h-1.5 w-full shrink-0" 
                style={{ backgroundColor: cat.cor || '#FF5A1F' }} 
              />

              {/* Column Header */}
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xs shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isEditMode && canManageCategoryStructure && (
                    <span
                      className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing shrink-0"
                      title="Arraste para reordenar esta coluna"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {/* Dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-neutral-900 shadow-2xs"
                    style={{ backgroundColor: cat.cor || '#FF5A1F' }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate" title={cat.nome}>
                        {cat.nome}
                      </h3>
                      {isEditMode && !isColumnEditable && (
                        <span className="text-[9px] uppercase font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1 py-0.2 rounded">
                          Leitura
                        </span>
                      )}
                    </div>
                    {cat.descricao && (
                      <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate" title={cat.descricao}>
                        {cat.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Counter & Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                    {cat.tutoriais.length}
                  </span>

                  {isColumnEditable && (
                    <button
                      onClick={() => onAddTutorial(cat.id)}
                      className="p-1 rounded-md text-neutral-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                      title="Adicionar procedimento nesta coluna"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isEditMode && canManageCategoryStructure && (
                    <>
                      <button
                        onClick={() => onEditCategory(cat)}
                        className="p-1 rounded-md text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                        title="Editar coluna"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat)}
                        className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Excluir coluna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Column Cards Stream (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
                {cat.tutoriais.length === 0 ? (
                  <div className="h-44 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center p-3 text-neutral-400 gap-1 bg-white/40 dark:bg-neutral-900/20">
                    <Inbox className="w-6 h-6 opacity-40" />
                    <p className="text-xs font-medium">Nenhum procedimento</p>
                    {isColumnEditable && (
                      <button
                        onClick={() => onAddTutorial(cat.id)}
                        className="mt-1 text-xs font-semibold text-orange-600 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Criar primeiro
                      </button>
                    )}
                  </div>
                ) : (
                  cat.tutoriais.map(tut => (
                    <div
                      key={tut.id}
                      onDragOver={e => {
                        if (!isEditMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDraggedOverTutId(tut.id);
                      }}
                      onDragLeave={() => {
                        if (draggedOverTutId === tut.id) {
                          setDraggedOverTutId(null);
                        }
                      }}
                      onDrop={e => {
                        if (!isEditMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDraggedOverTutId(null);
                        setDraggedOverCatId(null);

                        try {
                          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                          if (data.type === 'tutorial') {
                            if (data.catId === cat.id && data.tutId !== tut.id && onReorderTutorials) {
                              onReorderTutorials(cat.id, data.tutId, tut.id);
                            } else if (data.catId !== cat.id && onMoveTutorial) {
                              onMoveTutorial(data.catId, cat.id, data.tutId, tut.id);
                            }
                          }
                        } catch (err) {}
                      }}
                      className={draggedOverTutId === tut.id ? 'ring-2 ring-orange-500 rounded-xl' : ''}
                    >
                      <TutorialCard
                        category={cat}
                        tutorial={tut}
                        isFavorite={favorites.includes(tut.id)}
                        onToggleFavorite={onToggleFavorite}
                        onClick={() => onSelectTutorial(cat, tut)}
                        isEditMode={isColumnEditable}
                        onEdit={() => onEditTutorial(cat.id, tut)}
                        onDuplicate={() => onDuplicateTutorial(cat, tut)}
                        onDelete={() => onDeleteTutorial(cat, tut)}
                        onDragStart={e => {
                          if (!isColumnEditable) return;
                          e.stopPropagation();
                          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'tutorial', catId: cat.id, tutId: tut.id }));
                        }}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer: Quick Add */}
              {isColumnEditable && (
                <div className="p-2 border-t border-neutral-200/70 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/40 shrink-0">
                  <button
                    onClick={() => onAddTutorial(cat.id)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Procedimento</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
