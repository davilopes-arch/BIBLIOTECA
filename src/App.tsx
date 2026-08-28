import React from 'react';
import { Category, Tutorial, UserSession, SearchFilters } from './types';
import { 
  fetchCategoriesFromRemote, 
  saveCategoriesToRemote, 
  getFavorites, 
  saveFavorites, 
  LOCAL_THEME_KEY, 
  LOCAL_USER_KEY,
  generateId,
  resetTutorialViews,
  clearAccessHistory,
  saveLocalCategories,
  syncCategoriesToFirestore
} from './utils/storage';
import { logTutorialAccess, clearAllAccessLogs } from './utils/analyticsTracker';
import { HoverSidebar } from './components/HoverSidebar';
import { Navbar } from './components/Navbar';
import { Shelf } from './components/Shelf';
import { KanbanBoard } from './components/KanbanBoard';
import { QuickSection } from './components/QuickSection';
import { DetailModal } from './components/DetailModal';
import { TutorialFormModal } from './components/TutorialFormModal';
import { CategoryFormModal } from './components/CategoryFormModal';
import { TVModeView } from './components/TVModeView';
import { ConfirmModal } from './components/ConfirmModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { LoginCard } from './components/LoginCard';
import { AnalyticsModal } from './components/AnalyticsModal';
import { ExportManualModal } from './components/ExportManualModal';
import { Inbox, FolderTree } from 'lucide-react';
import { 
  isSuperAdmin, 
  isAreaEditor, 
  isColaborador, 
  canUserManageCategories, 
  canUserEditCategory, 
  canUserCreateTutorial 
} from './utils/permissions';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

