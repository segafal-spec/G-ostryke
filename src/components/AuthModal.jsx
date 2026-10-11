import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  LogOut,
  AlertCircle,
  Trophy,
  Flame,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Globe2,
  Briefcase,
  Calendar,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  checkPseudoAvailability,
  setUserPseudo,
  resendUserVerificationEmail,
} from '../services/firebase';
import {
  COUNTRY_OPTIONS,
  AGE_RANGE_OPTIONS,
  PROFESSION_OPTIONS,
} from '../utils/geo';

export default function AuthModal({
  isOpen,
  onClose,
  authInfo,
  onSuccess,
  authReason = 'general', // 'play' | 'general'
  invitedBy = null,
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [step, setStep] = useState('auth'); // 'auth' | 'choose_pseudo' | 'verification_pending'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [country, setCountry] = useState('FR');
  const [ageRange, setAgeRange] = useState('');
  const [profession, setProfession] = useState('');
  const [pseudoStatus, setPseudoStatus] = useState({ checking: false, available: null, message: '' });
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, sent: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Vérifier si l'utilisateur est authentifié et possède déjà un pseudo configuré
  const isUserLoggedIn = authInfo && authInfo.user && !authInfo.isAnonymous;
  const user = authInfo?.user;
  const stats = authInfo?.stats;
  const hasConfiguredPseudo = Boolean(stats?.pseudo?.trim() || user?.displayName?.trim());

  // Si l'utilisateur est connecté mais n'a pas encore de pseudo enregistré
  useEffect(() => {
    if (isUserLoggedIn && !hasConfiguredPseudo && step !== 'choose_pseudo') {
      setStep('choose_pseudo');
      setPseudo(user?.displayName || user?.email?.split('@')[0] || '');
    }
  }, [isUserLoggedIn, hasConfiguredPseudo, step, user]);

  // Vérification en direct de la disponibilité du pseudo sur Firebase avec debounce
  useEffect(() => {
    const trimmed = pseudo.trim();
    if (!trimmed || trimmed.length < 3) {
      setPseudoStatus({ checking: false, available: null, message: '' });
      return;
    }

    setPseudoStatus({ checking: true, available: null, message: 'Vérification sur Firebase...' });
    const timer = setTimeout(async () => {
      const res = await checkPseudoAvailability(trimmed, user?.uid || null);
      if (res.available) {
        setPseudoStatus({
          checking: false,
          available: true,
          message: 'Ce pseudo est disponible !',
        });
      } else {
        setPseudoStatus({
          checking: false,
          available: false,
          message: res.error,
        });
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [pseudo, user?.uid]);

  if (!isOpen) return null;

  // Réinitialiser les champs et messages
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setPseudo('');
    setErrorMessage('');
    setSuccessMessage('');
    setPendingVerificationEmail('');
    setResendStatus({ loading: false, success: false, sent: false, message: '' });
    setPseudoStatus({ checking: false, available: null, message: '' });
    setStep('auth');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };



  // Connexion Email avec vérification obligatoire du statut e-mail
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setResendStatus({ loading: false, success: false, sent: false, message: '' });

    const { user: loggedUser, needsPseudo, needsVerification, unverifiedEmail, isAdmin, error } =
      await loginWithEmail(email, password);
    setLoading(false);

    if (error === 'EMAIL_NOT_VERIFIED' || needsVerification) {
      setPendingVerificationEmail(unverifiedEmail || email);
      setErrorMessage('EMAIL_NOT_VERIFIED');
      return;
    }

    if (error) {
      setErrorMessage(error);
      return;
    }

    if (loggedUser) {
      const isUserAdmin = Boolean(
        isAdmin ||
        loggedUser.email?.trim().toLowerCase() === 'segafal@gmail.com'
      );

      if (needsPseudo && !isUserAdmin) {
        setStep('choose_pseudo');
        setPseudo(loggedUser.displayName || email.split('@')[0] || '');
      } else {
        setSuccessMessage(isUserAdmin ? 'Connexion Administrateur réussie !' : 'Connexion réussie !');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess(loggedUser);
        }, isUserAdmin ? 150 : 500);
      }
    }
  };

  // Inscription Email avec validation impérative de l'e-mail
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    const cleanPseudo = pseudo.trim();
    if (!cleanPseudo) {
      setErrorMessage('Veuillez renseigner un pseudo pour votre compte.');
      return;
    }
    if (cleanPseudo.length < 3) {
      setErrorMessage('Le pseudo doit comporter au moins 3 caractères.');
      return;
    }
    if (pseudoStatus.available === false) {
      setErrorMessage(pseudoStatus.message || 'Ce pseudo est déjà pris. Veuillez en choisir un autre.');
      return;
    }
    if (!email || !password) {
      setErrorMessage('Veuillez renseigner un e-mail et un mot de passe.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (!country) {
      setErrorMessage('Veuillez sélectionner votre pays dans la liste déroulante.');
      return;
    }
    if (!ageRange) {
      setErrorMessage('Veuillez sélectionner votre tranche d\'âge dans la liste déroulante.');
      return;
    }
    if (!profession) {
      setErrorMessage('Veuillez sélectionner votre profession ou secteur d\'activité.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setResendStatus({ loading: false, success: false, sent: false, message: '' });

    const selectedCountryObj = COUNTRY_OPTIONS.find((c) => c.code === country);
    const additionalProfile = {
      country: selectedCountryObj?.name || country,
      countryFlag: selectedCountryObj?.flag || '🌍',
      ageRange,
      profession,
    };

    const { needsVerification, email: registeredEmail, error } = await registerWithEmail(
      email,
      password,
      cleanPseudo,
      invitedBy,
      additionalProfile
    );
    setLoading(false);

    if (error) {
      setErrorMessage(error);
    } else if (needsVerification) {
      setPendingVerificationEmail(registeredEmail || email);
      setStep('verification_pending');
      // Conserver le mot de passe en mémoire pour permettre le renvoi de l'e-mail si nécessaire
    }
  };

  // Renvoi de l'e-mail de confirmation
  const handleResendVerification = async () => {
    const targetEmail = pendingVerificationEmail || email;
    if (!targetEmail) {
      setResendStatus({ loading: false, success: false, sent: false, message: 'Adresse e-mail manquante.' });
      return;
    }
    if (!password) {
      setResendStatus({
        loading: false,
        success: false,
        sent: false,
        message: 'Veuillez saisir votre mot de passe pour renvoyer le lien d’activation.',
      });
      return;
    }
    setResendStatus({ loading: true, success: false, sent: false, message: '' });
    const res = await resendUserVerificationEmail(targetEmail, password);
    if (res.success) {
      if (res.alreadyVerified) {
        setResendStatus({
          loading: false,
          success: true,
          sent: true,
          message: 'Votre adresse e-mail est déjà validée ! Vous pouvez vous connecter dès maintenant.',
        });
      } else {
        setResendStatus({
          loading: false,
          success: true,
          sent: true,
          message: `E-mail de confirmation renvoyé à ${targetEmail} ! Vérifiez votre messagerie et vos spams.`,
        });
      }
    } else {
      setResendStatus({
        loading: false,
        success: false,
        sent: false,
        message:
          res.error ||
          'Impossible de renvoyer l’e-mail. Veuillez vérifier votre mot de passe.',
      });
    }
  };

  // Enregistrement / Confirmation du pseudo unique
  const handleConfirmPseudo = async (e) => {
    e.preventDefault();
    const cleanPseudo = pseudo.trim();
    if (!cleanPseudo) {
      setErrorMessage('Veuillez saisir un pseudo valide.');
      return;
    }
    if (pseudoStatus.available === false) {
      setErrorMessage(pseudoStatus.message || 'Ce pseudo est déjà utilisé sur Firebase.');
      return;
    }
    if (!country) {
      setErrorMessage('Veuillez sélectionner votre pays.');
      return;
    }
    if (!ageRange) {
      setErrorMessage('Veuillez sélectionner votre tranche d\'âge.');
      return;
    }
    if (!profession) {
      setErrorMessage('Veuillez sélectionner votre profession.');
      return;
    }

    const currentUid = user?.uid || authInfo?.user?.uid;
    if (!currentUid) {
      setErrorMessage('Session expirée. Veuillez vous reconnecter.');
      setStep('auth');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const selectedCountryObj = COUNTRY_OPTIONS.find((c) => c.code === country);
    const additionalProfile = {
      country: selectedCountryObj?.name || country,
      countryFlag: selectedCountryObj?.flag || '🌍',
      ageRange,
      profession,
    };

    const res = await setUserPseudo(currentUid, cleanPseudo, invitedBy, additionalProfile);
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Erreur lors de l’enregistrement du pseudo.');
    } else {
      setSuccessMessage('Pseudo validé avec succès ! Bienvenue dans la partie.');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess(user || authInfo?.user);
      }, 500);
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    setLoading(true);
    await logoutUser();
    setLoading(false);
    handleClose();
  };

  return (
    <div style={styles.backdrop} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Bouton Fermer */}
        <button
          onClick={handleClose}
          style={styles.closeBtn}
          title="Fermer"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* ÉTAPE SPÉCIALE : VÉRIFICATION D'EMAIL OBLIGATOIRE */}
        {step === 'verification_pending' ? (
          <div style={styles.authContainer}>
            <div style={styles.header}>
              <div style={styles.mailIconBadge}>
                <Mail size={30} color="#f59e0b" />
              </div>
              <h2 style={styles.title}>Validez votre e-mail</h2>
              <p style={styles.subtitle}>
                Un lien d'activation officiel et sécurisé a été envoyé à :
              </p>
              <div style={styles.emailPill}>
                <span>📧 {pendingVerificationEmail || email}</span>
              </div>
            </div>

            <div style={styles.unverifiedWarningBox}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#fbbf24', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                    Validation obligatoire avant connexion
                  </strong>
                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                    Pour accéder au jeu et au site, vous devez obligatoirement cliquer sur le lien reçu dans votre messagerie.
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.spamAdviceBox}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                💡 <strong>Conseil :</strong> Vérifiez vos courriers indésirables / spams si vous ne trouvez pas l'e-mail dans les 2 minutes.
              </span>
            </div>

            {resendStatus.message && (
              <div
                style={
                  resendStatus.success
                    ? styles.successAlert
                    : styles.errorAlert
                }
              >
                {resendStatus.success ? (
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                )}
                <span>{resendStatus.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setStep('auth');
                  setErrorMessage('');
                  setSuccessMessage('Adresse e-mail validée ? Connectez-vous maintenant pour accéder au jeu !');
                }}
                style={styles.submitBtn}
              >
                <LogIn size={16} />
                <span>J'ai validé mon e-mail → Se connecter</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendStatus.loading}
                style={styles.resendBtn}
              >
                {resendStatus.loading ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <Mail size={15} />
                )}
                <span>{resendStatus.sent ? 'Renvoyer à nouveau' : 'Renvoyer l’e-mail de validation'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('auth');
                  setTab('register');
                  setErrorMessage('');
                }}
                style={styles.backLinkBtn}
              >
                <span>Modifier l’adresse e-mail</span>
              </button>
            </div>
          </div>
        ) : step === 'choose_pseudo' ? (
          <div style={styles.authContainer}>
            <div style={styles.header}>
              <div style={styles.pseudoIconBadge}>
                <Sparkles size={24} color="#10b981" />
              </div>
              <h2 style={styles.title}>Choisissez votre Pseudo</h2>
              <p style={styles.subtitle}>
                Chaque joueur doit posséder un <strong>pseudo unique</strong> vérifié sur Firebase pour accéder au jeu et figurer au classement.
              </p>
            </div>

            {/* Message d'erreur */}
            {errorMessage && (
              <div style={styles.errorAlert}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Message de succès */}
            {successMessage && (
              <div style={styles.successAlert}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPseudo} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Pseudo joueur (vérifié en direct)</label>
                <div style={styles.inputWrapper}>
                  <User size={16} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alexandre_CEO, EcoTitan, Sophie_Biz"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    style={{
                      ...styles.input,
                      ...(pseudoStatus.available === true ? styles.inputSuccess : {}),
                      ...(pseudoStatus.available === false ? styles.inputError : {}),
                    }}
                    maxLength={25}
                    autoFocus
                  />
                  {pseudoStatus.checking && (
                    <Loader2 size={16} className="spin" style={styles.inputRightIcon} color="#f59e0b" />
                  )}
                  {pseudoStatus.available === true && (
                    <CheckCircle2 size={16} style={styles.inputRightIcon} color="#10b981" />
                  )}
                  {pseudoStatus.available === false && (
                    <AlertCircle size={16} style={styles.inputRightIcon} color="#ef4444" />
                  )}
                </div>

                {/* Statut disponibilité pseudo */}
                {pseudoStatus.message && (
                  <span
                    style={{
                      ...styles.statusHelper,
                      color:
                        pseudoStatus.available === true
                          ? '#34d399'
                          : pseudoStatus.available === false
                          ? '#f87171'
                          : '#fbbf24',
                    }}
                  >
                    {pseudoStatus.message}
                  </span>
                )}
              </div>

              {/* Sélecteur Pays obligatoire */}
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Pays de résidence <span style={styles.requiredAsterisk}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <Globe2 size={16} color="#94a3b8" style={styles.inputIcon} />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    style={{ ...styles.input, ...styles.selectInputCustom }}
                  >
                    <option value="" disabled>Sélectionnez votre pays...</option>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sélecteur Tranche d'Âge obligatoire */}
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Tranche d'âge <span style={styles.requiredAsterisk}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <Calendar size={16} color="#94a3b8" style={styles.inputIcon} />
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    required
                    style={{ ...styles.input, ...styles.selectInputCustom }}
                  >
                    <option value="" disabled>Sélectionnez votre tranche d'âge...</option>
                    {AGE_RANGE_OPTIONS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sélecteur Profession / Secteur obligatoire */}
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Profession / Domaine d'activité <span style={styles.requiredAsterisk}>*</span>
                </label>
                <div style={styles.inputWrapper}>
                  <Briefcase size={16} color="#94a3b8" style={styles.inputIcon} />
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    required
                    style={{ ...styles.input, ...styles.selectInputCustom }}
                  >
                    <option value="" disabled>Sélectionnez votre métier ou domaine...</option>
                    {PROFESSION_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>


              <button
                type="submit"
                disabled={loading || pseudoStatus.available === false || pseudoStatus.checking}
                style={{
                  ...styles.submitBtn,
                  opacity:
                    loading || pseudoStatus.available === false || pseudoStatus.checking ? 0.6 : 1,
                  cursor:
                    loading || pseudoStatus.available === false || pseudoStatus.checking
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Valider mon pseudo & Jouer</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : isUserLoggedIn ? (
          /* VUE 1 : PROFIL UTILISATEUR CONNECTÉ */
          <div style={styles.profileContainer}>
            <div style={styles.avatarWrapper}>
              {(user.photoURL || stats?.photo_url) ? (
                <img
                  src={user.photoURL || stats?.photo_url}
                  alt={user.displayName || stats?.pseudo || 'Avatar'}
                  style={styles.avatarImg}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {(user.displayName || stats?.pseudo || user.email || 'B')[0].toUpperCase()}
                </div>
              )}
            </div>

            <h2 style={styles.profileName}>
              {user.displayName || stats?.pseudo || 'Joueur BizGames'}
            </h2>
            <span style={styles.profileEmail}>{user.email}</span>

            {/* Statistiques du profil */}
            <div style={styles.statsCardGrid}>
              <div style={styles.statCard}>
                <Flame size={18} color="#f59e0b" />
                <span style={styles.statValue}>{stats?.streak_actuel || 0}</span>
                <span style={styles.statLabel}>Série du jour</span>
              </div>
              <div style={styles.statCard}>
                <Trophy size={18} color="#10b981" />
                <span style={styles.statValue}>
                  {(stats?.meilleur_score || 0).toLocaleString('fr-FR')}
                </span>
                <span style={styles.statLabel}>Meilleur score</span>
              </div>
              <div style={styles.statCard}>
                <CheckCircle2 size={18} color="#3b82f6" />
                <span style={styles.statValue}>{stats?.parties_jouees || 0}</span>
                <span style={styles.statLabel}>Parties jouées</span>
              </div>
            </div>

            <div style={styles.profileActions}>
              <button
                onClick={() => {
                  setStep('choose_pseudo');
                  setPseudo(user.displayName || stats?.pseudo || '');
                }}
                style={styles.editPseudoBtn}
              >
                <User size={15} />
                <span>Modifier mon pseudo</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                style={styles.logoutBtn}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />}
                <span>Se déconnecter</span>
              </button>

              <button onClick={handleClose} style={styles.continuePlayBtn}>
                <span>Reprendre le jeu</span>
              </button>
            </div>
          </div>
        ) : (
          /* VUE 2 : ESPACE DE CONNEXION / INSCRIPTION */
          <div style={styles.authContainer}>
            {/* Bannière d'accès obligatoire au jeu si invoqué pour jouer */}
            {authReason === 'play' && (
              <div style={styles.requiredNotice}>
                <Lock size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Identification requise :</strong> Pour accéder au jeu et sauvegarder votre rang au classement, connectez-vous ou créez votre compte gratuit avec un pseudo unique.
                </span>
              </div>
            )}

            {/* En-tête modal */}
            <div style={styles.header}>
              <h2 style={styles.title}>Identification Joueur</h2>
              <p style={styles.subtitle}>
                Compte 100% gratuit. Enregistrez vos scores, conservez votre streak et défiez les stratèges économiques.
              </p>
            </div>

            {/* Onglets Connexion / Inscription */}
            <div style={styles.tabs}>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(tab === 'login' ? styles.tabBtnActive : {}),
                }}
                onClick={() => {
                  setTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                <LogIn size={15} />
                <span>Se connecter</span>
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(tab === 'register' ? styles.tabBtnActive : {}),
                }}
                onClick={() => {
                  setTab('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                <UserPlus size={15} />
                <span>Créer un compte</span>
              </button>
            </div>

            {/* Message d'erreur / Avertissement email non validé */}
            {errorMessage === 'EMAIL_NOT_VERIFIED' ? (
              <div style={styles.unverifiedWarningBox}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#fbbf24', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                      E-mail non validé — Accès bloqué
                    </strong>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45' }}>
                      Vous devez obligatoirement valider votre adresse <strong>{pendingVerificationEmail || email}</strong> en cliquant sur le lien reçu par e-mail avant de pouvoir vous connecter.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendStatus.loading}
                      style={styles.inlineResendBtn}
                    >
                      {resendStatus.loading ? <Loader2 size={13} className="spin" /> : <Mail size={13} />}
                      <span>{resendStatus.sent ? 'E-mail renvoyé !' : 'Renvoyer le lien de validation'}</span>
                    </button>
                    {resendStatus.message && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          marginTop: '6px',
                          color: resendStatus.success ? '#34d399' : '#f87171',
                          fontWeight: '600',
                        }}
                      >
                        {resendStatus.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : errorMessage ? (
              <div style={styles.errorAlert}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            {/* Message de succès */}
            {successMessage && (
              <div style={styles.successAlert}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>
            )}



            {/* Formulaire Email */}
            <form
              onSubmit={tab === 'login' ? handleEmailLogin : handleEmailRegister}
              style={styles.form}
            >
              {tab === 'register' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Pseudo joueur <span style={styles.requiredAsterisk}>*</span> (vérifié sur Firebase)
                  </label>
                  <div style={styles.inputWrapper}>
                    <User size={16} color="#94a3b8" style={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Alexandre, Sophie_Biz"
                      value={pseudo}
                      onChange={(e) => setPseudo(e.target.value)}
                      style={{
                        ...styles.input,
                        ...(pseudoStatus.available === true ? styles.inputSuccess : {}),
                        ...(pseudoStatus.available === false ? styles.inputError : {}),
                      }}
                      maxLength={25}
                    />
                    {pseudoStatus.checking && (
                      <Loader2 size={16} className="spin" style={styles.inputRightIcon} color="#f59e0b" />
                    )}
                    {pseudoStatus.available === true && (
                      <CheckCircle2 size={16} style={styles.inputRightIcon} color="#10b981" />
                    )}
                    {pseudoStatus.available === false && (
                      <AlertCircle size={16} style={styles.inputRightIcon} color="#ef4444" />
                    )}
                  </div>
                  {pseudoStatus.message && (
                    <span
                      style={{
                        ...styles.statusHelper,
                        color:
                          pseudoStatus.available === true
                            ? '#34d399'
                            : pseudoStatus.available === false
                            ? '#f87171'
                            : '#fbbf24',
                      }}
                    >
                      {pseudoStatus.message}
                    </span>
                  )}
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Adresse e-mail</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type="email"
                    required
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Mot de passe</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} color="#94a3b8" style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Au moins 6 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    minLength={6}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
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
                      <EyeOff size={16} color="#34d399" />
                    ) : (
                      <Eye size={16} color="#94a3b8" />
                    )}
                  </button>
                </div>
              </div>

              {tab === 'register' && (
                <>
                  {/* Sélecteur Pays obligatoire */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>
                      Pays de résidence <span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div style={styles.inputWrapper}>
                      <Globe2 size={16} color="#94a3b8" style={styles.inputIcon} />
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        style={{ ...styles.input, ...styles.selectInputCustom }}
                      >
                        <option value="" disabled>Sélectionnez votre pays...</option>
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sélecteur Tranche d'Âge obligatoire */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>
                      Tranche d'âge <span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div style={styles.inputWrapper}>
                      <Calendar size={16} color="#94a3b8" style={styles.inputIcon} />
                      <select
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        required
                        style={{ ...styles.input, ...styles.selectInputCustom }}
                      >
                        <option value="" disabled>Sélectionnez votre tranche d'âge...</option>
                        {AGE_RANGE_OPTIONS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sélecteur Profession / Domaine d'activité obligatoire */}
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>
                      Profession / Domaine d'activité <span style={styles.requiredAsterisk}>*</span>
                    </label>
                    <div style={styles.inputWrapper}>
                      <Briefcase size={16} color="#94a3b8" style={styles.inputIcon} />
                      <select
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        required
                        style={{ ...styles.input, ...styles.selectInputCustom }}
                      >
                        <option value="" disabled>Sélectionnez votre métier ou domaine...</option>
                        {PROFESSION_OPTIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}


              <button
                type="submit"
                disabled={
                  loading ||
                  (tab === 'register' && (pseudoStatus.available === false || pseudoStatus.checking))
                }
                style={{
                  ...styles.submitBtn,
                  opacity:
                    loading ||
                    (tab === 'register' && (pseudoStatus.available === false || pseudoStatus.checking))
                      ? 0.6
                      : 1,
                  cursor:
                    loading ||
                    (tab === 'register' && (pseudoStatus.available === false || pseudoStatus.checking))
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : tab === 'login' ? (
                  <>
                    <LogIn size={16} />
                    <span>Se connecter & Accéder au jeu</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Créer mon compte & Jouer</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
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
    zIndex: 3000,
    background: 'rgba(2, 9, 7, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    background: 'rgba(3, 18, 14, 0.96)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '28px 24px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15)',
    position: 'relative',
    animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  requiredNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: '#d1fae5',
    fontSize: '12px',
    lineHeight: '1.45',
    marginBottom: '16px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '18px',
  },
  pseudoIconBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
  },
  mailIconBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px auto',
  },
  emailPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    marginTop: '8px',
  },
  unverifiedWarningBox: {
    padding: '12px 14px',
    borderRadius: '12px',
    background: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    textAlign: 'left',
    marginBottom: '14px',
  },
  spamAdviceBox: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(2, 11, 8, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'center',
    marginBottom: '10px',
  },
  inlineResendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    background: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid rgba(245, 158, 11, 0.5)',
    color: '#fef08a',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resendBtn: {
    width: '100%',
    padding: '11px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  backLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '6px',
    textDecoration: 'underline',
    transition: 'color 0.2s ease',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#a7f3d0',
    lineHeight: '1.45',
  },
  tabs: {
    display: 'flex',
    background: 'rgba(6, 27, 21, 0.8)',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    marginBottom: '18px',
    gap: '4px',
  },
  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 12px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #f59e0b, #10b981)',
    color: '#03120e',
    fontWeight: '800',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    fontSize: '12px',
    marginBottom: '14px',
    lineHeight: '1.4',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#6ee7b7',
    fontSize: '12px',
    marginBottom: '14px',
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#ffffff',
    color: '#1f2937',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  },
  googleIcon: {
    flexShrink: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '18px 0',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'left',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  requiredAsterisk: {
    color: '#f59e0b',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  inputRightIcon: {
    position: 'absolute',
    right: '12px',
    pointerEvents: 'none',
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
  input: {
    width: '100%',
    padding: '10px 38px 10px 38px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  inputSuccess: {
    borderColor: '#10b981',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
  },
  selectInputCustom: {
    appearance: 'none',
    cursor: 'pointer',
    background: '#041d15',
    color: '#ffffff',
  },

  inputError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
  },
  statusHelper: {
    fontSize: '11px',
    marginTop: '2px',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: '6px',
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#03120e',
    fontSize: '14px',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
    transition: 'opacity 0.2s ease, transform 0.15s ease',
  },
  profileContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    paddingTop: '8px',
  },
  avatarWrapper: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #f59e0b',
    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
    marginBottom: '12px',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0b0f19',
    fontSize: '28px',
    fontWeight: '900',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-heading)',
  },
  profileName: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)',
    marginBottom: '2px',
  },
  profileEmail: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '20px',
  },
  statsCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    width: '100%',
    marginBottom: '24px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px 6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#f8fafc',
    fontFamily: 'var(--font-heading)',
  },
  statLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  profileActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  editPseudoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#e2e8f0',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  continuePlayBtn: {
    padding: '12px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0b0f19',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
