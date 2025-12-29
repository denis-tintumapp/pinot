/**
 * Página de Registro de Participante Permanente
 * Permite a usuarios registrarse como participantes permanentes
 * Requiere: Alias, Nombre Completo, Email, Teléfono
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { crearParticipantePermanente, verificarParticipacionExistente } from '../../utils/participantes';
import { useRecaptcha } from '../../hooks/useRecaptcha';

const RegistroParticipantePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventoId = searchParams.get('eventoId');
  
  const [alias, setAlias] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    alias: false,
    nombreCompleto: false,
    email: false,
    telefono: false,
    password: false,
    confirmPassword: false
  });

  const { executeRecaptcha } = useRecaptcha(true);

  useEffect(() => {
    if (!eventoId) {
      setError('No se especificó un evento. Redirigiendo...');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [eventoId, navigate]);

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const validarFormulario = (): boolean => {
    if (!alias.trim() || alias.trim().length > 20) {
      setError('El alias es requerido y debe tener máximo 20 caracteres');
      return false;
    }
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es requerido');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return false;
    }
    if (!telefono.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) {
      return;
    }

    if (!eventoId) {
      setError('No se especificó un evento');
      return;
    }

    setLoading(true);

    try {
      // Verificar si ya existe participación
      const participacion = await verificarParticipacionExistente(eventoId);
      if (participacion.existe) {
        setError('Ya estás registrado como participante en este evento');
        setLoading(false);
        navigate(`/participar?evento=${eventoId}`);
        return;
      }

      // Obtener token de reCAPTCHA
      const recaptchaToken = await executeRecaptcha('register_participant');

      // Inicializar Firebase si no está inicializado
      let app;
      if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      if (!app) {
        throw new Error('No se pudo inicializar Firebase');
      }

      // Crear usuario en Firebase Auth
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Actualizar perfil con nombre completo
      await updateProfile(user, {
        displayName: nombreCompleto.trim()
      });

      // Enviar email de verificación
      await sendEmailVerification(user);

      // Crear participante permanente en Firestore
      const resultado = await crearParticipantePermanente(eventoId, {
        alias: alias.trim(),
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim(),
        telefono: telefono.trim()
      });

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al crear participante');
      }

      // Redirigir a verificación de email
      navigate(`/auth/verify-email?email=${encodeURIComponent(email)}&eventoId=${eventoId}`);
    } catch (err: any) {
      console.error('Error al registrar participante:', err);
      
      let errorMessage = 'Error al registrar participante';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado. Por favor, inicia sesión.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/images/logo-pinot.png"
              alt="Pinot Logo"
              className="w-full max-w-[560px]"
            />
          </div>
          <h1 className="text-white/90 text-lg font-medium font-branding">Registro de Participante</h1>
          <p className="text-white/70 text-sm mt-2">Completa tus datos para participar</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                Alias *
              </label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                onBlur={() => handleFieldBlur('alias')}
                maxLength={20}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Tu alias (máx. 20 caracteres)"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                onBlur={() => handleFieldBlur('nombreCompleto')}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onBlur={() => handleFieldBlur('telefono')}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="+54 9 11 1234-5678"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleFieldBlur('password')}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-1">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleFieldBlur('confirmPassword')}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Repite tu contraseña"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:from-purple-600 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrarse y Participar'}
            </button>

            <div className="text-center">
              <p className="text-white/70 text-sm">
                ¿Ya tienes cuenta?{' '}
                <a href={`/auth/login?eventoId=${eventoId}`} className="text-white hover:underline">
                  Inicia sesión
                </a>
              </p>
            </div>

            <div className="text-center">
              <a href={`/participar?evento=${eventoId}`} className="text-white/70 hover:text-white text-sm underline">
                Participar como invitado (sin registro)
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistroParticipantePage;



