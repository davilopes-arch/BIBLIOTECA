import { AccessLog, AnalyticsTimeframe, AnalyticsGrouping, Category, Tutorial } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const LOCAL_ACCESS_LOGS_KEY = "souenergy_library_access_logs_v2";

/**
 * Verifies if an email is excluded from analytics and view counters.
 * The administrator and user davi.lopes@souenergy.com.br must NEVER be recorded or counted.
 */
export function isExcludedAccessEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return (
    normalized === 'davi.lopes@souenergy.com.br' ||
    normalized === 'admin@souenergy.com.br' ||
    normalized === 'suporte@souenergy.com.br'
  );
}

/**
 * Record a tutorial access event (view, step completion, etc.)
 * Strictly ignores excluded administrator emails like davi.lopes@souenergy.com.br
 */
export function logTutorialAccess(params: {
  tutorialId: string;
  tutorialTitle: string;
  categoryId: string;
  categoryName: string;
  userEmail?: string;
  department?: string;
  action?: 'view' | 'checklist_complete' | 'pdf_download';
}): AccessLog | null {
  // Never log accesses from davi.lopes@souenergy.com.br or admins
  if (isExcludedAccessEmail(params.userEmail)) {
    return null;
  }

  const newLog: AccessLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tutorialId: params.tutorialId,
    tutorialTitle: params.tutorialTitle,
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    timestamp: new Date().toISOString(),
    userEmail: params.userEmail || 'colaborador@souenergy.com.br',
    department: params.department || params.categoryName || 'Geral',
    action: params.action || 'view'
  };

  try {
    const existing = getStoredAccessLogsRaw();
    const updated = [newLog, ...existing].slice(0, 5000); // keep up to 5000 recent logs
    localStorage.setItem(LOCAL_ACCESS_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save access log locally:', e);
  }

  // Save to Firestore in background (non-blocking)
  try {
    setDoc(doc(db, 'access_logs', newLog.id), newLog).catch(err => {
      console.warn('Firestore access log write note:', err);
    });
  } catch (e) {}

  return newLog;
}

/**
 * Get raw stored logs from localStorage, filtering out any excluded email addresses
 */
function getStoredAccessLogsRaw(): AccessLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCESS_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(log => !isExcludedAccessEmail(log.userEmail));
      }
    }
  } catch (e) {}
  return [];
}

/**
 * Get all actual access logs (starts at zero with no fake seed data)
 */
export function getAccessLogs(categories: Category[] = []): AccessLog[] {
  return getStoredAccessLogsRaw();
}

/**
 * Clear all access logs completely
 */
export function clearAllAccessLogs() {
  try {
    localStorage.removeItem(LOCAL_ACCESS_LOGS_KEY);
    localStorage.removeItem("souenergy_library_access_logs_v1");
  } catch (e) {}
}

export interface AccessTimeDataPoint {
  label: string;
  rawDate: string;
  views: number;
  completions: number;
  uniqueProcedures: number;
}

export interface DepartmentAccessStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DayOfWeekStat {
  day: string;
  short: string;
  count: number;
  isWeekend: boolean;
}

export interface HourRangeStat {
  range: string;
  count: number;
  label: string;
}

export interface TutorialAccessStat {
  id: string;
  title: string;
  categoryName: string;
  categoryId: string;
  periodViews: number;
  totalViews: number;
  completions: number;
  completionRate: number;
  lastAccess?: string;
  obsolete?: boolean;
  needsReview?: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  satisfactionRate: number;
}

const DEPT_COLORS = [
  '#FF5A1F', // Sou Energy Orange
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B'  // Slate
];

/**
 * Process raw logs into multi-dimensional analytics for the Indicadores dashboard
 */
