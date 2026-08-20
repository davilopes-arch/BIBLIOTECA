import React from 'react';
import { 
  Star, 
  Clock, 
  Eye, 
  Paperclip, 
  GripVertical, 
  Copy, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Share2,
  Check,
  Sparkles,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Category, Tutorial } from '../types';
import { getCompletedTutorials } from '../utils/storage';

interface TutorialCardProps {
  category: Category;
  tutorial: Tutorial;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: () => void;
  isEditMode: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({
  category,
  tutorial,
  isFavorite,
  onToggleFavorite,
  onClick,
  isEditMode,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  // Check if tutorial is completed
  const isCompleted = React.useMemo(() => {
    return getCompletedTutorials().includes(tutorial.id);
  }, [tutorial.id]);

  // Check if updated in the last 7 days (Recent tag)
  const isRecent = React.useMemo(() => {
    if (!tutorial.updatedAt) return false;
    const diff = Date.now() - new Date(tutorial.updatedAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }, [tutorial.updatedAt]);

  // Check if outdated (>6 months without review)
  const isOutdatedReview = React.useMemo(() => {
    if (!tutorial.updatedAt) return false;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(tutorial.updatedAt) < sixMonthsAgo && !tutorial.obsoleto;
  }, [tutorial.updatedAt, tutorial.obsoleto]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('tutorialId', tutorial.id);
    navigator.clipboard.writeText(url.toString());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      draggable={isEditMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`group relative p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 transition-all duration-150 hover:border-neutral-400 dark:hover:border-neutral-600 hover:-translate-y-0.5 cursor-pointer shadow-xs flex flex-col justify-between ${
        tutorial.obsoleto ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/30' : ''
      }`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: category.cor || '#FF5A1F'
      }}
    >
      {/* Top Action Icons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Concluído
            </span>
          )}
          {isRecent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800 animate-pulse">
              <Sparkles className="w-3 h-3" />
              Atualizado
            </span>
          )}
          {isOutdatedReview && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400" title="Sem revisão há mais de 6 meses">
              <Calendar className="w-2.5 h-2.5" />
              Revisar
            </span>
          )}
          {tutorial.subcategoria && (
            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              {tutorial.subcategoria}
            </span>
          )}
          {tutorial.obsoleto && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <AlertTriangle className="w-3 h-3" />
              Desatualizado
            </span>
          )}
        </div>

        {/* Buttons (Star, Share, Admin Actions) */}
        <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
          {/* Drag Handle in Edit Mode */}
          {isEditMode && (
            <span
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing"
              title="Arraste para reordenar"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Favorite Star Button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite(tutorial.id);
            }}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isFavorite
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Share Link Button */}
          <button
            onClick={handleShare}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Copiar link direto para este tutorial"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Edit Mode Buttons */}
          {isEditMode && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                title="Duplicar tutorial"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer"
                title="Editar tutorial"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Excluir tutorial"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tutorial Title & Description */}
      <div className="mb-3">
        <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {tutorial.titulo}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
          {tutorial.desc}
        </p>
      </div>

      {/* Tags Chips */}
      {tutorial.tags && tutorial.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tutorial.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded-md text-[10.5px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60"
            >
              #{tag}
            </span>
          ))}
          {tutorial.tags.length > 3 && (
            <span className="text-[10px] text-neutral-400 self-center">
              +{tutorial.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer Meta: Duration, Views, Attachment, Updated Date */}
      <div className="pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-neutral-400" />
            {tutorial.duracao}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-neutral-400" />
            {tutorial.visualizacoes || 0}
          </span>
          {tutorial.anexo && (
            <span className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-medium" title="Possui anexo (link/arquivo)">
              <Paperclip className="w-3 h-3" />
              anexo
            </span>
          )}
        </div>

        {tutorial.updatedAt && (
          <span className="text-[10px] text-neutral-400 truncate max-w-[110px]" title={`Última alteração: ${new Date(tutorial.updatedAt).toLocaleDateString('pt-BR')}`}>
            {new Date(tutorial.updatedAt).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
};
