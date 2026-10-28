import React, { useState } from 'react';
import { X, ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<any>;
  onSuccess: () => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSuccess
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toUpperCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Por favor ingresa tu usuario y clave.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await onLogin(cleanUser, cleanPass);
      onSuccess();
      onClose();
      setUsername('');
      setPassword('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Usuario o clave incorrectos. Verifica tus credenciales de acceso.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200/90 relative animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/[0.04]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-stone-900/10 ring-4 ring-emerald-500/20">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <span className="inline-block text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1 uppercase font-mono">
            Acceso Privado Protegido
          </span>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Panel de Propietario
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Ingresa tus credenciales autorizadas para administrar productos, precios en vivo y pedidos desde cualquier dispositivo.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Usuario */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Nombre de Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoFocus
                autoCapitalize="characters"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder="Ingresa tu usuario"
                className="w-full pl-10 pr-3 py-2.5 text-sm font-mono font-bold text-stone-900 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all uppercase"
              />
            </div>
          </div>

          {/* Campo Clave */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Clave / Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm font-mono font-medium text-stone-900 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Verificando...' : 'Entrar al Panel Propietario'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