export function computeAccessAnalytics(
  logs: AccessLog[],
  categories: Category[],
  timeframe: AnalyticsTimeframe = '30d',
  grouping: AnalyticsGrouping = 'day',
  feedbacks: Record<string, { helpful: number; unhelpful: number }> = {},
  completedIds: string[] = [],
  selectedTutorialId?: string | null
) {
  const now = new Date();
  let startDate: Date;

  if (timeframe === '7d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
  } else if (timeframe === '30d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
  } else if (timeframe === '90d') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);
  } else if (timeframe === '12m') {
    startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else {
    // all
    startDate = new Date(0);
  }

  // Filter logs within timeframe and exclude admin emails
  const filteredLogs = logs.filter(log => {
    if (isExcludedAccessEmail(log.userEmail)) return false;
    const logDate = new Date(log.timestamp);
    if (logDate < startDate || logDate > now) return false;
    if (selectedTutorialId && log.tutorialId !== selectedTutorialId) return false;
    return true;
  });

  // Calculate previous period for comparison (trend %)
  const periodDurationMs = now.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDurationMs);
  const prevLogsCount = logs.filter(log => {
    if (isExcludedAccessEmail(log.userEmail)) return false;
    const logDate = new Date(log.timestamp);
    return logDate >= prevStartDate && logDate < startDate;
  }).length;

  // 1. Time Series Evolution (Diário / Semanal / Mensal)
  const timeSeriesMap = new Map<string, { label: string; rawDate: string; views: number; completions: number; tutSet: Set<string> }>();

  // Helper date formatter
  const formatDateKey = (date: Date, group: AnalyticsGrouping): { key: string; label: string } => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    if (group === 'day') {
      return { key: `${year}-${m}-${d}`, label: `${d}/${m}` };
    } else if (group === 'week') {
      const tempDate = new Date(date.getTime());
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
      const week1 = new Date(tempDate.getFullYear(), 0, 4);
      const weekNum = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      return { key: `${year}-W${weekNum.toString().padStart(2, '0')}`, label: `Sem ${weekNum}` };
    } else {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return { key: `${year}-${m}`, label: `${monthNames[date.getMonth()]}/${year.toString().slice(2)}` };
    }
  };

  // Pre-populate time intervals to ensure contiguous zero-data points on chart
  const intervalCursor = new Date(startDate);
  const intervalStepDays = grouping === 'day' ? 1 : grouping === 'week' ? 7 : 30;

  // Safety boundary on start date if "all" is chosen with 0 logs
  if (timeframe === 'all' && filteredLogs.length === 0) {
    intervalCursor.setTime(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  while (intervalCursor <= now) {
    const { key, label } = formatDateKey(intervalCursor, grouping);
    if (!timeSeriesMap.has(key)) {
      timeSeriesMap.set(key, {
        label,
        rawDate: key,
        views: 0,
        completions: 0,
        tutSet: new Set()
      });
    }
    intervalCursor.setDate(intervalCursor.getDate() + intervalStepDays);
  }

  // Populate from filtered logs
  filteredLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const { key, label } = formatDateKey(logDate, grouping);
    
    let entry = timeSeriesMap.get(key);
    if (!entry) {
      entry = { label, rawDate: key, views: 0, completions: 0, tutSet: new Set() };
      timeSeriesMap.set(key, entry);
    }

    entry.views += 1;
    if (log.action === 'checklist_complete') {
      entry.completions += 1;
    }
    entry.tutSet.add(log.tutorialId);
  });

  // Convert to sorted array
  const timeSeries: AccessTimeDataPoint[] = Array.from(timeSeriesMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, val]) => ({
      label: val.label,
      rawDate: val.rawDate,
      views: val.views,
      completions: val.completions,
      uniqueProcedures: val.tutSet.size
    }));

  // 2. Department Breakdown
  const deptCountMap = new Map<string, number>();
  filteredLogs.forEach(log => {
    const dept = log.department || log.categoryName || 'Outros';
    deptCountMap.set(dept, (deptCountMap.get(dept) || 0) + 1);
  });

  const totalPeriodAccesses = filteredLogs.length;
  const departmentStats: DepartmentAccessStat[] = Array.from(deptCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], index) => ({
      name,
      count,
      percentage: totalPeriodAccesses > 0 ? Math.round((count / totalPeriodAccesses) * 100) : 0,
      color: DEPT_COLORS[index % DEPT_COLORS.length]
    }));

  // 3. Day of Week distribution
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayShorts = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  filteredLogs.forEach(log => {
    const day = new Date(log.timestamp).getDay();
    dayCounts[day] += 1;
  });

  const dayOfWeekStats: DayOfWeekStat[] = [1, 2, 3, 4, 5, 6, 0].map(d => ({
    day: dayNames[d],
    short: dayShorts[d],
    count: dayCounts[d],
    isWeekend: d === 0 || d === 6
  }));

  // 4. Hourly Peak distribution
  const hourRanges = [
    { range: '06h - 09h', min: 6, max: 9, label: 'Manhã Cedo', count: 0 },
    { range: '09h - 12h', min: 9, max: 12, label: 'Manhã (Pico)', count: 0 },
    { range: '12h - 14h', min: 12, max: 14, label: 'Almoço', count: 0 },
    { range: '14h - 17h', min: 14, max: 17, label: 'Tarde (Pico)', count: 0 },
    { range: '17h - 20h', min: 17, max: 20, label: 'Fim de Expediente', count: 0 },
    { range: '20h - 06h', min: 20, max: 24, label: 'Noite / Outros', count: 0 }
  ];

  filteredLogs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    for (const hr of hourRanges) {
      if (hr.range === '20h - 06h') {
        if (hour >= 20 || hour < 6) {
          hr.count += 1;
          break;
        }
      } else if (hour >= hr.min && hour < hr.max) {
        hr.count += 1;
        break;
      }
    }
  });

  // 5. Tutorial-level metrics
  const tutStatsMap = new Map<string, {
    periodViews: number;
    completions: number;
    lastAccess?: string;
  }>();

  filteredLogs.forEach(log => {
    let stat = tutStatsMap.get(log.tutorialId);
    if (!stat) {
      stat = { periodViews: 0, completions: 0, lastAccess: log.timestamp };
      tutStatsMap.set(log.tutorialId, stat);
    }
    stat.periodViews += 1;
    if (log.action === 'checklist_complete') {
      stat.completions += 1;
    }
    if (!stat.lastAccess || new Date(log.timestamp) > new Date(stat.lastAccess)) {
      stat.lastAccess = log.timestamp;
    }
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tutorialStats: TutorialAccessStat[] = [];

  categories.forEach(cat => {
    cat.tutoriais.forEach(tut => {
      const logStat = tutStatsMap.get(tut.id) || { periodViews: 0, completions: 0 };
      const fb = feedbacks[tut.id] || { helpful: 0, unhelpful: 0 };
      const totalFb = fb.helpful + fb.unhelpful;
      const satisfactionRate = totalFb > 0 ? Math.round((fb.helpful / totalFb) * 100) : 100;
      const isCompleted = completedIds.includes(tut.id);
      const compRate = logStat.periodViews > 0 
        ? Math.min(100, Math.round((logStat.completions / logStat.periodViews) * 100))
        : (isCompleted ? 100 : 0);

      const updated = tut.updatedAt ? new Date(tut.updatedAt) : new Date(0);
      const needsReview = updated < sixMonthsAgo && !tut.obsoleto;

      tutorialStats.push({
        id: tut.id,
        title: tut.titulo,
        categoryName: cat.nome,
        categoryId: cat.id,
        periodViews: logStat.periodViews,
        totalViews: tut.visualizacoes || logStat.periodViews,
        completions: logStat.completions,
        completionRate: compRate,
        lastAccess: logStat.lastAccess,
        obsolete: tut.obsoleto,
        needsReview,
        helpfulCount: fb.helpful,
        unhelpfulCount: fb.unhelpful,
        satisfactionRate
      });
    });
  });

  // Sort tutorials by period views descending
  tutorialStats.sort((a, b) => b.periodViews - a.periodViews);

  // 6. Summary metrics
  const totalDays = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgViewsPerDay = (totalPeriodAccesses / totalDays).toFixed(1);
  
  const growthRate = prevLogsCount > 0 
    ? Math.round(((totalPeriodAccesses - prevLogsCount) / prevLogsCount) * 100)
    : 0;

  const activeProceduresCount = tutorialStats.filter(t => t.periodViews > 0).length;
  const zeroViewsCount = tutorialStats.filter(t => t.periodViews === 0).length;

  return {
    timeframe,
    grouping,
    totalPeriodAccesses,
    prevPeriodAccesses: prevLogsCount,
    growthRate,
    avgViewsPerDay,
    totalProcedures: tutorialStats.length,
    activeProceduresCount,
    zeroViewsCount,
    timeSeries,
    departmentStats,
    dayOfWeekStats,
    hourRanges,
    tutorialStats,
    mostViewed: tutorialStats.slice(0, 5),
    dormantProcedures: tutorialStats.filter(t => t.periodViews === 0)
  };
}
