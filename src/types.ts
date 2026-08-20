export interface TutorialFeedback {
  tutorialId: string;
  userEmail: string;
  isHelpful: boolean; // true = Sim, false = Não
  comment?: string;
  timestamp: string;
}

export interface OnboardingTrack {
  id: string;
  titulo: string;
  descricao: string;
  departamento: string;
  iconName?: string;
  cor?: string;
  tutorialIds: string[];
}

export interface TutorialHistory {
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

export interface Tutorial {
  id: string;
  titulo: string;
  duracao: string;
  desc: string;
  passos: string[]; // Supports rich text & markdown
  anexo?: string;
  subcategoria?: string;
  tags?: string[];
  obsoleto?: boolean;
  visualizacoes?: number;
  author?: string;
  updatedBy?: string;
  updatedAt?: string;
  version?: number;
  history?: TutorialHistory[];
}

export interface Category {
  id: string;
  nome: string;
  cor: string;
  descricao?: string;
  ordem?: number;
  departamento?: string;
  icone?: string;
  tutoriais: Tutorial[];
}

export type UserRole = 'colaborador' | 'editor' | 'admin';

export interface UserSession {
  email: string;
  name: string;
  role: UserRole;
  isAdmin: boolean;
  avatar: string;
  department?: string;
  allowedCategoryIds?: string[];
  loginTime: string;
}

export interface SearchFilters {
  query: string;
  selectedCategoryIds: string[];
  selectedSubcategory?: string;
  selectedTag?: string;
  onlyFavorites: boolean;
  onlyObsolete: boolean;
  onlyRecent?: boolean;
  onlyOutdatedReview?: boolean;
  sortBy: 'relevance' | 'views' | 'recent' | 'title';
}

