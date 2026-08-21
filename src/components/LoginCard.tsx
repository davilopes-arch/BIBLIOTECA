import React from 'react';
import { AlertCircle, ShieldCheck, Mail, User, Building2, ArrowRight, HelpCircle, ExternalLink } from 'lucide-react';
import { 
  SOU_ENERGY_ICON, 
  ALLOWED_CORPORATE_DOMAIN,
  SUPER_ADMIN_EMAILS
} from '../constants/assets';
import { UserSession } from '../types';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginCardProps {
  onLogin: (session: UserSession) => void;
}

const DEPARTMENTS = [
  'Geral / Operações',
  'RH - Gente & Gestão',
  'Financeiro & Controladoria',
  'Tecnologia da Informação (TI)',
  'Comercial & Vendas',
  'Customer Experience (CX / Atendimento)',
  'SESMT & Segurança do Trabalho',
  'Logística & Suprimentos',
  'Engenharia & Projetos'
];

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showManualForm, setShowManualForm] = React.useState(false);
  const [isDomainError, setIsDomainError] = React.useState(false);

  // Corporate email direct login state
  const [emailInput, setEmailInput] = React.useState('');
  const [nameInput, setNameInput] = React.useState('');
  const [selectedDept, setSelectedDept] = React.useState(DEPARTMENTS[0]);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const processCorporateLogin = (email: string, name?: string, picture?: string, department?: string) => {
    setError(null);
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail corporativo.');
      setIsLoading(false);
      return;
    }

    // Check corporate domain strictly
    if (!cleanEmail.endsWith(`@${ALLOWED_CORPORATE_DOMAIN}`)) {
      setError(
        `Acesso Negado: A conta "${cleanEmail}" não pertence ao domínio @${ALLOWED_CORPORATE_DOMAIN}. Por favor, utilize seu e-mail institucional Sou Energy.`
      );
      setIsLoading(false);
      return;
    }

    const isMasterAdmin = SUPER_ADMIN_EMAILS.some(adm => adm.toLowerCase() === cleanEmail);

    let formattedName = (name || '').trim();
    if (!formattedName) {
      const namePart = cleanEmail.split('@')[0];
      formattedName = namePart
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    const session: UserSession = {
      email: cleanEmail,
      name: formattedName,
      role: isMasterAdmin ? 'admin' : 'colaborador',
      isAdmin: isMasterAdmin,
      avatar: picture || formattedName.charAt(0).toUpperCase() || 'U',
      department: isMasterAdmin ? 'Administração Geral & TI' : (department || selectedDept),
      loginTime: new Date().toISOString()
    };

    onLogin(session);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setIsDomainError(false);

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account',
        hd: ALLOWED_CORPORATE_DOMAIN
      });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = (user.email || '').trim().toLowerCase();

      if (!email) {
        throw new Error('Não foi possível obter o e-mail da conta Google selecionada.');
      }

      processCorporateLogin(
        email,
        user.displayName || undefined,
        user.photoURL || undefined
      );
    } catch (err: any) {
      console.warn('Google Auth Error:', err);

      if (err.code === 'auth/unauthorized-domain') {
        setIsDomainError(true);
        setShowManualForm(true);
        setError(
          `O domínio "${currentHost}" ainda não está autorizado no Firebase Console. Utilize a validação direta de e-mail institucional abaixo para entrar agora.`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela de autenticação do Google foi fechada antes da conclusão.');
      } else if (err.code === 'auth/popup-blocked') {
        setShowManualForm(true);
        setError('O navegador bloqueou a janela pop-up do Google. Utilize a entrada direta por e-mail abaixo.');
      } else {
        setShowManualForm(true);
        setError(err.message || 'Erro ao autenticar com o Google. Utilize a opção por e-mail abaixo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let fullEmail = emailInput.trim().toLowerCase();
    if (fullEmail && !fullEmail.includes('@')) {
      fullEmail = `${fullEmail}@${ALLOWED_CORPORATE_DOMAIN}`;
    }

    processCorporateLogin(fullEmail, nameInput, undefined, selectedDept);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-950 font-sans">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-6 relative overflow-hidden text-center">
        {/* Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />

        {/* Brand Logo & Name */}
        <div className="space-y-3 pt-2 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 p-3 flex items-center justify-center border border-orange-500/20 shadow-xs">
            <img 
              src={SOU_ENERGY_ICON} 
              alt="Logo Sou Energy" 
              className="w-full h-full object-contain" 
            />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-wider text-neutral-900 dark:text-white uppercase">
              SOU ENERGY
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">
              Biblioteca de Procedimentos
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
              Acesso restrito para colaboradores da Sou Energy.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1.5 text-[12px] leading-relaxed">
              <p>{error}</p>
              {isDomainError && (
                <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-900/40 p-2 rounded-lg font-mono">
                  Dica: Adicione <strong>{currentHost}</strong> em <em>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</em>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google Workspace Button */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {/* Google SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Conectando ao Google...' : 'Entrar com Google Workspace'}</span>
          </button>
        </div>

        {/* Fallback Corporate Email Form (Shown on demand or if popup/domain error) */}
        {showManualForm ? (
          <form onSubmit={handleManualEmailSubmit} className="space-y-4 pt-3 text-left border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in">
            <div className="text-center">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Acesso Direto com E-mail @souenergy.com.br
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Seu e-mail corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="nome.sobrenome@souenergy.com.br"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Nome completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex: João Victor Silva"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Departamento / Setor
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !emailInput.trim()}
              className="w-full py-3 px-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isLoading ? 'Verificando...' : 'Confirmar e Acessar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowManualForm(true)}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium cursor-pointer"
            >
              Problemas com pop-up ou autorização de domínio? Clique aqui
            </button>
          </div>
        )}

        {/* Security Info */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Apenas contas <strong>@{ALLOWED_CORPORATE_DOMAIN}</strong></span>
        </div>
      </div>
    </div>
  );
};
