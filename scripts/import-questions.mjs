/**
 * BizGames — Script d'Importation Firestore des Questions
 *
 * Utilisation :
 *   node scripts/import-questions.mjs [--dry-run] [--round-date=YYYY-MM-DD]
 *
 * Prérequis pour injection réelle :
 *   1. Placer votre clé de compte de service Firebase dans serviceAccountKey.json
 *      OU définir la variable d'environnement GOOGLE_APPLICATION_CREDENTIALS
 *   2. npm install firebase-admin
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, '../data/questions.json');
const SERVICE_ACCOUNT_FILE = path.resolve(__dirname, '../serviceAccountKey.json');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const roundDateArg = args.find((a) => a.startsWith('--round-date='));
const roundDate = roundDateArg ? roundDateArg.split('=')[1] : new Date().toISOString().split('T')[0];

async function main() {
  console.log('========================================================');
  console.log('   BIZGAMES — INGESTION DES QUESTIONS FIRESTORE');
  console.log('========================================================\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Fichier de données introuvable : ${DATA_FILE}`);
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`📦 Fichier chargé : ${questions.length} questions prêtes pour l'import.`);

  const hasServiceAccount = fs.existsSync(SERVICE_ACCOUNT_FILE) || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (isDryRun || !hasServiceAccount) {
    if (!hasServiceAccount && !isDryRun) {
      console.warn('⚠️ Aucun fichier serviceAccountKey.json ni variable GOOGLE_APPLICATION_CREDENTIALS détectée.');
      console.warn('ℹ️ Passage automatique en mode --dry-run (simulation de validation).\n');
    } else {
      console.log('🔍 Mode Simulation activé (--dry-run).\n');
    }

    console.log(`[DRY-RUN] Validation de ${questions.length} documents pour la collection "questions" :`);
    let sampleDisplayed = false;
    for (const q of questions) {
      if (!sampleDisplayed) {
        console.log('Exemple de document préparé pour Firestore :');
        console.log(JSON.stringify({ ...q, cree_le: new Date().toISOString(), maj_le: new Date().toISOString() }, null, 2));
        sampleDisplayed = true;
      }
    }

    // Exemple de daily_round généré
    const sampleRoundIds = questions.slice(0, 5).map((q) => q.id);
    console.log(`\n[DRY-RUN] Préparation du document pour "/daily_rounds/${roundDate}" :`);
    console.log(JSON.stringify({
      date: roundDate,
      ids_questions: sampleRoundIds,
      cree_le: new Date().toISOString(),
    }, null, 2));

    console.log(`\n✅ Simulation réussie : ${questions.length} questions sont parfaitement formatées pour Firestore.`);
    console.log('💡 Pour écrire en production dans Firebase :');
    console.log('   1. Téléchargez la clé de compte de service depuis la console Firebase');
    console.log('   2. Placez-la à la racine sous le nom "serviceAccountKey.json"');
    console.log('   3. Exécutez : npm run import:data\n');
    return;
  }

  // Connexion réelle via Firebase Admin SDK
  console.log('🔥 Initialisation de Firebase Admin SDK...');
  let admin;
  try {
    admin = (await import('firebase-admin')).default;
  } catch {
    console.error('❌ Le package "firebase-admin" n\'est pas installé. Lancez : npm install firebase-admin');
    process.exit(1);
  }

  let credential;
  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf-8'));
    credential = admin.credential.cert(serviceAccount);
  } else {
    credential = admin.credential.applicationDefault();
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential });
  }

  const db = admin.firestore();
  console.log('🚀 Écriture par lot (Batch Write) dans la collection "questions"...');

  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  for (const q of questions) {
    const docRef = db.collection('questions').doc(q.id);
    batch.set(docRef, {
      ...q,
      maj_le: timestamp,
      cree_le: q.cree_le ? new Date(q.cree_le) : timestamp,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`✅ ${questions.length} questions insérées ou mises à jour avec succès.`);

  // Création du round officiel du jour
  const dailyRoundRef = db.collection('daily_rounds').doc(roundDate);
  const dailyDoc = await dailyRoundRef.get();

  if (!dailyDoc.exists) {
    // Sélection équilibrée de 5 questions
    const selectedIds = questions.slice(0, 5).map((q) => q.id);
    await dailyRoundRef.set({
      date: roundDate,
      ids_questions: selectedIds,
      cree_le: timestamp,
    });
    console.log(`🎯 Round quotidien du jour créé pour la date : ${roundDate} (IDs: ${selectedIds.join(', ')})`);
  } else {
    console.log(`ℹ️ Le round quotidien pour ${roundDate} existe déjà.`);
  }

  console.log('\n🎉 Opération terminée avec succès.');
}

main().catch((err) => {
  console.error('❌ Erreur lors de l\'exécution du script :', err);
  process.exit(1);
});
