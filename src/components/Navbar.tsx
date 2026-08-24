import React from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Sparkles, 
  Star, 
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  GraduationCap,
  BarChart3,
  FileDown,
  Sun,
  Moon
} from 'lucide-react';
import { Category, SearchFilters, UserSession } from '../types';
import { isSuperAdmin, canUserCreateTutorial } from '../utils/permissions';

interface NavbarProps {
  categories: Category[];
  filters: SearchFilters;
  onUpdateFilters: (newFilters: Partial<SearchFilters>) => void;
  user: UserSession;
  isAdmin: boolean;
  isEditMode: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenNewCategoryModal: () => void;
  onOpenNewTutorialModal: () => void;
  onOpenAssistant: () => void;
  onOpenOnboarding: () => void;
  onOpenAnalytics: () => void;
  onOpenExportManual: () => void;
  totalTutorialsCount: number;
  filteredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  filters,
  onUpdateFilters,
  user,
  isAdmin,
  isEditMode,
  isDark,
  onToggleTheme,
  onOpenNewCategoryModal,
  onOpenNewTutorialModal,
  onOpenAssistant,
  onOpenOnboarding,
  onOpenAnalytics,
  onOpenExportManual,
  totalTutorialsCount,
  filteredCount
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [showFilterDrawer, setShowFilterDrawer] = React.useState(false);

  const hasActiveFilters = 
    filters.query.trim().length > 0 || 
    filters.selectedCategoryIds.length > 0 ||
    filters.onlyFavorites ||
    filters.onlyObsolete ||
    Boolean(filters.selectedSubcategory) ||
    Boolean(filters.selectedTag) ||
    filters.sortBy !== 'relevance';

  // Extract all unique tags across categories
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    categories.forEach(cat => {
      cat.tutoriais.forEach(t => {
        (t.tags || []).forEach(tag => tagsSet.add(tag.toLowerCase()));
      });
    });
    return Array.from(tagsSet).slice(0, 15);
  }, [categories]);

  const handleClearFilters = () => {
    onUpdateFilters({
      query: '',
      selectedCategoryIds: [],
      selectedSubcategory: undefined,
      onlyFavorites: false,
      onlyObsolete: false,
      selectedTag: undefined,
      sortBy: 'relevance'
    });
  };

  return (
    <header className="space-y-4">
      {/* Top Banner / Corporate Greeting */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
            Base de Conhecimento{' '}
            <span className="inline-flex items-center text-orange-600 dark:text-orange-500 font-bold whitespace-nowrap">
              &amp; Processos
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
            Manuais operacionais, fluxos padronizados e tutoriais passo a passo da Sou Energy.
          </p>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Guided Onboarding Tracks Button */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 transition-colors cursor-pointer shadow-xs"
            title="Trilhas de Aprendizagem e Integração para Colaboradores"
          >
            <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Trilhas de Integração</span>
            <span className="sm:hidden">Trilhas</span>
          </button>

          {/* Export Department PDF Manual Button */}
          <button
            onClick={onOpenExportManual}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs"
            title="Gerar Manual Consolidado do Departamento em PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Gerar Manual PDF</span>
            <span className="sm:hidden">Manual</span>
          </button>

          {/* Operational Analytics & Feedback Modal Button */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs"
            title="Métricas Operacionais, Feedbacks e Tutoriais Críticos"
          >
            <BarChart3 className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Métricas & Feedback</span>
            <span className="sm:hidden">Métricas</span>
          </button>

          {/* AI Assistant Quick Trigger with Pulsing Sparkle */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors cursor-pointer shadow-xs group"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-orange-600 dark:text-orange-400" />
            <span>Tirar Dúvida com IA</span>
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-xs"
            title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Escuro</span>
              </>
            )}
          </button>

          {/* Create Category (Super Admin) & Tutorial (Admin or Area Editor) */}
          {isEditMode && (
            <>
              {isSuperAdmin(user) && (
                <button
                  onClick={onOpenNewCategoryModal}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-orange-600 dark:hover:bg-orange-500 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                  title="Criar nova categoria (Super Admin)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Categoria</span>
                </button>
              )}
              {canUserCreateTutorial(user) && (
                <button
                  onClick={onOpenNewTutorialModal}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors cursor-pointer shadow-xs"
                  title={
                    isSuperAdmin(user)
                      ? 'Adicionar novo procedimento'
                      : `Adicionar procedimento na área de ${user.department}`
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Tutorial</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Search and Quick Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={filters.query}
            onChange={e => onUpdateFilters({ query: e.target.value })}
            placeholder="Buscar por título, tag, autor ou conteúdo dos passos (ex: férias, VPN, NF-e)..."
            className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors shadow-xs"
          />
          {filters.query ? (
            <button
              onClick={() => onUpdateFilters({ query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Favorites Filter */}
          <button
            onClick={() => onUpdateFilters({ onlyFavorites: !filters.onlyFavorites })}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
              filters.onlyFavorites
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.onlyFavorites ? 'fill-current' : 'text-amber-500'}`} />
            <span>Favoritos</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={e => onUpdateFilters({ sortBy: e.target.value as any })}
              className="appearance-none flex items-center gap-1.5 pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer shadow-xs focus:outline-none focus:border-orange-500"
            >
              <option value="relevance">Mais Relevantes</option>
              <option value="views">Mais Acessados</option>
              <option value="recent">Atualizados Recentemente</option>
              <option value="title">Ordem Alfabética (A-Z)</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none" />
          </div>

          {/* Filter Drawer Toggle */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap shadow-xs ${
              showFilterDrawer || filters.selectedTag || filters.onlyObsolete
                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-2 text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Drawer (Tags, Obsoletes, Subcategories) */}
      {showFilterDrawer && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
          {/* Tag Cloud */}
          {allTags.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                Filtrar por Tags Operacionais:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => {
                  const isSelected = filters.selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => onUpdateFilters({ selectedTag: isSelected ? undefined : tag })}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white font-medium'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-400'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra Checkboxes */}
          <div className="flex items-center gap-4 pt-1 text-xs text-neutral-600 dark:text-neutral-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyObsolete}
                onChange={e => onUpdateFilters({ onlyObsolete: e.target.checked })}
                className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Mostrar apenas tutoriais desatualizados
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Search results stats */}
      {hasActiveFilters && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
          <span>
            Exibindo <strong>{filteredCount}</strong> de <strong>{totalTutorialsCount}</strong> tutoriais
          </span>
        </div>
      )}
    </header>
  );
};
