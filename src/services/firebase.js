import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import { sendWelcomeEmailGoogle } from './emailService';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { getDailyRound, getScoreEmoji } from '../utils/geo';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
// Forcer Google à toujours afficher l'écran de sélection de compte
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let anonymousAuthDisabled = false;

/**
 * Connecte le joueur en mode anonyme si aucun utilisateur n'est actif
 */
export async function ensureAnonymousAuth() {
  try {
    if (auth.currentUser) return auth.currentUser;
    if (anonymousAuthDisabled) return null;
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (err) {
    if (
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/operation-not-allowed' ||
      err.message?.includes('ADMIN_ONLY_OPERATION')
    ) {
      anonymousAuthDisabled = true;
    } else {
      console.warn('Mode hors ligne ou Firebase Auth non disponible :', err.message);
    }
    return null;
  }
}

/**
 * Vérifie si un pseudo est disponible et valide dans Firestore
 * @param {string} rawPseudo
 * @param {string|null} excludeUid - UID à ignorer (ex: l'utilisateur lui-même lors d'une mise à jour)
 */
export async function checkPseudoAvailability(rawPseudo, excludeUid = null) {
  const pseudo = rawPseudo?.trim();
  if (!pseudo) {
    return { available: false, error: 'Veuillez renseigner un pseudo.' };
  }
  if (pseudo.length < 3) {
    return { available: false, error: 'Le pseudo doit comporter au moins 3 caractères.' };
  }
  if (pseudo.length > 25) {
    return { available: false, error: 'Le pseudo ne peut pas dépasser 25 caractères.' };
  }
  // Caractères autorisés : lettres, chiffres, espaces, tirets, underscores
  const validRegex = /^[a-zA-Z0-9àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ _-]+$/;
  if (!validRegex.test(pseudo)) {
    return {
      available: false,
      error: 'Le pseudo ne doit contenir que des lettres, chiffres, tirets et underscores.',
    };
  }

  const lower = pseudo.toLowerCase();

  try {
    const usersRef = collection(db, 'users');

    // 1. Recherche par champ pseudo_lower
    const qLower = query(usersRef, where('pseudo_lower', '==', lower));
    const snapLower = await getDocs(qLower);
    const takenByLower = snapLower.docs.some((d) => d.id !== excludeUid);
    if (takenByLower) {
      return { available: false, error: 'Ce pseudo est déjà utilisé par un autre joueur.' };
    }

    // 2. Recherche par champ exact pseudo
    const qExact = query(usersRef, where('pseudo', '==', pseudo));
    const snapExact = await getDocs(qExact);
    const takenByExact = snapExact.docs.some((d) => d.id !== excludeUid);
    if (takenByExact) {
      return { available: false, error: 'Ce pseudo est déjà utilisé par un autre joueur.' };
    }

    // 3. Vérification exhaustive insensible à la casse sur tous les profils (sécurité rétro-compatibilité)
    const allUsersSnap = await getDocs(usersRef);
    for (const docSnap of allUsersSnap.docs) {
      if (docSnap.id === excludeUid) continue;
      const data = docSnap.data();
      const existingPseudo = (data.pseudo || '').trim().toLowerCase();
      const existingLower = (data.pseudo_lower || '').trim().toLowerCase();
      if (existingPseudo === lower || existingLower === lower) {
        return { available: false, error: 'Ce pseudo est déjà utilisé par un autre joueur.' };
      }
    }

    return { available: true, error: null };
  } catch (err) {
    console.error('Erreur vérification disponibilité pseudo :', err);
    return {
      available: false,
      error: 'Impossible de vérifier la disponibilité du pseudo. Veuillez réessayer.',
    };
  }
}

/**
 * Attribue ou met à jour le pseudo vérifié d'un joueur
 */
export async function setUserPseudo(uid, chosenPseudo, referredBy = null, additionalProfile = {}) {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      return { success: false, error: 'Utilisateur non authentifié.' };
    }

    const avail = await checkPseudoAvailability(chosenPseudo, uid);
    if (!avail.available) {
      return { success: false, error: avail.error };
    }

    const cleanPseudo = chosenPseudo.trim();

    // Mettre à jour Firebase Auth displayName
    await updateProfile(user, {
      displayName: cleanPseudo,
    });

    // Mettre à jour Firestore
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    const safeReferredBy = (referredBy && referredBy !== uid) ? referredBy.trim() : null;

    const profileFields = {
      country: additionalProfile.country || '',
      country_flag: additionalProfile.countryFlag || '',
      age_range: additionalProfile.ageRange || '',
      profession: additionalProfile.profession || '',
    };

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid,
        email: user.email || '',
        pseudo: cleanPseudo,
        pseudo_lower: cleanPseudo.toLowerCase(),
        photo_url: user.photoURL || '',
        is_anonymous: false,
        parties_jouees: 0,
        meilleur_score: 0,
        streak_actuel: 0,
        bonus_points: 0,
        referrals_count: 0,
        ...profileFields,
        ...(safeReferredBy ? { referred_by: safeReferredBy, referral_rewarded: false } : {}),
        cree_le: serverTimestamp(),
        email_verified: true,
        welcome_email_sent: true,
      });

      // Envoyer l'email de bienvenue pour nouvelle inscription Google
      if (user.email) {
        sendWelcomeEmailGoogle({ email: user.email, pseudo: cleanPseudo }).catch(() => {});
      }
    } else {
      const data = userDoc.data() || {};
      const updates = {
        pseudo: cleanPseudo,
        pseudo_lower: cleanPseudo.toLowerCase(),
        ...profileFields,
        maj_le: serverTimestamp(),
      };
      if (safeReferredBy && !data.referred_by) {
        updates.referred_by = safeReferredBy;
        updates.referral_rewarded = false;
      }
      if (!data.welcome_email_sent && user.email) {
        updates.welcome_email_sent = true;
        sendWelcomeEmailGoogle({ email: user.email, pseudo: cleanPseudo }).catch(() => {});
      }
      await setDoc(userRef, updates, { merge: true });
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Erreur attribution pseudo :', err);
    return { success: false, error: 'Erreur lors de l’enregistrement du pseudo.' };
  }
}

/**
 * Met à jour les informations du profil utilisateur (pseudo, photo, bio, pays, secteur favori)
 */
export async function updateUserProfileData(uid, { pseudo, photoUrl, bio, country, countryFlag, favoriteSector }) {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      return { success: false, error: 'Utilisateur non authentifié.' };
    }

    const updatesFirestore = {
      maj_le: serverTimestamp(),
    };

    const updatesAuth = {};

    // 1. Validation et mise à jour du pseudo si fourni
    if (pseudo !== undefined) {
      const cleanPseudo = pseudo?.trim();
      const currentPseudo = user.displayName?.trim();

      if (cleanPseudo && cleanPseudo !== currentPseudo) {
        const avail = await checkPseudoAvailability(cleanPseudo, uid);
        if (!avail.available) {
          return { success: false, error: avail.error };
        }
        updatesAuth.displayName = cleanPseudo;
        updatesFirestore.pseudo = cleanPseudo;
        updatesFirestore.pseudo_lower = cleanPseudo.toLowerCase();
      }
    }

    // 2. Photo URL si fournie (URL, dataUrl, ou vide)
    if (photoUrl !== undefined) {
      updatesAuth.photoURL = photoUrl || '';
      updatesFirestore.photo_url = photoUrl || '';
    }

    // 3. Bio / Statut (max 150 caractères)
    if (bio !== undefined) {
      updatesFirestore.bio = (bio || '').trim().slice(0, 150);
    }

    // 4. Pays et drapeau
    if (country !== undefined) {
      updatesFirestore.country = (country || '').trim();
      updatesFirestore.country_flag = (countryFlag || '').trim();
    }

    // 5. Secteur favori
    if (favoriteSector !== undefined) {
      updatesFirestore.favorite_sector = (favoriteSector || '').trim();
    }

    // Mise à jour Firebase Auth
    if (Object.keys(updatesAuth).length > 0) {
      await updateProfile(user, updatesAuth);
    }

    // Mise à jour Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updatesFirestore, { merge: true });

    return { success: true, error: null };
  } catch (err) {
    console.error('Erreur mise à jour profil :', err);
    return { success: false, error: err.message || 'Erreur lors de la mise à jour du profil.' };
  }
}

/**
 * Enregistre les préférences de notifications (Rappel quotidien, Newsletter, Actualités, Réseaux)
 */
