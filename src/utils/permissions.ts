import { Category, UserSession } from '../types';
import { SUPER_ADMIN_EMAILS } from '../constants/assets';

export function isSuperAdmin(user?: UserSession | null): boolean {
  if (!user) return false;
  if (user.email && SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === user.email.trim().toLowerCase())) {
    return true;
  }
  return user.role === 'admin' || user.isAdmin === true;
}

export function isAreaEditor(user?: UserSession | null): boolean {
  if (!user) return false;
  return user.role === 'editor';
}

export function isColaborador(user?: UserSession | null): boolean {
  if (!user) return false;
  return user.role === 'colaborador';
}

export function canUserManageCategories(user?: UserSession | null): boolean {
  return isSuperAdmin(user);
}

export function canUserEditCategory(
  user: UserSession | null | undefined,
  category: Category | string
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.role === 'editor') {
    const catId = typeof category === 'string' ? category : category.id;
    const catName = typeof category === 'string' ? '' : category.nome.toLowerCase();

    // Check if categoryId is in allowedCategoryIds
    if (user.allowedCategoryIds && user.allowedCategoryIds.length > 0) {
      if (user.allowedCategoryIds.includes(catId)) return true;
    }

    // Check if user department matches category name (e.g. Financeiro matches Financeiro)
    if (user.department && catName) {
      const deptNormalized = user.department.toLowerCase();
      if (catName.includes(deptNormalized) || deptNormalized.includes(catName)) {
        return true;
      }
    }

    // If allowedCategoryIds is not set, allow editing if department matches or if it's the editor's primary category
    return false;
  }
  return false;
}

export function canUserCreateTutorial(user: UserSession | null | undefined): boolean {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'editor';
}

export function getEditableCategories(
  user: UserSession | null | undefined,
  categories: Category[]
): Category[] {
  if (!user) return [];
  if (isSuperAdmin(user)) return categories;
  if (user.role === 'editor') {
    return categories.filter(c => canUserEditCategory(user, c));
  }
  return [];
}

export function getRoleDisplayName(user?: UserSession | null): string {
  if (!user) return 'Visitante';
  if (isSuperAdmin(user)) return 'Super Administrador';
  if (isAreaEditor(user)) return `Editor (${user.department || 'Área'})`;
  return 'Colaborador (Leitura)';
}
