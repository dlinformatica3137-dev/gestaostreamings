import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Copy,
  QrCode,
  CreditCard,
  ExternalLink,
  Sparkles,
  Zap,
  Lock,
  Loader2,
  RefreshCw
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, closeCheckout, refreshLicense, license } = useAuth();
  const [activeTab, setActiveTab] = useState<'pix' | 'mercadopago'>('mercadopago');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoadingPref, setIsLoadingPref] = useState<boolean>(false);
  const [preferenceData, setPreferenceData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isCheckoutOpen && !preferenceData) {
      loadPreference();
    }
  }, [isCheckoutOpen]);

  const loadPreference = async () => {
    setIsLoadingPref(true);
    try {
      const data = await api.createMercadoPagoPreference();
      setPreferenceData(data);
    } catch (err) {
      console.error('Erro ao gerar preferência:', err);
    } finally {
      setIsLoadingPref(false);
    }
  };

  const handleCopyPix = () => {
    if (!preferenceData?.pixCode) return;
    navigator.clipboard.writeText(preferenceData.pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulatePayment(preferenceData?.transaction?.id);
      setSuccessMessage('Pagamento de R$ 199,00 Aprovado com sucesso! Licença vitalícia ativada.');
      await refreshLicense();
      setTimeout(() => {
        closeCheckout();
        setSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Erro ao processar simulação.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Adquirir Licença Vitalícia</h3>
              <p className="text-xs text-slate-300">Gestor de Streamings — Pagamento único sem mensalidades</p>
            </div>
          </div>
          <button
            onClick={closeCheckout}
            aria-label="Fechar checkout"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="m-4 sm:m-6 p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-sm font-semibold">{successMessage}</div>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Price & Benefits Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Investimento Único
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                  R$ 199,00
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full">
                  Sem mensalidades
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Acesso permanente com todas as atualizações de IPTV, WhatsApp e recursos inclusos.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Cadastro ilimitado de clientes e assinaturas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Automação completa de lembretes no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Exportações completas para CSV e Excel (.xlsx)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Liberação automática via Webhook</span>
              </div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('mercadopago')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'mercadopago'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Checkout Mercado Pago (Cartão / Boleto / Pix)</span>
            </button>
            <button
              onClick={() => setActiveTab('pix')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'pix'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Pix QR Code Direto</span>
            </button>
          </div>

          {/* Tab 1: Pix */}
          {activeTab === 'pix' && (
            <div className="space-y-4">
              {isLoadingPref ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <span className="text-xs">Gerando cobrança Pix segura...</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                    {/* QR Code Illustration */}
                    <div className="w-36 h-36 bg-white p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0">
                      <div className="w-full h-full border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 text-center p-2">
                        <QrCode className="w-16 h-16 text-slate-800 mb-1" />
                        <span className="text-[10px] font-mono font-semibold text-slate-700">PIX R$ 199,00</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Como pagar com Pix:
                      </h4>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                        <li>Abra o aplicativo do seu banco preferido.</li>
                        <li>Escolha a opção <strong>Pix com Copia e Cola</strong> ou Ler QR Code.</li>
                        <li>Cole o código abaixo e confirme o valor de <strong>R$ 199,00</strong>.</li>
                        <li>A licença é ativada em segundos assim que confirmado!</li>
                      </ol>
                    </div>
                  </div>

                  {/* Pix Copy and Paste Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Código Pix Copia e Cola:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={preferenceData?.pixCode || 'Carregando código...'}
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-all"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Mercado Pago Checkout */}
          {activeTab === 'mercadopago' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-2">
                <p>
                  Ao prosseguir, você será redirecionado ao ambiente oficial do <strong>Mercado Pago</strong> com opções de Cartão de Crédito em até 12x, Pix e Boleto.
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  A confirmação de pagamento é enviada automaticamente ao nosso Webhook oficial para ativação imediata da licença.
                </p>
              </div>

              {preferenceData?.initPoint ? (
                <a
                  href={preferenceData.initPoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#009EE3] hover:bg-[#0081B8] text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ative Vitalício por R$ 199 — Ir para Checkout Seguro</span>
                </a>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  Gerando link de checkout do Mercado Pago...
                </div>
              )}
            </div>
          )}

          {/* Sandbox & Verification Action Box */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Transação protegida por Webhook criptografado</span>
            </div>

            {/* Test Simulation Button (Allows instant activation for testing & evaluation) */}
            <button
              onClick={handleSimulatePayment}
              disabled={isSimulating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Webhook...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Aprovar Pagamento Agora (Simulação / Teste)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
