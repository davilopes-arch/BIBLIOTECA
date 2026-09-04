import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Info, AlertTriangle, AlertCircle, Lightbulb, CheckCircle2, Copy, Check, X, ZoomIn } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowCheckboxes?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', allowCheckboxes = false }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = React.useState<number | null>(null);
  const [zoomImage, setZoomImage] = React.useState<{ src: string; alt?: string } | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <>
      <div className={`prose dark:prose-invert max-w-none text-[14px] leading-relaxed ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            blockquote({ children, ...props }) {
              // Check if blockquote is a GitHub-style alert callout
              const textContent = React.Children.toArray(children)
                .map(child => (typeof child === 'string' ? child : ''))
                .join('');

              const isNote = textContent.includes('[!NOTE]') || textContent.includes('[!INFO]');
              const isWarning = textContent.includes('[!WARNING]') || textContent.includes('[!ATENCAO]');
              const isTip = textContent.includes('[!TIP]') || textContent.includes('[!DICA]');
              const isImportant = textContent.includes('[!IMPORTANT]') || textContent.includes('[!IMPORTANTE]');

              if (isNote || isWarning || isTip || isImportant) {
                let variantClasses = 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200';
                let Icon = Info;
                let title = 'Nota';

                if (isWarning) {
                  variantClasses = 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200';
                  Icon = AlertTriangle;
                  title = 'Atenção';
                } else if (isTip) {
                  variantClasses = 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200';
                  Icon = Lightbulb;
                  title = 'Dica';
                } else if (isImportant) {
                  variantClasses = 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200';
                  Icon = AlertCircle;
                  title = 'Importante';
                }

                return (
                  <div className={`my-3 p-3.5 rounded-xl border-l-4 shadow-xs ${variantClasses}`}>
                    <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider mb-1 opacity-90">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{title}</span>
                    </div>
                    <div className="text-[13.5px] leading-relaxed pl-6">
                      {children}
                    </div>
                  </div>
                );
              }

              return (
                <blockquote className="border-l-4 border-orange-500/60 bg-neutral-50 dark:bg-neutral-900/60 pl-4 py-2 my-2 rounded-r-lg italic text-neutral-600 dark:text-neutral-300" {...props}>
                  {children}
                </blockquote>
              );
            },
            code({ inline, className, children, ...props }: any) {
              const codeString = String(children).replace(/\n$/, '');
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-mono text-[12.5px] border border-neutral-200 dark:border-neutral-700" {...props}>
                    {children}
                  </code>
                );
              }

              const codeId = Math.floor(Math.random() * 100000);
              return (
                <div className="relative group my-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 font-mono text-xs">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-neutral-400 text-[11px]">
                    <span>código / comando</span>
                    <button
                      onClick={() => handleCopy(codeString, codeId)}
                      className="flex items-center gap-1 hover:text-neutral-100 transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedCodeIndex === codeId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCodeIndex === codeId ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 overflow-x-auto">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              );
            },
            a({ href, children, ...props }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 dark:text-orange-400 underline font-medium hover:text-orange-700 transition-colors"
                  {...props}
                >
                  {children}
                </a>
              );
            },
            img({ src, alt, ...props }) {
              if (!src) return null;
              return (
                <span className="block my-3 group/img relative inline-block">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomImage({ src, alt });
                    }}
                    className="block relative cursor-zoom-in rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-orange-500/80 transition-all"
                  >
                    <img
                      src={src}
                      alt={alt || 'Imagem do passo'}
                      className="max-h-96 w-auto object-contain bg-neutral-50 dark:bg-neutral-950"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      {...props}
                    />
                    <span className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-neutral-900/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs flex items-center gap-1 text-[10.5px]">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Ampliar</span>
                    </span>
                  </span>
                  {alt && <span className="block text-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">{alt}</span>}
                </span>
              );
            },
            ul({ children, ...props }) {
              return <ul className="list-disc pl-5 my-1.5 space-y-1" {...props}>{children}</ul>;
            },
            ol({ children, ...props }) {
              return <ol className="list-decimal pl-5 my-1.5 space-y-1" {...props}>{children}</ol>;
            },
            strong({ children, ...props }) {
              return <strong className="font-bold text-neutral-900 dark:text-neutral-100" {...props}>{children}</strong>;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Fullscreen Image Zoom Lightbox */}
      {zoomImage && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setZoomImage(null);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              title="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage.src}
              alt={zoomImage.alt || 'Imagem ampliada'}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-neutral-700"
              referrerPolicy="no-referrer"
            />
            {zoomImage.alt && (
              <p className="text-sm font-medium text-neutral-200 mt-3 text-center bg-neutral-900/80 px-4 py-1.5 rounded-full">
                {zoomImage.alt}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
