import React from 'react';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { StoreConfig } from '../types';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = React.useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-modal-title"
      >
        {/* Header with App Branding */}
        <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 sm:p-6 pb-6 text-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg p-1.5 mb-3 flex items-center justify-center border-2 border-emerald-300">
              <img
                src={config.logoUrl || '/icon.svg'}
                alt="App Icon"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>Aplicación Web Progresiva (PWA)</span>
            </div>

            <h2 id="pwa-modal-title" className="text-lg sm:text-xl font-black text-white leading-tight">
              Instalar {config.storeName || 'VentaDirecta 24/7'}
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-xs">
              Ten el catálogo en la pantalla de inicio de tu teléfono con acceso directo y rápido
            </p>
          </div>
        </div>

        {/* Modal Body with Installation Steps */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">¡La aplicación ya está instalada!</h3>
              <p className="text-xs text-stone-600">
                Puedes abrirla directamente desde los iconos de aplicaciones en la pantalla principal de tu dispositivo.
              </p>
            </div>
          ) : (
            <>
              {/* Direct 1-Click Install Button if supported by browser (Chromium/Android) */}
              {isInstallable && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Download className="w-5 h-5" />
                    <span>{installing ? 'Instalando...' : 'Instalar Ahora en tu Teléfono'}</span>
                  </button>
                  <p className="text-[11px] text-center text-stone-500">
                    Instalación instantánea oficial sin necesidad de pasar por Play Store
                  </p>
                </div>
              )}

              {/* iOS Safari Instructions */}
              {isIOS ? (
                <div className="p-4 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Instrucciones para iPhone / iPad (Safari)</span>
                  </div>

                  <ol className="space-y-2.5 text-xs text-stone-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Toca el botón <strong>Compartir</strong> en la barra inferior de Safari{' '}
                        <Share2 className="w-3.5 h-3.5 inline text-blue-600 align-text-bottom" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Desliza hacia abajo y presiona <strong>"Agregar a la pantalla de inicio"</strong>{' '}
                        <PlusSquare className="w-3.5 h-3.5 inline text-stone-700 align-text-bottom" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Toca <strong>"Agregar"</strong> en la esquina superior derecha para confirmar.
                      </span>
                    </li>
                  </ol>
                </div>
              ) : !isInstallable ? (
                /* Fallback Android / Chrome / Mobile Browser Instructions */
                <div className="p-4 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Cómo instalar en tu dispositivo</span>
                  </div>

                  <ol className="space-y-2.5 text-xs text-stone-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Toca el menú del navegador <strong>(los 3 puntos ⋮ en la esquina superior derecha)</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Selecciona la opción <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla principal"</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Confirma tocando <strong>"Instalar"</strong> para tener el icono en tu pantalla de inicio.
                      </span>
                    </li>
                  </ol>
                </div>
              ) : null}

              {/* Benefits of Installing */}
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Ventajas de instalar la App:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Carga ultra rápida</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Acceso con 1 toque</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sin anuncios externos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>No ocupa espacio</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