export async function updateUserNotificationPreferences(uid, preferences) {
  try {
    // Sauvegarde locale de confort
    try {
      localStorage.setItem(`bizgames_notif_${uid || 'guest'}`, JSON.stringify(preferences));
    } catch (e) {
      // Ignorer
    }

    const user = auth.currentUser;
    if (user && uid && user.uid === uid) {
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          notification_preferences: preferences,
          maj_le: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return { success: true };
  } catch (err) {
    console.warn('Erreur mise à jour préférences notifications :', err);
    return { success: false, error: err.message };
  }
}

/**
 * Téléverse un fichier avatar vers Firebase Storage avec fallback dataURL
 * Partitionné strictement sous /users/{uid}/
 */
export async function uploadUserAvatarFile(uid, fileOrDataUrl) {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      return { success: false, photoUrl: null, error: 'Utilisateur non authentifié.' };
    }

    let downloadUrl = null;

    if (typeof fileOrDataUrl === 'string') {
      downloadUrl = fileOrDataUrl;
    } else {
      try {
        const fileExt = fileOrDataUrl.type?.includes('png') ? 'png' : 'jpg';
        const fileRef = storageRef(storage, `users/${uid}/avatar_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(fileRef, fileOrDataUrl, {
          contentType: fileOrDataUrl.type || 'image/jpeg',
        });
        downloadUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage non disponible ou bloqué, repli automatique dataURL :', storageErr);
        downloadUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        });
      }
    }

    if (!downloadUrl) {
      return { success: false, photoUrl: null, error: 'Impossible de traiter la photo de profil.' };
    }

    // Mettre à jour Firebase Auth
    await updateProfile(user, {
      photoURL: downloadUrl,
    });

    // Mettre à jour Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        photo_url: downloadUrl,
        maj_le: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, photoUrl: downloadUrl, error: null };
  } catch (err) {
    console.error('Erreur téléversement avatar :', err);
    return { success: false, photoUrl: null, error: err.message || 'Erreur lors de l’enregistrement de la photo.' };
  }
}

/**
 * Envoie un e-mail de réinitialisation de mot de passe sécurisé
 */
export async function sendUserPasswordResetEmail(email) {
  try {
    const targetEmail = email || auth.currentUser?.email;
    if (!targetEmail) {
      return { success: false, error: 'Aucune adresse e-mail trouvée.' };
    }
    await sendPasswordResetEmail(auth, targetEmail);
    return { success: true, error: null };
  } catch (err) {
    console.error('Erreur réinitialisation mot de passe :', err);
    return { success: false, error: formatAuthError(err.code) };
  }
}

/**
 * Connexion via Google Auth (Popup) avec vérification systématique du pseudo unique
 */
export async function loginWithGoogle(referredBy = null) {
  try {
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Vérifier l'existence et l'état du profil dans Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const isNewRegistration = !userDoc.exists();

    const safeReferredBy = (referredBy && referredBy !== user.uid) ? referredBy.trim() : null;

    if (userDoc.exists()) {
      const data = userDoc.data();
      // Si le joueur a déjà un pseudo valide
      if (data.pseudo && data.pseudo.trim()) {
        const patch = {};
        if (!data.pseudo_lower) {
          patch.pseudo_lower = data.pseudo.trim().toLowerCase();
        }
        if (safeReferredBy && !data.referred_by) {
          patch.referred_by = safeReferredBy;
          patch.referral_rewarded = false;
        }
        if (user.photoURL && (!data.photo_url || data.photo_url !== user.photoURL)) {
          patch.photo_url = user.photoURL;
        }
        if (Object.keys(patch).length > 0) {
          await setDoc(userRef, patch, { merge: true });
        }
        return { user, needsPseudo: false, isNewUser: false, error: null };
      }
    }

    // Le compte est nouveau ou n'a pas encore de pseudo enregistré
    // Vérifier si le displayName de Google est utilisable et disponible
    const candidatePseudo = user.displayName?.trim() || '';
    let isCandidateAvailable = false;

    if (candidatePseudo && candidatePseudo.length >= 3 && candidatePseudo.length <= 25) {
      const check = await checkPseudoAvailability(candidatePseudo, user.uid);
      isCandidateAvailable = check.available;
    }

    // Si le nom Google est disponible, on peut l'initialiser tout en notifiant l'interface
    if (isCandidateAvailable) {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || '',
          pseudo: candidatePseudo,
          pseudo_lower: candidatePseudo.toLowerCase(),
          photo_url: user.photoURL || '',
          is_anonymous: false,
          parties_jouees: 0,
          meilleur_score: 0,
          streak_actuel: 0,
          bonus_points: 0,
          referrals_count: 0,
          ...(safeReferredBy ? { referred_by: safeReferredBy, referral_rewarded: false } : {}),
          cree_le: serverTimestamp(),
          email_verified: true,
          welcome_email_sent: true,
        },
        { merge: true }
      );

      // Expédier l'e-mail de confirmation d'inscription Google
      if (user.email) {
        sendWelcomeEmailGoogle({ email: user.email, pseudo: candidatePseudo }).catch((e) => {
          console.warn('Erreur expédition email Google bienvenue :', e);
        });
      }

      return { user, needsPseudo: false, isNewUser: true, error: null };
    }

    // Sinon, le joueur DOIT choisir un pseudo unique non pris
    return {
      user,
      needsPseudo: true,
      suggestedPseudo: candidatePseudo || user.email?.split('@')[0] || '',
      isNewUser: isNewRegistration,
      error: null,
    };
  } catch (err) {
    console.warn('Erreur Firebase Auth Google :', err.code, err.message);
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return { user: null, needsPseudo: false, error: 'Fenêtre de connexion fermée.' };
    }
    if (err.code === 'auth/popup-blocked') {
      return {
        user: null,
        needsPseudo: false,
        error: 'La fenêtre de connexion Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.',
      };
    }
    return { user: null, needsPseudo: false, error: formatAuthError(err.code) };
  }
}

let isAuthOperationInProgress = false;

/**
 * Inscription par Email et Mot de passe avec vérification d'unicité du pseudo
 * Envoi systématique d'un e-mail de validation et blocage de l'accès au site tant qu'il n'est pas validé
 */
export async function registerWithEmail(email, password, pseudo, referredBy = null, additionalProfile = {}) {
  const cleanPseudo = pseudo?.trim();
  if (!cleanPseudo) {
    return { user: null, error: 'Un pseudo est obligatoire pour créer votre compte.' };
  }

  // Vérification de la disponibilité du pseudo dans Firestore avant création
  const check = await checkPseudoAvailability(cleanPseudo);
  if (!check.available) {
    return { user: null, error: check.error };
  }

  isAuthOperationInProgress = true;
  let createdUser = null;
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    createdUser = user;

    await updateProfile(user, {
      displayName: cleanPseudo,
    });

    const safeReferredBy = (referredBy && referredBy !== user.uid) ? referredBy.trim() : null;

    const profileFields = {
      country: additionalProfile.country || '',
      country_flag: additionalProfile.countryFlag || '',
      age_range: additionalProfile.ageRange || '',
      profession: additionalProfile.profession || '',
    };

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      pseudo: cleanPseudo,
      pseudo_lower: cleanPseudo.toLowerCase(),
      photo_url: '',
      is_anonymous: false,
      parties_jouees: 0,
      meilleur_score: 0,
      streak_actuel: 0,
      bonus_points: 0,
      referrals_count: 0,
      ...profileFields,
      ...(safeReferredBy ? { referred_by: safeReferredBy, referral_rewarded: false } : {}),
      cree_le: serverTimestamp(),
      email_verified: false,
    });

    // Envoi officiel de l'e-mail de validation Firebase
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
    } catch (emailErr) {
      console.warn('Erreur envoi email avec actionCodeSettings, repli standard :', emailErr);
      try {
        await sendEmailVerification(user);
      } catch (fallbackErr) {
        console.warn('Erreur envoi email standard :', fallbackErr);
      }
    }

    // DÉCONNEXION OBLIGATOIRE IMMÉDIATE : aucun accès au site sans validation
    await signOut(auth);

    return { user: null, needsVerification: true, email: user.email, error: null };
  } catch (err) {
    console.error('Erreur inscription email :', err);
    // Si le compte Auth a été créé mais qu'une erreur Firestore s'est produite, supprimer pour éviter un compte orphelin bloqué
    if (createdUser && auth.currentUser?.uid === createdUser.uid) {
      try {
        await deleteUser(createdUser);
      } catch (delErr) {
        console.warn('Impossible de supprimer le compte auth orphelin :', delErr);
      }
    }
    return { user: null, needsVerification: false, error: formatAuthError(err.code) || err.message };
  } finally {
    isAuthOperationInProgress = false;
  }
}

/**
 * Connexion par Email et Mot de passe avec contrôle strict de validation de l'adresse e-mail
 */
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    const isOwnerEmail = user.email?.trim().toLowerCase() === 'segafal@gmail.com';

    // RÈGLE STRICTE : Si l'adresse n'est pas encore validée, interdire la connexion
    if (!user.emailVerified && !isOwnerEmail) {
      await signOut(auth);
      return {
        user: null,
        needsVerification: true,
        unverifiedEmail: user.email || email,
        error: 'EMAIL_NOT_VERIFIED',
      };
    }

    // Si validé, auto-réparation ou synchronisation dans Firestore si nécessaire
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const fallbackPseudo = user.displayName || user.email?.split('@')[0] || 'Joueur';
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        pseudo: fallbackPseudo,
        pseudo_lower: fallbackPseudo.toLowerCase(),
        photo_url: user.photoURL || '',
        is_anonymous: false,
        parties_jouees: 0,
        meilleur_score: 0,
        streak_actuel: 0,
        bonus_points: 0,
        referrals_count: 0,
        email_verified: true,
        cree_le: serverTimestamp(),
      }, { merge: true }).catch((e) => console.warn('Erreur auto-réparation profil Firestore :', e));
    } else if (userDoc.data().email_verified !== true) {
      await setDoc(userRef, { email_verified: true }, { merge: true }).catch(() => {});
    }

    const updatedDoc = await getDoc(userRef);
    const hasPseudo = updatedDoc.exists() && Boolean(updatedDoc.data().pseudo);
    const isAdmin = Boolean(
      isOwnerEmail ||
      (updatedDoc.exists() && (updatedDoc.data().is_admin === true || updatedDoc.data().isAdmin === true))
    );

    return { user, needsPseudo: !hasPseudo && !isAdmin, isAdmin, error: null };
  } catch (err) {
    return { user: null, needsPseudo: false, isAdmin: false, error: formatAuthError(err.code) };
  }
}

/**
 * Renvoie un e-mail officiel de validation de compte Firebase Auth
 */
export async function resendUserVerificationEmail(email, password) {
  isAuthOperationInProgress = true;
  try {
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) {
      return { success: false, error: 'Veuillez saisir votre adresse e-mail.' };
    }
    if (!password) {
      return { success: false, error: 'Veuillez renseigner votre mot de passe pour renvoyer le lien.' };
    }

    const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const user = result.user;

    if (user.emailVerified) {
      await signOut(auth);
      return { success: true, alreadyVerified: true };
    }

    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
    } catch (emailErr) {
      console.warn('Erreur envoi email avec actionCodeSettings, repli standard :', emailErr);
      try {
        await sendEmailVerification(user);
      } catch (fallbackErr) {
        console.warn('Erreur envoi email standard :', fallbackErr);
      }
    }

    await signOut(auth);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: formatAuthError(err.code) };
  } finally {
    isAuthOperationInProgress = false;
  }
}

/**
 * Déconnexion totale et sécurisée : purge de la session Firebase et de tout reliquat local
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    // Nettoyer tous les reliquats d'anciens comptes ou sessions anonymes du navigateur
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (
            k &&
            (k.startsWith('bizgames_anon_') ||
              k === 'bizgames_all_history' ||
              k.startsWith('bizgames_played_') ||
              k.startsWith('bizgames_temp_'))
          ) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) {
      // Ignorer
    }
    return true;
  } catch (err) {
    console.error('Erreur déconnexion :', err);
    return false;
  }
}

/**
 * Vérifie de manière autoritaire sur Firestore si un joueur a déjà joué la manche officielle du jour
 */
export async function checkUserDailyPlayed(userId, dateStr) {
  try {
    if (!userId || !dateStr) return null;
    const scoresRef = collection(db, 'scores');
    const q = query(
      scoresRef,
      where('user_id', '==', userId),
      where('date', '==', dateStr)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Privilégier le score officiel s'il existe, sinon le meilleur score du jour
      let targetDoc = docs.find((d) => d.is_official === true);
      if (!targetDoc) {
        targetDoc = docs[0];
        // Rétrocompatibilité / auto-réparation : s'assurer que le score est bien marqué is_official
        try {
          await updateDoc(doc(db, 'scores', targetDoc.id), { is_official: true });
          targetDoc.is_official = true;
        } catch (e) {
          console.warn('Auto-réparation is_official :', e);
        }
      }
      return {
        date: targetDoc.date,
        scoreTotal: targetDoc.score_total,
        timeSeconds: targetDoc.temps_total_secondes,
        emojiGrid: targetDoc.grille_emoji,
        details: (targetDoc.details_par_question || []).map((d) => ({
          questionId: d.question_id,
          questionTexte: d.question_texte,
          lieuNom: d.lieu_nom,
          pays: d.pays,
          explication: d.explication,
          distanceKm: d.distance_km,
          score: d.score,
        })),
      };
    }
    return null;
  } catch (err) {
    console.warn('Erreur vérification partie jouée Firestore :', err.message);
    return null;
  }
}

/**
 * Récupère le profil Firestore d'un joueur
 */
export async function getUserStats(uid) {
  try {
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.warn('Erreur lecture stats utilisateur :', err);
    return null;
  }
}

/**
 * Écouteur des changements d'état d'authentification
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    // Si une opération d'inscription ou d'envoi d'e-mail est en cours, ne pas intervenir !
    if (isAuthOperationInProgress) {
      return;
    }

    if (user && !user.isAnonymous) {
      const isOwnerEmail = user.email?.trim().toLowerCase() === 'segafal@gmail.com';
      const isEmailUser = user.providerData?.some((p) => p.providerId === 'password');

      // RÈGLE STRICTE : un compte par email non validé n'a aucun accès au site
      if (isEmailUser && !user.emailVerified && !isOwnerEmail) {
        try {
          await signOut(auth);
        } catch {}
        callback({
          user: null,
          stats: null,
          isAnonymous: true,
          isAdmin: false,
          hasPseudo: false,
          needsEmailVerification: true,
          unverifiedEmail: user.email,
        });
        return;
      }

      // Émission préliminaire immédiate pour éviter tout écran blanc ou latence
      callback({
        user,
        stats: null,
        isAnonymous: false,
        isAdmin: isOwnerEmail,
        hasPseudo: Boolean(user.displayName?.trim()),
      });

      const stats = await getUserStats(user.uid);
      if (user.photoURL && stats && (!stats.photo_url || stats.photo_url !== user.photoURL)) {
        try {
          await setDoc(doc(db, 'users', user.uid), { photo_url: user.photoURL }, { merge: true });
          stats.photo_url = user.photoURL;
        } catch {}
      }
      let isAdmin = isOwnerEmail;
      try {
        const tokenResult = await user.getIdTokenResult(true);
        const hasClaim = !!(tokenResult.claims?.admin || tokenResult.claims?.superadmin);
        const hasDocFlag = Boolean(stats?.is_admin === true || stats?.isAdmin === true);
        isAdmin = hasClaim || hasDocFlag || isOwnerEmail;
      } catch {
        isAdmin = Boolean(stats?.is_admin === true || stats?.isAdmin === true || isOwnerEmail);
      }
      const hasPseudo = Boolean(stats?.pseudo?.trim() || user.displayName?.trim());
      callback({ user, stats, isAnonymous: false, isAdmin, hasPseudo });
    } else {
      callback({ user, stats: null, isAnonymous: true, isAdmin: false, hasPseudo: false });
    }
  });
}

/**
 * Vérifie si l'utilisateur courant est admin (is_admin doc, custom claims, ou email fondateur)
 */
export async function checkIsAdmin() {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    if (user.email?.trim().toLowerCase() === 'segafal@gmail.com') return true;
    const stats = await getUserStats(user.uid);
    if (stats?.is_admin === true || stats?.isAdmin === true) return true;
    const tokenResult = await user.getIdTokenResult(true);
    return !!(tokenResult.claims?.admin || tokenResult.claims?.superadmin);
  } catch {
    return false;
  }
}

/**
 * Enregistre le score de la partie dans Firestore
 */
export async function saveGameScore({ date, scoreTotal, timeSeconds, history, isOfficial = true }) {
  try {
    let user = auth.currentUser;
    if (!user) {
      user = await ensureAnonymousAuth();
    }
    const userId = user ? user.uid : 'anon_offline';

    // RÈGLE STRICTE : Le compte admin ne doit JAMAIS pouvoir jouer ni enregistrer de score
    const isOwnerEmail = user?.email?.trim().toLowerCase() === 'segafal@gmail.com';
    let isUserAdmin = Boolean(isOwnerEmail || userId === '6uNoDpHzLvRikKRJplgGXOZJXIU2');
    if (!isUserAdmin && user && !user.isAnonymous) {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const dData = userDoc.data();
          if (dData.is_admin === true || dData.isAdmin === true) {
            isUserAdmin = true;
          }
        }
      } catch (e) {}
    }

    if (isUserAdmin) {
      console.info('Compte administrateur : les comptes administrateurs ne jouent pas et n’enregistrent aucun score.');
      return null;
    }

    const emojiGrid = history
      .map((h) => getScoreEmoji(h.score, h.distanceKm))
      .join('');

    const scoreData = {
      user_id: userId,
      pseudo: user?.displayName || 'Joueur Anonyme',
      photo_url: user?.photoURL || '',
      date,
      is_official: Boolean(isOfficial),
      score_total: scoreTotal,
      temps_total_secondes: timeSeconds,
      grille_emoji: emojiGrid,
      details_par_question: history.map((h) => ({
        question_id: h.question.id,
        question_texte: h.question.texte || '',
        lieu_nom: h.question.lieu_nom || '',
        pays: h.question.pays || '',
        explication: h.question.explication || '',
        distance_km: h.distanceKm,
        score: h.score,
        guess_lat: h.guess?.lat ?? null,
        guess_lng: h.guess?.lng ?? null,
      })),
      cree_le: serverTimestamp(),
    };

    // Anti-doublon : vérifier si un score a déjà été enregistré pour ce joueur à cette date
    const scoresRef = collection(db, 'scores');
    const existingQ = query(
      scoresRef,
      where('user_id', '==', userId),
      where('date', '==', date)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      // Si le score existant a déjà été enregistré, s'assurer qu'il est marqué officiel sans créer de doublon
      const updatesToExisting = {};
      if (isOfficial && !existingDoc.data().is_official) {
        updatesToExisting.is_official = true;
      }
      if (user?.photoURL && !existingDoc.data().photo_url) {
        updatesToExisting.photo_url = user.photoURL;
      }
      if (Object.keys(updatesToExisting).length > 0) {
        try {
          await updateDoc(doc(db, 'scores', existingDoc.id), updatesToExisting);
        } catch (e) {}
      }
      return existingDoc.id;
    }

    const docRef = await addDoc(scoresRef, scoreData);

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          pseudo: user.displayName || 'Joueur BizGames',
          photo_url: user.photoURL || '',
          is_anonymous: user.isAnonymous,
          parties_jouees: 1,
          meilleur_score: scoreTotal,
          score_total_cumule: scoreTotal,
          total_points: scoreTotal,
          streak_actuel: isOfficial ? 1 : 0,
          date_derniere_partie: date,
          cree_le: serverTimestamp(),
        });
      } else {
        const data = userDoc.data();
        if (user.photoURL && !data.photo_url) {
          try {
            await setDoc(userRef, { photo_url: user.photoURL }, { merge: true });
          } catch (e) {}
        }
        const newBest = Math.max(data.meilleur_score || 0, scoreTotal);
        const currentCumulative = data.score_total_cumule || data.total_points || 0;
        const newCumulative = currentCumulative + scoreTotal;

        // Calcul exact du streak quotidien (consécutif)
        let updatedStreak = data.streak_actuel || 0;
        if (isOfficial) {
          const lastDate = data.date_derniere_partie;
          if (lastDate === date) {
            // Déjà joué aujourd'hui, on conserve le streak
            updatedStreak = Math.max(updatedStreak, 1);
          } else if (lastDate) {
            const currentDateObj = new Date(date);
            const yesterdayObj = new Date(currentDateObj);
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

            if (lastDate === yesterdayStr) {
              updatedStreak = (data.streak_actuel || 0) + 1;
            } else {
              updatedStreak = 1; // Rupture de série
            }
          } else {
            updatedStreak = 1;
          }
        }

        // 🏆 RÉCOMPENSES DU CHALLENGE 30 JOURS (Points bonus de streak débloqués) :
        let bonusPointsToAdd = 0;
        const reachedMilestones = Array.isArray(data.unlocked_streak_milestones) ? [...data.unlocked_streak_milestones] : [];
        const streakRewards = { 3: 100, 7: 250, 14: 500, 21: 1000, 30: 2500 };
        
        if (isOfficial && streakRewards[updatedStreak] && !reachedMilestones.includes(updatedStreak)) {
          bonusPointsToAdd = streakRewards[updatedStreak];
          reachedMilestones.push(updatedStreak);
        }

        const finalCumulative = newCumulative + bonusPointsToAdd;

        await setDoc(
          userRef,
          {
            parties_jouees: (data.parties_jouees || 0) + 1,
            meilleur_score: newBest,
            score_total_cumule: finalCumulative,
            total_points: finalCumulative,
            ...(isOfficial ? { 
              streak_actuel: updatedStreak, 
              date_derniere_partie: date,
              unlocked_streak_milestones: reachedMilestones,
              ...(bonusPointsToAdd > 0 ? { dernier_bonus_streak: { days: updatedStreak, pts: bonusPointsToAdd, date } } : {})
            } : {}),
            maj_le: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 🎁 PARRAINAGE & BONUS DE 500 POINTS :
      // Si ce nouveau joueur a été parrainé (referred_by) et n'a pas encore validé son premier round officiel
      try {
        await triggerReferralReward(user.uid);
      } catch (refErr) {
        console.warn('Erreur déclenchement bonus parrainage :', refErr);
      }
    }

    return docRef.id;
  } catch (err) {
    console.warn('Impossible de synchroniser le score avec Firestore :', err.message);
    return null;
  }
}

/**
 * Attribue le bonus de parrainage de 500 points au parrain
 * Déclenché dès qu'un joueur invité effectue sa première manche officielle
 */
export async function triggerReferralReward(newPlayerUid) {
  if (!newPlayerUid) return { success: false, reason: 'missing_uid' };

  try {
    const newPlayerRef = doc(db, 'users', newPlayerUid);
    const newPlayerSnap = await getDoc(newPlayerRef);
    if (!newPlayerSnap.exists()) return { success: false, reason: 'player_not_found' };

    const playerData = newPlayerSnap.data();
    const referrerIdentifier = playerData.referred_by;
    // Si pas de parrain ou si le bonus a déjà été validé
    if (!referrerIdentifier || playerData.referral_rewarded === true) {
      return { success: false, reason: 'no_referrer_or_already_rewarded' };
    }

    // Retrouver le document Firestore du parrain (par UID ou par pseudo)
    let referrerDocRef = null;
    const directRef = doc(db, 'users', referrerIdentifier);
    const directSnap = await getDoc(directRef);

    if (directSnap.exists()) {
      referrerDocRef = directRef;
    } else {
      // Recherche alternative par pseudo insensible à la casse
      const q = query(
        collection(db, 'users'),
        where('pseudo_lower', '==', referrerIdentifier.trim().toLowerCase())
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        referrerDocRef = doc(db, 'users', querySnap.docs[0].id);
      }
    }

    if (!referrerDocRef) {
      console.warn('Parrain introuvable sur Firebase :', referrerIdentifier);
      return { success: false, reason: 'referrer_not_found' };
    }

    // Règle anti-auto-parrainage : interdire d'être son propre parrain
    if (referrerDocRef.id === newPlayerUid) {
      return { success: false, reason: 'self_referral_forbidden' };
    }

    // Transaction atomique pour créditer 500 points au parrain et marquer le bonus accordé
    await runTransaction(db, async (transaction) => {
      const refSnap = await transaction.get(referrerDocRef);
      if (!refSnap.exists()) return;

      const refData = refSnap.data() || {};
      const currentBonus = refData.bonus_points || 0;
      const currentTotal = refData.score_total_cumule || refData.total_points || 0;

      transaction.update(referrerDocRef, {
        bonus_points: currentBonus + 500,
        score_total_cumule: currentTotal + 500,
        total_points: currentTotal + 500,
        referrals_count: (refData.referrals_count || 0) + 1,
        maj_le: serverTimestamp(),
      });

      transaction.update(newPlayerRef, {
        referral_rewarded: true,
        referral_rewarded_at: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (err) {
    console.warn('Erreur attribution transaction bonus parrainage :', err);
    return { success: false, error: err.message };
  }
}

/**
 * Récupère la liste complète des filleuls parrainés par un utilisateur
 * Renvoie les informations des amis, leur statut (validé / en attente), leurs scores et les points rapportés
 */
export async function getUserReferralsList(referrerUid, referrerPseudo = null) {
  if (!referrerUid) return [];

  try {
    const usersRef = collection(db, 'users');
    const referralsMap = new Map();

    // 1. Recherche par UID du parrain
    const qUid = query(usersRef, where('referred_by', '==', referrerUid));
    const snapUid = await getDocs(qUid);
    snapUid.forEach((d) => {
      referralsMap.set(d.id, { id: d.id, ...d.data() });
    });

    // 2. Recherche optionnelle par pseudo (si un lien a été partagé avec le pseudo)
    if (referrerPseudo) {
      const qPseudo = query(usersRef, where('referred_by', '==', referrerPseudo.trim()));
      const snapPseudo = await getDocs(qPseudo);
      snapPseudo.forEach((d) => {
        if (!referralsMap.has(d.id)) {
          referralsMap.set(d.id, { id: d.id, ...d.data() });
        }
      });
    }

    const list = Array.from(referralsMap.values()).map((filleul) => {
      const isRewarded = filleul.referral_rewarded === true;
      const pointsGiven = isRewarded ? 500 : 0;
      const totalPoints = filleul.score_total_cumule || filleul.total_points || filleul.meilleur_score || 0;

      return {
        uid: filleul.uid || filleul.id,
        pseudo: filleul.pseudo || 'Ami BizGames',
        photo_url: filleul.photo_url || '',
        parties_jouees: filleul.parties_jouees || 0,
        meilleur_score: filleul.meilleur_score || 0,
        total_points: totalPoints,
        streak_actuel: filleul.streak_actuel || 0,
        cree_le: filleul.cree_le,
        referral_rewarded: isRewarded,
        points_rapportes: pointsGiven,
        status: isRewarded ? 'valide' : (filleul.parties_jouees > 0 ? 'en_cours' : 'en_attente_1ere_partie'),
      };
    });

    // Tri : les filleuls validés d'abord, puis par score total décroissant
    return list.sort((a, b) => {
      if (b.points_rapportes !== a.points_rapportes) {
        return b.points_rapportes - a.points_rapportes;
      }
      return (b.total_points || 0) - (a.total_points || 0);
    });
  } catch (err) {
    console.warn('Erreur récupération filleuls :', err.message);
    return [];
  }
}

/**
 * Traduction conviviale des erreurs Firebase Auth
 */
function formatAuthError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'Aucun compte associé à cette adresse e-mail.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée par un autre compte.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/invalid-email':
      return 'Format d’adresse e-mail invalide.';
    case 'auth/popup-closed-by-user':
      return 'Fenêtre de connexion Google fermée avant validation.';
    case 'auth/popup-blocked':
      return 'La fenêtre de connexion Google a été bloquée par le navigateur. Veuillez autoriser les pop-ups.';
    case 'auth/cancelled-popup-request':
      return 'Opération d’authentification précédente annulée.';
    case 'auth/unauthorized-domain':
      return 'Ce domaine n’est pas autorisé dans la console Firebase Authentication.';
    case 'auth/network-request-failed':
      return 'Problème de connexion réseau. Vérifiez votre accès Internet.';
    default:
      return 'Une erreur est survenue lors de l’authentification.';
  }
}

/**
 * Récupère le classement du round pour une date donnée
 */
export async function getDailyLeaderboard(dateStr, currentUserScore = null) {
  try {
    const scoresRef = collection(db, 'scores');
    const q = query(scoresRef, where('date', '==', dateStr));
    const snapshot = await getDocs(q);

    // Charger la table des utilisateurs pour rattacher la photo de profil officielle et le pseudo
    const usersMap = new Map();
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((uDoc) => {
        const uData = uDoc.data();
        const photo = uData.photo_url || uData.photoURL || '';
        const pseudo = uData.pseudo || '';
        const entry = { photo_url: photo, pseudo };
        usersMap.set(uDoc.id, entry);
        if (pseudo) {
          usersMap.set(pseudo.toLowerCase().trim(), entry);
        }
      });
    } catch (uErr) {
      console.warn('Erreur lecture photos profils utilisateurs :', uErr);
    }

    let scores = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const isUserAdmin = Boolean(
        data.user_id === '6uNoDpHzLvRikKRJplgGXOZJXIU2' ||
        (data.pseudo || '').toLowerCase() === 'admin' ||
        (data.pseudo || '').toLowerCase() === 'superadmin' ||
        data.is_admin === true ||
        data.isAdmin === true
      );
      if (data.is_official !== false && !isUserAdmin) {
        const uid = data.user_id || d.id;
        const uInfo = usersMap.get(uid) || (data.pseudo ? usersMap.get(data.pseudo.toLowerCase().trim()) : null);
        const resolvedPhoto = data.photo_url || uInfo?.photo_url || '';
        const resolvedPseudo = (!data.pseudo || data.pseudo === 'Joueur Anonyme' || data.pseudo === 'Joueur BizGames') && uInfo?.pseudo
          ? uInfo.pseudo
          : data.pseudo;

        scores.push({
          id: d.id,
          ...data,
          photo_url: resolvedPhoto,
          pseudo: resolvedPseudo,
        });
      }
    });

    if (currentUserScore && !scores.some((s) => s.user_id === currentUserScore.user_id)) {
      const uInfo = usersMap.get(currentUserScore.user_id) || (currentUserScore.pseudo ? usersMap.get(currentUserScore.pseudo.toLowerCase().trim()) : null);
      scores.push({
        ...currentUserScore,
        photo_url: currentUserScore.photo_url || uInfo?.photo_url || '',
        pseudo: currentUserScore.pseudo || uInfo?.pseudo || 'Joueur',
      });
    }

    // Dédoublonnage par joueur (meilleur score conservé)
    const bestByUser = {};
    scores.forEach((s) => {
      const uid = s.user_id || s.id;
      if (!bestByUser[uid] || (s.score_total || 0) > (bestByUser[uid].score_total || 0)) {
        bestByUser[uid] = s;
      }
    });

    let list = Object.values(bestByUser);

    // Tri : score décroissant, puis temps croissant
    list.sort((a, b) => {
      if ((b.score_total || 0) !== (a.score_total || 0)) {
        return (b.score_total || 0) - (a.score_total || 0);
      }
      return (a.temps_total_secondes || 999) - (b.temps_total_secondes || 999);
    });

    // Liste triée des vrais joueurs authentifiés ayant joué aujourd'hui
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  } catch (err) {
    console.warn('Erreur récupération classement du jour :', err.message);
    return [];
  }
}

/**
 * Récupère le classement des vrais joueurs globaux enregistrés sur Firebase
 */
export async function getGlobalLeaderboard() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    // Récupérer les scores de la collection 'scores' pour garantir le calcul exact de la somme des points de chaque jour
    const scoresRef = collection(db, 'scores');
    const snapScores = await getDocs(scoresRef);

    // Groupement des scores officiels par utilisateur et par date pour additionner les points de chaque jour
    const dailyScoresByUser = {};
    snapScores.forEach((d) => {
      const s = d.data();
      const uid = s.user_id;
      if (!uid) return;
      if (s.is_official === false) return; // Ne compter que les manches officielles ou valides
      const dateKey = s.date || 'legacy';
      if (!dailyScoresByUser[uid]) dailyScoresByUser[uid] = {};
      if (!dailyScoresByUser[uid][dateKey] || (s.score_total || 0) > dailyScoresByUser[uid][dateKey]) {
        dailyScoresByUser[uid][dateKey] = s.score_total || 0;
      }
    });

    let users = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const uid = d.id;
      const isUserAdmin = Boolean(
        uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2' ||
        data.is_admin === true ||
        data.isAdmin === true ||
        data.email?.toLowerCase() === 'segafal@gmail.com' ||
        (data.pseudo || '').toLowerCase() === 'admin' ||
        (data.pseudo || '').toLowerCase() === 'superadmin'
      );
      if (isUserAdmin) return;

      // Somme de tous les points de chaque jour joué + bonus de parrainage éventuel
      const userDaysMap = dailyScoresByUser[uid] || {};
      const sumDaily = Object.values(userDaysMap).reduce((acc, pts) => acc + pts, 0);
      const daysPlayedCount = Object.keys(userDaysMap).length;
      const bonusPts = data.bonus_points || 0;

      // Cumul total : la somme calculée depuis scores + bonus ou le score cumulé enregistré
      const scoreCumule = Math.max(
        sumDaily + bonusPts,
        data.score_total_cumule || 0,
        data.total_points || 0,
        (data.meilleur_score || 0) + bonusPts
      );

      const partiesJouees = Math.max(data.parties_jouees || 0, daysPlayedCount, scoreCumule > 0 ? 1 : 0);

      if (scoreCumule > 0 || partiesJouees > 0) {
        users.push({
          id: uid,
          uid,
          ...data,
          photo_url: data.photo_url || data.photoURL || '',
          bonus_points: bonusPts,
          referrals_count: data.referrals_count || 0,
          score_total_cumule: scoreCumule,
          total_points: scoreCumule,
          parties_jouees: partiesJouees,
        });
      }
    });

    // Tri prioritaire : somme des points de chaque jour (score total cumulé) décroissant
    users.sort((a, b) => {
      if ((b.score_total_cumule || 0) !== (a.score_total_cumule || 0)) {
        return (b.score_total_cumule || 0) - (a.score_total_cumule || 0);
      }
      if ((b.parties_jouees || 0) !== (a.parties_jouees || 0)) {
        return (b.parties_jouees || 0) - (a.parties_jouees || 0);
      }
      if ((b.meilleur_score || 0) !== (a.meilleur_score || 0)) {
        return (b.meilleur_score || 0) - (a.meilleur_score || 0);
      }
      return (b.streak_actuel || 0) - (a.streak_actuel || 0);
    });

    return users.slice(0, 50).map((u, i) => ({
      ...u,
      rank: i + 1,
    }));
  } catch (err) {
    console.warn('Erreur récupération classement global :', err.message);
    return [];
  }
}

/**
 * Récupère l'historique complet des scores d'un joueur
 */
export async function getUserScoreHistory(userId) {
  try {
    if (!userId) return [];
    const scoresRef = collection(db, 'scores');
    const q = query(scoresRef, where('user_id', '==', userId));
    const snapshot = await getDocs(q);

    const seenDates = new Map();
    const duplicateDocIdsToDelete = [];

    snapshot.forEach((d) => {
      const data = d.data();
      const dateKey = data.date || d.id;
      if (seenDates.has(dateKey)) {
        const existing = seenDates.get(dateKey);
        // Si doublon identique ou précédent non officiel, marquer le doublon superflu pour suppression
        if (data.is_official && !existing.is_official) {
          duplicateDocIdsToDelete.push(existing.id);
          seenDates.set(dateKey, { id: d.id, ...data });
        } else {
          duplicateDocIdsToDelete.push(d.id);
        }
      } else {
        seenDates.set(dateKey, { id: d.id, ...data });
      }
    });

    // Nettoyage en tâche de fond des doublons détectés dans Firestore
    if (duplicateDocIdsToDelete.length > 0) {
      Promise.all(duplicateDocIdsToDelete.map((id) => deleteDoc(doc(db, 'scores', id))))
        .then(() => console.info(`Nettoyé ${duplicateDocIdsToDelete.length} scores en doublon dans Firestore.`))
        .catch((e) => console.warn('Erreur nettoyage doublons Firestore :', e));
    }

    const history = Array.from(seenDates.values());
    history.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return history;
  } catch (err) {
    console.warn('Erreur récupération historique joueur :', err.message);
    return [];
  }
}

// ============================================================================
// GESTION DU COMPTE ADMIN (MODIFICATION EMAIL & MOT DE PASSE)
// ============================================================================

/**
 * Met à jour l'adresse email du compte admin connecté
 */
export async function updateAdminEmail(newEmail) {
  const user = auth.currentUser;
  if (!user) throw new Error('Aucun utilisateur connecté.');
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Adresse email invalide.');
  }
  await updateEmail(user, trimmed);
  // Synchroniser le document user dans Firestore
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, { email: trimmed, maj_le: serverTimestamp() }, { merge: true });
  try {
    await setDoc(doc(db, 'admins', user.uid), { email: trimmed, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    // collection admins optionnelle
  }
  return true;
}

/**
 * Met à jour le mot de passe du compte admin connecté
 */
export async function updateAdminPassword(newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('Aucun utilisateur connecté.');
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Le mot de passe doit comporter au moins 6 caractères.');
  }
  await updatePassword(user, newPassword);
  return true;
}

/**
 * Envoie un lien de réinitialisation de mot de passe par email
 */
export async function sendAdminPasswordReset(email) {
  const targetEmail = (email || auth.currentUser?.email || '').trim();
  if (!targetEmail) throw new Error('Aucune adresse email spécifiée.');
  await sendPasswordResetEmail(auth, targetEmail);
  return true;
}

// ============================================================================
// SERVICES ESPACE ADMIN (SUPERVISION, QUESTIONS, VALIDATION, CALENDRIER)
// ============================================================================

/**
 * Écran 1 : Vue d'ensemble (Statistiques du site, parties, joueurs uniques, round du jour, alertes)
 */
export async function fetchAdminOverviewStats(todayDateStr) {
  try {
    const scoresRef = collection(db, 'scores');
    const snapScores = await getDocs(scoresRef);

    const dToday = new Date(todayDateStr + 'T00:00:00');
    const d7DaysAgo = new Date(dToday);
    d7DaysAgo.setDate(dToday.getDate() - 7);
    const date7DaysAgoStr = d7DaysAgo.toISOString().split('T')[0];

    let gamesToday = 0;
    let gamesWeek = 0;
    let scoresTodaySum = 0;
    const uniqueUsersToday = new Set();
    const uniqueAnonToday = new Set();
    const uniqueRegToday = new Set();

    snapScores.forEach((d) => {
      const data = d.data();
      const sDate = data.date || '';
      if (sDate === todayDateStr) {
        gamesToday++;
        scoresTodaySum += (data.score_total || 0);
        const uid = data.user_id || d.id;
        uniqueUsersToday.add(uid);
        if (data.is_anonymous || uid.startsWith('anon_') || uid.startsWith('guest_') || uid === 'anon_offline') {
          uniqueAnonToday.add(uid);
        } else {
          uniqueRegToday.add(uid);
        }
      }
      if (sDate >= date7DaysAgoStr) {
        gamesWeek++;
      }
    });

    const avgScoreToday = gamesToday > 0 ? Math.round(scoresTodaySum / gamesToday) : 0;

    // Compter le total de questions et celles en attente de validation
    const questionsRef = collection(db, 'questions');
    const questionsSnap = await getDocs(questionsRef);
    const totalQuestionsCount = questionsSnap.size;
    let pendingCount = 0;
    questionsSnap.forEach((d) => {
      if (d.data().statut_validation === 'en_attente') pendingCount++;
    });

    // Récupérer le round du jour
    let todayRound = null;
    try {
      const roundDoc = await getDoc(doc(db, 'daily_rounds', todayDateStr));
      if (roundDoc.exists()) {
        todayRound = { id: roundDoc.id, ...roundDoc.data() };
      }
    } catch (e) {
      console.warn('Erreur lecture daily_round du jour:', e);
    }

    return {
      gamesToday,
      gamesWeek,
      uniquePlayersToday: uniqueUsersToday.size,
      registeredPlayersToday: uniqueRegToday.size,
      anonymousPlayersToday: uniqueAnonToday.size,
      avgScoreToday,
      totalQuestionsCount,
      pendingCount,
      todayRound,
    };
  } catch (err) {
    console.error('Erreur chargement stats overview admin :', err);
    throw err;
  }
}


/**
 * Écran 2 : Récupère toutes les questions de la collection Firestore
 */
export async function fetchAllQuestionsAdmin() {
  const ref = collection(db, 'questions');
  const snap = await getDocs(ref);
  const list = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });
  return list;
}

/**
 * Enregistre ou met à jour une question
 */
export async function saveQuestionAdmin(questionData) {
  const id = questionData.id || `q_${Date.now()}`;
  const docRef = doc(db, 'questions', id);
  const data = {
    ...questionData,
    id,
    maj_le: serverTimestamp(),
  };
  if (!questionData.cree_le) {
    data.cree_le = serverTimestamp();
  }
  await setDoc(docRef, data, { merge: true });
  return data;
}

/**
 * Supprime une question
 */
export async function deleteQuestionAdmin(questionId) {
  const docRef = doc(db, 'questions', questionId);
  await deleteDoc(docRef);
  return true;
}

/**
 * Écran 3 : Validation / Rejet d'une question
 */
export async function updateQuestionValidation(questionId, statutValidation, noteAdmin = '') {
  const docRef = doc(db, 'questions', questionId);
  const qSnap = await getDoc(docRef);
  const qData = qSnap.exists() ? qSnap.data() : null;

  await updateDoc(docRef, {
    statut_validation: statutValidation,
    actif: statutValidation === 'validee',
    note_admin: noteAdmin || '',
    maj_le: serverTimestamp(),
  });

  // Si la question est validée et qu'elle a été soumise par un joueur : créditer le bonus de +500 pts
  if (
    statutValidation === 'validee' &&
    qData &&
    qData.soumis_par &&
    qData.soumis_par !== 'catalogue_officiel' &&
    qData.soumis_par !== 'admin'
  ) {
    try {
      const authorRef = doc(db, 'users', qData.soumis_par);
      const authorSnap = await getDoc(authorRef);
      if (authorSnap.exists()) {
        await updateDoc(authorRef, {
          bonus_points: increment(500),
          score_total_cumule: increment(500),
          questions_validees_count: increment(1),
          maj_le: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Impossible d'attribuer le bonus de contribution :", e);
    }
  }

  return true;
}

/**
 * Soumission d'une proposition de question par un joueur
 */
export async function submitQuestionPlayer(questionData, user, stats) {
  if (!user || user.isAnonymous) {
    throw new Error('Vous devez être connecté avec un compte pour proposer une question.');
  }

  const qId = `q_comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, 'questions', qId);

  const payload = {
    id: qId,
    texte: (questionData.texte || '').trim(),
    categorie: questionData.categorie || 'tech',
    difficulte: questionData.difficulte || 'moyen',
    reponse_lat: Number(questionData.reponse_lat) || 0,
    reponse_lng: Number(questionData.reponse_lng) || 0,
    lieu_nom: (questionData.lieu_nom || '').trim(),
    pays: (questionData.pays || '').trim(),
    region: (questionData.region || '').trim(),
    explication: (questionData.explication || '').trim(),
    source: (questionData.source || '').trim(),
    statut_validation: 'en_attente',
    actif: false,
    soumis_par: user.uid,
    auteur_pseudo: stats?.pseudo || user.displayName || 'Joueur BizGames',
    auteur_photo: stats?.photo_url || user.photoURL || null,
    cree_le: serverTimestamp(),
    maj_le: serverTimestamp(),
  };

  await setDoc(docRef, payload);
  return payload;
}

/**
 * Récupère l'historique des questions soumises par un joueur
 */
export async function fetchUserSubmittedQuestions(userId) {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, 'questions'),
      where('soumis_par', '==', userId)
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    // Trier par date la plus récente
    list.sort((a, b) => {
      const tA = a.cree_le?.seconds ? a.cree_le.seconds * 1000 : new Date(a.cree_le || 0).getTime();
      const tB = b.cree_le?.seconds ? b.cree_le.seconds * 1000 : new Date(b.cree_le || 0).getTime();
      return tB - tA;
    });
    return list;
  } catch (err) {
    console.error('Erreur récupération questions joueur :', err);
    return [];
  }
}

