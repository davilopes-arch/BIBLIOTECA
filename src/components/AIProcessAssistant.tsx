import React from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ExternalLink,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Category, Tutorial } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  matchedTutorials?: Array<{ category: Category; tutorial: Tutorial }>;
  timestamp: Date;
}

interface AIProcessAssistantProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onOpenTutorial: (category: Category, tutorial: Tutorial) => void;
}

export const AIProcessAssistant: React.FC<AIProcessAssistantProps> = ({
  categories,
  isOpen,
  onClose,
  onOpenTutorial
}) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Sou o **Assistente de Processos da Sou Energy**. Como posso te ajudar hoje? Você pode perguntar sobre qualquer procedimento interno, solicitação de férias, VPN, emissão de notas ou regras da empresa.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Quick suggestions
  const SUGGESTIONS = [
    'Como pedir férias?',
    'Como conectar na VPN?',
    'Como emitir Nota Fiscal?',
    'Qual o procedimento de reembolso?',
    'Checklist de abertura de unidade'
  ];

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Collect simplified context to send to the backend
      const libraryContext = categories.map(c => ({
        categoria: c.nome,
        tutoriais: c.tutoriais.map(t => ({
          id: t.id,
          titulo: t.titulo,
          desc: t.desc,
          subcategoria: t.subcategoria,
          tags: t.tags,
          passos: t.passos
        }))
      }));

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          context: libraryContext
        })
      });

      const data = await res.json();

      // Find matched tutorial objects from response
      const matched: Array<{ category: Category; tutorial: Tutorial }> = [];
      if (data && Array.isArray(data.matchedTutorialIds)) {
        data.matchedTutorialIds.forEach((id: string) => {
          categories.forEach(cat => {
            const t = cat.tutoriais.find(item => item.id === id);
            if (t) matched.push({ category: cat, tutorial: t });
          });
        });
      }

      const botMessage: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: data.answer || 'Aqui estão as instruções baseadas no acervo da biblioteca:',
        matchedTutorials: matched.length > 0 ? matched : undefined,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.warn("Server AI error, falling back to smart local matching:", err);

      // Local matching fallback
      const queryLower = text.toLowerCase();
      const terms = queryLower.split(/\s+/).filter(w => w.length > 2);

      const scored: Array<{ category: Category; tutorial: Tutorial; score: number }> = [];

      categories.forEach(cat => {
        cat.tutoriais.forEach(t => {
          let score = 0;
          const fullText = `${t.titulo} ${t.desc} ${(t.tags || []).join(' ')} ${t.passos.join(' ')}`.toLowerCase();

          terms.forEach(term => {
            if (t.titulo.toLowerCase().includes(term)) score += 5;
            if ((t.tags || []).some(tag => tag.includes(term))) score += 4;
            if (t.desc.toLowerCase().includes(term)) score += 3;
            if (t.passos.some(p => p.toLowerCase().includes(term))) score += 2;
          });

          if (score > 0) {
            scored.push({ category: cat, tutorial: t, score });
          }
        });
      });

      scored.sort((a, b) => b.score - a.score);
      const topMatches = scored.slice(0, 3).map(s => ({ category: s.category, tutorial: s.tutorial }));

      let responseText = '';
      if (topMatches.length > 0) {
        const top = topMatches[0].tutorial;
        responseText = `Encontrei o procedimento **${top.titulo}** no acervo! Veja um resumo dos passos principais:\n\n` +
          top.passos.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join('\n\n') +
          (top.passos.length > 4 ? `\n\n*(E mais ${top.passos.length - 4} passos no tutorial completo)*` : '');
      } else {
        responseText = 'Não encontrei nenhum procedimento com esses termos exatos no acervo. Experimente buscar por palavras como *férias*, *VPN*, *reembolso* ou consulte as categorias na barra lateral.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: responseText,
          matchedTutorials: topMatches.length > 0 ? topMatches : undefined,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl h-[85vh] max-h-[640px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                Assistente de Processos IA
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-neutral-500">
                Respostas em tempo real baseadas no acervo da Sou Energy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-orange-600 text-white shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-tr-xs font-medium'
                    : 'bg-neutral-50 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 rounded-tl-xs'
                }`}
              >
                <MarkdownRenderer content={msg.text} />

                {/* Linked Tutorial Cards if bot matched tutorials */}
                {msg.matchedTutorials && msg.matchedTutorials.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Tutoriais Relacionados:
                    </p>
                    <div className="space-y-1.5">
                      {msg.matchedTutorials.map(({ category, tutorial }) => (
                        <div
                          key={tutorial.id}
                          onClick={() => onOpenTutorial(category, tutorial)}
                          className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs group"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                              {category.nome}
                            </span>
                            <h5 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 truncate">
                              {tutorial.titulo}
                            </h5>
                          </div>

                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 shrink-0 group-hover:underline"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                <span>Consultando os processos da biblioteca...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips Bar */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-orange-500 hover:text-orange-600 whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Digite sua dúvida sobre qualquer processo..."
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
