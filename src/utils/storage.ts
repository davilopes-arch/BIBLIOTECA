import { Category } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ONBOARDING_TRACKS } from '../constants/initialData';
import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';

export const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbxlEXeBk8zanzHZ8Cj_wsqZFGHyuDXsBAQTyTHrn3ONhzJ6AotSrfXL6jga-GbNMoJF/exec";

export const LOCAL_STORAGE_KEY = "souenergy_library_categories_v2";
export const LOCAL_FAVORITES_KEY = "souenergy_library_favorites_v2";
export const LOCAL_THEME_KEY = "souenergy_library_theme";
export const LOCAL_USER_KEY = "souenergy_library_user_session";
export const LOCAL_VIEWED_KEY = "souenergy_library_viewed_history";

export function ensureFields(categories: Category[]): Category[] {
  return categories.map(cat => ({
    ...cat,
    tutoriais: (cat.tutoriais || []).map(t => ({
      ...t,
      obsoleto: typeof t.obsoleto === 'boolean' ? t.obsoleto : false,
      visualizacoes: typeof t.visualizacoes === 'number' ? t.visualizacoes : 0,
      anexo: typeof t.anexo === 'string' ? t.anexo : '',
      tags: Array.isArray(t.tags) ? t.tags : [],
      subcategoria: typeof t.subcategoria === 'string' ? t.subcategoria : '',
      passos: Array.isArray(t.passos) ? t.passos : [],
      version: t.version || 1,
      history: Array.isArray(t.history) ? t.history : []
    }))
  }));
}

export async function fetchCategoriesFromRemote(): Promise<{ categories: Category[]; version: string }> {
  // 1. Try fetching from Cloud Firestore
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (!categoriesSnapshot.empty) {
      const firestoreCats: Category[] = [];
      categoriesSnapshot.forEach(docSnap => {
        firestoreCats.push(docSnap.data() as Category);
      });
      // Sort by ordem
      firestoreCats.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      const ensured = ensureFields(firestoreCats);
      saveLocalCategories(ensured);
      return { categories: ensured, version: `firestore-${Date.now()}` };
    }
  } catch (err) {
    console.warn("Firestore fetch notice, will try sheets/local fallback:", err);
  }

  // 2. Try fetching from Google Sheets
  try {
    const res = await fetch(SHEETS_API_URL, { method: 'GET', cache: 'no-store' });
    const data = await res.json();
    if (data && data.sucesso && Array.isArray(data.categories) && data.categories.length > 0) {
      const ensured = ensureFields(data.categories);
      const version = data.versao || '';
      saveLocalCategories(ensured);
      
      // Auto sync into Firestore in background
      syncCategoriesToFirestore(ensured).catch(e => console.warn('Sync to firestore:', e));
      return { categories: ensured, version };
    }
  } catch (err) {
    console.warn("Google Sheets fetch notice:", err);
  }

  // 3. Fallback to local storage
  const local = getLocalCategories();
  if (local && local.length > 0) {
    const ensured = ensureFields(local);
    syncCategoriesToFirestore(ensured).catch(() => {});
    return { categories: ensured, version: 'local-1' };
  }

  // 4. Default Seed Initial Data
  const defaultEnsured = ensureFields(DEFAULT_CATEGORIES);
  saveLocalCategories(defaultEnsured);
  syncCategoriesToFirestore(defaultEnsured).catch(() => {});
  return { categories: defaultEnsured, version: 'initial' };
}

export async function syncCategoriesToFirestore(categories: Category[]) {
  try {
    const batch = writeBatch(db);
    for (const cat of categories) {
      const docRef = doc(db, 'categories', cat.id);
      batch.set(docRef, cat, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    console.warn('Could not batch sync to Firestore:', error);
  }
}

export async function saveCategoriesToRemote(
  categories: Category[],
  baseVersion: string,
  userEmail?: string
): Promise<{ success: boolean; newVersion?: string; conflict?: boolean; updatedCategories?: Category[] }> {
  const ensured = ensureFields(categories);
  saveLocalCategories(ensured);

  // Persist into Cloud Firestore
  try {
    await syncCategoriesToFirestore(ensured);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'categories');
  }

  // Also sync to Google Sheets for dual backup
  try {
    fetch(SHEETS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveData',
        categories: ensured,
        baseVersion: baseVersion,
        userEmail: userEmail || 'davi.lopes@souenergy.com.br',
        timestamp: new Date().toISOString()
      })
    }).catch(e => console.warn('Sheets background sync error:', e));
  } catch (e) {}

  return { success: true, newVersion: `firestore-${Date.now()}` };
}

export function getLocalCategories(): Category[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveLocalCategories(categories: Category[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error(e);
  }
}

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveFavorites(favs: string[]) {
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favs));
    
    // Save to Firestore if user logged in
    if (auth.currentUser?.uid) {
      const uid = auth.currentUser.uid;
      setDoc(doc(db, 'user_preferences', uid), {
        userId: uid,
        favorites: favs,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `user_preferences/${uid}`);
      });
    }
  } catch (e) {}
}

export const LOCAL_FEEDBACK_KEY = "souenergy_library_feedback_v1";
export const LOCAL_COMPLETED_KEY = "souenergy_library_completed_tutorials";

export function getCompletedTutorials(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMPLETED_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveCompletedTutorials(completed: string[]) {
  try {
    localStorage.setItem(LOCAL_COMPLETED_KEY, JSON.stringify(completed));
    if (auth.currentUser?.uid) {
      const uid = auth.currentUser.uid;
      setDoc(doc(db, 'user_preferences', uid), {
        userId: uid,
        completedTutorials: completed,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `user_preferences/${uid}`);
      });
    }
  } catch (e) {}
}

export function toggleCompletedTutorial(tutorialId: string): string[] {
  const current = getCompletedTutorials();
  const exists = current.includes(tutorialId);
  const updated = exists ? current.filter(id => id !== tutorialId) : [...current, tutorialId];
  saveCompletedTutorials(updated);
  return updated;
}

export function getTutorialFeedbacks(): Record<string, { helpful: number; unhelpful: number; userVote?: boolean }> {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

export function saveTutorialVote(tutorialId: string, isHelpful: boolean) {
  try {
    const all = getTutorialFeedbacks();
    const current = all[tutorialId] || { helpful: 0, unhelpful: 0 };
    
    if (current.userVote === isHelpful) {
      return all;
    }
    
    if (current.userVote === true && !isHelpful) {
      current.helpful = Math.max(0, current.helpful - 1);
      current.unhelpful += 1;
    } else if (current.userVote === false && isHelpful) {
      current.unhelpful = Math.max(0, current.unhelpful - 1);
      current.helpful += 1;
    } else if (current.userVote === undefined) {
      if (isHelpful) current.helpful += 1;
      else current.unhelpful += 1;
    }
    
    current.userVote = isHelpful;
    all[tutorialId] = current;
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(all));

    // Async push to firestore feedbacks collection
    setDoc(doc(db, 'feedbacks', tutorialId), {
      tutorialId,
      helpful: current.helpful,
      unhelpful: current.unhelpful
    }, { merge: true }).catch(err => {
      console.warn('Feedback save note:', err);
    });

    return all;
  } catch (e) {
    return {};
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getOnboardingTracks() {
  return DEFAULT_ONBOARDING_TRACKS;
}
