import React from 'react';
import { Tv, X, Clock, Play, Pause, ChevronRight } from 'lucide-react';
import { Category, Tutorial } from '../types';
import { SOU_ENERGY_ICON } from '../constants/assets';

interface TVModeViewProps {
  categories: Category[];
  onSelectTutorial: (category: Category, tutorial: Tutorial) => void;
  onExit: () => void;
}

export const TVModeView: React.FC<TVModeViewProps> = ({
  categories,
  onSelectTutorial,
  onExit
}) => {
  const [selectedCatId, setSelectedCatId] = React.useState<string | 'all'>('all');
  const [autoScroll, setAutoScroll] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll loop for TV monitors
  React.useEffect(() => {
    if (!autoScroll) return;
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        containerRef.current.scrollBy({ top: 220, behavior: 'smooth' });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [autoScroll]);

  const filteredCategories = React.useMemo(() => {
    if (selectedCatId === 'all') return categories;
    return categories.filter(c => c.id === selectedCatId);
  }, [categories, selectedCatId]);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col overflow-hidden select-none">
      {/* TV Header Bar */}
      <header className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src={SOU_ENERGY_ICON} alt="Sou Energy" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Biblioteca de Processos
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white uppercase tracking-wider">
                Modo Painel
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Sou Energy · Guia Rápido de Procedimentos Operacionais
            </p>
          </div>
        </div>

        {/* Controls: Category Filter + Auto-scroll toggle + Exit */}
        <div className="flex items-center gap-3">
          {/* Category Filter Pills */}
          <div className="hidden md:flex items-center gap-1.5 bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedCatId === 'all' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCatId === cat.id ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                <span>{cat.nome}</span>
              </button>
            ))}
          </div>

          {/* Auto-scroll button */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
              autoScroll
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
            }`}
            title="Alternar rolagem automática de painel"
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoScroll ? 'Pausar Rolagem' : 'Rolar Auto'}</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </header>

      {/* Main Big Grid Display */}
      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-none"
      >
        {filteredCategories.map(cat => (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-2">
              <span
                className="w-4 h-4 rounded-full shrink-0 ring-2 ring-neutral-700"
                style={{ backgroundColor: cat.cor }}
              />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {cat.nome}
              </h2>
              <span className="text-xs text-neutral-500 font-mono">
                ({cat.tutoriais.length} processos)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.tutoriais.map(tut => (
                <div
                  key={tut.id}
                  onClick={() => onSelectTutorial(cat, tut)}
                  className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500 hover:bg-neutral-800/80 transition-all duration-150 cursor-pointer shadow-lg flex flex-col justify-between group"
                  style={{
                    borderLeftWidth: '5px',
                    borderLeftColor: cat.cor
                  }}
                >
                  <div className="space-y-2">
                    {tut.subcategoria && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-orange-400 uppercase tracking-wider">
                        {tut.subcategoria}
                      </span>
                    )}
                    <h3 className="font-bold text-base text-white group-hover:text-orange-400 line-clamp-2 leading-snug">
                      {tut.titulo}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {tut.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 mt-4">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      {tut.duracao}
                    </span>
                    <span className="flex items-center gap-1 text-orange-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Ver tutorial <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};
