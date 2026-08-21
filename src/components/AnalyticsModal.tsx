import React from 'react';
import { 
  BarChart3, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  Eye, 
  Clock, 
  AlertTriangle, 
  X, 
  Download, 
  CheckCircle2, 
  FileText,
  UserCheck,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Category, Tutorial, UserSession } from '../types';
import { getTutorialFeedbacks, getCompletedTutorials } from '../utils/storage';
import { isSuperAdmin } from '../utils/permissions';

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
  const feedbacks = React.useMemo(() => getTutorialFeedbacks(), [isOpen]);
  const completedIds = React.useMemo(() => getCompletedTutorials(), [isOpen]);
  const [confirmReset, setConfirmReset] = React.useState(false);


  // Aggregate stats
  const stats = React.useMemo(() => {
    let totalTutorials = 0;
    let totalViews = 0;
    let obsoleteCount = 0;
    let reviewNeededCount = 0;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const allTutorialsWithCat: Array<{ cat: Category; tut: Tutorial; helpful: number; unhelpful: number; score: number }> = [];

    categories.forEach(cat => {
      cat.tutoriais.forEach(tut => {
        totalTutorials++;
        totalViews += tut.visualizacoes || 0;
        if (tut.obsoleto) obsoleteCount++;

        const updated = tut.updatedAt ? new Date(tut.updatedAt) : new Date(0);
        if (updated < sixMonthsAgo && !tut.obsoleto) {
          reviewNeededCount++;
        }

        const fb = feedbacks[tut.id] || { helpful: 0, unhelpful: 0 };
        const totalVotes = fb.helpful + fb.unhelpful;
        const approvalRate = totalVotes > 0 ? (fb.helpful / totalVotes) * 100 : 100;

        allTutorialsWithCat.push({
          cat,
          tut,
          helpful: fb.helpful,
          unhelpful: fb.unhelpful,
          score: approvalRate
        });
      });
    });

    const mostViewed = [...allTutorialsWithCat].sort((a, b) => (b.tut.visualizacoes || 0) - (a.tut.visualizacoes || 0)).slice(0, 5);
    const mostHelpful = [...allTutorialsWithCat].filter(item => item.helpful > 0).sort((a, b) => b.helpful - a.helpful).slice(0, 5);
    const attentionNeeded = [...allTutorialsWithCat].filter(item => item.unhelpful > 0).sort((a, b) => b.unhelpful - a.unhelpful).slice(0, 5);

    let totalHelpful = 0;
    let totalUnhelpful = 0;
    Object.values(feedbacks).forEach(f => {
      totalHelpful += f.helpful || 0;
      totalUnhelpful += f.unhelpful || 0;
    });

    return {
      totalTutorials,
      totalViews,
      obsoleteCount,
      reviewNeededCount,
      totalHelpful,
      totalUnhelpful,
      completedCount: completedIds.length,
      mostViewed,
      mostHelpful,
      attentionNeeded
    };
  }, [categories, feedbacks, completedIds]);

  if (!isOpen) return null;

  const totalFeedback = stats.totalHelpful + stats.totalUnhelpful;
  const generalApproval = totalFeedback > 0 ? Math.round((stats.totalHelpful / totalFeedback) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Painel de Indicadores & Feedback Operacional
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Métricas de uso, satisfação dos colaboradores e saúde do acervo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Procedimentos</span>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">{stats.totalTutorials}</p>
              <p className="text-[11px] text-neutral-400">Em {categories.length} categorias</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Visualizações</span>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.totalViews}</p>
              <p className="text-[11px] text-neutral-400">Consultas da equipe</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Satisfação Geral</span>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{generalApproval}%</p>
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-neutral-400">{stats.totalHelpful} votos positivos</p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Treinos Concluídos</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.completedCount}</p>
              <p className="text-[11px] text-neutral-400">Checklists finalizados</p>
            </div>
          </div>

          {/* Attention Alerts */}
          {(stats.reviewNeededCount > 0 || stats.obsoleteCount > 0) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                <p className="font-bold">Atenção para Gestão da Qualidade & Revisão:</p>
                <p>
                  Existem <strong>{stats.reviewNeededCount}</strong> tutoriais sem revisão há mais de 6 meses e{' '}
                  <strong>{stats.obsoleteCount}</strong> marcados como obsoletos/desatualizados que necessitam de intervenção dos autores.
                </p>
              </div>
            </div>
          )}

          {/* Split Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Consulted Tutorials */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-orange-500" />
                Procedimentos Mais Acessados
              </h3>
              <div className="space-y-2">
                {stats.mostViewed.map(({ cat, tut }, idx) => (
                  <div
                    key={tut.id}
                    onClick={() => {
                      onSelectTutorial(cat, tut);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-xs font-bold flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{tut.titulo}</p>
                        <p className="text-[10.5px] text-neutral-400 truncate">{cat.nome}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap pl-2">
                      {tut.visualizacoes || 0} views
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Helpful vs Needs Revision */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
                Avaliação dos Colaboradores
              </h3>
              {stats.attentionNeeded.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-neutral-500 font-medium">Requerem clareza ou revisão de passos:</p>
                  {stats.attentionNeeded.map(({ cat, tut, unhelpful, helpful }) => (
                    <div
                      key={tut.id}
                      onClick={() => {
                        onSelectTutorial(cat, tut);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 hover:border-red-400 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{tut.titulo}</p>
                        <p className="text-[10.5px] text-neutral-400 truncate">{cat.nome}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> {unhelpful}</span>
                        <span className="text-neutral-300 dark:text-neutral-700">|</span>
                        <span className="text-emerald-600 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {helpful}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
                  <ThumbsUp className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Excelente índice de clareza!</p>
                  <p className="text-[11px] text-neutral-400">Nenhum feedback negativo pendente de revisão.</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <div>
            {isSuperAdmin(user) && onResetAccessHistory && (
              confirmReset ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-semibold">Confirmar zerar histórico?</span>
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
                  title="Zera os contadores de visualizações de todos os procedimentos"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Histórico de Acessos</span>
                </button>
              )
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Fechar Relatório
          </button>
        </div>

      </div>
    </div>
  );
};
