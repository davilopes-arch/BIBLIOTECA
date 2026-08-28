import React from 'react';
import { 
  Sun, 
  Moon, 
  Settings2, 
  Download, 
  Upload, 
  LogOut, 
  Keyboard,
  BarChart3,
  FileDown
} from 'lucide-react';
import { Category, UserSession } from '../types';
import { SOU_ENERGY_ICON } from '../constants/assets';
import { isSuperAdmin, isAreaEditor, getRoleDisplayName } from '../utils/permissions';

interface HoverSidebarProps {
  categories?: Category[];
  selectedCategoryIds?: string[];
  onToggleCategory?: (categoryId: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isAdmin: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isTvMode?: boolean;
  onToggleTvMode?: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  user: UserSession;
  onLogout: () => void;
  onOpenShortcuts: () => void;
  onOpenAnalytics?: () => void;
  onOpenExportManual?: () => void;
}

interface TooltipData {
  title: string;
  subtitle?: string;
  badge?: string;
  top: number;
}

export const HoverSidebar: React.FC<HoverSidebarProps> = ({
  isDark,
  onToggleTheme,
  isEditMode,
  onToggleEditMode,
  onExportBackup,
  onImportBackup,
  user,
  onLogout,
  onOpenShortcuts,
  onOpenAnalytics,
  onOpenExportManual
}) => {
  const [tooltip, setTooltip] = React.useState<TooltipData | null>(null);

  const showTooltip = (e: React.MouseEvent<HTMLElement>, title: string, subtitle?: string, badge?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      title,
      subtitle,
      badge,
      top: rect.top + rect.height / 2
    });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  return (
    <>
      <aside
        className="fixed top-0 left-0 h-screen w-12 bg-neutral-900 text-neutral-300 flex flex-col py-3 z-40 shadow-2xl select-none border-r border-neutral-800 shrink-0"
        aria-label="Menu lateral de navegação"
      >
        {/* Top Logo */}
        <div 
          className="w-full h-10 flex items-center justify-center shrink-0 mb-2 cursor-pointer"
          onMouseEnter={(e) => showTooltip(e, 'SOU ENERGY', 'Biblioteca de Procedimentos')}
          onMouseLeave={hideTooltip}
        >
          <img
            src={SOU_ENERGY_ICON}
            alt="Sou Energy"
            className="w-7 h-7 rounded-lg object-cover hover:scale-105 transition-transform"
          />
        </div>

        {/* Main Navigation - Icons Only */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 px-1.5 flex flex-col items-center scrollbar-none">
          
          {/* Manual em PDF */}
          {onOpenExportManual && (
            <button
              onClick={onOpenExportManual}
              onMouseEnter={(e) => showTooltip(e, 'Gerar Manual PDF', 'Exportar procedimentos do departamento em PDF')}
              onMouseLeave={hideTooltip}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
              aria-label="Gerar Manual PDF"
            >
              <FileDown className="w-4 h-4" />
            </button>
          )}

          {/* Indicadores (Apenas Super Administrador) */}
          {onOpenAnalytics && isSuperAdmin(user) && (
            <button
              onClick={onOpenAnalytics}
              onMouseEnter={(e) => showTooltip(e, 'Painel de Indicadores', 'Métricas de acesso e engajamento em tempo real', 'Super Admin')}
              onMouseLeave={hideTooltip}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-orange-400 hover:bg-neutral-800 transition-all cursor-pointer"
              aria-label="Painel de Indicadores"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            onMouseEnter={(e) => showTooltip(e, isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro')}
            onMouseLeave={hideTooltip}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            aria-label={isDark ? 'Tema Claro' : 'Tema Escuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-400" />}
          </button>

          {/* Edit Mode (Admin and Area Editor) */}
          {(isSuperAdmin(user) || isAreaEditor(user)) && (
            <button
              onClick={onToggleEditMode}
              onMouseEnter={(e) => showTooltip(
                e, 
                isEditMode ? 'Desativar Modo Edição' : 'Ativar Modo Edição',
                isSuperAdmin(user) ? 'Edição global de procedimentos' : `Edição na área ${user.department}`,
                isEditMode ? 'Ativado' : undefined
              )}
              onMouseLeave={hideTooltip}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isEditMode 
                  ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-400/50' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              aria-label="Modo de Edição"
            >
              <Settings2 className={`w-4 h-4 transition-transform duration-300 ${isEditMode ? 'rotate-90 text-white' : ''}`} />
            </button>
          )}

          {/* Export / Restore Backup (Super Admin Only) */}
          {isSuperAdmin(user) && isEditMode && (
            <>
              <button
                onClick={onExportBackup}
                onMouseEnter={(e) => showTooltip(e, 'Exportar Backup JSON', 'Baixar arquivo de segurança de todos os procedimentos')}
                onMouseLeave={hideTooltip}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                aria-label="Exportar Backup"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={onImportBackup}
                onMouseEnter={(e) => showTooltip(e, 'Restaurar Backup JSON', 'Importar arquivo com procedimentos')}
                onMouseLeave={hideTooltip}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                aria-label="Restaurar Backup"
              >
                <Upload className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            onMouseEnter={(e) => showTooltip(e, 'Atalhos de Teclado', 'Pressione ? para visualizar atalhos rápidos')}
            onMouseLeave={hideTooltip}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            aria-label="Atalhos de Teclado"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* Footer: User Profile & Logout */}
        <div className="shrink-0 pt-2 border-t border-neutral-800 px-1.5 flex flex-col items-center space-y-1.5">
          
          {/* User Avatar */}
          <div 
            className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-1 ring-neutral-700 cursor-pointer"
            onMouseEnter={(e) => showTooltip(
              e, 
              user.name, 
              `${getRoleDisplayName(user)}${user.department ? ` • ${user.department}` : ''}`,
              user.email
            )}
            onMouseLeave={hideTooltip}
          >
            {user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://') || user.avatar.startsWith('data:image/')) ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span>{(user.name ? user.name[0] : 'U').toUpperCase()}</span>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            onMouseEnter={(e) => showTooltip(e, 'Encerrar Sessão', 'Sair da conta')}
            onMouseLeave={hideTooltip}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
            aria-label="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Floating Tooltip Description Popup */}
      {tooltip && (
        <div
          className="fixed left-14 -translate-y-1/2 z-50 pointer-events-none px-3 py-2 rounded-xl bg-neutral-900/95 text-white text-xs shadow-2xl border border-neutral-700/90 flex flex-col gap-0.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap min-w-[120px] max-w-[280px]"
          style={{ top: tooltip.top }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white text-[12.5px] truncate">
              {tooltip.title}
            </span>
            {tooltip.badge && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {tooltip.badge}
              </span>
            )}
          </div>
          {tooltip.subtitle && (
            <span className="text-[11px] text-neutral-400 font-normal leading-tight">
              {tooltip.subtitle}
            </span>
          )}
        </div>
      )}
    </>
  );
};
