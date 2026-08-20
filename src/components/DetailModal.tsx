import React from 'react';
import { 
  X, 
  Clock, 
  Eye, 
  Paperclip, 
  CheckCircle2, 
  Circle, 
  Share2, 
  Printer, 
  History, 
  AlertTriangle, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, Tutorial } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { saveTutorialVote, getTutorialFeedbacks, toggleCompletedTutorial, getCompletedTutorials } from '../utils/storage';

interface DetailModalProps {
  category: Category;
  tutorial: Tutorial;
  isOpen: boolean;
  onClose: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  category,
  tutorial,
  isOpen,
  onClose,
  onNavigatePrev,
  onNavigateNext
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [feedbackVote, setFeedbackVote] = React.useState<boolean | null>(null);
  const [feedbackCounts, setFeedbackCounts] = React.useState({ helpful: 0, unhelpful: 0 });

  // Load feedback
  React.useEffect(() => {
    const allFb = getTutorialFeedbacks();
    const current = allFb[tutorial.id];
    if (current) {
      setFeedbackCounts({ helpful: current.helpful || 0, unhelpful: current.unhelpful || 0 });
      setFeedbackVote(current.userVote !== undefined ? current.userVote : null);
    } else {
      setFeedbackCounts({ helpful: 0, unhelpful: 0 });
      setFeedbackVote(null);
    }
  }, [tutorial.id]);

  // Voice narration (Web Speech API)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Seu navegador não suporta leitura de voz integrada.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSteps = tutorial.passos.map((p, idx) => `Passo ${idx + 1}: ${p.replace(/[#*`>]/g, '')}`).join('. ');
    const fullSpeechText = `${tutorial.titulo}. ${tutorial.desc || ''}. ${cleanSteps}`;

    const utterance = new SpeechSynthesisUtterance(fullSpeechText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Stop speech when unmounting or changing tutorial
  React.useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [tutorial.id]);

