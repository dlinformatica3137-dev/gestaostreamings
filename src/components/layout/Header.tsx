import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Menu, Shield, Key } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange?: (tab: string) => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, onToggleMobileSidebar }) => {
  const { user } = useAuth();

  const isMasterAdmin =
    (user as any)?.role === 'superadmin' ||
    (user as any)?.role === 'owner' ||
    user?.email === 'bambamtelas@gmail.com' ||
    user?.email === 'admin@gestorstream.com' ||
    user?.email === 'demo@gestorstream.com' ||
    Boolean(localStorage.getItem('gestor_stream_superadmin_token'));

  const getBreadcrumbTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Principal';
      case 'customers': return 'Gerenciamento de Clientes';
      case 'plans': return 'Planos Comerciais';
      case 'applications': return 'Cadastro de Aplicativos';
      case 'finance': return 'Financeiro & Cobranças';
      case 'whatsapp': return 'Automação de WhatsApp';
      case 'settings': return 'Configurações do Sistema';
      case 'superadmin': return 'Painel Admin Master';
      default: return 'Painel';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Zone 1: Mobile menu toggle + Brand Wordmark / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          aria-label="Abrir menu lateral"
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 hidden sm:inline whitespace-nowrap">
            {user?.company_name || 'Gestor de Streamings'}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap truncate max-w-[180px] sm:max-w-none">
            {getBreadcrumbTitle(currentTab)}
          </span>
        </div>
      </div>

      {/* Right Zone: Action to change password / settings */}
      <div className="flex items-center gap-2.5 text-xs">
        <button
          onClick={() => onTabChange?.('settings')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 font-medium transition-all shadow-xs border border-slate-200/60 dark:border-slate-700/60"
          title="Trocar minha senha"
        >
          <Key className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Trocar Senha</span>
        </button>
      </div>
    </header>
  );
};
