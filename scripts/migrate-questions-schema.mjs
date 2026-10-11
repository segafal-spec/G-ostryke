/**
 * scripts/migrate-questions-schema.mjs
 *
 * Script de migration Firestore pour BizGames :
 * 1. Ajoute les nouveaux champs (statut_validation: "validee", soumis_par: "import_script", soumis_le, note_admin)
 *    à toutes les questions de la collection "questions".
 * 2. Importe le vivier complet depuis data/questions.json (231 questions) avec les nouveaux champs.
 * 3. Génère les 30 prochains rounds quotidiens dans "daily_rounds" avec le statut "planifie".
 * 4. Valide l'état admin sur le compte segafal@gmail.com (UID: 6uNoDpHzLvRikKRJplgGXOZJXIU2).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: 'AIzaSyAKS3IeKsT5JusIimVhPxyk_K5DA0qNpsU',
  authDomain: 'bizgames-game.firebaseapp.com',
  projectId: 'bizgames-game',
  storageBucket: 'bizgames-game.firebasestorage.app',
  messagingSenderId: '613565358993',
  appId: '1:613565358993:web:514027c92eb88927057030',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_UID = '6uNoDpHzLvRikKRJplgGXOZJXIU2';
const ADMIN_EMAIL = 'segafal@gmail.com';
const DATA_FILE = path.resolve(__dirname, '../data/questions.json');

async function main() {
  console.log('===============================================================');
  console.log('   BIZGAMES — MIGRATION DU SCHÉMA FIRESTORE (QUESTIONS & ROUNDS)');
  console.log('===============================================================\n');

  // 1. Charger le vivier local de questions
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Fichier introuvable : ${DATA_FILE}`);
    process.exit(1);
  }
  const localQuestions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`📦 ${localQuestions.length} questions chargées depuis data/questions.json`);

  // 2. Récupérer les questions existantes dans Firestore
  console.log('🔍 Lecture des questions actuellement dans Firestore...');
  const questionsColl = collection(db, 'questions');
  const existingSnap = await getDocs(questionsColl);
  console.log(`📊 ${existingSnap.size} documents trouvés dans la collection "questions".`);

  const existingMap = new Map();
  existingSnap.docs.forEach((d) => existingMap.set(d.id, d.data()));

  // 3. Fusionner les questions locales et distantes
  const allQuestionsMap = new Map();
  // Insérer d'abord les questions locales
  for (const q of localQuestions) {
    allQuestionsMap.set(q.id, {
      ...q,
      statut_validation: 'validee',
      soumis_par: 'import_script',
      note_admin: '',
      actif: q.actif !== false,
    });
  }
  // Insérer / écraser avec les questions existantes dans Firestore (en préservant leurs modifications)
  for (const [id, data] of existingMap.entries()) {
    allQuestionsMap.set(id, {
      ...data,
      statut_validation: data.statut_validation || 'validee',
      soumis_par: data.soumis_par || 'import_script',
      note_admin: data.note_admin || '',
      actif: data.actif !== false,
    });
  }

  console.log(`\n🚀 Mise à jour et migration de ${allQuestionsMap.size} questions dans Firestore...`);

  // Écriture par batchs de 300
  const questionsList = Array.from(allQuestionsMap.values());
  const BATCH_SIZE = 300;
  for (let i = 0; i < questionsList.length; i += BATCH_SIZE) {
    const chunk = questionsList.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const q of chunk) {
      const ref = doc(db, 'questions', q.id);
      batch.set(ref, {
        ...q,
        statut_validation: q.statut_validation || 'validee',
        soumis_par: q.soumis_par || 'import_script',
        note_admin: q.note_admin || '',
        soumis_le: q.soumis_le || serverTimestamp(),
        maj_le: serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    console.log(`   ✅ Lot ${Math.floor(i / BATCH_SIZE) + 1} validé (${chunk.length} questions enregistrées).`);
  }

  // 4. Mettre à jour le statut is_admin sur le document user
  console.log(`\n👤 Vérification du compte admin (${ADMIN_EMAIL} - ${ADMIN_UID})...`);
  const adminUserRef = doc(db, 'users', ADMIN_UID);
  await setDoc(adminUserRef, {
    is_admin: true,
    isAdmin: true,
    role: 'superadmin',
    maj_le: serverTimestamp(),
  }, { merge: true });
  console.log('✅ Document users mis à jour avec is_admin: true');

  // 5. Génération / Vérification des 30 prochains jours dans daily_rounds
  console.log('\n📅 Planification des rounds pour les 30 prochains jours...');
  const today = new Date();
  const validQuestions = questionsList.filter(
    (q) => q.actif !== false && (q.statut_validation === 'validee' || !q.statut_validation)
  );
  console.log(`   💡 Vivier de questions validées & actives disponibles : ${validQuestions.length}`);

  // Récupérer les rounds existants dans Firestore
  const dailyRoundsColl = collection(db, 'daily_rounds');
  const existingRoundsSnap = await getDocs(dailyRoundsColl);
  const existingRoundsMap = new Map();
  existingRoundsSnap.docs.forEach((d) => existingRoundsMap.set(d.id, d.data()));

  const usedQuestionIdsInLast60Days = new Set();
  // Remplir avec les questions déjà utilisées récemment
  for (const [rDate, rData] of existingRoundsMap.entries()) {
    if (rData.ids_questions && Array.isArray(rData.ids_questions)) {
      rData.ids_questions.forEach((id) => usedQuestionIdsInLast60Days.add(id));
    }
  }

  const roundsBatch = writeBatch(db);
  let createdCount = 0;

  for (let dayOffset = 0; dayOffset < 31; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];

    const existingRound = existingRoundsMap.get(dateStr);
    if (existingRound && existingRound.ids_questions && existingRound.ids_questions.length === 5) {
      // Le round existe déjà et est complet
      continue;
    }

    // Sélection intelligente de 5 questions :
    // 1. Pas deux fois la même catégorie
    // 2. Éviter questions des 60 derniers jours si possible
    // 3. Mix des difficultés (facile, moyen, difficile)
    const selectedIds = [];
    const usedCategories = new Set();

    // Pool prioritaire (non utilisé récemment)
    let candidatePool = validQuestions.filter((q) => !usedQuestionIdsInLast60Days.has(q.id));
    if (candidatePool.length < 15) {
      candidatePool = [...validQuestions]; // Réinitialiser si vivier épuisé
    }

    // Mélange déterministe pour stabilité
    const seed = parseInt(dateStr.replace(/-/g, ''), 10);
    const shuffled = [...candidatePool].sort((a, b) => {
      const hA = (parseInt(a.id.replace(/\D/g, '') || '0', 10) + seed) % 97;
      const hB = (parseInt(b.id.replace(/\D/g, '') || '0', 10) + seed) % 97;
      return hA - hB;
    });

    for (const candidate of shuffled) {
      if (selectedIds.length === 5) break;
      if (!usedCategories.has(candidate.categorie)) {
        selectedIds.push(candidate.id);
        usedCategories.add(candidate.categorie);
        usedQuestionIdsInLast60Days.add(candidate.id);
      }
    }

    // Si on a moins de 5 questions (rare), compléter avec n'importe quelle question validée non encore dans la sélection
    if (selectedIds.length < 5) {
      for (const candidate of validQuestions) {
        if (selectedIds.length === 5) break;
        if (!selectedIds.includes(candidate.id)) {
          selectedIds.push(candidate.id);
        }
      }
    }

    const roundRef = doc(db, 'daily_rounds', dateStr);
    roundsBatch.set(roundRef, {
      date: dateStr,
      ids_questions: selectedIds,
      statut: 'planifie',
      genere_le: serverTimestamp(),
      modifie_par: ADMIN_UID,
    }, { merge: true });

    createdCount++;
  }

  await roundsBatch.commit();
  console.log(`✅ ${createdCount} rounds quotidiens créés ou complétés dans "daily_rounds".`);

  console.log('\n===============================================================');
  console.log('   🎉 MIGRATION FIRESTORE ACCOMPLIE AVEC SUCCÈS !');
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('❌ Erreur critique lors de la migration :', err);
  process.exit(1);
});