/**
 * Synchronise les questions du catalogue local vers la collection Firestore 'questions'
 * Gère le découpage par lots de 400 (limite Firestore : 500 par batch)
 */
export async function syncCatalogQuestionsAdmin(questionsList, onProgress = null) {
  if (!Array.isArray(questionsList) || questionsList.length === 0) {
    throw new Error('Aucune question fournie pour la synchronisation.');
  }

  const chunkSize = 400;
  let totalCommitted = 0;

  for (let i = 0; i < questionsList.length; i += chunkSize) {
    const chunk = questionsList.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((q) => {
      const qId = q.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const docRef = doc(db, 'questions', qId);
      const data = {
        id: qId,
        texte: q.texte || '',
        categorie: q.categorie || 'tech',
        difficulte: q.difficulte || 'moyen',
        reponse_lat: Number(q.reponse_lat) || 0,
        reponse_lng: Number(q.reponse_lng) || 0,
        lieu_nom: q.lieu_nom || '',
        pays: q.pays || '',
        region: q.region || '',
        explication: q.explication || '',
        source: q.source || '',
        actif: q.actif !== false,
        statut_validation: q.statut_validation || 'validee',
        soumis_par: q.soumis_par || 'catalogue_officiel',
        maj_le: serverTimestamp(),
      };
      if (!q.cree_le) {
        data.cree_le = serverTimestamp();
      }
      batch.set(docRef, data, { merge: true });
    });

    await batch.commit();
    totalCommitted += chunk.length;
    if (typeof onProgress === 'function') {
      onProgress(totalCommitted, questionsList.length);
    }
  }

  return { success: true, count: totalCommitted };
}


