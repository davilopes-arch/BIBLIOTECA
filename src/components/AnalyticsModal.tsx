import React from 'react';
import { 
  BarChart3, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  TrendingDown,
  Eye, 
  Clock, 
  AlertTriangle, 
  X, 
  Download, 
  CheckCircle2, 
  RotateCcw,
  Calendar,
  Layers,
  Filter,
  Search,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Info,
  Building2,
  Users,
  Activity,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Category, Tutorial, UserSession, AnalyticsTimeframe, AnalyticsGrouping } from '../types';
import { getTutorialFeedbacks, getCompletedTutorials } from '../utils/storage';
import { isSuperAdmin } from '../utils/permissions';
import { getAccessLogs, computeAccessAnalytics, TutorialAccessStat } from '../utils/analyticsTracker';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  user?: UserSession | null;
  onSelectTutorial: (cat: Category, tut: Tutorial) => void;
  onResetAccessHistory?: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  categories,
  user,
  onSelectTutorial,
  onResetAccessHistory
}) => {
  // Filters & State
  const [timeframe, setTimeframe] = React.useState<AnalyticsTimeframe>('30d');
  const [grouping, setGrouping] = React.useState<AnalyticsGrouping>('day');
  const [selectedTutorialId, setSelectedTutorialId] = React.useState<string | null>(null);
  const [tableSearch, setTableSearch] = React.useState('');
  const [tableTab, setTableTab] = React.useState<'all' | 'top' | 'dormant' | 'review'>('all');
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [copiedNotification, setCopiedNotification] = React.useState(false);

  // Auto adjust grouping when timeframe changes
  const handleTimeframeChange = (newTf: AnalyticsTimeframe) => {
    setTimeframe(newTf);
    if (newTf === '7d') {
      setGrouping('day');
    } else if (newTf === '30d') {
      setGrouping('day');
    } else if (newTf === '90d') {
      setGrouping('week');
    } else if (newTf === '12m' || newTf === 'all') {
      setGrouping('month');
    }
  };

  // Load Feedbacks and Completed IDs
  const feedbacks = React.useMemo(() => getTutorialFeedbacks(), [isOpen]);
  const completedIds = React.useMemo(() => getCompletedTutorials(), [isOpen]);

  // Load raw access logs
  const logs = React.useMemo(() => {
    if (!isOpen) return [];
    return getAccessLogs(categories);
  }, [isOpen, categories]);

  // Process computed analytics
  const analytics = React.useMemo(() => {
    return computeAccessAnalytics(
      logs,
      categories,
      timeframe,
      grouping,
      feedbacks,
      completedIds,
      selectedTutorialId
    );
  }, [logs, categories, timeframe, grouping, feedbacks, completedIds, selectedTutorialId]);

  // Detailed selected tutorial object (if one is selected for deep dive)
  const selectedTutorialDetail = React.useMemo(() => {
    if (!selectedTutorialId) return null;
    for (const cat of categories) {
      const found = cat.tutoriais.find(t => t.id === selectedTutorialId);
      if (found) return { category: cat, tutorial: found };
    }
    return null;
  }, [selectedTutorialId, categories]);

  // Filtered tutorial table items
  const filteredTutorialRows = React.useMemo(() => {
    let list = [...analytics.tutorialStats];

    if (tableTab === 'top') {
      list = list.filter(t => t.periodViews > 0).sort((a, b) => b.periodViews - a.periodViews);
    } else if (tableTab === 'dormant') {
      list = list.filter(t => t.periodViews === 0);
    } else if (tableTab === 'review') {
      list = list.filter(t => t.needsReview || t.obsolete);
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.categoryName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [analytics.tutorialStats, tableTab, tableSearch]);

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = [
      'Posição',
      'Procedimento',
      'Departamento / Categoria',
      `Acessos no Período (${timeframe})`,
      'Total Geral Acumulado',
      'Taxa Conclusão Checklist (%)',
      'Votos Úteis',
      'Votos Não Úteis',
      'Aprovação (%)',
      'Status de Revisão'
    ];

    const rows = analytics.tutorialStats.map((item, idx) => [
      idx + 1,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.categoryName.replace(/"/g, '""')}"`,
      item.periodViews,
      item.totalViews,
      `${item.completionRate}%`,
      item.helpfulCount,
      item.unhelpfulCount,
      `${item.satisfactionRate}%`,
      item.obsolete ? 'Obsoleto' : item.needsReview ? 'Revisão Necessária' : 'Atualizado'
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `souenergy_indicadores_acessos_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Painel de Indicadores & Gestão de Acessos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50">
                  Tempo Real
                </span>
              </div>
              <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                Auditoria de consultas, frequência por período (dia/semana/mês) e engajamento por passo a passo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
              title="Baixar planilha CSV com os indicadores para a diretoria"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Exportado!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Exportar CSV</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-5 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Timeframe Filter Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <span className="px-2 text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-500" /> Período:
            </span>
            <button
              onClick={() => handleTimeframeChange('7d')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === '7d'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => handleTimeframeChange('30d')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => handleTimeframeChange('90d')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === '90d'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              3 Meses
            </button>
            <button
              onClick={() => handleTimeframeChange('12m')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === '12m'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              12 Meses
            </button>
            <button
              onClick={() => handleTimeframeChange('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Tudo
            </button>
          </div>

          {/* Grouping Toggle Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
            <span className="px-2 text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-orange-500" /> Agrupar por:
            </span>
            <button
              onClick={() => setGrouping('day')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                grouping === 'day'
                  ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setGrouping('week')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                grouping === 'week'
                  ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setGrouping('month')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                grouping === 'month'
                  ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Mês
            </button>
          </div>

          {/* Procedure Specific Filter */}
          {selectedTutorialId && (
            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 px-2.5 py-1 rounded-xl">
              <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 truncate max-w-[220px]">
                Filtrado por: {selectedTutorialDetail?.tutorial.titulo}
              </span>
              <button
                onClick={() => setSelectedTutorialId(null)}
                className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 cursor-pointer"
                title="Remover filtro individual e ver todos os procedimentos"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Main Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
          
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Total Acessos */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Acessos no Período
              </span>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-neutral-900 dark:text-white">
                  {analytics.totalPeriodAccesses}
                </p>
                {analytics.growthRate !== 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                    analytics.growthRate > 0 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                  }`}>
                    {analytics.growthRate > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {analytics.growthRate > 0 ? `+${analytics.growthRate}%` : `${analytics.growthRate}%`}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400">Consultas dos times</p>
            </div>

            {/* Card 2: Média Diária */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Média Diária
              </span>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {analytics.avgViewsPerDay}
              </p>
              <p className="text-[10px] text-neutral-400">Consultas / dia útil</p>
            </div>

            {/* Card 3: Procedimentos Ativos */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Passos Consultados
              </span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {analytics.activeProceduresCount} <span className="text-xs font-normal text-neutral-400">/ {analytics.totalProcedures}</span>
              </p>
              <p className="text-[10px] text-neutral-400">Acervo ativo no período</p>
            </div>

            {/* Card 4: Taxa de Conclusão */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Checklists Finalizados
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {completedIds.length}
              </p>
              <p className="text-[10px] text-neutral-400">Treinos executados 100%</p>
            </div>

            {/* Card 5: Satisfação / Clareza */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Índice de Clareza
              </span>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {feedbacks && Object.keys(feedbacks).length > 0
                    ? Math.round((Object.values(feedbacks).reduce((acc, f) => acc + (f.helpful || 0), 0) / Math.max(1, Object.values(feedbacks).reduce((acc, f) => acc + (f.helpful || 0) + (f.unhelpful || 0), 0))) * 100)
                    : 100}%
                </p>
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-neutral-400">Aprovação da equipe</p>
            </div>

            {/* Card 6: Procedimentos Ociosos */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
                Sem Acessos (0 views)
              </span>
              <p className={`text-2xl font-black ${analytics.zeroViewsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-white'}`}>
                {analytics.zeroViewsCount}
              </p>
              <p className="text-[10px] text-neutral-400">Requer divulgação/revisão</p>
            </div>
          </div>

          {/* Individual Deep-Dive Banner if a tutorial is selected */}
          {selectedTutorialDetail && (
            <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Raio-X do Passo a Passo Individual
                    </span>
                    <span className="text-[10.5px] text-neutral-400">• {selectedTutorialDetail.category.nome}</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {selectedTutorialDetail.tutorial.titulo}
                  </h3>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    Acessado <strong>{analytics.totalPeriodAccesses} vezes</strong> no período selecionado (Total acumulado: {selectedTutorialDetail.tutorial.visualizacoes || 0} visualizações).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectTutorial(selectedTutorialDetail.category, selectedTutorialDetail.tutorial);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Abrir este Passo a Passo</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedTutorialId(null)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Ver Todos
                </button>
              </div>
            </div>
          )}

          {/* Main Visual Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Chart 1: Time Series Area Chart (Evolução de Acessos ao longo do tempo) */}
            <div className="lg:col-span-2 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Evolução Temporal de Acessos ({grouping === 'day' ? 'Diário' : grouping === 'week' ? 'Semanal' : 'Mensal'})
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-400">
                  {analytics.timeSeries.length} pontos avaliados
                </span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accessGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10, fill: '#888888' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#888888' }} 
                      axisLine={false} 
                      tickLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-neutral-900 text-white text-xs shadow-xl border border-neutral-700 space-y-1">
                              <p className="font-bold text-orange-400">{label}</p>
                              <p className="text-neutral-300">
                                Visualizações: <strong className="text-white">{data.views}</strong>
                              </p>
                              <p className="text-neutral-300">
                                Passos distintos: <strong className="text-white">{data.uniqueProcedures}</strong>
                              </p>
                              {data.completions > 0 && (
                                <p className="text-emerald-400">
                                  Checklists concluídos: <strong>{data.completions}</strong>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#FF5A1F" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#accessGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department / Category Breakdown */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Acessos por Departamento
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-400">
                  {analytics.departmentStats.length} áreas
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                {analytics.departmentStats.length > 0 ? (
                  analytics.departmentStats.slice(0, 6).map((dept) => (
                    <div key={dept.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[170px]" title={dept.name}>
                          {dept.name}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 font-bold whitespace-nowrap pl-2">
                          {dept.count} ({dept.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, dept.percentage)}%`, backgroundColor: dept.color }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-6">Sem registros de departamento no período.</p>
                )}
              </div>
            </div>

          </div>

          {/* Secondary Analytical Visualizers: Days of Week + Peak Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Days of Week (Dias mais movimentados) */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Dias da Semana com Mais Consultas
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-400">Segunda a Domingo</span>
              </div>

              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dayOfWeekStats} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                    <XAxis dataKey="short" tick={{ fontSize: 10, fill: '#888888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#888888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2 rounded-lg bg-neutral-900 text-white text-xs shadow-lg border border-neutral-700">
                              <p className="font-bold text-orange-400">{data.day}</p>
                              <p>{data.count} acessos registrados</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#FF5A1F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours (Faixas de Horário de Acesso) */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Horários de Pico de Acesso
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-400">Turnos operacionais</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {analytics.hourRanges.map(hr => (
                  <div key={hr.range} className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                      <span>{hr.range}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-base font-black text-neutral-900 dark:text-white">{hr.count}</span>
                      <span className="text-[10px] text-neutral-400">{hr.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Procedures Ranking & Deep Audit Table */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-500" />
                  Desempenho Detalhado por Passo a Passo
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Clique em um procedimento para inspecionar métricas individuais ou abrir o tutorial
                </p>
              </div>

              {/* Table Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search in table */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filtrar por nome..."
                    className="w-44 pl-8 pr-2.5 py-1 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-orange-500"
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Tab buttons */}
                <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => setTableTab('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      tableTab === 'all'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Todos ({analytics.tutorialStats.length})
                  </button>
                  <button
                    onClick={() => setTableTab('top')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      tableTab === 'top'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Mais Acessados
                  </button>
                  <button
                    onClick={() => setTableTab('dormant')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      tableTab === 'dormant'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Sem Acessos ({analytics.zeroViewsCount})
                  </button>
                  <button
                    onClick={() => setTableTab('review')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      tableTab === 'review'
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Revisão Pendente
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-800">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Procedimento / Passo a Passo</th>
                    <th className="py-2.5 px-3 text-center">Acessos no Período</th>
                    <th className="py-2.5 px-3 text-center">Total Geral</th>
                    <th className="py-2.5 px-3 text-center">Taxa Conclusão</th>
                    <th className="py-2.5 px-3 text-center">Avaliação</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredTutorialRows.length > 0 ? (
                    filteredTutorialRows.map((tut, index) => {
                      const maxViews = analytics.tutorialStats[0]?.periodViews || 1;
                      const viewBarWidth = Math.max(4, Math.round((tut.periodViews / maxViews) * 100));
                      const isSelected = selectedTutorialId === tut.id;

                      return (
                        <tr 
                          key={tut.id}
                          className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                            isSelected ? 'bg-orange-50/70 dark:bg-orange-950/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-bold text-neutral-400">
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-3 min-w-[200px]">
                            <button
                              onClick={() => setSelectedTutorialId(isSelected ? null : tut.id)}
                              className="text-left font-semibold text-neutral-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors block truncate max-w-[280px] cursor-pointer"
                              title={tut.title}
                            >
                              {tut.title}
                            </button>
                            <span className="text-[10.5px] text-neutral-400">
                              {tut.categoryName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-orange-600 dark:text-orange-400">
                                {tut.periodViews} views
                              </span>
                              <div className="w-16 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700 mt-1 overflow-hidden">
                                <div 
                                  className="h-full bg-orange-500 rounded-full" 
                                  style={{ width: `${viewBarWidth}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-neutral-600 dark:text-neutral-300">
                            {tut.totalViews}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              {tut.completionRate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {tut.helpfulCount + tut.unhelpfulCount > 0 ? (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                                <span className="text-emerald-600 flex items-center gap-0.5">
                                  <ThumbsUp className="w-3 h-3" /> {tut.helpfulCount}
                                </span>
                                {tut.unhelpfulCount > 0 && (
                                  <span className="text-red-500 flex items-center gap-0.5">
                                    <ThumbsDown className="w-3 h-3" /> {tut.unhelpfulCount}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10.5px] text-neutral-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {tut.obsolete ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                                Obsoleto
                              </span>
                            ) : tut.needsReview ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                                Revisão &gt;6m
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                                Atualizado
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedTutorialId(isSelected ? null : tut.id)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-orange-500 text-white' 
                                    : 'border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                title="Filtrar gráficos para este passo a passo"
                              >
                                {isSelected ? 'Filtrado' : 'Gráfico'}
                              </button>
                              <button
                                onClick={() => {
                                  const targetCat = categories.find(c => c.id === tut.categoryId);
                                  const targetTut = targetCat?.tutoriais.find(t => t.id === tut.id);
                                  if (targetCat && targetTut) {
                                    onSelectTutorial(targetCat, targetTut);
                                    onClose();
                                  }
                                }}
                                className="p-1 rounded-lg text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                title="Abrir procedimento na íntegra"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-400">
                        Nenhum passo a passo encontrado para o filtro selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-3 text-xs">
          <div>
            {isSuperAdmin(user) && onResetAccessHistory && (
              confirmReset ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-semibold">Confirmar zerar todos os acessos?</span>
                  <button
                    onClick={() => {
                      onResetAccessHistory();
                      setConfirmReset(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Sim, Zerar
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-colors cursor-pointer"
                  title="Zera os contadores de visualizações e logs de acesso"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Histórico de Acessos</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Dados</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
            >
              Fechar Painel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
