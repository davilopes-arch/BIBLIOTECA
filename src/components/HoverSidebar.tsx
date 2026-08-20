import React from 'react';
import { 
  FolderTree, 
  Sun, 
  Moon, 
  Settings2, 
  Tv, 
  Download, 
  Upload, 
  LogOut, 
  ChevronDown, 
  ShieldCheck,
  Sparkles,
  Keyboard,
  GraduationCap,
  BarChart3,
  FileDown,
  Edit3,
  User,
  Shield
} from 'lucide-react';
import { Category, UserSession } from '../types';
import { SOU_ENERGY_ICON, SOU_ENERGY_LOGO_FULL } from '../constants/assets';
import { isSuperAdmin, isAreaEditor, getRoleDisplayName } from '../utils/permissions';

interface HoverSidebarProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isAdmin: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  user: UserSession;
  onLogout: () => void;
  onOpenShortcuts: () => void;
  onOpenAssistant: () => void;
  onOpenOnboarding?: () => void;
  onOpenAnalytics?: () => void;
  onOpenExportManual?: () => void;
}

export const HoverSidebar: React.FC<HoverSidebarProps> = ({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  isDark,
  onToggleTheme,
  isAdmin,
  isEditMode,
  onToggleEditMode,
  isTvMode,
  onToggleTvMode,
  onExportBackup,
  onImportBackup,
  user,
  onLogout,
  onOpenShortcuts,
  onOpenAssistant,
  onOpenOnboarding,
  onOpenAnalytics,
  onOpenExportManual
}) => {
  const [isCategoriesExpanded, setIsCategoriesExpanded] = React.useState(true);

  const getInitials = (nome: string) => {
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <aside
      className="group/sidebar fixed top-0 left-0 h-screen w-12 hover:w-60 focus-within:w-60 bg-neutral-900 text-neutral-300 flex flex-col py-4 z-40 shadow-2xl transition-all duration-200 ease-in-out overflow-hidden select-none border-r border-neutral-800"
      aria-label="Menu lateral de navegação"
    >
      {/* Top Logo */}
      <div className="relative w-full h-10 px-3 flex items-center shrink-0 mb-3 overflow-hidden">
        <img
          src={SOU_ENERGY_ICON}
          alt="Sou Energy"
          className="w-6 h-6 object-contain group-hover/sidebar:opacity-0 transition-opacity duration-150"
        />
        <img
          src={SOU_ENERGY_LOGO_FULL}
          alt="Sou Energy Logo"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-auto object-contain opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150"
        />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 px-1.5 scrollbar-thin scrollbar-thumb-neutral-700">
        
        {/* Assistente IA */}
        <button
          onClick={onOpenAssistant}
          className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-orange-400 hover:bg-orange-950/40 hover:text-orange-300 transition-colors cursor-pointer"
          title="Assistente de Processos IA"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-orange-500 animate-pulse" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity font-medium">
            Assistente IA
          </span>
        </button>

        {/* Trilhas de Integração (Onboarding) */}
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            title="Trilhas de Aprendizagem e Integração"
          >
            <GraduationCap className="w-4 h-4 shrink-0 text-orange-400" />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
              Trilhas Integração
            </span>
          </button>
        )}

        {/* Manual em PDF */}
        {onOpenExportManual && (
          <button
            onClick={onOpenExportManual}
            className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            title="Gerar Manual de Departamento em PDF"
          >
            <FileDown className="w-4 h-4 shrink-0 text-neutral-400" />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
              Gerar Manual PDF
            </span>
          </button>
        )}

        {/* Métricas e Feedback */}
        {onOpenAnalytics && (
          <button
            onClick={onOpenAnalytics}
            className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            title="Painel de Métricas e Feedback Operacional"
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-neutral-400" />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
              Métricas & Feedback
            </span>
          </button>
        )}

        {/* Categories Collapsible */}
        <button
          onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          className={`w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer ${
            selectedCategoryIds.length > 0 ? 'text-orange-400' : 'text-neutral-300'
          }`}
          title="Filtrar por Categoria"
        >
          <FolderTree className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1 text-left font-medium">
            Categorias
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover/sidebar:opacity-100 transition-transform duration-200 ${
              isCategoriesExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Categories List */}
        {isCategoriesExpanded && (
          <div className="space-y-0.5 pl-1">
            {categories.map(cat => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              const count = cat.tutoriais.length;

              return (
                <button
                  key={cat.id}
                  onClick={() => onToggleCategory(cat.id)}
                  className={`w-full h-8.5 rounded-lg flex items-center px-2 gap-2.5 text-[12.5px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  }`}
                  title={`${cat.nome} (${count} tutoriais)`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-xs border border-white/20"
                    style={{ backgroundColor: cat.cor }}
                  >
                    {getInitials(cat.nome)}
                  </span>
                  <span className="truncate whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1 text-left">
                    {cat.nome}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 opacity-0 group-hover/sidebar:opacity-100 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="my-2 border-t border-neutral-800" />

        {/* Section: Ferramentas */}
        <div className="px-2.5 py-1 text-[10.5px] uppercase tracking-wider text-neutral-500 font-semibold opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
          Ferramentas
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 shrink-0 text-amber-400" /> : <Moon className="w-4 h-4 shrink-0 text-neutral-400" />}
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
            {isDark ? 'Tema Claro' : 'Tema Escuro'}
          </span>
        </button>

        {/* TV Mode */}
        <button
          onClick={onToggleTvMode}
          className={`w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] transition-colors cursor-pointer ${
            isTvMode ? 'bg-orange-500/20 text-orange-400' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
          }`}
          title="Modo TV / Painel Limpo"
        >
          <Tv className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
            Modo TV
          </span>
        </button>

        {/* Edit Mode (Admin and Area Editor) */}
        {(isSuperAdmin(user) || isAreaEditor(user)) && (
          <button
            onClick={onToggleEditMode}
            className={`w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] transition-colors cursor-pointer ${
              isEditMode ? 'bg-orange-600 text-white font-medium shadow-xs' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
            title={
              isSuperAdmin(user)
                ? 'Ativar/Desativar Modo de Edição Global'
                : `Ativar/Desativar Edição na sua área (${user.department})`
            }
          >
            <Settings2 className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isEditMode ? 'rotate-90 text-white' : ''}`} />
            <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
              {isEditMode ? 'Edição Ativada' : 'Modo Edição'}
            </span>
          </button>
        )}

        {/* Export / Restore Backup (Super Admin Only) */}
        {isSuperAdmin(user) && isEditMode && (
          <>
            <button
              onClick={onExportBackup}
              className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              title="Baixar backup em JSON (Super Admin)"
            >
              <Download className="w-4 h-4 shrink-0 text-neutral-400" />
              <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
                Exportar Backup
              </span>
            </button>

            <button
              onClick={onImportBackup}
              className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              title="Restaurar backup de JSON (Super Admin)"
            >
              <Upload className="w-4 h-4 shrink-0 text-neutral-400" />
              <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
                Restaurar Backup
              </span>
            </button>
          </>
        )}

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="w-full h-9 rounded-lg flex items-center px-2.5 gap-3 text-[13px] text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
          title="Atalhos de teclado (?)"
        >
          <Keyboard className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
            Atalhos (?)
          </span>
        </button>
      </div>

      {/* Footer: User Profile & Logout */}
      <div className="shrink-0 pt-2 border-t border-neutral-800 px-1.5 space-y-1">
        <div className="flex items-center px-2 py-1.5 gap-2.5 rounded-lg bg-neutral-950/40">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-1 ring-neutral-700">
            {user.avatar || user.name[0] || 'U'}
          </div>
          <div className="overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate flex items-center gap-1">
              {user.name}
              {isSuperAdmin(user) && (
                <span title="Super Admin" className="inline-flex items-center text-orange-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
              {isAreaEditor(user) && (
                <span title={`Editor: ${user.department}`} className="inline-flex items-center text-amber-400">
                  <Edit3 className="w-3 h-3" />
                </span>
              )}
            </p>
            <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                isSuperAdmin(user) ? 'bg-orange-500' : isAreaEditor(user) ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              {getRoleDisplayName(user)}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full h-8.5 rounded-lg flex items-center px-2.5 gap-3 text-[12.5px] text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
          title="Sair da conta"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
            Encerrar Sessão
          </span>
        </button>
      </div>
    </aside>
  );
};