/**
 * Statistiques de calibrage par question (distance moyenne & score moyen depuis scores)
 */
export async function fetchQuestionPerformanceStats() {
  try {
    const scoresRef = collection(db, 'scores');
    const snap = await getDocs(scoresRef);
    const statsMap = {};

    snap.forEach((d) => {
      const data = d.data();
      const details = data.details_par_question || [];
      details.forEach((item) => {
        if (!item.question_id) return;
        if (!statsMap[item.question_id]) {
          statsMap[item.question_id] = { totalDistance: 0, totalScore: 0, count: 0 };
        }
        statsMap[item.question_id].totalDistance += (item.distance_km || 0);
        statsMap[item.question_id].totalScore += (item.score || 0);
        statsMap[item.question_id].count += 1;
      });
    });

    const result = {};
    for (const [qid, val] of Object.entries(statsMap)) {
      result[qid] = {
        playedCount: val.count,
        avgDistanceKm: Math.round(val.totalDistance / val.count),
        avgScore: Math.round(val.totalScore / val.count),
      };
    }
    return result;
  } catch (err) {
    console.warn('Erreur calcul stats questions depuis scores :', err);
    return {};
  }
}

/**
 * Écran 4 : Récupère les rounds pour une plage de dates
 */
export async function fetchDailyRoundsRange(startDateStr, endDateStr) {
  const roundsRef = collection(db, 'daily_rounds');
  const snap = await getDocs(roundsRef);
  const rounds = [];
  snap.forEach((d) => {
    const data = d.data();
    const date = data.date || d.id;
    if (date >= startDateStr && date <= endDateStr) {
      rounds.push({ id: d.id, ...data, date });
    }
  });
  rounds.sort((a, b) => a.date.localeCompare(b.date));
  return rounds;
}

