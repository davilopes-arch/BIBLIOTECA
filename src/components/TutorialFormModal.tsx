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
  Upload,
  Image as ImageIcon,
  UploadCloud,
  Check
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

interface StepImageModalData {
  stepIndex: number;
  url: string;
  caption: string;
  mode: 'upload' | 'url';
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
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

  // Step Image Attachment Modal State
  const [stepImageModal, setStepImageModal] = React.useState<StepImageModalData | null>(null);
  const stepImageInputRef = React.useRef<HTMLInputElement>(null);

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

  // Step image attachment modal handlers
  const handleOpenStepImageModal = (index: number) => {
    setStepImageModal({
      stepIndex: index,
      url: '',
      caption: '',
      mode: 'upload',
      isUploading: false,
      uploadProgress: 0,
      error: null
    });
  };

  const handleStepImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !stepImageModal) return;

    if (!file.type.startsWith('image/')) {
      setStepImageModal(prev => prev ? { ...prev, error: 'Selecione um arquivo de imagem válido (PNG, JPG, WebP, GIF).' } : null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setStepImageModal(prev => prev ? { ...prev, error: 'A imagem deve ter no máximo 20MB.' } : null);
      return;
    }

    setStepImageModal(prev => prev ? { ...prev, isUploading: true, uploadProgress: 0, error: null } : null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const cloudUrl = await uploadToDrive(file, pct => {
          setStepImageModal(prev => prev ? { ...prev, uploadProgress: pct } : null);
        });
        setStepImageModal(prev => prev ? { 
          ...prev, 
          url: cloudUrl, 
          caption: prev.caption || file.name.replace(/\.[^/.]+$/, ''),
          isUploading: false 
        } : null);
      } catch (err) {
        console.warn('Upload remoto não disponível, utilizando imagem incorporada:', err);
        setStepImageModal(prev => prev ? { 
          ...prev, 
          url: dataUrl, 
          caption: prev.caption || file.name.replace(/\.[^/.]+$/, ''),
          isUploading: false 
        } : null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyStepImage = () => {
    if (!stepImageModal || !stepImageModal.url) return;
    const { stepIndex, url, caption } = stepImageModal;
    const altText = caption.trim() || `Imagem do Passo ${stepIndex + 1}`;
    const imageMarkdown = `\n\n![${altText}](${url.trim()})\n`;

    setPassos(prev => {
      const copy = [...prev];
      copy[stepIndex] = (copy[stepIndex] ? copy[stepIndex] : '') + imageMarkdown;
      return copy;
    });

    setStepImageModal(null);
  };

  const extractImagesFromStep = (stepText: string) => {
    const regex = /!\[(.*?)\]\((.*?)\)/g;
    const matches: { full: string; alt: string; url: string }[] = [];
    let m;
    while ((m = regex.exec(stepText)) !== null) {
      matches.push({ full: m[0], alt: m[1], url: m[2] });
    }
    return matches;
  };

  const handleRemoveImageFromStep = (stepIndex: number, fullMatch: string) => {
    setPassos(prev => {
      const copy = [...prev];
      copy[stepIndex] = copy[stepIndex].replace(fullMatch, '').trim();
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
          {/* Row 1: Category */}
          <div className="space-y-1">
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
                        <button
                          type="button"
                          onClick={() => handleOpenStepImageModal(pIdx)}
                          className="p-1 rounded text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/60 transition-colors cursor-pointer"
                          title="Anexar Imagem ou Print neste passo"
                        >
                          <ImageIcon className="w-3 h-3" />
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

                    {/* Detected step images list & management */}
                    {extractImagesFromStep(passo).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {extractImagesFromStep(passo).map((img, iIdx) => (
                          <div
                            key={iIdx}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-xs shadow-2xs"
                          >
                            <img
                              src={img.url}
                              alt={img.alt}
                              className="w-7 h-7 rounded-lg object-cover border border-orange-300 dark:border-orange-700 shrink-0 bg-white"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex flex-col min-w-0 max-w-[200px]">
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate text-[11px]">
                                {img.alt || 'Imagem do passo'}
                              </span>
                              <span className="text-[9.5px] text-neutral-400 dark:text-neutral-500 truncate font-mono">
                                {img.url.startsWith('data:') ? 'Imagem carregada' : img.url}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImageFromStep(pIdx, img.full)}
                              className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors ml-1 cursor-pointer"
                              title="Remover imagem deste passo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

        {/* Step Image Attachment Modal */}
        {stepImageModal && (
          <div 
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => !stepImageModal.isUploading && setStepImageModal(null)}
          >
            <div 
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Anexar Imagem ao Passo {stepImageModal.stepIndex + 1}
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Insira prints de telas, diagramas ou fotos explicativas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !stepImageModal.isUploading && setStepImageModal(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Toggle Mode: Upload vs URL */}
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setStepImageModal(prev => prev ? { ...prev, mode: 'upload', error: null } : null)}
                    className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      stepImageModal.mode === 'upload'
                        ? 'bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload do Computador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepImageModal(prev => prev ? { ...prev, mode: 'url', error: null } : null)}
                    className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      stepImageModal.mode === 'url'
                        ? 'bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Link / URL da Imagem</span>
                  </button>
                </div>

                {/* Mode Upload */}
                {stepImageModal.mode === 'upload' ? (
                  <div className="space-y-3">
                    <input
                      ref={stepImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleStepImageFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => !stepImageModal.isUploading && stepImageInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-800/30"
                    >
                      {stepImageModal.isUploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Enviando imagem ({stepImageModal.uploadProgress}%)...
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center mb-2">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            Clique para selecionar imagem do computador
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            Formatos suportados: PNG, JPG, JPEG, WEBP, GIF (máx. 20MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mode URL */
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={stepImageModal.url}
                      onChange={e => setStepImageModal(prev => prev ? { ...prev, url: e.target.value } : null)}
                      placeholder="https://exemplo.com/imagem.png"
                      className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}

                {/* Error message */}
                {stepImageModal.error && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
                    {stepImageModal.error}
                  </p>
                )}

                {/* Image Preview if URL loaded */}
                {stepImageModal.url && (
                  <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 max-h-48 flex items-center justify-center p-2">
                      <img
                        src={stepImageModal.url}
                        alt={stepImageModal.caption || 'Prévia'}
                        className="max-h-44 w-auto object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Caption Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Legenda / Texto alternativo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={stepImageModal.caption}
                        onChange={e => setStepImageModal(prev => prev ? { ...prev, caption: e.target.value } : null)}
                        placeholder="Ex: Print da tela de confirmação do pedido"
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 bg-neutral-50/50 dark:bg-neutral-900/50">
                <button
                  type="button"
                  onClick={() => setStepImageModal(null)}
                  disabled={stepImageModal.isUploading}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyStepImage}
                  disabled={!stepImageModal.url || stepImageModal.isUploading}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Inserir Imagem no Passo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
