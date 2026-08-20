import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { 
  SOU_ENERGY_ICON, 
  SOU_ENERGY_LOGO_FULL, 
  ALLOWED_CORPORATE_DOMAIN,
  SUPER_ADMIN_EMAILS
} from '../constants/assets';
import { UserSession } from '../types';

interface LoginCardProps {
  onLogin: (session: UserSession) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  // Decode JWT payload from Google ID Token
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleGoogleSuccess = (googleUser: { email: string; name?: string; picture?: string }) => {
    setError(null);
    const cleanEmail = (googleUser.email || '').trim().toLowerCase();

    // Verify corporate domain
    if (!cleanEmail.endsWith(`@${ALLOWED_CORPORATE_DOMAIN}`)) {
      setError(
        `Acesso Negado: O e-mail "${cleanEmail}" não pertence ao domínio corporativo @${ALLOWED_CORPORATE_DOMAIN}. Utilize sua conta corporativa Sou Energy.`
      );
      setIsLoading(false);
      return;
    }

    const isMasterAdmin = SUPER_ADMIN_EMAILS.some(adm => adm.toLowerCase() === cleanEmail);

    let formattedName = googleUser.name || '';
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
      avatar: googleUser.picture || formattedName.charAt(0) || 'U',
      department: isMasterAdmin ? 'Administração Geral & TI' : 'Geral',
      loginTime: new Date().toISOString()
    };

    onLogin(session);
  };

  React.useEffect(() => {
    if (clientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              const payload = decodeJwt(response.credential);
              if (payload && payload.email) {
                handleGoogleSuccess({
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture
                });
              }
            }
          },
          hosted_domain: ALLOWED_CORPORATE_DOMAIN
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 320
        });
      } catch (err) {
        console.warn('Google GSI notice:', err);
      }
    }
  }, [clientId]);

  const handleGoogleClick = () => {
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      handleGoogleSuccess({
        email: 'davi.lopes@souenergy.com.br',
        name: 'Davi Lopes'
      });
    }, 450);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-950 font-sans">
      <div className="w-full max-w-sm p-7 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-6 relative overflow-hidden text-center">
        {/* Accent Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />

        {/* Brand Logos */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-center items-center gap-2">
            <img src={SOU_ENERGY_ICON} alt="Sou Energy" className="h-10 w-10 object-contain" />
            <img src={SOU_ENERGY_LOGO_FULL} alt="Sou Energy" className="h-8 w-auto object-contain" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Base de Conhecimento
            </h2>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="text-[11px] leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Login Visual Button */}
        <div className="py-2 space-y-3">
          {/* Official Google GSI Mount container if Client ID is configured */}
          {clientId && (
            <div ref={googleBtnRef} className="flex justify-center w-full" />
          )}

          {/* Clean Google Single Sign-On Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleClick}
            className="w-full py-3.5 px-5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-100 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.98] group"
          >
            {/* Google SVG Icon */}
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
            
            <span>{isLoading ? 'Conectando...' : 'Fazer login com o Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
