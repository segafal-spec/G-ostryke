import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe2,
  Volume2,
  VolumeX,
  Compass,
  Key,
  LogOut,
  Sparkles,
  Shield,
  Briefcase,
  Check,
  Mail,
  Smartphone,
  ExternalLink,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  checkPseudoAvailability,
  updateUserProfileData,
  uploadUserAvatarFile,
  sendUserPasswordResetEmail,
  logoutUser,
  deleteCurrentUserAccount,
} from '../services/firebase';
import {
  isSoundEnabled,
  setSoundEnabled,
  playClickSound,
  playSuccessSound,
  playSwitchSound,
} from '../utils/audio';
import {
  AGE_RANGE_OPTIONS,
  PROFESSION_OPTIONS,
} from '../utils/geo';

// Liste des avatars 3D prédéfinis "Titans & Stratèges du Business"
const PRESET_AVATARS = [
  {
    id: 'executive_ceo',
    image: '/images/avatars/avatar_executive_ceo.jpg',
    label: 'Titan PDG Mondial',
    role: 'Wall Street & M&A',
  },
  {
    id: 'female_ceo',
    image: '/images/avatars/avatar_female_ceo.jpg',
    label: 'Directrice Générale',
    role: 'Stratégie & Climat',
  },
  {
    id: 'young_trader',
    image: '/images/avatars/avatar_young_trader.jpg',
    label: 'Analyste Marchés',
    role: 'Trading & Macro-Éco',
  },
  {
    id: 'tech_visionary',
    image: '/images/avatars/avatar_tech_visionary.jpg',
    label: 'Directrice Tech & IA',
    role: 'Innovation & Puces',
  },
  {
    id: 'global_investor',
    image: '/images/avatars/avatar_global_investor.jpg',
    label: 'Investisseur Global',
    role: 'Venture Capital & Bourses',
  },
  {
    id: 'finance_analyst',
    image: '/images/characters/char_finance_analyst.jpg',
    label: 'Stratège Économique',
    role: 'Intelligence Marchés',
  },
];

// Liste des pays & drapeaux supportés
const COUNTRY_LIST = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'JP', name: 'Japon', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapour', flag: '🇸🇬' },
  { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'GLOBAL', name: 'International / Autre', flag: '🌍' },
];

// Secteurs de prédilection
const SECTOR_CHOICES = [
  { id: 'tech', labelFr: '💻 Tech, IA & Big Tech', labelEn: '💻 Tech, AI & Big Tech' },
  { id: 'finance', labelFr: '🏦 Wall Street & Finance', labelEn: '🏦 Wall Street & Finance' },
  { id: 'luxe', labelFr: '💎 Luxe & Haute Horlogerie', labelEn: '💎 Luxury & High Watchmaking' },
  { id: 'energie', labelFr: '⚡ Énergie & Gigafactories', labelEn: '⚡ Energy & Gigafactories' },
  { id: 'auto', labelFr: '🚗 Automobile & Aéro', labelEn: '🚗 Automotive & Aerospace' },
];