  // Reset completed steps when opening new tutorial
  React.useEffect(() => {
    setCompletedSteps([]);
    setShowHistory(false);
    setScrollProgress(0);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [tutorial.id]);

  // Handle scroll progress bar
  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  // Toggle step completion
  const handleToggleStep = (index: number) => {
    setCompletedSteps(prev => {
      const exists = prev.includes(index);
      const updated = exists ? prev.filter(i => i !== index) : [...prev, index];

      // Trigger confetti celebration and mark tutorial as completed if all steps are completed!
      if (!exists && updated.length === tutorial.passos.length && tutorial.passos.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        const completedList = getCompletedTutorials();
        if (!completedList.includes(tutorial.id)) {
          toggleCompletedTutorial(tutorial.id);
        }
      }

      return updated;
    });
  };

  const handleVote = (isHelpful: boolean) => {
    const updated = saveTutorialVote(tutorial.id, isHelpful);
    const curr = updated[tutorial.id];
    if (curr) {
      setFeedbackCounts({ helpful: curr.helpful, unhelpful: curr.unhelpful });
      setFeedbackVote(isHelpful);
    }
  };

  const handleShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('tutorialId', tutorial.id);
    navigator.clipboard.writeText(url.toString());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const totalSteps = tutorial.passos.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  // Check if review is older than 6 months
  const isReviewOutdated = (() => {
    if (!tutorial.updatedAt) return false;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(tutorial.updatedAt) < sixMonthsAgo;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
        style={{
          borderTopWidth: '5px',
          borderTopColor: category.cor || '#FF5A1F'
        }}
      >
        {/* Scroll Progress Indicator Line */}
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 z-10 transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-200/80 dark:border-neutral-800 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="space-y-1 pr-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: category.cor || '#FF5A1F' }}
              >
                {category.nome}
              </span>
              {tutorial.subcategoria && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {tutorial.subcategoria}
                </span>
              )}
              {tutorial.version && (
                <span className="text-[11px] font-semibold text-neutral-400">
                  v{tutorial.version}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug">
              {tutorial.titulo}
            </h2>
          </div>

          {/* Action Header Icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Voice Audio Narration Button */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isSpeaking 
                  ? 'bg-orange-600 text-white shadow-md animate-pulse' 
                  : 'text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 hover:text-orange-600'
              }`}
              title={isSpeaking ? "Pausar Leitura de Voz" : "Ouvir Passo a Passo por Voz (Áudio-Guia)"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Parar Áudio' : 'Ouvir Passos'}</span>
            </button>

            <button
              onClick={handleShareLink}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Copiar link direto do tutorial"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Imprimir / Salvar em PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700"
        >
          {/* Outdated Notice Banner */}
          {isReviewOutdated && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Revisão Periódica Recomendada:</strong> Este procedimento foi atualizado há mais de 6 meses ({tutorial.updatedAt ? new Date(tutorial.updatedAt).toLocaleDateString('pt-BR') : 'sem data'}). Se encontrar divergências nas rotinas atuais, notifique a equipe de processos.
              </div>
            </div>
          )}

          {/* Metadata Badges Strip */}
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Tempo estimado: <strong>{tutorial.duracao}</strong>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-neutral-400" />
              <strong>{tutorial.visualizacoes || 0}</strong> visualizações
            </span>
            {tutorial.author && (
              <>
                <span>·</span>
                <span>Autor: <strong>{tutorial.author}</strong></span>
              </>
            )}
            {tutorial.updatedAt && (
              <>
                <span>·</span>
                <span>Última revisão: <strong>{new Date(tutorial.updatedAt).toLocaleDateString('pt-BR')}</strong></span>
              </>
            )}
          </div>

          {/* Tutorial Overview Description */}
          {tutorial.desc && (
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
              {tutorial.desc}
            </div>
          )}

          {/* Attachment Banner if present */}
          {tutorial.anexo && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60">
              <div className="flex items-center gap-2 text-xs text-orange-900 dark:text-orange-300 font-medium">
                <Paperclip className="w-4 h-4 text-orange-600" />
                <span>Arquivo ou Sistema Complementar Vinculado</span>
              </div>
              <a
                href={tutorial.anexo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-xs"
              >
                <span>Acessar Anexo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Interactive Step Progress Tracker */}
          {totalSteps > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Passo a Passo de Execução
                </span>
                <span className="font-mono text-[11px] text-neutral-500">
                  {completedSteps.length}/{totalSteps} concluídos ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Items List */}
          <div className="space-y-3">
            {tutorial.passos.map((passo, index) => {
              const isChecked = completedSteps.includes(index);
              return (
                <div
                  key={index}
                  onClick={() => handleToggleStep(index)}
                  className={`group p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/40 text-neutral-500 dark:text-neutral-400'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
                  }`}
                >
                  {/* Step Number Badge and Check Icon */}
                  <div className="pt-0.5 shrink-0 flex items-center justify-center">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-150" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-[11px] font-bold text-neutral-500 group-hover:border-orange-500 group-hover:text-orange-600 transition-colors">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Step Text Content with Markdown */}
                  <div
                    className="flex-1 min-w-0"
                    onClick={e => {
                      // Allow clicking links inside markdown without toggling checkbox
                      if ((e.target as HTMLElement).tagName === 'A') {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <MarkdownRenderer content={passo} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Section ("Este tutorial te ajudou?") */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Este tutorial te ajudou?
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Seu feedback orienta melhorias contínuas nos procedimentos da Sou Energy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(true)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  feedbackVote === true
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Sim ({feedbackCounts.helpful})</span>
              </button>

              <button
                onClick={() => handleVote(false)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  feedbackVote === false
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-red-400'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Não ({feedbackCounts.unhelpful})</span>
              </button>
            </div>
          </div>

          {/* Tags Chips */}
          {tutorial.tags && tutorial.tags.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-neutral-400 mr-2">Tags:</span>
              {tutorial.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-block mr-1.5 mb-1 px-2 py-0.5 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Revision History Collapsible */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showHistory ? 'Ocultar Histórico de Revisões' : 'Ver Histórico de Revisões e Autoria'}</span>
            </button>

            {showHistory && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between font-semibold pb-1 border-b border-neutral-200 dark:border-neutral-800">
                  <span>Versão atual: v{tutorial.version || 1}</span>
                  <span>Autor: {tutorial.author || 'Equipe Sou Energy'}</span>
                </div>

                {tutorial.history && tutorial.history.length > 0 ? (
                  <ul className="space-y-1.5 list-disc pl-4">
                    {tutorial.history.map((log, lIdx) => (
                      <li key={lIdx}>
                        <strong>{new Date(log.timestamp).toLocaleDateString('pt-BR')}</strong> por{' '}
                        <span className="text-neutral-900 dark:text-neutral-200 font-medium">{log.updatedBy}</span>
                        {log.notes && <span className="italic text-neutral-500"> — {log.notes}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-neutral-400">Nenhum log anterior registrado.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Prev / Next tutorial navigation */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
          <div className="flex items-center gap-2">
            {onNavigatePrev && (
              <button
                onClick={onNavigatePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}
            {onNavigateNext && (
              <button
                onClick={onNavigateNext}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-800 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Fechar Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};
