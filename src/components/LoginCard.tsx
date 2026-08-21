import React from 'react';
import { AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
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

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure Google prompts to pick account
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

      // Check corporate domain strictly
      if (!email.endsWith(`@${ALLOWED_CORPORATE_DOMAIN}`)) {
        setError(
          `Acesso Negado: A conta Google "${email}" não pertence ao domínio @${ALLOWED_CORPORATE_DOMAIN}. Por favor, entre com sua conta institucional da Sou Energy.`
        );
        setIsLoading(false);
        return;
      }

      const isMasterAdmin = SUPER_ADMIN_EMAILS.some(adm => adm.toLowerCase() === email);

      let formattedName = (user.displayName || '').trim();
      if (!formattedName) {
        const namePart = email.split('@')[0];
        formattedName = namePart
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }

      const session: UserSession = {
        email: email,
        name: formattedName,
        role: isMasterAdmin ? 'admin' : 'colaborador',
        isAdmin: isMasterAdmin,
        avatar: user.photoURL || formattedName.charAt(0).toUpperCase() || 'U',
        department: isMasterAdmin ? 'Administração Geral & TI' : 'Geral / Operações',
        loginTime: new Date().toISOString()
      };

      onLogin(session);
    } catch (err: any) {
      console.warn('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela de autenticação do Google foi fechada antes da conclusão.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou a janela pop-up. Por favor, permita pop-ups para este site e tente novamente.');
      } else {
        setError(err.message || 'Erro ao autenticar com o Google Workspace. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
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
              Acesso exclusivo para colaboradores via conta corporativa Google Workspace.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="text-[12px] leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Workspace Login Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {/* Google Icon */}
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

        {/* Security Info */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Apenas contas <strong>@{ALLOWED_CORPORATE_DOMAIN}</strong></span>
        </div>
      </div>
    </div>
  );
};