export default function PlayerSettingsTab({
  user,
  stats,
  isUserLoggedIn,
  lang = 'fr',
  onSetLang,
  onOpenAuth,
  onCloseDashboard,
  onProfileUpdated,
}) {
  const fileInputRef = useRef(null);

  // Formulaire Identité
  const [pseudo, setPseudo] = useState(user?.displayName || stats?.pseudo || '');
  const [initialPseudo, setInitialPseudo] = useState(user?.displayName || stats?.pseudo || '');
  const [bio, setBio] = useState(stats?.bio || '');
  const [country, setCountry] = useState(stats?.country || 'France');
  const [countryFlag, setCountryFlag] = useState(stats?.country_flag || '🇫🇷');
  const [favoriteSector, setFavoriteSector] = useState(stats?.favorite_sector || 'tech');

  // Photo / Avatar
  const [currentPhoto, setCurrentPhoto] = useState(user?.photoURL || stats?.photo_url || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Préférences de jeu
  const [soundEnabled, setSoundState] = useState(() => isSoundEnabled());
  const [unitKm, setUnitKm] = useState(() => {
    try {
      return localStorage.getItem('bizgames_unit') !== 'mi';
    } catch (e) {
      return true;
    }
  });
  const [autoRotate, setAutoRotate] = useState(() => {
    try {
      return localStorage.getItem('bizgames_globe_autorotate') !== 'false';
    } catch (e) {
      return true;
    }
  });

  // États de validation et de soumission
  const [pseudoCheck, setPseudoCheck] = useState({ checking: false, available: null, message: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [pwdResetSent, setPwdResetSent] = useState(false);
  const [loadingPwdReset, setLoadingPwdReset] = useState(false);

  // Suppression définitive de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Synchronisation lors de mises à jour extérieures
  useEffect(() => {
    if (user?.displayName || stats?.pseudo) {
      const p = user?.displayName || stats?.pseudo || '';
      setPseudo(p);
      setInitialPseudo(p);
    }
    if (user?.photoURL || stats?.photo_url) {
      setCurrentPhoto(user?.photoURL || stats?.photo_url || '');
    }
    if (stats?.bio !== undefined) setBio(stats.bio);
    if (stats?.country) setCountry(stats.country);
    if (stats?.country_flag) setCountryFlag(stats.country_flag);
    if (stats?.favorite_sector) setFavoriteSector(stats.favorite_sector);
  }, [user?.displayName, user?.photoURL, stats]);

  // Validation en direct du pseudo lors de la saisie (debounce 450ms)
  useEffect(() => {
    const trimmed = pseudo.trim();

    if (!trimmed || trimmed === initialPseudo) {
      setPseudoCheck({ checking: false, available: null, message: '' });
      return;
    }

    if (trimmed.length < 3) {
      setPseudoCheck({
        checking: false,
        available: false,
        message: lang === 'fr' ? 'Minimum 3 caractères requis.' : 'Minimum 3 characters required.',
      });
      return;
    }

    if (trimmed.length > 25) {
      setPseudoCheck({
        checking: false,
        available: false,
        message: lang === 'fr' ? 'Maximum 25 caractères.' : 'Maximum 25 characters.',
      });
      return;
    }

    const validRegex = /^[a-zA-Z0-9àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ _-]+$/;
    if (!validRegex.test(trimmed)) {
      setPseudoCheck({
        checking: false,
        available: false,
        message: lang === 'fr' ? 'Lettres, chiffres, tirets et espaces uniquement.' : 'Letters, numbers, hyphens and spaces only.',
      });
      return;
    }

    setPseudoCheck({ checking: true, available: null, message: '' });

    const timer = setTimeout(async () => {
      try {
        const res = await checkPseudoAvailability(trimmed, user?.uid);
        if (res.available) {
          setPseudoCheck({
            checking: false,
            available: true,
            message: lang === 'fr' ? '✓ Pseudo disponible !' : '✓ Username is available!',
          });
        } else {
          setPseudoCheck({
            checking: false,
            available: false,
            message: res.error || (lang === 'fr' ? 'Ce pseudo est déjà pris.' : 'This username is already taken.'),
          });
        }
      } catch (err) {
        setPseudoCheck({ checking: false, available: null, message: '' });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [pseudo, initialPseudo, user?.uid, lang]);

  // Toast auto-effaçable
  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setErrorToast('');
    playSuccessSound();
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 6000);
  };

  // Traitement et téléversement de la photo
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérification du type
    if (!file.type.startsWith('image/')) {
      showError(lang === 'fr' ? 'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).' : 'Please choose a valid image file (JPG, PNG, WebP).');
      return;
    }

    // Vérification de la taille (< 8MB avant compression)
    if (file.size > 8 * 1024 * 1024) {
      showError(lang === 'fr' ? "L'image ne doit pas dépasser 8 Mo." : 'Image file must be under 8MB.');
      return;
    }

    setUploadingPhoto(true);
    playClickSound();

    try {
      // Redimensionnement et cadrage centré carré 256x256 via Canvas HTML5
      const resizedBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;

            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 256, 256);
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Erreur de conversion canvas'));
              },
              'image/jpeg',
              0.88
            );
          };
          img.onerror = reject;
          img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (!isUserLoggedIn || !user?.uid) {
        // En mode invité : stocker en dataURL localement
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          setCurrentPhoto(dataUrl);
          try {
            localStorage.setItem('bizgames_guest_photo', dataUrl);
          } catch (e) {}
          setUploadingPhoto(false);
          showSuccess(lang === 'fr' ? 'Photo de profil mise à jour !' : 'Profile photo updated!');
        };
        reader.readAsDataURL(resizedBlob);
        return;
      }

      // Mode connecté : téléversement vers Firebase
      const res = await uploadUserAvatarFile(user.uid, resizedBlob);
      if (res.success && res.photoUrl) {
        setCurrentPhoto(res.photoUrl);
        showSuccess(lang === 'fr' ? 'Photo de profil enregistrée avec succès !' : 'Profile photo saved successfully!');
        if (onProfileUpdated) onProfileUpdated();
      } else {
        showError(res.error || (lang === 'fr' ? 'Échec de l’envoi de la photo.' : 'Failed to upload photo.'));
      }
    } catch (err) {
      console.error(err);
      showError(lang === 'fr' ? 'Erreur lors du traitement de l’image.' : 'Error processing image.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sélection d'un avatar prédéfini
  const handleSelectPreset = async (preset) => {
    playSwitchSound();
    setUploadingPhoto(true);

    const targetUrl = preset.image;
    setCurrentPhoto(targetUrl);

    if (isUserLoggedIn && user?.uid) {
      try {
        const res = await uploadUserAvatarFile(user.uid, targetUrl);
        if (res.success) {
          showSuccess(lang === 'fr' ? `Avatar « ${preset.label} » activé !` : `Avatar "${preset.label}" activated!`);
          if (onProfileUpdated) onProfileUpdated();
        } else {
          showError(res.error || 'Erreur lors de la sélection de l’avatar.');
        }
      } catch (e) {
        showError(lang === 'fr' ? 'Erreur lors de la mise à jour.' : 'Error updating avatar.');
      }
    } else {
      try {
        localStorage.setItem('bizgames_guest_photo', targetUrl);
      } catch (e) {}
      showSuccess(lang === 'fr' ? `Avatar « ${preset.label} » activé !` : `Avatar "${preset.label}" activated!`);
    }

    setUploadingPhoto(false);
  };

  // Suppression de la photo
  const handleRemovePhoto = async () => {
    playClickSound();
    setCurrentPhoto('');

    if (isUserLoggedIn && user?.uid) {
      setUploadingPhoto(true);
      try {
        await updateUserProfileData(user.uid, { photoUrl: '' });
        showSuccess(lang === 'fr' ? 'Photo retirée (initiales affichées par défaut).' : 'Photo removed (initials used by default).');
        if (onProfileUpdated) onProfileUpdated();
      } catch (e) {
        showError(lang === 'fr' ? 'Erreur lors de la suppression.' : 'Error removing photo.');
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      try {
        localStorage.removeItem('bizgames_guest_photo');
      } catch (e) {}
      showSuccess(lang === 'fr' ? 'Photo retirée.' : 'Photo removed.');
    }
  };

  // Sauvegarde des informations du profil (Pseudo, Bio, Pays, Secteur)
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    playClickSound();

    const cleanPseudo = pseudo.trim();
    if (!cleanPseudo) {
      showError(lang === 'fr' ? 'Veuillez saisir un pseudo valide.' : 'Please enter a valid username.');
      return;
    }

    if (cleanPseudo.length < 3) {
      showError(lang === 'fr' ? 'Le pseudo doit comporter au moins 3 caractères.' : 'Username must be at least 3 characters.');
      return;
    }

    if (pseudoCheck.available === false && cleanPseudo !== initialPseudo) {
      showError(pseudoCheck.message || (lang === 'fr' ? 'Ce pseudo n’est pas disponible.' : 'Username not available.'));
      return;
    }

    setSavingProfile(true);

    if (!isUserLoggedIn || !user?.uid) {
      // Sauvegarde locale pour invité
      try {
        localStorage.setItem('bizgames_guest_pseudo', cleanPseudo);
        localStorage.setItem('bizgames_guest_bio', bio.trim());
        localStorage.setItem('bizgames_guest_country', country);
        localStorage.setItem('bizgames_guest_country_flag', countryFlag);
        localStorage.setItem('bizgames_guest_sector', favoriteSector);
      } catch (err) {}
      setInitialPseudo(cleanPseudo);
      showSuccess(lang === 'fr' ? 'Préférences enregistrées sur ce navigateur !' : 'Preferences saved on this browser!');
      setSavingProfile(false);
      return;
    }

    try {
      const res = await updateUserProfileData(user.uid, {
        pseudo: cleanPseudo,
        photoUrl: currentPhoto,
        bio: bio.trim(),
        country,
        countryFlag,
        favoriteSector,
      });

      if (res.success) {
        setInitialPseudo(cleanPseudo);
        showSuccess(lang === 'fr' ? 'Profil et identité enregistrés avec succès !' : 'Profile saved successfully!');
        if (onProfileUpdated) onProfileUpdated();
      } else {
        showError(res.error || (lang === 'fr' ? 'Échec de la sauvegarde.' : 'Failed to save profile.'));
      }
    } catch (err) {
      console.error(err);
      showError(err.message || (lang === 'fr' ? 'Erreur lors de la sauvegarde.' : 'Error saving profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Bascule du Son
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundState(next);
    setSoundEnabled(next);
    if (next) {
      playSuccessSound();
    }
  };

  // Bascule de l'unité km/mi
  const handleToggleUnit = (km) => {
    setUnitKm(km);
    playSwitchSound();
    try {
      localStorage.setItem('bizgames_unit', km ? 'km' : 'mi');
    } catch (e) {}
  };

  // Bascule de la rotation auto
  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    playSwitchSound();
    try {
      localStorage.setItem('bizgames_globe_autorotate', next ? 'true' : 'false');
    } catch (e) {}
  };

  // Envoi email de réinitialisation mot de passe
  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setLoadingPwdReset(true);
    playClickSound();

    try {
      const res = await sendUserPasswordResetEmail(user.email);
      if (res.success) {
        setPwdResetSent(true);
        showSuccess(
          lang === 'fr'
            ? `E-mail de réinitialisation envoyé à ${user.email} !`
            : `Password reset email sent to ${user.email}!`
        );
      } else {
        showError(res.error || (lang === 'fr' ? 'Impossible d’envoyer le mail.' : 'Could not send email.'));
      }
    } catch (err) {
      showError(err.message || 'Erreur');
    } finally {
      setLoadingPwdReset(false);
    }
  };

  // Suppression définitive du compte utilisateur
  const handleConfirmDeleteAccount = async () => {
    const requiredWord = lang === 'fr' ? 'SUPPRIMER' : 'DELETE';
    if (deleteConfirmText.trim().toUpperCase() !== requiredWord) {
      setDeleteError(
        lang === 'fr'
          ? 'Veuillez saisir exactement le mot demandé pour confirmer.'
          : 'Please type the exact required word.'
      );
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');
    try {
      const res = await deleteCurrentUserAccount('Suppression volontaire depuis le Hub Joueur');
      setShowDeleteModal(false);
      if (res?.message) {
        alert(res.message);
      }
      if (onCloseDashboard) onCloseDashboard();
      if (onProfileUpdated) onProfileUpdated();
      window.location.reload();
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      setDeleteError(
        err.message ||
          (lang === 'fr'
            ? 'Une erreur est survenue lors de la suppression.'
            : 'An error occurred during deletion.')
      );
      setDeletingAccount(false);
    }
  };

  const isGoogleAccount = user?.providerData?.some((p) => p.providerId === 'google.com');

  return (
    <div style={styles.container}>
      {/* Toast de notification flottant */}
      {successToast && (
        <div style={styles.toastSuccess}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>{successToast}</span>
        </div>
      )}
      {errorToast && (
        <div style={styles.toastError}>
          <AlertCircle size={18} color="#ef4444" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* 1. EN-TÊTE DE LA PAGE PARAMÈTRES */}
      <div style={styles.headerBlock}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.headerIconBox}>
            <User size={24} color="#10b981" />
          </div>
          <div>
            <h2 style={styles.title}>
              {lang === 'fr' ? 'Mon Compte & Paramètres' : 'Account & Settings'}
            </h2>
            <p style={styles.subtitle}>
              {lang === 'fr'
                ? 'Personnalisez votre identité de titan, votre photo, et ajustez vos réglages de jeu.'
                : 'Customize your business identity, avatar, and adjust your gameplay settings.'}
            </p>
          </div>
        </div>
      </div>

      {/* AVERTISSEMENT INVITÉ / CTA CRÉATION COMPTE */}
      {!isUserLoggedIn && (
        <div style={styles.guestAlertBanner}>
          <div style={styles.guestAlertIconBox}>
            <Shield size={22} color="#f59e0b" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={styles.guestAlertTitle}>
              {lang === 'fr' ? 'Jouez en toute sécurité : sauvegardez votre profil' : 'Save your profile and game records'}
            </h4>
            <p style={styles.guestAlertDesc}>
              {lang === 'fr'
                ? 'Vous jouez actuellement en tant qu’invité. Connectez-vous gratuitement pour sécuriser votre pseudo unique, vos badges et votre progression.'
                : 'You are playing as a guest. Sign in for free to secure your unique username, badges, and ranking.'}
            </p>
          </div>
          <button onClick={onOpenAuth} style={styles.linkAccountBtn}>
            <Sparkles size={15} />
            <span>{lang === 'fr' ? 'Créer un compte gratuit' : 'Create Free Account'}</span>
          </button>
        </div>
      )}

      {/* 2. SECTION 1 : STUDIO PHOTO & AVATAR */}
      <section style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} color="#10b981" />
            <h3 style={styles.sectionTitle}>
              {lang === 'fr' ? 'Photo de profil & Avatar' : 'Profile Picture & Avatar'}
            </h3>
          </div>
          <span style={styles.sectionTag}>
            {lang === 'fr' ? 'Visible par les autres joueurs' : 'Visible to other players'}
          </span>
        </div>

        <div style={styles.avatarStudioRow}>
          {/* Aperçu grand format de l'avatar */}
          <div style={styles.avatarPreviewWrapper}>
            <div style={styles.avatarBigBox}>
              {uploadingPhoto ? (
                <Loader2 size={36} className="spin" color="#10b981" />
              ) : currentPhoto ? (
                <img src={currentPhoto} alt="Avatar" style={styles.avatarBigImg} />
              ) : (
                <span style={styles.avatarBigInitial}>
                  {(pseudo || user?.email || 'B')[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Boutons d'action pour la photo */}
            <div style={styles.avatarActionBtns}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                style={styles.uploadPhotoBtn}
                title={lang === 'fr' ? 'Téléverser depuis vos fichiers ou appareil' : 'Upload from device'}
              >
                <Upload size={14} />
                <span>{lang === 'fr' ? 'Importer une photo' : 'Upload photo'}</span>
              </button>

              {currentPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  style={styles.removePhotoBtn}
                  title={lang === 'fr' ? 'Retirer la photo' : 'Remove photo'}
                >
                  <Trash2 size={14} />
                  <span>{lang === 'fr' ? 'Supprimer' : 'Remove'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Galerie d'avatars prédéfinis 3D */}
          <div style={styles.presetsGallery}>
            <span style={styles.presetsHeading}>
              {lang === 'fr' ? 'Ou choisissez un avatar 3D officiel :' : 'Or pick an official 3D persona avatar:'}
            </span>
            <div style={styles.presetsGrid}>
              {PRESET_AVATARS.map((preset) => {
                const isSelected = currentPhoto === preset.image;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      ...styles.presetItemBtn,
                      ...(isSelected ? styles.presetItemBtnSelected : {}),
                    }}
                    title={`${preset.label} — ${preset.role}`}
                  >
                    <div style={styles.presetAvatarWrapper}>
                      <img
                        src={preset.image}
                        alt={preset.label}
                        style={styles.presetAvatarImg}
                        loading="lazy"
                      />
                      {isSelected && (
                        <div style={styles.presetCheckBadge}>
                          <Check size={11} color="#ffffff" />
                        </div>
                      )}
                    </div>
                    <span style={styles.presetLabel}>{preset.label}</span>
                    <span style={styles.presetRole}>{preset.role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2 : IDENTITÉ DU JOUEUR (PSEUDO, BIO, PAYS, SECTEUR) */}
      <form onSubmit={handleSaveProfile} style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="#10b981" />
            <h3 style={styles.sectionTitle}>
              {lang === 'fr' ? 'Identité & Profil Public' : 'Public Profile & Identity'}
            </h3>
          </div>
          <span style={styles.sectionTag}>
            {lang === 'fr' ? 'Affiché aux classements' : 'Shown in Leaderboards'}
          </span>
        </div>

        <div style={styles.formGrid}>
          {/* Champ Pseudo */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <span>{lang === 'fr' ? 'Pseudo (Nom d’utilisateur)' : 'Username (Public)'}</span>
              <span style={styles.requiredMark}>*</span>
            </label>
            <div style={styles.inputWithIconWrapper}>
              <User size={16} color="#94a3b8" style={styles.inputFieldIcon} />
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                maxLength={25}
                placeholder={lang === 'fr' ? 'Votre pseudo de titan...' : 'Your titan username...'}
                style={{
                  ...styles.textInput,
                  ...(pseudoCheck.available === true ? styles.inputSuccess : {}),
                  ...(pseudoCheck.available === false ? styles.inputError : {}),
                }}
              />
              {pseudoCheck.checking && (
                <Loader2 size={16} className="spin" color="#10b981" style={styles.inputEndIcon} />
              )}
            </div>

            {/* Message de validation */}
            {pseudoCheck.message && (
              <span
                style={{
                  ...styles.fieldHint,
                  color: pseudoCheck.available ? '#34d399' : '#f87171',
                }}
              >
                {pseudoCheck.message}
              </span>
            )}
            {!pseudoCheck.message && (
              <span style={styles.fieldHint}>
                {lang === 'fr' ? '3 à 25 caractères (lettres, chiffres, espaces, tirets)' : '3 to 25 characters (letters, digits, hyphens)'}
              </span>
            )}
          </div>

          {/* Champ Titre Professionnel / Bio */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <span>{lang === 'fr' ? 'Titre / Bio courte' : 'Headline / Short Bio'}</span>
              <span style={styles.charCount}>{bio.length}/100</span>
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder={
                lang === 'fr'
                  ? 'Ex: Analyste Private Equity, Passionné d’IA, Directeur Stratégie...'
                  : 'Ex: Private Equity Analyst, AI Enthusiast, Strategy Director...'
              }
              style={styles.textInputNoIcon}
            />
            <span style={styles.fieldHint}>
              {lang === 'fr' ? 'Visible sur votre carte de profil et fiches de score.' : 'Visible on your profile card and score breakdown.'}
            </span>
          </div>

          {/* Informations Certifiées du Compte (Non modifiables) */}
          <div style={styles.lockedInfoSection}>
            <div style={styles.lockedInfoHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="#10b981" />
                <strong style={styles.lockedInfoTitle}>
                  {lang === 'fr' ? 'Informations Certifiées du Compte' : 'Verified Account Information'}
                </strong>
              </div>
              <span style={styles.lockedBadge}>
                {lang === 'fr' ? '🔒 Non modifiable' : '🔒 Read-only'}
              </span>
            </div>
            <p style={styles.lockedInfoDesc}>
              {lang === 'fr'
                ? 'Ces données sont définies lors de l’inscription pour garantir l’authenticité des classements et ne peuvent pas être modifiées.'
                : 'These details are fixed upon registration to ensure leaderboard fairness and cannot be changed.'}
            </p>

            <div style={styles.lockedGrid}>
              {/* 1. Pays */}
              <div style={styles.lockedItem}>
                <span style={styles.lockedLabel}>
                  {lang === 'fr' ? 'Pays de résidence' : 'Country'}
                </span>
                <div style={styles.lockedValueBox}>
                  <Globe2 size={15} color="#34d399" />
                  <span style={styles.lockedValueText}>
                    {stats?.country_flag || countryFlag || '🌍'} {stats?.country || country || (lang === 'fr' ? 'Non renseigné' : 'Not set')}
                  </span>
                </div>
              </div>

              {/* 2. Tranche d'Âge */}
              <div style={styles.lockedItem}>
                <span style={styles.lockedLabel}>
                  {lang === 'fr' ? 'Tranche d’âge' : 'Age Range'}
                </span>
                <div style={styles.lockedValueBox}>
                  <Lock size={14} color="#94a3b8" />
                  <span style={styles.lockedValueText}>
                    {AGE_RANGE_OPTIONS.find((a) => a.id === stats?.age_range)?.label || stats?.age_range || (lang === 'fr' ? 'Non renseignée' : 'Not set')}
                  </span>
                </div>
              </div>

              {/* 3. Profession / Domaine */}
              <div style={styles.lockedItem}>
                <span style={styles.lockedLabel}>
                  {lang === 'fr' ? 'Profession / Domaine' : 'Profession / Field'}
                </span>
                <div style={styles.lockedValueBox}>
                  <Briefcase size={14} color="#94a3b8" />
                  <span style={styles.lockedValueText}>
                    {PROFESSION_OPTIONS.find((p) => p.id === stats?.profession)?.label || stats?.profession || (lang === 'fr' ? 'Non renseignée' : 'Not set')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Secteur de prédilection */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>
              <span>{lang === 'fr' ? 'Secteur économique de prédilection' : 'Favorite Economic Sector'}</span>
            </label>
            <select
              value={favoriteSector}
              onChange={(e) => setFavoriteSector(e.target.value)}
              style={styles.selectInputPlain}
            >
              {SECTOR_CHOICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {lang === 'fr' ? s.labelFr : s.labelEn}
                </option>
              ))}
            </select>
            <span style={styles.fieldHint}>
              {lang === 'fr' ? 'Définit votre badge sectoriel de prédilection.' : 'Defines your preferred sector mastery badge.'}
            </span>
          </div>
        </div>


        {/* Bouton de sauvegarde */}
        <div style={styles.saveActionRow}>
          <button
            type="submit"
            disabled={savingProfile || (pseudoCheck.available === false && pseudo.trim() !== initialPseudo)}
            style={styles.saveSubmitBtn}
          >
            {savingProfile ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>{lang === 'fr' ? 'Enregistrement...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{lang === 'fr' ? 'Enregistrer les modifications' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 4. SECTION 3 : PRÉFÉRENCES DE JEU & AUDIO */}
      <section style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="#10b981" />
            <h3 style={styles.sectionTitle}>
              {lang === 'fr' ? 'Préférences de Jeu & Ergonomie' : 'Gameplay & Preferences'}
            </h3>
          </div>
        </div>

        <div style={styles.settingsList}>

          {/* Effets sonores */}
          <div style={styles.settingItemRow}>
            <div style={styles.settingItemInfo}>
              <div style={styles.settingTitleRow}>
                {soundEnabled ? <Volume2 size={17} color="#10b981" /> : <VolumeX size={17} color="#94a3b8" />}
                <strong style={styles.settingItemTitle}>
                  {lang === 'fr' ? 'Effets sonores (Audio SFX)' : 'Sound Effects (Audio SFX)'}
                </strong>
              </div>
              <span style={styles.settingItemDesc}>
                {lang === 'fr' ? 'Sons des clics, validations de tirs et jingles de réussite.' : 'Audio feedback on clicks, target guesses and success.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              style={{
                ...styles.switchTrack,
                ...(soundEnabled ? styles.switchTrackActive : {}),
              }}
              title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: soundEnabled ? 'translateX(22px)' : 'translateX(0px)',
                }}
              />
            </button>
          </div>

          {/* Unités de distance */}
          <div style={styles.settingItemRow}>
            <div style={styles.settingItemInfo}>
              <strong style={styles.settingItemTitle}>
                {lang === 'fr' ? 'Unité de mesure des distances' : 'Distance Measurement Unit'}
              </strong>
              <span style={styles.settingItemDesc}>
                {lang === 'fr' ? 'Affichage des écarts en kilomètres ou miles nautiques.' : 'Display distance errors in kilometers or miles.'}
              </span>
            </div>
            <div style={styles.langToggleGroup}>
              <button
                type="button"
                onClick={() => handleToggleUnit(true)}
                style={{
                  ...styles.toggleChoiceBtn,
                  ...(unitKm ? styles.toggleChoiceActive : {}),
                }}
              >
                <span>Kilomètres (km)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleUnit(false)}
                style={{
                  ...styles.toggleChoiceBtn,
                  ...(!unitKm ? styles.toggleChoiceActive : {}),
                }}
              >
                <span>Miles (mi)</span>
              </button>
            </div>
          </div>

          {/* Rotation automatique du globe */}
          <div style={styles.settingItemRow}>
            <div style={styles.settingItemInfo}>
              <strong style={styles.settingItemTitle}>
                {lang === 'fr' ? 'Rotation automatique du Globe 3D' : '3D Globe Auto-Rotation'}
              </strong>
              <span style={styles.settingItemDesc}>
                {lang === 'fr' ? 'Rotation orbitale cinématique lente lorsque le globe est inactif.' : 'Slow cinematic orbit when the globe is idle.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoRotate}
              style={{
                ...styles.switchTrack,
                ...(autoRotate ? styles.switchTrackActive : {}),
              }}
              title={autoRotate ? 'Désactiver la rotation' : 'Activer la rotation'}
            >
              <div
                style={{
                  ...styles.switchThumb,
                  transform: autoRotate ? 'translateX(22px)' : 'translateX(0px)',
                }}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 5. SECTION 4 : SÉCURITÉ DU COMPTE & GESTION DES DONNÉES */}
      <section style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#10b981" />
            <h3 style={styles.sectionTitle}>
              {lang === 'fr' ? 'Sécurité & Données du Compte' : 'Account Security & Data'}
            </h3>
          </div>
        </div>

        <div style={styles.securityBox}>
          {isUserLoggedIn ? (
            <div style={styles.accountDetailsGrid}>
              <div style={styles.accountDetailItem}>
                <span style={styles.accountDetailLabel}>{lang === 'fr' ? 'Adresse E-mail' : 'Email Address'}</span>
                <strong style={styles.accountDetailValue}>{user?.email || '—'}</strong>
              </div>

              <div style={styles.accountDetailItem}>
                <span style={styles.accountDetailLabel}>{lang === 'fr' ? 'Méthode de connexion' : 'Sign-in Provider'}</span>
                <strong style={styles.accountDetailValue}>
                  {isGoogleAccount ? '🌐 Compte Google' : '✉️ Email & Mot de passe'}
                </strong>
              </div>

              <div style={styles.accountDetailItem}>
                <span style={styles.accountDetailLabel}>{lang === 'fr' ? 'Statut du Compte' : 'Account Status'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#10b981" />
                  <strong style={{ color: '#34d399', fontSize: '13px' }}>
                    {lang === 'fr' ? 'Vérifié & 100% Gratuit' : 'Verified & 100% Free'}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.guestNoticeRow}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                {lang === 'fr'
                  ? 'Compte invité temporaire. Créez un compte par e-mail pour sauvegarder vos données définitivement.'
                  : 'Temporary guest account. Create an account with your email to permanently save your progress.'}
              </span>
              <button onClick={onOpenAuth} style={styles.linkAccountSmallBtn}>
                {lang === 'fr' ? 'Lier mon compte' : 'Link Account'}
              </button>
            </div>
          )}

          {/* Actions Sécurité */}
          <div style={styles.dangerZoneRow}>
            {isUserLoggedIn && !isGoogleAccount && (
              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={loadingPwdReset || pwdResetSent}
                style={styles.secondarySecBtn}
              >
                <Key size={15} />
                <span>
                  {pwdResetSent
                    ? (lang === 'fr' ? 'E-mail de réinitialisation envoyé !' : 'Reset email sent!')
                    : (lang === 'fr' ? 'Réinitialiser mon mot de passe' : 'Reset password')}
                </span>
              </button>
            )}

            {isUserLoggedIn && (
              <button
                type="button"
                onClick={async () => {
                  playClickSound();
                  await logoutUser();
                  if (onCloseDashboard) onCloseDashboard();
                }}
                style={styles.logoutSecBtn}
              >
                <LogOut size={15} />
                <span>{lang === 'fr' ? 'Déconnexion' : 'Sign out'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 6. SECTION 5 : ZONE DE DANGER - SUPPRESSION DÉFINITIVE DU COMPTE & RGPD */}
      {isUserLoggedIn && (
        <section style={styles.dangerSectionCard}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} color="#ef4444" />
              <h3 style={{ ...styles.sectionTitle, color: '#f87171' }}>
                {lang === 'fr' ? 'Zone de Danger : Suppression du Compte' : 'Danger Zone: Delete Account'}
              </h3>
            </div>
          </div>
          <div style={styles.dangerContentBox}>
            <p style={styles.dangerText}>
              {lang === 'fr'
                ? "Conformément aux normes RGPD, vous pouvez supprimer définitivement votre compte BizGames ainsi que l'ensemble de vos données associées (scores, séries de jours joués, progression et historique). Cette opération est immédiate et irréversible."
                : 'In compliance with GDPR standards, you can permanently delete your BizGames account and all associated data (scores, streaks, game history, and progress). This action is immediate and irreversible.'}
            </p>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setDeleteConfirmText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              style={styles.deleteAccountBtn}
            >
              <Trash2 size={15} />
              <span>
                {lang === 'fr'
                  ? 'Supprimer définitivement mon compte et mes données'
                  : 'Permanently Delete Account & Data'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION DÉFINITIVE */}
      {showDeleteModal && (
        <div style={styles.modalOverlay} onClick={() => !deletingAccount && setShowDeleteModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <h4 style={{ margin: 0, color: '#f87171', fontSize: '16px', fontWeight: '800' }}>
                  {lang === 'fr' ? 'Confirmation de suppression définitive' : 'Confirm Permanent Deletion'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => !deletingAccount && setShowDeleteModal(false)}
                style={styles.modalCloseBtn}
                disabled={deletingAccount}
              >
                &times;
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 14px' }}>
                {lang === 'fr'
                  ? 'Êtes-vous absolument certain ? Toutes vos statistiques, parties officielles, positions au classement et données de profil seront immédiatement effacées des serveurs.'
                  : 'Are you absolutely sure? All your statistics, game history, leaderboard ranks, and profile data will be permanently wiped from the servers.'}
              </p>

              <div style={styles.modalInputBlock}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  {lang === 'fr'
                    ? 'Tapez "SUPPRIMER" pour valider :'
                    : 'Type "DELETE" to confirm:'}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={lang === 'fr' ? 'SUPPRIMER' : 'DELETE'}
                  style={styles.deleteConfirmInput}
                  disabled={deletingAccount}
                  autoFocus
                />
              </div>

              {deleteError && (
                <div style={styles.modalErrorBox}>
                  <AlertCircle size={14} color="#f87171" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={styles.modalCancelBtn}
                disabled={deletingAccount}
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                style={styles.modalConfirmDeleteBtn}
                disabled={
                  deletingAccount ||
                  deleteConfirmText.trim().toUpperCase() !== (lang === 'fr' ? 'SUPPRIMER' : 'DELETE')
                }
              >
                {deletingAccount ? (
                  <>
                    <Loader2 size={15} className="spin-anim" />
                    <span>{lang === 'fr' ? 'Suppression en cours...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>{lang === 'fr' ? 'Supprimer pour toujours' : 'Delete Permanently'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '860px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '32px',
  },
  toastSuccess: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    background: 'rgba(6, 43, 33, 0.95)',
    border: '1px solid #10b981',
    borderRadius: '12px',
    padding: '12px 18px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)',
    animation: 'fadeIn 0.2s ease',
  },
  toastError: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    background: 'rgba(40, 10, 10, 0.95)',
    border: '1px solid #ef4444',
    borderRadius: '12px',
    padding: '12px 18px',
    color: '#fca5a5',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 8px 30px rgba(239, 68, 68, 0.35)',
    animation: 'fadeIn 0.2s ease',
  },
  headerBlock: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  subtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '3px 0 0 0',
  },
  guestAlertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(6, 27, 21, 0.9))',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    borderRadius: '16px',
    flexWrap: 'wrap',
  },
  guestAlertIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(245, 158, 11, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guestAlertTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#fbbf24',
    margin: 0,
  },
  guestAlertDesc: {
    fontSize: '12px',
    color: '#cbd5e1',
    margin: '4px 0 0 0',
    lineHeight: '1.4',
  },
  linkAccountBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: 'none',
    borderRadius: '10px',
    color: '#0b0f19',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 3px 12px rgba(245, 158, 11, 0.3)',
  },
  sectionCard: {
    background: 'rgba(6, 27, 21, 0.75)',
    border: '1px solid rgba(16, 185, 129, 0.22)',
    borderRadius: '20px',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  sectionTag: {
    fontSize: '11px',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: '700',
  },
  avatarStudioRow: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  avatarPreviewWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    minWidth: '150px',
  },
  avatarBigBox: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: '3px solid rgba(16, 185, 129, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)',
  },
  avatarBigImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarBigInitial: {
    fontSize: '40px',
    fontWeight: '900',
    color: '#03120e',
  },
  avatarActionBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  uploadPhotoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '10px',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  removePhotoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '6px 10px',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  presetsGallery: {
    flex: 1,
    minWidth: '260px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  presetsHeading: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  presetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
    gap: '10px',
  },
  presetItemBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  presetItemBtnSelected: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '2px solid #10b981',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
  },
  presetAvatarWrapper: {
    position: 'relative',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(16, 185, 129, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  presetCheckBadge: {
    position: 'absolute',
    bottom: '1px',
    right: '1px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)',
  },
  presetLabel: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  presetRole: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#34d399',
    textAlign: 'center',
    lineHeight: '1.1',
    letterSpacing: '0.2px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredMark: {
    color: '#10b981',
    marginLeft: '3px',
  },
  charCount: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
  },
  inputWithIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputFieldIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  inputEndIcon: {
    position: 'absolute',
    right: '12px',
  },
  textInput: {
    width: '100%',
    padding: '11px 36px 11px 38px',
    background: 'rgba(3, 18, 14, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textInputNoIcon: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(3, 18, 14, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputSuccess: {
    borderColor: '#10b981',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
  },
  inputError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
  },
  fieldHint: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  selectFlagPrefix: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    pointerEvents: 'none',
  },
  selectInput: {
    width: '100%',
    padding: '11px 14px 11px 38px',
    background: 'rgba(3, 18, 14, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  selectInputPlain: {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(3, 18, 14, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  // ─── Styles Section Verrouillée ───────────────────────────────────────────
  lockedInfoSection: {
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '14px',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    margin: '6px 0',
  },
  lockedInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedInfoTitle: {
    fontSize: '14px',
    color: '#ffffff',
  },
  lockedBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#94a3b8',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px',
  },
  lockedInfoDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.4',
  },
  lockedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  lockedItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '10px 12px',
    borderRadius: '10px',
  },
  lockedLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  lockedValueBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  lockedValueText: {
    fontSize: '13px',
    color: '#e2e8f0',
    fontWeight: '700',
  },
  saveActionRow: {

    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '8px',
  },
  saveSubmitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '12px',
    color: '#03120e',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
    transition: 'all 0.15s ease',
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  settingItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '14px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  settingItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flex: 1,
    minWidth: '220px',
  },
  settingTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  settingItemTitle: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '700',
  },
  settingItemDesc: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  langToggleGroup: {
    display: 'flex',
    background: 'rgba(3, 18, 14, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    padding: '3px',
    gap: '3px',
  },
  toggleChoiceBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  toggleChoiceActive: {
    background: '#10b981',
    color: '#03120e',
    fontWeight: '800',
  },
  switchTrack: {
    width: '48px',
    height: '26px',
    borderRadius: '13px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s ease',
  },
  switchTrackActive: {
    background: 'rgba(16, 185, 129, 0.8)',
    borderColor: '#10b981',
  },
  switchThumb: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
    transition: 'transform 0.2s ease',
  },
  securityBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  accountDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  accountDetailItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  accountDetailLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  accountDetailValue: {
    fontSize: '13px',
    color: '#ffffff',
  },
  guestNoticeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px dashed rgba(245, 158, 11, 0.3)',
    borderRadius: '12px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  linkAccountSmallBtn: {
    background: '#f59e0b',
    border: 'none',
    color: '#0b0f19',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  dangerZoneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  secondarySecBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  logoutSecBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '10px',
    color: '#fca5a5',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  dangerSectionCard: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '18px',
    overflow: 'hidden',
  },
  dangerContentBox: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  dangerText: {
    margin: 0,
    fontSize: '13px',
    color: '#fca5a5',
    lineHeight: '1.6',
  },
  deleteAccountBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    background: 'rgba(2, 6, 23, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modalBox: {
    background: '#0a0f1d',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '16px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(239, 68, 68, 0.08)',
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: 1,
  },
  modalBody: {
    padding: '20px',
  },
  modalInputBlock: {
    marginTop: '12px',
  },
  deleteConfirmInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '1px',
  },
  modalErrorBox: {
    marginTop: '12px',
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  modalFooter: {
    padding: '14px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    background: 'rgba(0, 0, 0, 0.3)',
  },
  modalCancelBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalConfirmDeleteBtn: {
    padding: '8px 18px',
    background: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  },
};