/**
 * Sauvegarde ou modifie un round quotidien dans Firestore
 */
export async function saveDailyRound(roundData) {
  const roundRef = doc(db, 'daily_rounds', roundData.date);
  await setDoc(roundRef, {
    ...roundData,
    maj_le: serverTimestamp(),
  }, { merge: true });
  return true;
}

/**
 * Auto-génération des 30 prochains jours selon les règles strictes
 */
export async function autoGenerateUpcomingRounds(startDateStr, daysCount = 30, adminUid) {
  const questionsList = await fetchAllQuestionsAdmin();
  const validQuestions = questionsList.filter(
    (q) => q.actif !== false && q.statut_validation === 'validee'
  );

  if (validQuestions.length < 5) {
    throw new Error('Pas assez de questions validées et actives pour planifier des rounds (minimum 5 requises).');
  }

  const roundsColl = collection(db, 'daily_rounds');
  const snapRounds = await getDocs(roundsColl);
  const existingRoundsMap = new Map();
  snapRounds.forEach((d) => existingRoundsMap.set(d.id, d.data()));

  const usedQuestionIdsInLast60Days = new Set();
  const todayStr = new Date().toISOString().split('T')[0];

  const dStart = new Date(startDateStr + 'T00:00:00');
  const d60Before = new Date(dStart);
  d60Before.setDate(dStart.getDate() - 60);
  const date60BeforeStr = d60Before.toISOString().split('T')[0];

  for (const [rDate, rData] of existingRoundsMap.entries()) {
    if (rDate >= date60BeforeStr && rData.ids_questions) {
      rData.ids_questions.forEach((id) => usedQuestionIdsInLast60Days.add(id));
    }
  }

  const batch = writeBatch(db);
  let generatedCount = 0;

  for (let offset = 0; offset < daysCount; offset++) {
    const curDate = new Date(dStart);
    curDate.setDate(dStart.getDate() + offset);
    const dateStr = curDate.toISOString().split('T')[0];

    const existingRound = existingRoundsMap.get(dateStr);
    // Règle stricte : Ne jamais écraser un round dont le statut est "joue" ou date passée
    if (existingRound && (existingRound.statut === 'joue' || dateStr < todayStr)) {
      continue;
    }

    const selectedIds = [];
    const usedCategories = new Set();

    let candidatePool = validQuestions.filter((q) => !usedQuestionIdsInLast60Days.has(q.id));
    if (candidatePool.length < 15) {
      candidatePool = [...validQuestions];
    }

    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    const shuffled = [...candidatePool].sort((a, b) => {
      const hA = (parseInt(a.id.replace(/\D/g, '') || '0', 10) + seed) % 97;
      const hB = (parseInt(b.id.replace(/\D/g, '') || '0', 10) + seed) % 97;
      return hA - hB;
    });

    for (const diff of ['facile', 'moyen', 'difficile', 'moyen', 'facile']) {
      if (selectedIds.length === 5) break;
      const match = shuffled.find(
        (q) => !selectedIds.includes(q.id) &&
               !usedCategories.has(q.categorie) &&
               (q.difficulte === diff || !q.difficulte)
      );
      if (match) {
        selectedIds.push(match.id);
        usedCategories.add(match.categorie);
        usedQuestionIdsInLast60Days.add(match.id);
      }
    }

    if (selectedIds.length < 5) {
      for (const candidate of shuffled) {
        if (selectedIds.length === 5) break;
        if (!selectedIds.includes(candidate.id) && !usedCategories.has(candidate.categorie)) {
          selectedIds.push(candidate.id);
          usedCategories.add(candidate.categorie);
          usedQuestionIdsInLast60Days.add(candidate.id);
        }
      }
    }

    if (selectedIds.length < 5) {
      for (const candidate of validQuestions) {
        if (selectedIds.length === 5) break;
        if (!selectedIds.includes(candidate.id)) {
          selectedIds.push(candidate.id);
        }
      }
    }

    const roundRef = doc(db, 'daily_rounds', dateStr);
    batch.set(roundRef, {
      date: dateStr,
      ids_questions: selectedIds,
      statut: selectedIds.length === 5 ? 'planifie' : 'incomplet',
      genere_le: serverTimestamp(),
      modifie_par: adminUid || 'admin_auto',
    }, { merge: true });

    generatedCount++;
  }

  await batch.commit();
  return generatedCount;
}

