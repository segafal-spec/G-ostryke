/**
 * set-admin.mjs — Script pour définir les droits admin sur un utilisateur
 * Usage: node scripts/set-admin.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger le service account depuis le fichier .env
import dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialiser Firebase Admin
let app;
try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                              resolve(__dirname, '../service-account.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
} catch (e) {
  // Fallback: utiliser les credentials par défaut (Application Default Credentials)
  app = initializeApp({
    projectId: 'bizgames-game',
  });
}

const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_UID = '6uNoDpHzLvRikKRJplgGXOZJXIU2';
const ADMIN_EMAIL = 'segafal@gmail.com';

async function setAdminClaims() {
  console.log(`\n🔧 Configuration des droits admin pour ${ADMIN_EMAIL}...`);
  
  // 1. Définir les custom claims Firebase Auth
  await auth.setCustomUserClaims(ADMIN_UID, {
    admin: true,
    superadmin: true,
    role: 'admin',
  });
  console.log('✅ Custom claims admin définis dans Firebase Auth');

  // 2. Créer/mettre à jour le document admin dans Firestore
  await db.collection('admins').doc(ADMIN_UID).set({
    uid: ADMIN_UID,
    email: ADMIN_EMAIL,
    displayName: 'seyard papillon',
    role: 'superadmin',
    permissions: {
      viewQuestions: true,
      editQuestions: true,
      createRounds: true,
      deleteQuestions: true,
      viewUsers: true,
      manageUsers: true,
      viewStats: true,
      viewUpcoming: true,       // Voir les questions à venir (1 mois)
      manageGroups: true,
      manageChallenges: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('✅ Document admin créé dans Firestore (collection: admins)');

  // 3. Mettre à jour le document users existant
  await db.collection('users').doc(ADMIN_UID).set({
    isAdmin: true,
    role: 'superadmin',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('✅ Profil utilisateur mis à jour avec isAdmin: true');

  // 4. Vérification
  const user = await auth.getUser(ADMIN_UID);
  console.log('\n📋 Vérification des custom claims:');
  console.log(JSON.stringify(user.customClaims, null, 2));
  
  console.log('\n🎉 Droits admin configurés avec succès !');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   UID      : ${ADMIN_UID}`);
  console.log(`   Role     : superadmin`);
  console.log('\n⚠️  Le token JWT sera mis à jour à la prochaine connexion.');
  console.log('   Déconnectez-vous puis reconnectez-vous pour activer les droits admin.\n');
}

setAdminClaims().catch(console.error).finally(() => process.exit(0));
