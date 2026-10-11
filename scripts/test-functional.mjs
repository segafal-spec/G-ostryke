import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateHaversineDistance, calculateScore, getScoreEmoji, generateShareText, getDailyRound } from '../src/utils/geo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_FILE = path.resolve(__dirname, '../reports/functional-tester-report.md');
const QUESTIONS_FILE = path.resolve(__dirname, '../data/questions.json');

function runFunctionalTests() {
  console.log('--- EXÉCUTION DU TESTEUR FONCTIONNEL (Functional Tester) ---');

  const tests = [];
  let allPassed = true;

  function assert(title, condition, extraInfo = '') {
    if (condition) {
      tests.push({ title, status: 'PASSED', extraInfo });
      console.log(`✅ ${title}`);
    } else {
      tests.push({ title, status: 'FAILED', extraInfo });
      console.error(`❌ ${title} : ${extraInfo}`);
      allPassed = false;
    }
  }

  // 1. Tests Haversine
  const distParisLondon = calculateHaversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
  assert(
    'Distance Paris - Londres (environ 343 km)',
    distParisLondon >= 340 && distParisLondon <= 346,
    `Calculé : ${distParisLondon} km`
  );

  const distZero = calculateHaversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
  assert('Distance point identique (0 km)', distZero === 0, `Calculé : ${distZero} km`);

  // 2. Tests de barème de scoring
  const scoreExact = calculateScore(0);
  assert('Score pour 0 km (exact) = 5 000 pts', scoreExact === 5000, `Reçu : ${scoreExact}`);

  const scoreTolerance = calculateScore(24);
  assert('Score dans la tolérance (< 25 km) = 5 000 pts', scoreTolerance === 5000, `Reçu : ${scoreTolerance}`);

  const score2000 = calculateScore(2000);
  assert(
    'Score à 2 000 km (1/e * 5000 ≈ 1839 pts)',
    score2000 >= 1835 && score2000 <= 1845,
    `Reçu : ${score2000}`
  );

  const scoreAntipode = calculateScore(20000);
  assert('Score aux antipodes (> 18 000 km) = 0 pt', scoreAntipode === 0, `Reçu : ${scoreAntipode}`);

  // 3. Tests Emoji Wordle
  const emojiGreen = getScoreEmoji(5000, 10);
  const emojiYellow = getScoreEmoji(3500, 500);
  const emojiOrange = getScoreEmoji(1500, 2500);
  const emojiBlack = getScoreEmoji(0, 10000);
  assert(
    'Attribution des emojis de performance',
    emojiGreen === '🟩' && emojiYellow === '🟨' && emojiOrange === '🟧' && emojiBlack === '⬛',
    `Reçu : ${emojiGreen} ${emojiYellow} ${emojiOrange} ${emojiBlack}`
  );

  // 4. Test génération quotidienne
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8'));
  const round1 = getDailyRound(questions, '2026-09-27');
  const round2 = getDailyRound(questions, '2026-09-27');
  assert(
    'Le round quotidien contient exactement 5 questions uniques',
    round1.length === 5 && new Set(round1.map((q) => q.id)).size === 5,
    `Taille : ${round1.length}`
  );
  assert(
    'Déterminisme du round du jour (même date => mêmes questions)',
    JSON.stringify(round1.map((q) => q.id)) === JSON.stringify(round2.map((q) => q.id)),
    `Round1: ${round1.map((q) => q.id).join(',')} | Round2: ${round2.map((q) => q.id).join(',')}`
  );

  // 5. Test de non-divulgation des réponses dans le partage
  const shareText = generateShareText('2026-09-27', 22400, [
    { score: 5000, distanceKm: 12 },
    { score: 4800, distanceKm: 85 },
    { score: 3200, distanceKm: 900 },
    { score: 4500, distanceKm: 70 },
    { score: 4900, distanceKm: 40 },
  ], 75);

  assert(
    'Le texte de partage ne divulgue aucune coordonnée ni nom de lieu',
    !shareText.includes('lat') && !shareText.includes('lng') && !shareText.includes('Paris') && !shareText.includes('Apple'),
    'Texte vérifié et exempt de spoilers.'
  );

  // Génération du rapport Markdown
  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  let markdown = `# Rapport du Sous-Agent : Testeur Fonctionnel\n\n`;
  markdown += `*Date d'exécution : ${new Date().toISOString()}*\n\n`;
  markdown += `## Statut Global : ${allPassed ? '✅ TOUS LES TESTS SONT AU VERT' : '❌ ANOMALIES DÉTECTÉES'}\n\n`;
  markdown += `## Détail des Assertions Validées :\n`;
  for (const t of tests) {
    markdown += `- [${t.status === 'PASSED' ? 'X' : ' '}] **${t.title}** (${t.extraInfo})\n`;
  }

  fs.writeFileSync(REPORT_FILE, markdown, 'utf-8');
  console.log(`\n📋 Rapport fonctionnel sauvegardé : ${REPORT_FILE}`);

  if (!allPassed) {
    process.exit(1);
  }
}

runFunctionalTests();
