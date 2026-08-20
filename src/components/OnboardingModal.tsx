import React from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Award, 
  Sparkles, 
  X, 
  ChevronRight, 
  BookOpen,
  Clock,
  Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, Tutorial } from '../types';
import { DEFAULT_ONBOARDING_TRACKS } from '../constants/initialData';
import { getCompletedTutorials } from '../utils/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectTutorial: (cat: Category, tut: Tutorial) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSelectTutorial
}) => {
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>(DEFAULT_ONBOARDING_TRACKS[0].id);
  const completedIds = React.useMemo(() => getCompletedTutorials(), [isOpen]);

  const activeTrack = DEFAULT_ONBOARDING_TRACKS.find(t => t.id === selectedTrackId) || DEFAULT_ONBOARDING_TRACKS[0];

  // Lookup tutorials in active track
  const trackTutorialsWithCat = React.useMemo(() => {
    const list: Array<{ cat: Category; tut: Tutorial; isDone: boolean }> = [];
    activeTrack.tutorialIds.forEach(id => {
      for (const cat of categories) {
        const found = cat.tutoriais.find(t => t.id === id);
        if (found) {
          list.push({ cat, tut: found, isDone: completedIds.includes(found.id) });
          break;
        }
      }
    });
    return list;
  }, [activeTrack, categories, completedIds]);

  const completedCount = trackTutorialsWithCat.filter(item => item.isDone).length;
  const totalCount = trackTutorialsWithCat.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  React.useEffect(() => {
    if (progressPercent === 100 && totalCount > 0) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  }, [progressPercent, totalCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Trilhas de Aprendizagem & Onboarding
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Guias estruturados passo a passo por cargo e departamento
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* Left Track Selector */}
          <div className="w-full md:w-72 shrink-0 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Escolha a sua Trilha
            </span>
            <div className="space-y-1.5">
              {DEFAULT_ONBOARDING_TRACKS.map(track => {
                const isSelected = track.id === selectedTrackId;
                return (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-950 dark:text-orange-200 shadow-xs'
                        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{track.titulo}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{track.departamento}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-orange-500' : 'text-neutral-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Track Detail and Tutorial Progress List */}
          <div className="flex-1 space-y-5">
            {/* Track Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200/80 dark:border-orange-900/40 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-600 text-white mb-1.5">
                    {activeTrack.departamento}
                  </span>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                    {activeTrack.titulo}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                    {activeTrack.descricao}
                  </p>
                </div>
                {progressPercent === 100 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-xs">
                    <Award className="w-4 h-4" />
                    <span>Concluída!</span>
                  </div>
                )}
              </div>

              {/* Track Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-neutral-600 dark:text-neutral-400">Progresso da Trilha:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{completedCount} de {totalCount} concluídos ({progressPercent}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* List of Tutorial Modules in Track */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Módulos e Procedimentos da Trilha
              </h4>

              <div className="space-y-2">
                {trackTutorialsWithCat.map(({ cat, tut, isDone }, idx) => (
                  <div
                    key={tut.id}
                    onClick={() => {
                      onSelectTutorial(cat, tut);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400'
                        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 hover:border-orange-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-[10px] font-bold text-neutral-500 shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-neutral-500 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                          {tut.titulo}
                        </p>
                        <div className="flex items-center gap-2 text-[10.5px] text-neutral-400">
                          <span>{cat.nome}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {tut.duracao}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Concluir / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