export default function App() {
  // Authentication State
  const [user, setUser] = React.useState<UserSession | null>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  });

  // Main Data & Version
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [dataVersion, setDataVersion] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  // User Preferences
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const val = localStorage.getItem(LOCAL_THEME_KEY);
      return val === 'dark';
    } catch (e) {
      return false;
    }
  });

  // UI Modes
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isTvMode, setIsTvMode] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'kanban' | 'list'>('kanban');
  const [openShelfIds, setOpenShelfIds] = React.useState<Set<string>>(new Set());

  // Search & Filtering State
  const [filters, setFilters] = React.useState<SearchFilters>({
    query: '',
    selectedCategoryIds: [],
    onlyFavorites: false,
    onlyObsolete: false,
    sortBy: 'relevance'
  });

  // Modals & Overlays
  const [activeTutorial, setActiveTutorial] = React.useState<{ category: Category; tutorial: Tutorial } | null>(null);
  const [categoryModal, setCategoryModal] = React.useState<{ isOpen: boolean; categoryToEdit?: Category | null }>({ isOpen: false });
  const [tutorialModal, setTutorialModal] = React.useState<{ isOpen: boolean; categoryId?: string; tutorialToEdit?: Tutorial | null }>({ isOpen: false });
  const [confirmState, setConfirmState] = React.useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false);
  const [isExportManualOpen, setIsExportManualOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Hidden file input for JSON restore
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync Dark Mode to DOM
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(LOCAL_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(LOCAL_THEME_KEY, 'light');
    }
  }, [isDark]);

  // Load Initial Data
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let { categories: fetched, version } = await fetchCategoriesFromRemote();

      // Ensure all initial/legacy access view counts start from 0 for fresh tracking
      const RESET_FLAG_KEY = 'souenergy_fresh_zero_indicators_v4';
      if (!localStorage.getItem(RESET_FLAG_KEY)) {
        fetched = resetTutorialViews(fetched);
        clearAccessHistory();
        clearAllAccessLogs();
        localStorage.setItem(RESET_FLAG_KEY, 'true');
        saveLocalCategories(fetched);
        syncCategoriesToFirestore(fetched).catch(() => {});
      }

      setCategories(fetched);
      setOpenShelfIds(new Set(fetched.map(c => c.id)));
      setDataVersion(version);
      setFavorites(getFavorites());
      setIsLoading(false);

      // Check URL query parameters for direct tutorial link
      const urlParams = new URLSearchParams(window.location.search);
      const directTutId = urlParams.get('tutorialId');
      if (directTutId) {
        for (const cat of fetched) {
          const found = cat.tutoriais.find(t => t.id === directTutId);
          if (found) {
            setActiveTutorial({ category: cat, tutorial: found });
            break;
          }
        }
      }
    }
    loadData();
  }, []);

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input / textarea
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInput = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT';

      if (e.key === 'Escape') {
        setActiveTutorial(null);
        setCategoryModal({ isOpen: false });
        setTutorialModal({ isOpen: false });
        setConfirmState(null);
        setIsShortcutsOpen(false);
        setIsAnalyticsOpen(false);
        setIsExportManualOpen(false);
        if (isTvMode) setIsTvMode(false);
        return;
      }

      if (isInput) return;

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      } else if (e.key.toLowerCase() === 'e' && (isSuperAdmin(user) || isAreaEditor(user)) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsEditMode(prev => !prev);
        showToast(!isEditMode ? 'Modo de Edição ativado.' : 'Modo de Edição desativado.');
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, isTvMode, user]);

  // Login handler
  const handleLogin = (session: UserSession) => {
    setUser(session);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(session));
    showToast(`Bem-vindo, ${session.name}! (${session.role === 'admin' ? 'Super Admin' : session.role === 'editor' ? `Editor - ${session.department}` : 'Colaborador'})`);
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setIsEditMode(false);
    setIsTvMode(false);
    localStorage.removeItem(LOCAL_USER_KEY);
    signOut(auth).catch(() => {});
    showToast('Sessão encerrada com sucesso.');
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(item => item !== id) : [...prev, id];
      saveFavorites(updated);
      showToast(exists ? 'Removido dos favoritos' : 'Adicionado aos favoritos!');
      return updated;
    });
  };

  // Toggle shelf accordion
  const handleToggleShelf = (catId: string) => {
    setOpenShelfIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Save changes to categories and persist to remote
  const saveAndSync = async (updated: Category[]) => {
    setCategories(updated);
    const result = await saveCategoriesToRemote(updated, dataVersion, user?.email);
    if (result.conflict && result.updatedCategories) {
      setCategories(result.updatedCategories);
      if (result.newVersion) setDataVersion(result.newVersion);
      showToast('Os dados foram atualizados com a versão mais recente da nuvem.');
    } else if (result.newVersion) {
      setDataVersion(result.newVersion);
    }
  };

  // Category Actions
  const handleSaveCategory = async (catData: Partial<Category>) => {
    if (!isSuperAdmin(user)) {
      showToast('Apenas o Super Administrador pode gerenciar categorias.');
      return;
    }
    if (catData.id) {
      // Edit
      const updated = categories.map(c => c.id === catData.id ? { ...c, ...catData } : c);
      await saveAndSync(updated as Category[]);
      showToast('Categoria atualizada com sucesso!');
    } else {
      // Create
      const newCategory: Category = {
        id: generateId('cat'),
        nome: catData.nome || 'Nova Categoria',
        cor: catData.cor || '#FF5A1F',
        descricao: catData.descricao,
        tutoriais: []
      };
      const updated = [...categories, newCategory];
      await saveAndSync(updated);
      setOpenShelfIds(prev => new Set(prev).add(newCategory.id));
      showToast('Nova categoria criada!');
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    if (!isSuperAdmin(user)) {
      showToast('Apenas o Super Administrador pode excluir categorias.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: `Excluir Categoria "${cat.nome}"`,
      message: `Tem certeza que deseja excluir esta categoria e todos os ${cat.tutoriais.length} tutoriais contidos nela? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        const updated = categories.filter(c => c.id !== cat.id);
        await saveAndSync(updated);
        setConfirmState(null);
        showToast('Categoria excluída com sucesso.');
      }
    });
  };

  const handleReorderCategories = async (fromId: string, toId: string) => {
    if (!isSuperAdmin(user)) return;
    const fromIndex = categories.findIndex(c => c.id === fromId);
    const toIndex = categories.findIndex(c => c.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const copy = [...categories];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    await saveAndSync(copy);
  };

  const handleReorderTutorials = async (catId: string, fromId: string, toId: string) => {
    const targetCat = categories.find(c => c.id === catId);
    if (!targetCat || !canUserEditCategory(user, targetCat)) return;

    const tuts = [...targetCat.tutoriais];
    const fromIndex = tuts.findIndex(t => t.id === fromId);
    const toIndex = tuts.findIndex(t => t.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const [moved] = tuts.splice(fromIndex, 1);
    tuts.splice(toIndex, 0, moved);

    const updated = categories.map(c => {
      if (c.id === catId) return { ...c, tutoriais: tuts };
      return c;
    });
    await saveAndSync(updated);
  };

  const handleMoveTutorial = async (fromCatId: string, toCatId: string, tutId: string, targetTutId?: string) => {
    const sourceCat = categories.find(c => c.id === fromCatId);
    const targetCat = categories.find(c => c.id === toCatId);
    if (!sourceCat || !targetCat) return;

    if (!canUserEditCategory(user, sourceCat) || !canUserEditCategory(user, targetCat)) {
      showToast('Você não possui permissão para mover tutoriais entre estas categorias.');
      return;
    }

    const tutToMove = sourceCat.tutoriais.find(t => t.id === tutId);
    if (!tutToMove) return;

    if (fromCatId === toCatId) {
      if (targetTutId && targetTutId !== tutId) {
        handleReorderTutorials(fromCatId, tutId, targetTutId);
      }
      return;
    }

    const updatedCategories = categories.map(cat => {
      if (cat.id === fromCatId) {
        return {
          ...cat,
          tutoriais: cat.tutoriais.filter(t => t.id !== tutId)
        };
      }
      if (cat.id === toCatId) {
        const tuts = [...cat.tutoriais];
        if (targetTutId) {
          const targetIndex = tuts.findIndex(t => t.id === targetTutId);
          if (targetIndex !== -1) {
            tuts.splice(targetIndex, 0, tutToMove);
          } else {
            tuts.push(tutToMove);
          }
        } else {
          tuts.push(tutToMove);
        }
        return {
          ...cat,
          tutoriais: tuts
        };
      }
      return cat;
    });

    await saveAndSync(updatedCategories);
    showToast(`Procedimento movido para "${targetCat.nome}"`);
  };

  // Tutorial Actions
  const handleSaveTutorial = async (categoryId: string, tutData: Partial<Tutorial>) => {
    if (!canUserEditCategory(user, categoryId)) {
      showToast('Você não possui permissão para cadastrar ou editar tutoriais nesta área.');
      return;
    }
    const isEdit = Boolean(tutData.id);
    let updatedCatId = categoryId;

    // Build or update tutorial object
    const newOrUpdatedTutorial: Tutorial = {
      id: tutData.id || generateId('tut'),
      titulo: tutData.titulo || 'Novo Procedimento',
      duracao: tutData.duracao || '5 min',
      desc: tutData.desc || '',
      passos: tutData.passos && tutData.passos.length > 0 ? tutData.passos : ['Descreva aqui o primeiro passo do procedimento.'],
      anexo: tutData.anexo,
      obsoleto: tutData.obsoleto || false,
      tags: tutData.tags || [],
      subcategoria: tutData.subcategoria,
      author: tutData.author || user?.name || 'Equipe Sou Energy',
      version: tutData.version || 1,
      history: tutData.history || [
        {
          timestamp: new Date().toISOString(),
          updatedBy: user?.name || 'Sistema',
          notes: isEdit ? 'Procedimento editado' : 'Criação inicial do procedimento'
        }
      ],
      visualizacoes: tutData.visualizacoes || 0,
      updatedAt: new Date().toISOString()
    };

    const updatedCategories = categories.map(cat => {
      // Remove from previous category if moving
      const hasTut = cat.tutoriais.some(t => t.id === newOrUpdatedTutorial.id);
      if (cat.id === categoryId) {
        if (hasTut) {
          return {
            ...cat,
            tutoriais: cat.tutoriais.map(t => t.id === newOrUpdatedTutorial.id ? newOrUpdatedTutorial : t)
          };
        } else {
          return {
            ...cat,
            tutoriais: [newOrUpdatedTutorial, ...cat.tutoriais]
          };
        }
      } else if (hasTut) {
        return {
          ...cat,
          tutoriais: cat.tutoriais.filter(t => t.id !== newOrUpdatedTutorial.id)
        };
      }
      return cat;
    });

    await saveAndSync(updatedCategories);
    showToast(isEdit ? 'Tutorial atualizado com sucesso!' : 'Novo tutorial cadastrado com sucesso!');
  };

  const handleDuplicateTutorial = async (cat: Category, tut: Tutorial) => {
    if (!canUserEditCategory(user, cat)) {
      showToast('Você não possui permissão para duplicar tutoriais nesta área.');
      return;
    }
    const duplicated: Tutorial = {
      ...tut,
      id: generateId('tut'),
      titulo: `${tut.titulo} (Cópia)`,
      version: 1,
      visualizacoes: 0,
      author: user?.name || 'Equipe Sou Energy',
      updatedAt: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          updatedBy: user?.name || 'Sistema',
          notes: `Duplicado a partir de "${tut.titulo}"`
        }
      ]
    };

    const updated = categories.map(c => {
      if (c.id === cat.id) {
        return { ...c, tutoriais: [duplicated, ...c.tutoriais] };
      }
      return c;
    });

    await saveAndSync(updated);
    showToast(`Tutorial duplicado: "${duplicated.titulo}"`);
  };

  const handleDeleteTutorial = (cat: Category, tut: Tutorial) => {
    if (!canUserEditCategory(user, cat)) {
      showToast('Você não possui permissão para excluir tutoriais nesta área.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: `Excluir Procedimento "${tut.titulo}"`,
      message: `Tem certeza que deseja excluir este procedimento da categoria ${cat.nome}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        const updated = categories.map(c => {
          if (c.id === cat.id) {
            return { ...c, tutoriais: c.tutoriais.filter(t => t.id !== tut.id) };
          }
          return c;
        });
        await saveAndSync(updated);
        setConfirmState(null);
        showToast('Procedimento excluído com sucesso.');
      }
    });
  };

  // Open Tutorial detail and increment view count (excluding super admin / davi.lopes@souenergy.com.br from views counting)
  const handleOpenTutorialDetail = async (category: Category, tutorial: Tutorial) => {
    setActiveTutorial({ category, tutorial });

    // Do NOT log access or increment view counts if the user is super admin or davi.lopes@souenergy.com.br
    const isExcludedAdmin = isSuperAdmin(user) || 
      (user?.email && user.email.toLowerCase().trim() === 'davi.lopes@souenergy.com.br') ||
      user?.role === 'admin' ||
      user?.isAdmin === true;

    if (isExcludedAdmin) {
      return;
    }

    // Log the access event for non-admin collaborators
    logTutorialAccess({
      tutorialId: tutorial.id,
      tutorialTitle: tutorial.titulo,
      categoryId: category.id,
      categoryName: category.nome,
      userEmail: user?.email,
      department: user?.department || category.departamento || category.nome,
      action: 'view'
    });

    // Increment views counter in background for regular collaborators and viewers
    const updatedCategories = categories.map(c => {
      if (c.id === category.id) {
        return {
          ...c,
          tutoriais: c.tutoriais.map(t => {
            if (t.id === tutorial.id) {
              return { ...t, visualizacoes: (t.visualizacoes || 0) + 1 };
            }
            return t;
          })
        };
      }
      return c;
    });
    setCategories(updatedCategories);
    saveCategoriesToRemote(updatedCategories, dataVersion, user?.email).then(res => {
      if (res.newVersion) setDataVersion(res.newVersion);
    });
  };

  // Reset / Clear access history
  const handleResetAccessHistory = async () => {
    const cleared = resetTutorialViews(categories);
    setCategories(cleared);
    clearAccessHistory();
    clearAllAccessLogs();
    await saveCategoriesToRemote(cleared, dataVersion, user?.email).then(res => {
      if (res.newVersion) setDataVersion(res.newVersion);
    });
    showToast('Histórico de acessos e visualizações zerado com sucesso.');
  };

  // Backup JSON Export & Import
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `souenergy_processos_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup baixado com sucesso!');
  };

  const handleImportBackup = () => {
    importFileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setConfirmState({
            isOpen: true,
            title: 'Restaurar Base de Procedimentos',
            message: `O arquivo contém ${parsed.length} categorias. Deseja substituir os procedimentos atuais por este backup?`,
            onConfirm: async () => {
              await saveAndSync(parsed);
              setConfirmState(null);
              showToast('Procedimentos restaurados com sucesso!');
            }
          });
        } else {
          showToast('Formato de arquivo inválido. Deve ser um array de categorias.');
        }
      } catch (err) {
        showToast('Erro ao ler o arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter Categories & Tutorials
  const filteredCategories = React.useMemo(() => {
    return categories
      .map(cat => {
        // Category selection filter
        if (filters.selectedCategoryIds.length > 0 && !filters.selectedCategoryIds.includes(cat.id)) {
          return null;
        }

        let tuts = [...cat.tutoriais];

        // Search query
        if (filters.query.trim()) {
          const q = filters.query.toLowerCase().trim();
          tuts = tuts.filter(t => {
            const matchTitle = t.titulo.toLowerCase().includes(q);
            const matchDesc = t.desc?.toLowerCase().includes(q);
            const matchAuthor = t.author?.toLowerCase().includes(q);
            const matchSub = t.subcategoria?.toLowerCase().includes(q);
            const matchTags = t.tags?.some(tag => tag.toLowerCase().includes(q));
            const matchSteps = t.passos.some(p => p.toLowerCase().includes(q));
            return matchTitle || matchDesc || matchAuthor || matchSub || matchTags || matchSteps;
          });
        }

        // Favorites filter
        if (filters.onlyFavorites) {
          tuts = tuts.filter(t => favorites.includes(t.id));
        }

        // Obsolete filter
        if (filters.onlyObsolete) {
          tuts = tuts.filter(t => t.obsoleto);
        }

        // Tag filter
        if (filters.selectedTag) {
          tuts = tuts.filter(t => t.tags?.some(tag => tag.toLowerCase() === filters.selectedTag?.toLowerCase()));
        }

        // Subcategory filter
        if (filters.selectedSubcategory) {
          tuts = tuts.filter(t => t.subcategoria === filters.selectedSubcategory);
        }

        // Sorting
        if (filters.sortBy === 'views') {
          tuts.sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
        } else if (filters.sortBy === 'recent') {
          tuts.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        } else if (filters.sortBy === 'title') {
          tuts.sort((a, b) => a.titulo.localeCompare(b.titulo));
        }

        return {
          ...cat,
          tutoriais: tuts
        };
      })
      .filter((cat): cat is Category => cat !== null);
  }, [categories, filters, favorites]);

  // Overall statistics
  const totalTutorialsCount = React.useMemo(() => {
    return categories.reduce((sum, c) => sum + c.tutoriais.length, 0);
  }, [categories]);

  const filteredCount = React.useMemo(() => {
    return filteredCategories.reduce((sum, c) => sum + c.tutoriais.length, 0);
  }, [filteredCategories]);

  // If not logged in, render corporate Login View
  if (!user) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
        <LoginCard onLogin={handleLogin} />
      </div>
    );
  }

  // If TV Mode is activated, render fullscreen dashboard
  if (isTvMode) {
    return (
      <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
        <TVModeView
          categories={categories}
          onExit={() => setIsTvMode(false)}
          onSelectTutorial={(cat, tut) => {
            setIsTvMode(false);
            handleOpenTutorialDetail(cat, tut);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-150 relative">
      {/* Hidden File Input for Backups */}
      <input
        ref={importFileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hover Expandable Sidebar */}
      <HoverSidebar
        categories={categories}
        selectedCategoryIds={filters.selectedCategoryIds}
        onToggleCategory={(catId) => {
          setFilters(prev => {
            const exists = prev.selectedCategoryIds.includes(catId);
            return {
              ...prev,
              selectedCategoryIds: exists
                ? prev.selectedCategoryIds.filter(id => id !== catId)
                : [...prev.selectedCategoryIds, catId]
            };
          });
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isAdmin={user.isAdmin}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        user={user}
        onLogout={handleLogout}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenExportManual={() => setIsExportManualOpen(true)}
      />

      {/* Centered Main Content Container with left padding for fixed sidebar */}
      <div className="pl-12 w-full min-h-screen flex justify-center">
        <main className="w-full max-w-7xl 2xl:max-w-[1700px] px-3 sm:px-6 py-4 sm:py-5 space-y-3.5">
          {/* Top Navbar with Search & Filters */}
          <Navbar
            categories={categories}
            filters={filters}
            onUpdateFilters={(newF) => setFilters(prev => ({ ...prev, ...newF }))}
            user={user}
            isAdmin={user.isAdmin}
            isEditMode={isEditMode}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
            onOpenNewCategoryModal={() => setCategoryModal({ isOpen: true })}
            onOpenNewTutorialModal={() => setTutorialModal({ isOpen: true })}
            onOpenAnalytics={() => setIsAnalyticsOpen(true)}
            onOpenExportManual={() => setIsExportManualOpen(true)}
            totalTutorialsCount={totalTutorialsCount}
            filteredCount={filteredCount}
          />

          {/* Quick Access Strip (Favoritos & Mais Acessados) */}
          {!filters.query && filters.selectedCategoryIds.length === 0 && !filters.onlyFavorites && !filters.onlyObsolete && (
            <QuickSection
              categories={categories}
              favorites={favorites}
              onSelectTutorial={handleOpenTutorialDetail}
            />
          )}

          {/* Categories Kanban / Shelves Section */}
          <div className="space-y-3 pt-0.5">
            {isLoading ? (
              <div className="py-16 text-center space-y-2.5">
                <div className="w-7 h-7 border-2.5 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-neutral-500 font-medium">Carregando procedimentos da Sou Energy...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 shadow-2xs">
                <Inbox className="w-8 h-8 text-neutral-400 mx-auto stroke-1" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Nenhum procedimento encontrado
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Tente buscar por outros termos ou desmarque os filtros ativos.
                </p>
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                categories={filteredCategories.filter(cat => cat.tutoriais.length > 0 || isEditMode)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectTutorial={handleOpenTutorialDetail}
                isEditMode={isEditMode}
                user={user}
                canUserEditCategory={canUserEditCategory}
                canUserManageCategories={canUserManageCategories}
                onEditCategory={cat => setCategoryModal({ isOpen: true, categoryToEdit: cat })}
                onDeleteCategory={handleDeleteCategory}
                onAddTutorial={catId => setTutorialModal({ isOpen: true, categoryId: catId })}
                onEditTutorial={(catId, tut) => setTutorialModal({ isOpen: true, categoryId: catId, tutorialToEdit: tut })}
                onDuplicateTutorial={handleDuplicateTutorial}
                onDeleteTutorial={handleDeleteTutorial}
                onReorderCategories={handleReorderCategories}
                onReorderTutorials={handleReorderTutorials}
                onMoveTutorial={handleMoveTutorial}
                viewMode={viewMode}
                onToggleViewMode={() => setViewMode(prev => prev === 'kanban' ? 'list' : 'kanban')}
                onOpenNewCategoryModal={() => setCategoryModal({ isOpen: true })}
              />
            ) : (
              <div className="space-y-3">
                {/* Switch back to Kanban bar */}
                <div className="flex items-center justify-between px-1 py-0.5 text-xs text-neutral-500">
                  <span>Modo Estantes / Lista Ativo</span>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className="font-semibold text-orange-600 hover:underline cursor-pointer"
                  >
                    Alternar para Quadro Kanban
                  </button>
                </div>
                {filteredCategories.map(cat => {
                  if (cat.tutoriais.length === 0 && !isEditMode) return null;

                  const isOpen = filters.query || filters.selectedCategoryIds.length > 0 ? true : openShelfIds.has(cat.id);
                  const canEditCat = canUserEditCategory(user, cat);
                  const canManageCatStruct = canUserManageCategories(user);

                  return (
                    <Shelf
                      key={cat.id}
                      category={cat}
                      filteredTutorials={cat.tutoriais}
                      isOpen={isOpen}
                      onToggleOpen={() => handleToggleShelf(cat.id)}
                      favorites={favorites}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectTutorial={tut => handleOpenTutorialDetail(cat, tut)}
                      isEditMode={isEditMode}
                      canEditCategory={canEditCat}
                      canManageCategoryStructure={canManageCatStruct}
                      onEditCategory={() => setCategoryModal({ isOpen: true, categoryToEdit: cat })}
                      onDeleteCategory={() => handleDeleteCategory(cat)}
                      onAddTutorial={() => setTutorialModal({ isOpen: true, categoryId: cat.id })}
                      onEditTutorial={tut => setTutorialModal({ isOpen: true, categoryId: cat.id, tutorialToEdit: tut })}
                      onDuplicateTutorial={tut => handleDuplicateTutorial(cat, tut)}
                      onDeleteTutorial={tut => handleDeleteTutorial(cat, tut)}
                      onReorderCategories={handleReorderCategories}
                      onReorderTutorials={handleReorderTutorials}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Reader Modal */}
      {activeTutorial && (
        <DetailModal
          category={activeTutorial.category}
          tutorial={activeTutorial.tutorial}
          isOpen={Boolean(activeTutorial)}
          onClose={() => setActiveTutorial(null)}
          onNavigatePrev={() => {
            const cat = activeTutorial.category;
            const idx = cat.tutoriais.findIndex(t => t.id === activeTutorial.tutorial.id);
            if (idx > 0) {
              setActiveTutorial({ category: cat, tutorial: cat.tutoriais[idx - 1] });
            }
          }}
          onNavigateNext={() => {
            const cat = activeTutorial.category;
            const idx = cat.tutoriais.findIndex(t => t.id === activeTutorial.tutorial.id);
            if (idx < cat.tutoriais.length - 1) {
              setActiveTutorial({ category: cat, tutorial: cat.tutoriais[idx + 1] });
            }
          }}
        />
      )}

      {/* Category Editor / Creator Modal */}
      <CategoryFormModal
        isOpen={categoryModal.isOpen}
        categoryToEdit={categoryModal.categoryToEdit}
        onClose={() => setCategoryModal({ isOpen: false })}
        onSave={handleSaveCategory}
      />

      {/* Tutorial Editor / Creator Modal */}
      <TutorialFormModal
        categories={categories}
        initialCategory={tutorialModal.categoryId}
        tutorialToEdit={tutorialModal.tutorialToEdit}
        isOpen={tutorialModal.isOpen}
        onClose={() => setTutorialModal({ isOpen: false })}
        onSave={handleSaveTutorial}
        user={user}
      />

      {/* Operational Analytics & Feedback Modal (Apenas Super Administrador) */}
      {isSuperAdmin(user) && (
        <AnalyticsModal
          categories={categories}
          user={user}
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          onSelectTutorial={(cat, tut) => {
            setIsAnalyticsOpen(false);
            handleOpenTutorialDetail(cat, tut);
          }}
          onResetAccessHistory={handleResetAccessHistory}
        />
      )}

      {/* Export Department Manual PDF Modal */}
      <ExportManualModal
        categories={categories}
        isOpen={isExportManualOpen}
        onClose={() => setIsExportManualOpen(false)}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Confirmation Dialog */}
      {confirmState && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3 duration-150 border border-neutral-800 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
