import React from 'react';
import { X, Check } from 'lucide-react';
import { Category } from '../types';
import { SWATCH_COLORS } from '../constants/assets';

interface CategoryFormModalProps {
  categoryToEdit?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Partial<Category>) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  categoryToEdit,
  isOpen,
  onClose,
  onSave
}) => {
  const [nome, setNome] = React.useState('');
  const [cor, setCor] = React.useState(SWATCH_COLORS[0]);
  const [descricao, setDescricao] = React.useState('');

  React.useEffect(() => {
    if (categoryToEdit) {
      setNome(categoryToEdit.nome || '');
      setCor(categoryToEdit.cor || SWATCH_COLORS[0]);
      setDescricao(categoryToEdit.descricao || '');
    } else {
      setNome('');
      setCor(SWATCH_COLORS[0]);
      setDescricao('');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSave({
      id: categoryToEdit?.id,
      nome: nome.trim(),
      cor,
      descricao: descricao.trim() || undefined
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
            </p>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {categoryToEdit ? categoryToEdit.nome : 'Criar Estante'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Jurídico, Vendas, TI..."
              required
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Descrição Curta (Opcional)
            </label>
            <input
              type="text"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Processos de contratos, procurações e compliance"
              className="w-full px-3.5 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Cor de Identificação
            </label>
            
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={cor}
                onChange={e => setCor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer p-1"
              />
              <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">
                {cor}
              </span>
            </div>

            {/* Swatches grid */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SWATCH_COLORS.map(c => {
                const isSelected = cor.toUpperCase() === c.toUpperCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className="w-6 h-6 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {categoryToEdit ? 'Salvar Categoria' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
