import React from 'react';
import { 
  X, 
  Sparkles, 
  Bold, 
  Italic, 
  Code, 
  AlertTriangle, 
  Lightbulb, 
  Info, 
  Link2, 
  Paperclip, 
  Plus, 
  Trash2, 
  GripVertical,
  Eye,
  Loader2,
  FileText,
  Upload
} from 'lucide-react';
import { Category, Tutorial, UserSession } from '../types';
import { uploadToDrive, MAX_ATTACH_MB } from '../utils/driveUpload';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getEditableCategories, isSuperAdmin } from '../utils/permissions';

interface TutorialFormModalProps {
  categories: Category[];
  initialCategory?: string;
  tutorialToEdit?: Tutorial | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (catId: string, tutorial: Tutorial) => void;
  user: UserSession;
}

export const TutorialFormModal: React.FC<TutorialFormModalProps> = ({
  categories,
  initialCategory,
  tutorialToEdit,
  isOpen,
  onClose,
  onSave,
  user
}) => {
  const allowedCategories = React.useMemo(() => {
    const editable = getEditableCategories(user, categories);
    return editable.length > 0 ? editable : categories;
  }, [user, categories]);

  const [selectedCatId, setSelectedCatId] = React.useState(
    initialCategory || allowedCategories[0]?.id || categories[0]?.id || ''
  );
  const [titulo, setTitulo] = React.useState('');
  const [duracao, setDuracao] = React.useState('5 min');
  const [desc, setDesc] = React.useState('');
  const [subcategoria, setSubcategoria] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  const [anexo, setAnexo] = React.useState('');
  const [obsoleto, setObsoleto] = React.useState(false);
  const [revisionNotes, setRevisionNotes] = React.useState('');

  // Steps list
  const [passos, setPassos] = React.useState<string[]>(['']);
  const [activeTab, setActiveTab] = React.useState<'edit' | 'preview'>('edit');

  // AI Generation State
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // File Upload State
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Populate data if editing
  React.useEffect(() => {
    if (tutorialToEdit) {
      setTitulo(tutorialToEdit.titulo || '');
      setDuracao(tutorialToEdit.duracao || '5 min');
      setDesc(tutorialToEdit.desc || '');
      setSubcategoria(tutorialToEdit.subcategoria || '');
      setTagsInput((tutorialToEdit.tags || []).join(', '));
      setAnexo(tutorialToEdit.anexo || '');
      setObsoleto(tutorialToEdit.obsoleto || false);
      setPassos(tutorialToEdit.passos && tutorialToEdit.passos.length > 0 ? tutorialToEdit.passos : ['']);
      setRevisionNotes('');
      if (initialCategory) setSelectedCatId(initialCategory);
    } else {
      setTitulo('');
      setDuracao('5 min');
      setDesc('');
      setSubcategoria('');
      setTagsInput('');
      setAnexo('');
      setObsoleto(false);
      setPassos(['']);
      setRevisionNotes('');
      if (initialCategory) setSelectedCatId(initialCategory);
      else if (allowedCategories[0]) setSelectedCatId(allowedCategories[0].id);
    }
  }, [tutorialToEdit, initialCategory, isOpen, allowedCategories]);

  if (!isOpen) return null;

  // Step operations
  const handleAddStep = () => {
    setPassos(prev => [...prev, '']);
  };

  const handleRemoveStep = (index: number) => {
    setPassos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (index: number, val: string) => {
    setPassos(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const insertSnippetInStep = (index: number, snippet: string) => {
    setPassos(prev => {
      const copy = [...prev];
      copy[index] = (copy[index] ? copy[index] + '\n' : '') + snippet;
      return copy;
    });
  };

  // AI Step Generator
  const handleGenerateWithAI = async () => {
    if (!titulo.trim()) {
      setAiError('Preencha o título do tutorial primeiro para a IA gerar os passos adequados.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/suggest-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titulo,
          description: desc,
          category: categories.find(c => c.id === selectedCatId)?.nome || ''
        })
      });

      const data = await res.json();
      if (data && data.success && Array.isArray(data.steps) && data.steps.length > 0) {
        setPassos(data.steps);
        if (data.description && !desc) {
          setDesc(data.description);
        }
        if (data.duration) {
          setDuracao(data.duration);
        }
        if (Array.isArray(data.tags) && !tagsInput) {
          setTagsInput(data.tags.join(', '));
        }
      } else {
        throw new Error(data.error || 'Não foi possível gerar os passos automaticamente.');
      }
    } catch (err: any) {
      console.warn("AI generation error, generating local smart template:", err);
      // Smart offline template fallback
      setPassos([
        `Acesse a plataforma ou sistema correspondente utilizando suas credenciais corporativas.`,
        `Navegue até o módulo **${titulo.replace(/^(Como|Guia de|Passo a passo)/i, '').trim()}** no menu principal.`,
        `> [!NOTE]\n> Verifique se você possui os privilégios de acesso necessários antes de prosseguir.`,
        `Preencha os campos obrigatórios com os dados do processo e confirme as informações.`,
        `> [!TIP]\n> Salve o comprovante ou anote o número de protocolo gerado para acompanhamento.`,
        `Envie para validação do responsável direto e acompanhe o status até a finalização.`
      ]);
      if (!desc) {
        setDesc(`Procedimento operacional padronizado para ${titulo.toLowerCase()}.`);
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // File upload to Drive via Apps Script
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACH_MB * 1024 * 1024) {
      setUploadError(`Arquivo excede o limite máximo de ${MAX_ATTACH_MB}MB.`);
      return;
    }

    setIsUploadingFile(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const fileUrl = await uploadToDrive(file, pct => setUploadProgress(pct));
      setAnexo(fileUrl);
    } catch (err: any) {
      setUploadError(err?.message || 'Falha no envio do arquivo.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitulo = titulo.trim();
    const cleanDesc = desc.trim();
    const cleanDuracao = duracao.trim() || '5 min';
    const cleanPassos = passos.map(p => p.trim()).filter(Boolean);

    if (!cleanTitulo) {
      alert('Por favor, informe o título do tutorial.');
      return;
    }
    if (cleanPassos.length === 0) {
      alert('Adicione pelo menos 1 passo.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const now = new Date().toISOString();
    const currentVersion = tutorialToEdit?.version || 1;

    const newHistory = tutorialToEdit?.history ? [...tutorialToEdit.history] : [];
    if (tutorialToEdit) {
      newHistory.push({
        timestamp: now,
        updatedBy: user.email,
        notes: revisionNotes.trim() || 'Atualização do conteúdo'
      });
    }

    const tutorialData: Tutorial = {
      id: tutorialToEdit?.id || `tut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      titulo: cleanTitulo,
      duracao: cleanDuracao,
      desc: cleanDesc,
      subcategoria: subcategoria.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      anexo: anexo.trim() || undefined,
      obsoleto,
      passos: cleanPassos,
      visualizacoes: tutorialToEdit?.visualizacoes || 0,
      author: tutorialToEdit?.author || user.name,
      updatedBy: user.email,
      updatedAt: now,
      version: tutorialToEdit ? currentVersion + 1 : 1,
      history: newHistory
    };

    onSave(selectedCatId, tutorialData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              {tutorialToEdit ? 'Editar Tutorial' : 'Novo Processo / Tutorial'}
            </p>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {tutorialToEdit ? tutorialToEdit.titulo : 'Cadastrar Tutorial'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700">
          
          {/* Row 1: Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Categoria *
              </label>
              <select
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500 font-medium"
              >
                {allowedCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Tempo Estimado
              </label>
              <input
                type="text"
                value={duracao}
                onChange={e => setDuracao(e.target.value)}
                placeholder="Ex: 5 min"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Row 2: Title with AI Auto-Generator Button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Título do Tutorial *
              </label>
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900 hover:bg-orange-100 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando passos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>✨ Gerar Passo a Passo com IA</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Como solicitar acesso à VPN corporativa"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500 font-medium"
            />
            {aiError && <p className="text-xs text-red-500 pt-0.5">{aiError}</p>}
          </div>

          {/* Row 3: Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Descrição Resumida
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Breve resumo sobre o objetivo do tutorial e quem deve realizá-lo."
              className="w-full px-3.5 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Row 4: Subcategory & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Subcategoria (Opcional)
              </label>
              <input
                type="text"
                value={subcategoria}
                onChange={e => setSubcategoria(e.target.value)}
                placeholder="Ex: Redes, Faturamento, Benefícios"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="Ex: vpn, acesso, senha, suporte"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Row 5: Attachment Link or File Upload */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Anexo / Link Complementar (Opcional)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={anexo}
                onChange={e => setAnexo(e.target.value)}
                placeholder="https://... ou anexe um arquivo do computador"
                className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
              />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,video/*,image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Anexar arquivo do computador"
              >
                {isUploadingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span>{uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </>
                )}
              </button>
            </div>
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          </div>

          {/* Step Builder Section with Markdown Toolbar & Preview Tab */}
          <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Passos de Execução ({passos.length})
                </span>
                <span className="text-[11px] text-neutral-400">
                  (Suporta Markdown, Negrito, Links e Alertas)
                </span>
              </div>

              {/* Tabs: Edit / Preview */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'edit'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Prévia</span>
                </button>
              </div>
            </div>

            {/* Edit Mode: List of Steps */}
            {activeTab === 'edit' ? (
              <div className="space-y-3">
                {passos.map((passo, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center text-[10px]">
                          {pIdx + 1}
                        </span>
                        Passo {pIdx + 1}
                      </span>

                      {/* Quick Markdown Toolbar for this step */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '**texto em negrito**')}
                          className="p-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Inserir Negrito"
                        >
                          <Bold className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '*texto em itálico*')}
                          className="p-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Inserir Itálico"
                        >
                          <Italic className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '`código/comando`')}
                          className="p-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Inserir Código"
                        >
                          <Code className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '> [!NOTE]\n> Informação importante para este passo.')}
                          className="p-1 rounded text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                          title="Inserir Alerta de Nota"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '> [!WARNING]\n> Atenção: certifique-se antes de continuar.')}
                          className="p-1 rounded text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                          title="Inserir Alerta de Atenção"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '> [!TIP]\n> Dica: utilize este atalho para ganhar tempo.')}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                          title="Inserir Alerta de Dica"
                        >
                          <Lightbulb className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippetInStep(pIdx, '[Texto do Link](https://exemplo.com)')}
                          className="p-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Inserir Link"
                        >
                          <Link2 className="w-3 h-3" />
                        </button>

                        {passos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(pIdx)}
                            className="p-1 ml-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                            title="Excluir este passo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={passo}
                      onChange={e => handleUpdateStep(pIdx, e.target.value)}
                      placeholder={`Descreva o passo ${pIdx + 1} em detalhes...`}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddStep}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:border-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Próximo Passo</span>
                </button>
              </div>
            ) : (
              /* Live Preview Mode */
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 space-y-3">
                {passos.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <MarkdownRenderer content={p || '*Passo vazio*'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row: Revision Notes (if editing) */}
          {tutorialToEdit && (
            <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Motivo da Revisão / Log de Alteração
              </label>
              <input
                type="text"
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                placeholder="Ex: Atualizado prazo de 15 para 30 dias de antecedência"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          {/* Checkbox Obsolete */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="obsoleteCheckbox"
              checked={obsoleto}
              onChange={e => setObsoleto(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="obsoleteCheckbox" className="text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
              Marcar como procedimento desatualizado / em revisão
            </label>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {tutorialToEdit ? 'Salvar Alterações' : 'Criar Tutorial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
