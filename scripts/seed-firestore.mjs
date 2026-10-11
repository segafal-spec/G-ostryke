import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/questions.json');

const firebaseConfig = {
  apiKey: "AIzaSyAKS3IeKsT5JusIimVhPxyk_K5DA0qNpsU",
  authDomain: "bizgames-game.firebaseapp.com",
  projectId: "bizgames-game",
  storageBucket: "bizgames-game.firebasestorage.app",
  messagingSenderId: "613565358993",
  appId: "1:613565358993:web:514027c92eb88927057030"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Démarrage du peuplement Firestore...');
  const questions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`📦 ${questions.length} questions à injecter dans "questions"...`);

  let count = 0;
  for (const q of questions) {
    const docRef = doc(db, 'questions', q.id);
    await setDoc(docRef, {
      ...q,
      cree_le: serverTimestamp(),
      maj_le: serverTimestamp(),
    });
    count++;
    process.stdout.write(`\rInsertion : ${count}/${questions.length} (${q.id})`);
  }
  console.log('\n✅ 30 questions insérées dans Firestore !');

  // Daily round pour aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const roundRef = doc(db, 'daily_rounds', today);
  const selectedIds = questions.slice(0, 5).map(q => q.id);

  await setDoc(roundRef, {
    date: today,
    ids_questions: selectedIds,
    cree_le: serverTimestamp(),
  });
  console.log(`🎯 Daily round créé pour la date ${today} avec 5 questions (${selectedIds.join(', ')})`);
  console.log('🎉 Seed Firestore terminé avec succès !');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erreur de seed :', err);
  process.exit(1);
});
