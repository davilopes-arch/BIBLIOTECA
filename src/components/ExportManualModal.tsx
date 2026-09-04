import React from 'react';
import { 
  FileDown, 
  Printer, 
  CheckSquare, 
  Square, 
  X, 
  FolderCheck,
  Building2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Category, Tutorial } from '../types';
import { SOU_ENERGY_ICON, SOU_ENERGY_LOGO_FULL } from '../constants/assets';

interface ExportManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export const ExportManualModal: React.FC<ExportManualModalProps> = ({
  isOpen,
  onClose,
  categories
}) => {
  const [selectedCatIds, setSelectedCatIds] = React.useState<string[]>(() => categories.map(c => c.id));
  const [includeHistory, setIncludeHistory] = React.useState(false);
  const [includeAttachments, setIncludeAttachments] = React.useState(true);

  React.useEffect(() => {
    if (isOpen && selectedCatIds.length === 0) {
      setSelectedCatIds(categories.map(c => c.id));
    }
  }, [isOpen, categories]);

  const toggleCategory = (id: string) => {
    setSelectedCatIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedCatIds(categories.map(c => c.id));
  const deselectAll = () => setSelectedCatIds([]);

  const selectedCategories = categories.filter(c => selectedCatIds.includes(c.id));
  const totalTutorials = selectedCategories.reduce((sum, c) => sum + c.tutoriais.length, 0);

  const handlePrintManual = () => {
    // Construct a printable window with official Sou Energy manual layout
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, permita popups para gerar o documento de impressão.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Manual Operacional e Normas Internas - Sou Energy</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            color: #1a1a1a;
            line-height: 1.6;
            margin: 0;
            padding: 30px;
            background: #fff;
          }
          .header {
            border-bottom: 3px solid #FF5A1F;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo { height: 40px; }
          .title { font-size: 24px; font-weight: 800; color: #111; margin: 0; }
          .subtitle { font-size: 13px; color: #666; margin: 4px 0 0; }
          .meta-info { font-size: 11px; color: #888; text-align: right; }
          .category-block { margin-bottom: 40px; page-break-inside: avoid; }
          .category-title {
            font-size: 18px;
            font-weight: 700;
            color: #D6430E;
            border-bottom: 1.5px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .tutorial-card {
            border: 1px solid #e5e5e5;
            border-left: 4px solid #FF5A1F;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .tut-title { font-size: 15px; font-weight: 700; margin: 0 0 4px; color: #222; }
          .tut-desc { font-size: 12px; color: #555; margin-bottom: 12px; }
          .tut-meta { font-size: 11px; color: #777; margin-bottom: 12px; display: flex; gap: 15px; }
          .step-list { margin: 0; padding-left: 20px; font-size: 12.5px; }
          .step-item { margin-bottom: 8px; }
          .alert-box { background: #fff8f5; border: 1px solid #ffdecb; padding: 8px 12px; border-radius: 6px; font-size: 11.5px; margin: 8px 0; color: #b43403; }
          .footer {
            border-top: 1px solid #eee;
            margin-top: 40px;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .category-block { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Sou Energy • Manual de Processos & Procedimentos</h1>
            <p class="subtitle">Documento Oficial de Treinamento, Qualidade e Governança Corporativa</p>
          </div>
          <div class="meta-info">
            <p><strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de Procedimentos:</strong> ${totalTutorials}</p>
            <p><strong>Confidencialidade:</strong> Uso Interno</p>
          </div>
        </div>

        ${selectedCategories.map(cat => `
          <div class="category-block">
            <h2 class="category-title" style="color: ${cat.cor || '#FF5A1F'}">
              📁 Departamento: ${cat.nome} ${cat.descricao ? `<span style="font-size:12px; font-weight:normal; color:#666;">(${cat.descricao})</span>` : ''}
            </h2>
            ${cat.tutoriais.map((tut, tIdx) => `
              <div class="tutorial-card" style="border-left-color: ${cat.cor || '#FF5A1F'}">
                <h3 class="tut-title">${tIdx + 1}. ${tut.titulo}</h3>
                <p class="tut-desc">${tut.desc || ''}</p>
                <div class="tut-meta">
                  ${tut.subcategoria ? `<span>📂 Subcategoria: <strong>${tut.subcategoria}</strong></span>` : ''}
                  <span>✍️ Autor: <strong>${tut.author || 'Equipe Sou Energy'}</strong></span>
                  <span>🔄 Versão: <strong>v${tut.version || 1}</strong></span>
                </div>
                <div style="font-weight: 600; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; color: #444;">
                  Passo a Passo de Execução:
                </div>
                <ol class="step-list">
                  ${tut.passos.map(step => `
                    <li class="step-item">
                      ${step.replace(/> \[!(NOTE|TIP|WARNING)\]\n>/g, '<br/><em>Nota:</em>')}
                    </li>
                  `).join('')}
                </ol>
                ${tut.anexo && includeAttachments ? `
                  <div style="margin-top: 10px; font-size: 11px; color: #0284c7;">
                    🔗 Link / Anexo: ${tut.anexo}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div class="footer">
          Sou Energy Solar • Biblioteca de Processos Internos • Gerado em ${new Date().toLocaleString('pt-BR')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Exportar Manual Oficial dos Departamentos
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Gere um documento PDF padronizado com os procedimentos selecionados
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
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Quick Select Buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Selecione as Categorias / Departamentos ({selectedCatIds.length} de {categories.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
              >
                Marcar Todos
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <button
                onClick={deselectAll}
                className="text-xs text-neutral-500 hover:underline cursor-pointer"
              >
                Desmarcar
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categories.map(cat => {
              const isChecked = selectedCatIds.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-400 text-neutral-900 dark:text-white'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.cor || '#FF5A1F' }} 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{cat.nome}</p>
                      <p className="text-[10.5px] text-neutral-400">{cat.tutoriais.length} tutoriais</p>
                    </div>
                  </div>
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-orange-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span>
                Total no documento final: <strong>{totalTutorials} procedimentos</strong> formatados
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium">Layout para Impressão / Salvar em PDF</span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handlePrintManual}
            disabled={totalTutorials === 0}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Gerar e Imprimir Manual (PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