/**
 * Surveillance et auto-renouvellement glissant des rounds quotidiens :
 * Vérifie si le stock de rounds futurs planifiés dans Firestore est inférieur à minDaysBuffer (ex: 7 jours).
 * Si c'est le cas, génère automatiquement les 30 jours suivants avec la rotation anti-doublons de 60 jours.
 */
export async function autoEnsureDailyRoundsBuffer(todayDateStr, minDaysBuffer = 7, targetDaysAhead = 35, adminUid = 'auto_system') {
  try {
    const roundsColl = collection(db, 'daily_rounds');
    const snapRounds = await getDocs(roundsColl);

    const existingRoundsMap = new Map();
    snapRounds.forEach((d) => existingRoundsMap.set(d.id, d.data()));

    const base = new Date(todayDateStr + 'T00:00:00');
    let futureDaysAvailable = 0;

    for (let i = 0; i <= targetDaysAhead; i++) {
      const cur = new Date(base);
      cur.setDate(base.getDate() + i);
      const dStr = cur.toISOString().split('T')[0];
      const r = existingRoundsMap.get(dStr);
      if (r && Array.isArray(r.ids_questions) && r.ids_questions.length === 5) {
        futureDaysAvailable++;
      }
    }

    // Si on a moins de 7 jours d'avance (ou le tampon souhaité), régénération glissante automatique
    if (futureDaysAvailable < minDaysBuffer) {
      console.log(`[AutoBuffer] Stock de rounds planifiés faible (${futureDaysAvailable} jours < ${minDaysBuffer} requis). Auto-génération de 35 jours...`);
      const count = await autoGenerateUpcomingRounds(todayDateStr, targetDaysAhead, adminUid);
      return { triggered: true, generatedCount: count, previousCount: futureDaysAvailable };
    }

    return { triggered: false, daysAvailable: futureDaysAvailable };
  } catch (err) {
    console.warn('[AutoBuffer] Impossible de vérifier ou auto-générer les rounds :', err);
    return { triggered: false, error: err.message };
  }
}


