import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  TvMinimalPlay,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  X
} from 'lucide-react';

interface AuthProps {
  onAdminClick?: () => void;
}

export const Auth: React.FC<AuthProps> = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery modal
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [regFullName, setRegFullName] = useState<string>('');
  const [regCompany, setRegCompany] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regTerms, setRegTerms] = useState<boolean>(true);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (!regTerms) {
      setErrorMessage('Você deve aceitar os termos de uso e política de privacidade.');
      setIsLoading(false);
      return;
    }

    try {
      // Simple client fingerprint to prevent trial abuse
      const fingerprint = `fp_${navigator.userAgent.replace(/\D/g, '').substring(0, 10)}`;

      await register({
        full_name: regFullName,
        company_name: regCompany,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        confirm_password: regConfirmPassword,
        terms_accepted: regTerms,
        fingerprint
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.recoverPassword(recoveryEmail);
      setRecoveryMessage(res.temp_password_info || res.message);
    } catch (err: any) {
      setRecoveryMessage(err.message || 'Erro ao processar recuperação.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Presentation & Hero Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center p-1 shadow-xl shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo Gestor de Streamings" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">
                Gestor de Streamings
              </span>
              <span className="text-xs text-blue-400 font-medium tracking-wide">
                SaaS para IPTV & Streaming
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Gerencie seus clientes, mensalidades e WhatsApp em uma única plataforma.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Sistema completo desenvolvido para revendedores de IPTV, canais fechados, Netflix, Disney+ e combos de streaming.
            </p>
          </div>

          {/* Value Highlights */}
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span><strong>24 horas de teste gratuito</strong> ativado no cadastro</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Licença vitalícia por <strong>R$ 199,00</strong> (sem mensalidades)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <span>Lembretes automáticos no WhatsApp com anti-duplicação</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Isolamento SaaS multi-empresa com exportações Excel e CSV</span>
            </div>
          </div>
        </div>

        {/* Auth Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-slate-800/80 backdrop-blur-md p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-700/80 shadow-2xl space-y-4 sm:space-y-6">
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 lg:hidden pb-3 border-b border-slate-700/60">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-white text-base block leading-tight">Gestor de Streamings</span>
              <span className="text-[11px] text-blue-400 font-medium">SaaS IPTV & Assinaturas</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-slate-700">
            <button
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Criar Conta (Teste 24h)
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-xs text-rose-200">
              {errorMessage}
            </div>
          )}


          {/* Form Login */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Senha</label>
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(true)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </form>
          )}

          {/* Form Register */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Nome da Empresa / Negócio *</label>
                  <input
                    type="text"
                    required
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    placeholder="Ex: TurboPlay IPTV"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="11999998888"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Senha *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Confirmar Senha *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-400 pt-1">
                <input
                  type="checkbox"
                  required
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                />
                <span>
                  Declaro que aceito os Termos de Uso e a Política de Privacidade do Gestor de Streamings SaaS.
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md disabled:opacity-50"
              >
                {isLoading ? 'Ativando Teste...' : 'Criar Conta e Iniciar 24h Grátis'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Password Recovery Modal */}
      {isRecoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-700 space-y-4 max-h-[92vh] overflow-y-auto my-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Recuperar Senha</h3>
              <button
                onClick={() => { setIsRecoveryOpen(false); setRecoveryMessage(null); }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Digite seu e-mail cadastrado para gerar uma chave temporária de redefinição.
            </p>

            <form onSubmit={handleRecoverPassword} className="space-y-3">
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />

              {recoveryMessage && (
                <div className="p-3 bg-blue-950/80 border border-blue-700 text-blue-200 rounded-xl text-xs">
                  {recoveryMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
              >
                Enviar Instruções
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
