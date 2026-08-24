import React from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ExternalLink,
  Globe,
  Building2,
  Search,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Category, Tutorial } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WebSource {
  title: string;
  url: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  matchedTutorials?: Array<{ category: Category; tutorial: Tutorial }>;
  webSources?: WebSource[];
  usedWebSearch?: boolean;
  userQuery?: string;
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
      text: 'Olá! Sou o **Assistente Inteligente da Sou Energy**.\n\nPosso te ajudar com dúvidas sobre procedimentos internos (férias, VPN, ERP, POPs) ou realizar **pesquisas externas em tempo real na Web** (normas ANEEL, inversores, manuais e legislações).',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = React.useState('');
  const [enableWebSearch, setEnableWebSearch] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Quick suggestions based on mode
  const INTERNAL_SUGGESTIONS = [
    'Como pedir férias?',
    'Como conectar na VPN?',
    'Como emitir Nota Fiscal?',
    'Qual o procedimento de reembolso?',
    'Checklist de abertura de unidade'
  ];

  const WEB_SUGGESTIONS = [
    'Regras da REN 1059 ANEEL para solar',
    'Procedimento de conexão com a concessionária',
    'Principais códigos de erro em inversores Growatt/Deye',
    'Tributação de ICMS em energia solar'
  ];

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string, forceWebSearch?: boolean) => {
    const text = (queryText || inputText).trim();
    if (!text || isLoading) return;

    const useWeb = forceWebSearch !== undefined ? forceWebSearch : enableWebSearch;
    if (forceWebSearch !== undefined) {
      setEnableWebSearch(forceWebSearch);
    }

    setInputText('');
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      usedWebSearch: useWeb,
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
          context: libraryContext,
          enableWebSearch: useWeb
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
        text: data.answer || 'Aqui estão as informações para sua dúvida:',
        matchedTutorials: matched.length > 0 ? matched : undefined,
        webSources: data.webSources && data.webSources.length > 0 ? data.webSources : undefined,
        usedWebSearch: data.usedWebSearch || useWeb,
        userQuery: text,
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
        responseText = `Encontrei o procedimento interno **${top.titulo}** no acervo da Sou Energy! Veja o resumo dos passos:\n\n` +
          top.passos.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join('\n\n') +
          (top.passos.length > 4 ? `\n\n*(E mais ${top.passos.length - 4} passos no tutorial completo)*` : '');
      } else {
        responseText = 'Não localizei este procedimento específico na base interna da Sou Energy. Caso deseje informações gerais ou externas, ative a **Pesquisa na Web** abaixo.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: responseText,
          matchedTutorials: topMatches.length > 0 ? topMatches : undefined,
          usedWebSearch: useWeb,
          userQuery: text,
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
        className="relative w-full max-w-2xl h-[88vh] max-h-[680px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                Assistente de Processos & Conhecimento
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-300">
                  <Building2 className="w-3 h-3 text-orange-600" />
                  Base Sou Energy
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1 font-medium ${enableWebSearch ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}`}>
                  <Globe className="w-3 h-3" />
                  {enableWebSearch ? 'Web Search Ativo' : 'Web Opcional'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar assistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Toggle Banner */}
        <div className="px-4 py-2 bg-neutral-100/70 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 min-w-0">
            <Globe className={`w-3.5 h-3.5 shrink-0 ${enableWebSearch ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}`} />
            <span className="truncate">
              {enableWebSearch 
                ? 'Modo Híbrido: Consultando Base Sou Energy + Google Search em tempo real'
                : 'Modo Foco Interno: Respostas estritamente baseadas nos POPs e tutoriais da empresa'}
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hidden sm:inline">
              Pesquisar na Web
            </span>
            <div 
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                enableWebSearch ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div 
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                  enableWebSearch ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
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
                    : msg.usedWebSearch
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-orange-600 text-white shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : msg.usedWebSearch ? (
                  <Globe className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-tr-xs font-medium'
                    : 'bg-neutral-50 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 rounded-tl-xs'
                }`}
              >
                {/* Source Badge on Bot Message */}
                {msg.sender === 'bot' && (
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {msg.usedWebSearch ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                        <Globe className="w-3 h-3" />
                        Pesquisa Web & Base Interna
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                        <ShieldCheck className="w-3 h-3" />
                        Acervo Oficial Sou Energy
                      </span>
                    )}
                  </div>
                )}

                <MarkdownRenderer content={msg.text} />

                {/* Linked Internal Tutorial Cards */}
                {msg.matchedTutorials && msg.matchedTutorials.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Tutoriais Internos Relacionados:
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
                            <span>Abrir POP</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Web Grounding Sources */}
                {msg.webSources && msg.webSources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      Fontes e Referências Externas (Google Search):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {msg.webSources.slice(0, 4).map((source, idx) => {
                        let domain = '';
                        try {
                          domain = new URL(source.url).hostname.replace('www.', '');
                        } catch {
                          domain = 'web';
                        }
                        return (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex items-center justify-between gap-2 group"
                            title={source.title}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 block truncate">
                                {domain}
                              </span>
                              <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                {source.title}
                              </p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Prompt to retry with Web Search if no matches found and web search was off */}
                {msg.sender === 'bot' && !msg.usedWebSearch && (!msg.matchedTutorials || msg.matchedTutorials.length === 0) && msg.userQuery && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => handleSend(msg.userQuery, true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Pesquisar esta pergunta na Web agora</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 ${enableWebSearch ? 'bg-blue-600' : 'bg-orange-600'}`}>
                {enableWebSearch ? <Globe className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                <span>
                  {enableWebSearch 
                    ? 'Pesquisando na base interna da Sou Energy e na Web em tempo real...' 
                    : 'Consultando os processos da biblioteca interna...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips Bar */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
            Sugestões:
          </span>
          {(enableWebSearch ? WEB_SUGGESTIONS : INTERNAL_SUGGESTIONS).map(s => (
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
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  enableWebSearch
                    ? "Faça uma pergunta sobre processos internos ou normas/dados externos..."
                    : "Digite sua dúvida sobre processos da Sou Energy..."
                }
                className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setEnableWebSearch(!enableWebSearch)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  enableWebSearch
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/60'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
                title={enableWebSearch ? "Pesquisa na Web ativada" : "Ativar pesquisa na Web"}
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl text-white transition-colors disabled:opacity-40 cursor-pointer shadow-xs ${
                enableWebSearch ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
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