// ============================================================================
// POINT 7 : CHARGEMENT DU ROUND DU JOUR CÔTÉ JOUEUR (FIRESTORE AVEC FALLBACK)
// ============================================================================

/**
 * Charge le round officiel du jour depuis Firestore daily_rounds/{dateStr}
 * Lit les 5 questions correspondantes.
 * Fallback élégant si document absent ou offline : pioche déterministe parmi les questions validées & actives.
 */
export async function fetchDailyRoundForDate(dateStr, fallbackPool = []) {
  try {
    const roundRef = doc(db, 'daily_rounds', dateStr);
    const roundSnap = await getDoc(roundRef);

    if (roundSnap.exists()) {
      const data = roundSnap.data();
      const questionIds = data.ids_questions || [];

      if (questionIds.length > 0) {
        const loadedQuestions = [];
        for (const qid of questionIds) {
          try {
            const qDoc = await getDoc(doc(db, 'questions', qid));
            if (qDoc.exists()) {
              loadedQuestions.push({ id: qDoc.id, ...qDoc.data() });
            } else {
              const localQ = fallbackPool.find((p) => p.id === qid);
              if (localQ) loadedQuestions.push(localQ);
            }
          } catch (e) {
            const localQ = fallbackPool.find((p) => p.id === qid);
            if (localQ) loadedQuestions.push(localQ);
          }
        }

        if (loadedQuestions.length === 5) {
          return loadedQuestions;
        }
      }
    }
  } catch (err) {
    console.warn('Daily round distant inaccessible, activation du fallback local :', err.message);
  }

  // Fallback déterministe identique à l'algorithme officiel
  const validFallback = fallbackPool.filter((q) => q.actif !== false && (q.statut_validation === 'validee' || !q.statut_validation));
  const poolToUse = validFallback.length >= 5 ? validFallback : fallbackPool;
  return getDailyRound(poolToUse, dateStr);
}

// ============================================================================
// GESTION & SUPERVISION DES JOUEURS (ESPACE ADMIN)
// ============================================================================

/**
 * Récupère l'ensemble des joueurs enregistrés dans Firestore, avec agrégation
 * complète de leurs scores, calcul de leur rang mondial et de leur position par pays.
 */
export async function fetchAllPlayersWithStatsAdmin() {
  try {
    const usersRef = collection(db, 'users');
    const scoresRef = collection(db, 'scores');

    const [snapUsers, snapScores] = await Promise.all([
      getDocs(usersRef),
      getDocs(scoresRef),
    ]);

    // 1. Indexer tous les scores par user_id
    const scoresByUser = {};
    const allScoresList = [];
    snapScores.forEach((d) => {
      const data = d.data();
      const scoreObj = { id: d.id, ...data };
      allScoresList.push(scoreObj);
      const uid = data.user_id || 'unknown';
      if (!scoresByUser[uid]) {
        scoresByUser[uid] = [];
      }
      scoresByUser[uid].push(scoreObj);
    });

    // Trier les scores de chaque joueur par date décroissante
    for (const uid in scoresByUser) {
      scoresByUser[uid].sort((a, b) => {
        const da = a.date || (a.cree_le?.toDate ? a.cree_le.toDate().toISOString() : '');
        const db_ = b.date || (b.cree_le?.toDate ? b.cree_le.toDate().toISOString() : '');
        return db_.localeCompare(da);
      });
    }

    // 2. Extraire les utilisateurs enregistrés
    const userMap = new Map();
    snapUsers.forEach((d) => {
      const u = d.data();
      const uid = d.id;
      userMap.set(uid, { id: uid, uid, ...u });
    });

    // 3. Si des scores existent pour des UIDs non répertoriés dans /users, les ajouter pour une visibilité 100% complète
    allScoresList.forEach((s) => {
      const uid = s.user_id;
      if (uid && !userMap.has(uid) && !uid.startsWith('anon_offline')) {
        userMap.set(uid, {
          id: uid,
          uid,
          pseudo: s.pseudo || 'Joueur Invité',
          email: '',
          country: 'Non renseigné',
          country_flag: '🌍',
          parties_jouees: 0,
          meilleur_score: s.score_total || 0,
          is_guest: true,
          cree_le: s.cree_le || null,
        });
      }
    });

    // 4. Calculer les statistiques précises pour chaque joueur
    const players = [];
    userMap.forEach((user, uid) => {
      const userScores = scoresByUser[uid] || [];
      const scoreValues = userScores.map((s) => s.score_total || 0);

      const bestFromScores = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
      const bestScore = Math.max(bestFromScores, user.meilleur_score || 0);

      const totalScoreSum = scoreValues.reduce((acc, curr) => acc + curr, 0);
      const gamesCount = Math.max(userScores.length, user.parties_jouees || 0);
      const avgScore = userScores.length > 0 ? Number((totalScoreSum / userScores.length).toFixed(1)) : (user.parties_jouees > 0 && user.meilleur_score ? Number(user.meilleur_score) : 0);

      const totalSeconds = userScores.reduce((acc, s) => acc + (s.temps_total_secondes || 0), 0);
      const avgTimeSeconds = userScores.length > 0 ? Math.round(totalSeconds / userScores.length) : null;

      // Calcul distance moyenne sur les questions jouées
      let totalDist = 0;
      let distCount = 0;
      userScores.forEach((s) => {
        (s.details_par_question || []).forEach((q) => {
          if (typeof q.distance_km === 'number') {
            totalDist += q.distance_km;
            distCount++;
          }
        });
      });
      const avgDistanceKm = distCount > 0 ? Math.round(totalDist / distCount) : null;

      const lastPlayedDate = userScores[0]?.date || user.date_derniere_partie || null;
      const latestEmojiGrid = userScores[0]?.grille_emoji || null;

      const country = (user.country || '').trim() || 'Non renseigné';
      const countryFlag = (user.country_flag || '').trim() || '🌍';

      const isFounder = user.email?.trim().toLowerCase() === 'segafal@gmail.com';
      const isAdmin = Boolean(
        user.is_admin === true ||
        user.isAdmin === true ||
        isFounder ||
        uid === '6uNoDpHzLvRikKRJplgGXOZJXIU2' ||
        (user.pseudo || '').toLowerCase() === 'admin' ||
        (user.pseudo || '').toLowerCase() === 'superadmin'
      );

      // RÈGLE STRICTE : Le compte administrateur NE JOUE PAS et ne doit JAMAIS apparaître dans la liste ou le classement des joueurs
      if (isAdmin) {
        return;
      }

      // Cumul exact des points de chaque jour
      const dailyMap = {};
      userScores.forEach((s) => {
        if (s.is_official === false) return;
        const d = s.date || 'legacy';
        if (!dailyMap[d] || (s.score_total || 0) > dailyMap[d]) {
          dailyMap[d] = s.score_total || 0;
        }
      });
      const dailySum = Object.values(dailyMap).reduce((a, b) => a + b, 0);
      const totalPoints = Math.max(
        dailySum,
        totalScoreSum,
        user.score_total_cumule || 0,
        user.total_points || 0,
        bestScore
      );

      players.push({
        ...user,
        id: uid,
        uid,
        pseudo: user.pseudo || user.displayName || (user.email ? user.email.split('@')[0] : 'Joueur'),
        email: user.email || '',
        country,
        countryFlag,
        ageRange: user.age_range || '',
        profession: user.profession || '',
        bio: user.bio || '',
        favoriteSector: user.favorite_sector || '',
        bestScore,
        avgScore,
        totalPoints,
        score_total_cumule: totalPoints,
        gamesCount,
        streak: user.streak_actuel || 0,
        avgTimeSeconds,
        avgDistanceKm,
        lastPlayedDate,
        latestEmojiGrid,
        isAdmin,
        isFounder,
        scores: userScores,
      });
    });

    // 5. Calcul du Rang Mondial (Global Rank) basé sur les points cumulés de chaque jour
    players.sort((a, b) => {
      if ((b.totalPoints || 0) !== (a.totalPoints || 0)) return (b.totalPoints || 0) - (a.totalPoints || 0);
      if ((b.bestScore || 0) !== (a.bestScore || 0)) return (b.bestScore || 0) - (a.bestScore || 0);
      if (b.gamesCount !== a.gamesCount) return b.gamesCount - a.gamesCount;
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      return (b.streak || 0) - (a.streak || 0);
    });

    players.forEach((p, index) => {
      p.globalRank = index + 1;
    });

    // 6. Calcul de la Position par Pays (Country Rank)
    const playersByCountry = {};
    players.forEach((p) => {
      const c = p.country;
      if (!playersByCountry[c]) {
        playersByCountry[c] = [];
      }
      playersByCountry[c].push(p);
    });

    for (const c in playersByCountry) {
      const countryGroup = playersByCountry[c];
      countryGroup.sort((a, b) => {
        if ((b.totalPoints || 0) !== (a.totalPoints || 0)) return (b.totalPoints || 0) - (a.totalPoints || 0);
        if ((b.bestScore || 0) !== (a.bestScore || 0)) return (b.bestScore || 0) - (a.bestScore || 0);
        if (b.gamesCount !== a.gamesCount) return b.gamesCount - a.gamesCount;
        return (b.streak || 0) - (a.streak || 0);
      });
      countryGroup.forEach((p, idx) => {
        p.countryRank = idx + 1;
        p.countryTotalPlayers = countryGroup.length;
      });
    }

    // 7. Agréger les statistiques par pays (Country Analytics)
    const countryStatsList = Object.keys(playersByCountry).map((c) => {
      const group = playersByCountry[c];
      const flag = group[0]?.countryFlag || '🌍';
      const totalScoresInCountry = group.reduce((acc, p) => acc + p.totalPoints, 0);
      const totalGamesInCountry = group.reduce((acc, p) => acc + p.gamesCount, 0);
      const avgScoreInCountry = totalGamesInCountry > 0 ? Number((totalScoresInCountry / totalGamesInCountry).toFixed(1)) : 0;
      const bestScoreInCountry = Math.max(...group.map((p) => p.bestScore || 0));

      return {
        country: c,
        flag,
        playerCount: group.length,
        avgScore: avgScoreInCountry,
        bestScore: bestScoreInCountry,
        topPlayer: group[0]?.pseudo || '—',
      };
    });

    countryStatsList.sort((a, b) => b.playerCount - a.playerCount);

    // 8. Indicateurs synthétiques globaux
    const totalPlayers = players.length;
    const activePlayers = players.filter((p) => p.gamesCount > 0).length;
    const globalRecordScore = players.length > 0 ? Math.max(...players.map((p) => p.bestScore)) : 0;
    const recordHolder = players.find((p) => p.bestScore === globalRecordScore)?.pseudo || '—';
    const totalCommunityGames = players.reduce((acc, p) => acc + p.gamesCount, 0);
    const globalAvgScore = totalCommunityGames > 0
      ? Number((players.reduce((acc, p) => acc + p.totalPoints, 0) / totalCommunityGames).toFixed(1))
      : 0;

    return {
      players,
      countryStats: countryStatsList,
      globalStats: {
        totalPlayers,
        activePlayers,
        globalRecordScore,
        recordHolder,
        totalCommunityGames,
        globalAvgScore,
        countriesCount: countryStatsList.length,
      },
    };
  } catch (err) {
    console.error('Erreur chargement des joueurs pour l’admin :', err);
    throw err;
  }
}

