import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { loginWithEmail, logoutUser } from '../../services/firebase';

export default function AdminLogin({ onLoginSuccess, onGoHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checkIsUserAdmin = (user) => {
    if (!user) return false;
    const emailNorm = user.email?.trim().toLowerCase();
    return emailNorm === 'segafal@gmail.com';
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez saisir votre e-mail et votre mot de passe.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { user, isAdmin, error } = await loginWithEmail(email, password);
      if (error) {
        setErrorMessage(error);
        setLoading(false);
        return;
      }

      if (user) {
        const hasAccess = isAdmin || checkIsUserAdmin(user);
        if (!hasAccess) {
          await logoutUser();
          setErrorMessage('Accès refusé : ce compte ne dispose pas des privilèges administrateur.');
          setLoading(false);
          return;
        }

        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background glow decoration */}
      <div style={styles.glowBg} />

      <div style={styles.card}>
        {/* Top Header */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Shield size={36} color="#fbbf24" />
          </div>
          <div style={styles.badge}>
            <Sparkles size={12} color="#10b981" />
            <span>ACCÈS STRICTEMENT RÉSERVÉ</span>
          </div>
          <h1 style={styles.title}>BizGames Admin</h1>
          <p style={styles.subtitle}>
            Saisissez vos identifiants administrateur pour ouvrir l'espace de gestion et supervision.
          </p>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulaire de connexion sécurisée par Email / Password */}
        <form onSubmit={handleEmailSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Adresse e-mail</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#6ee7b7" style={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="segafal@gmail.com"
                style={styles.input}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#6ee7b7" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={styles.input}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#34d399" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={styles.spinnerIcon} />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Accéder à l'espace Admin</span>
              </>
            )}
          </button>
        </form>

        {/* Retour au jeu public */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={onGoHome}
            style={styles.backBtn}
          >
            <ArrowLeft size={15} />
            <span>Retour au jeu public</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#020b08',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
  },

  glowBg: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },

  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'rgba(6, 24, 18, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '24px',
    padding: '36px 32px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 10,
  },

  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },

  iconWrapper: {
    width: '68px',
    height: '68px',
    borderRadius: '20px',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 8px 24px rgba(251, 191, 36, 0.2)',
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: '#34d399',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '12px',
  },

  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
    margin: '0 0 6px 0',
    letterSpacing: '-0.3px',
  },

  subtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.5,
  },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#fca5a5',
    fontSize: '13px',
    marginBottom: '20px',
    lineHeight: 1.4,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },

  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  inputIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },

  input: {
    width: '100%',
    padding: '13px 44px 13px 44px',
    backgroundColor: 'rgba(2, 11, 8, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  },

  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitBtn: {
    marginTop: '6px',
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: '#10b981',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
    transition: 'all 0.2s ease',
  },

  spinnerIcon: {
    animation: 'spin 1s linear infinite',
  },

  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },

  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'color 0.2s ease',
  },
};
