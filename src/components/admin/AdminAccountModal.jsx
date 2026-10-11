import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  updateAdminEmail,
  updateAdminPassword,
  sendAdminPasswordReset,
} from '../../services/firebase';

export default function AdminAccountModal({ isOpen, onClose, user }) {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const currentEmail = user?.email || 'segafal@gmail.com';

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setStatusMsg({ type: 'error', text: 'Veuillez saisir une nouvelle adresse email valide.' });
      return;
    }
    setLoadingEmail(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await updateAdminEmail(newEmail);
      setStatusMsg({
        type: 'success',
        text: `Adresse email mise à jour avec succès vers ${newEmail.trim().toLowerCase()}.`,
      });
      setNewEmail('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setStatusMsg({
          type: 'error',
          text: 'Sécurité Firebase : pour modifier votre email, veuillez vous reconnecter récemment puis réessayer.',
        });
      } else {
        setStatusMsg({ type: 'error', text: err.message || 'Erreur lors de la mise à jour de l’email.' });
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Le mot de passe doit comporter au moins 6 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    setLoadingPass(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await updateAdminPassword(newPassword);
      setStatusMsg({
        type: 'success',
        text: 'Mot de passe administrateur mis à jour avec succès !',
      });
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setStatusMsg({
          type: 'error',
          text: 'Sécurité Firebase : pour définir ou changer le mot de passe, veuillez vous reconnecter récemment ou utiliser le lien de réinitialisation ci-dessous.',
        });
      } else {
        setStatusMsg({ type: 'error', text: err.message || 'Erreur lors du changement de mot de passe.' });
      }
    } finally {
      setLoadingPass(false);
    }
  };

  const handleSendResetEmail = async () => {
    setLoadingReset(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await sendAdminPasswordReset(currentEmail);
      setStatusMsg({
        type: 'success',
        text: `Un lien de réinitialisation sécurisé a été envoyé à ${currentEmail}. Vérifiez votre boîte de réception.`,
      });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'Erreur lors de l’envoi du lien de réinitialisation.' });
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}>
              <Shield size={20} color="#10b981" />
            </div>
            <div>
              <h2 style={styles.title}>Paramètres du Compte Administrateur</h2>
              <p style={styles.subtitle}>Gérez vos accès de connexion et la sécurité du compte</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Info compte actuel */}
        <div style={styles.currentInfoCard}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Compte connecté :</span>
            <strong style={styles.infoValue}>{currentEmail}</strong>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Statut d'accès :</span>
            <span style={styles.superadminBadge}>Superadmin vérifié</span>
          </div>
        </div>

        {/* Feedback message */}
        {statusMsg.text && (
          <div
            style={{
              ...styles.messageBox,
              ...(statusMsg.type === 'error' ? styles.messageError : styles.messageSuccess),
            }}
          >
            {statusMsg.type === 'error' ? (
              <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div style={styles.sectionsContainer}>
          {/* Section 1 : Changer l'Email */}
          <form onSubmit={handleUpdateEmail} style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <Mail size={16} color="#34d399" />
              <h3 style={styles.cardTitle}>Modifier l'adresse Email</h3>
            </div>
            <p style={styles.cardDesc}>
              Modifie l'identifiant de connexion principal et met à jour votre profil Firestore.
            </p>
            <div style={styles.inputGroup}>
              <input
                type="email"
                placeholder="Nouvelle adresse email (ex: admin@bizgames.com)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={styles.input}
              />
              <button
                type="submit"
                disabled={loadingEmail || !newEmail.trim()}
                style={styles.actionBtn}
              >
                {loadingEmail ? <Loader2 size={15} className="spin" /> : <span>Mettre à jour l'email</span>}
              </button>
            </div>
          </form>

          {/* Section 2 : Changer le Mot de Passe */}
          <form onSubmit={handleUpdatePassword} style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <KeyRound size={16} color="#f59e0b" />
              <h3 style={styles.cardTitle}>Changer le Mot de Passe</h3>
            </div>
            <p style={styles.cardDesc}>
              Définissez un mot de passe fort pour vous connecter par email + mot de passe.
            </p>
            <div style={styles.inputsColumn}>
              <div style={styles.inputWrapper}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Nouveau mot de passe (6 car. min.)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.inputWithToggle}
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showNewPassword ? (
                    <EyeOff size={16} color="#34d399" />
                  ) : (
                    <Eye size={16} color="#94a3b8" />
                  )}
                </button>
              </div>

              <div style={styles.inputWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmer le nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.inputWithToggle}
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} color="#34d399" />
                  ) : (
                    <Eye size={16} color="#94a3b8" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loadingPass || !newPassword || newPassword.length < 6}
                style={styles.actionBtnOrange}
              >
                {loadingPass ? <Loader2 size={15} className="spin" /> : <span>Valider le nouveau mot de passe</span>}
              </button>
            </div>
          </form>

          {/* Section 3 : Lien de réinitialisation direct */}
          <div style={styles.resetBox}>
            <div>
              <strong style={{ fontSize: '13px', color: '#e2e8f0', display: 'block', marginBottom: '2px' }}>
                Réinitialisation par email en 1 clic
              </strong>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Recevez directement un lien sécurisé sur <strong>{currentEmail}</strong>
              </span>
            </div>
            <button
              onClick={handleSendResetEmail}
              disabled={loadingReset}
              style={styles.resetBtn}
            >
              {loadingReset ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <>
                  <Send size={13} />
                  <span>Envoyer le lien</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#051813',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.15)',
    padding: '28px',
    color: '#f8fafc',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    margin: '3px 0 0 0',
    fontSize: '12px',
    color: '#94a3b8',
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentInfoCard: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '14px 18px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: '13px',
    color: '#34d399',
    fontFamily: 'monospace',
  },
  superadminBadge: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '20px',
    textTransform: 'uppercase',
  },
  messageBox: {
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
  },
  messageSuccess: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#a7f3d0',
  },
  messageError: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
  },
  sectionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardSection: {
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  cardDesc: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
  },
  inputsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(3, 18, 14, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputWithToggle: {
    width: '100%',
    padding: '10px 38px 10px 14px',
    borderRadius: '10px',
    background: 'rgba(3, 18, 14, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    lineHeight: 1,
  },
  actionBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    background: '#10b981',
    color: '#03120e',
    fontWeight: '700',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  },
  actionBtnOrange: {
    padding: '10px 16px',
    borderRadius: '10px',
    background: '#f59e0b',
    color: '#03120e',
    fontWeight: '700',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBox: {
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px dashed rgba(16, 185, 129, 0.3)',
    borderRadius: '14px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  resetBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  },
};