/**
 * Met à jour le rôle administrateur d'un utilisateur dans Firestore
 */
export async function updateUserAdminStatusAdmin(uid, isAdmin) {
  if (!uid) throw new Error('UID requis.');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    is_admin: Boolean(isAdmin),
    isAdmin: Boolean(isAdmin),
    maj_le: serverTimestamp(),
  }, { merge: true });

  const adminDocRef = doc(db, 'admins', uid);
  if (isAdmin) {
    await setDoc(adminDocRef, {
      uid,
      role: 'admin',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } else {
    try {
      await deleteDoc(adminDocRef);
    } catch (e) {
      // Ignorer si n'existe pas
    }
  }
  return true;
}

/**
 * Supprime un score d'un joueur (ex: score de test ou anomalie)
 */
export async function deleteUserScoreAdmin(scoreId) {
  if (!scoreId) throw new Error('scoreId requis.');
  const scoreRef = doc(db, 'scores', scoreId);
  await deleteDoc(scoreRef);
  return true;
}

/**
 * Supprime définitivement le compte d'un utilisateur et toutes ses données associées
 * - Archive obligatoirement l'email et les stats historiques dans la collection 'deleted_accounts' (visible et exportable par l'Admin)
 * - Supprime tous les scores Firestore de l'utilisateur
 * - Supprime le document Firestore /users/{userId}
 * - Nettoie le cache local
 * - Supprime l'utilisateur de Firebase Authentication
 */
export async function deleteCurrentUserAccount(reason = 'Demande de suppression de compte utilisateur') {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Aucun compte utilisateur connecté.');
  }

  const userId = user.uid;

  // 1. Récupération des statistiques et données du profil avant purge
  let userStats = {};
  try {
    const userDocSnap = await getDoc(doc(db, 'users', userId));
    if (userDocSnap.exists()) {
      userStats = userDocSnap.data();
    }
  } catch (err) {
    console.warn('Impossible de lire les données du profil avant suppression:', err);
  }

  const emailToArchive = (user.email || userStats.email || '').trim().toLowerCase();

  // 2. Archivage sur Firestore dans 'deleted_accounts' (garde l'email et les métadonnées pour l'admin)
  try {
    await addDoc(collection(db, 'deleted_accounts'), {
      user_id: userId,
      email: emailToArchive || 'Non renseigné (Invité/Anonyme)',
      pseudo: userStats.pseudo || user.displayName || 'Joueur Anonyme',
      pays: userStats.pays || 'GLOBAL',
      parties_jouees: Number(userStats.parties_jouees || userStats.gamesCount || 0),
      score_cumule: Number(userStats.score_cumule || userStats.totalPoints || 0),
      meilleur_score: Number(userStats.meilleur_score || userStats.bestScore || 0),
      streak_max: Number(userStats.streak_max || userStats.streak || 0),
      raison: reason || 'Demande de suppression par le joueur',
      deleted_at: serverTimestamp(),
      deleted_at_iso: new Date().toISOString(),
    });
  } catch (errArchive) {
    console.error("Erreur lors de l'archivage de l'email supprimé:", errArchive);
  }

  // 3. Purge de tous les scores associés à cet utilisateur dans 'scores'
  try {
    const scoresQuery = query(collection(db, 'scores'), where('user_id', '==', userId));
    const scoresSnap = await getDocs(scoresQuery);
    if (!scoresSnap.empty) {
      const batches = [];
      let currentBatch = writeBatch(db);
      let count = 0;
      scoresSnap.docs.forEach((d) => {
        currentBatch.delete(d.ref);
        count++;
        if (count === 400) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(db);
          count = 0;
        }
      });
      if (count > 0) {
        batches.push(currentBatch.commit());
      }
      await Promise.all(batches);
    }
  } catch (errScores) {
    console.warn('Erreur suppression des scores:', errScores);
  }

  // 4. Suppression du document profil /users/{userId}
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (errUserDoc) {
    console.warn('Erreur suppression du document /users:', errUserDoc);
  }

  // 5. Nettoyage du localStorage et sessionStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`bizgames_profile_${userId}`);
      localStorage.removeItem('bizgames_active_user');
      localStorage.removeItem('bizgames_last_daily_played');
      sessionStorage.clear();
    }
  } catch (e) {
    // Ignorer
  }

  // 6. Suppression du compte Firebase Auth
  try {
    await deleteUser(user);
    return { success: true, message: 'Compte et données définitivement supprimés.' };
  } catch (authErr) {
    console.warn('Erreur deleteUser Firebase Auth:', authErr);
    // Déconnexion de secours si la session requiert une ré-authentification
    await signOut(auth);
    if (authErr.code === 'auth/requires-recent-login') {
      return {
        success: true,
        requiresRecentLogin: true,
        message: 'Toutes vos données ont été définitivement purgées. Votre session a été révoquée.',
      };
    }
    return { success: true };
  }
}

/**
 * Récupère la liste de tous les comptes supprimés archivés (réservé Admin)
 */
export async function fetchDeletedAccountsAdmin() {
  try {
    const deletedRef = collection(db, 'deleted_accounts');
    const q = query(deletedRef, orderBy('deleted_at', 'desc'));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (err) {
    console.warn('Fallback lecture deleted_accounts sans index :', err);
    try {
      const snapFallback = await getDocs(collection(db, 'deleted_accounts'));
      const listFallback = [];
      snapFallback.forEach((d) => {
        listFallback.push({ id: d.id, ...d.data() });
      });
      listFallback.sort((a, b) => {
        const da = a.deleted_at?.toDate ? a.deleted_at.toDate() : new Date(a.deleted_at_iso || 0);
        const db = b.deleted_at?.toDate ? b.deleted_at.toDate() : new Date(b.deleted_at_iso || 0);
        return db - da;
      });
      return listFallback;
    } catch (e2) {
      console.error('Erreur lecture deleted_accounts fallback:', e2);
      return [];
    }
  }
}

/**
 * Supprime définitivement un enregistrement d'archive de compte supprimé (réservé Admin)
 */
export async function deleteDeletedAccountAdmin(docId) {
  if (!docId) throw new Error('ID de document manquant.');
  await deleteDoc(doc(db, 'deleted_accounts', docId));
  return { success: true };
}

/**
 * Supprime plusieurs enregistrements d'archives de comptes supprimés par lot (réservé Admin)
 */
export async function deleteMultipleDeletedAccountsAdmin(docIds) {
  if (!Array.isArray(docIds) || docIds.length === 0) return { success: true, count: 0 };
  const batches = [];
  let currentBatch = writeBatch(db);
  let count = 0;
  for (const id of docIds) {
    currentBatch.delete(doc(db, 'deleted_accounts', id));
    count++;
    if (count === 400) {
      batches.push(currentBatch.commit());
      currentBatch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) {
    batches.push(currentBatch.commit());
  }
  await Promise.all(batches);
  return { success: true, count: docIds.length };
}



