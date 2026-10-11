import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/questions.json');
const REPORT_FILE = path.resolve(__dirname, '../reports/data-verifier-report.md');

function runVerification() {
  console.log('--- EXÉCUTION DU VÉRIFICATEUR DE DONNÉES (Data Verifier) ---');
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Erreur : Fichier introuvable ${DATA_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  let questions = [];
  try {
    questions = JSON.parse(rawData);
  } catch (err) {
    console.error('Erreur de parsing JSON :', err.message);
    process.exit(1);
  }

  const validated = [];
  const errors = [];
  const ids = new Set();
  const coordSet = new Set();

  const categories = {};
  const regions = {};
  const difficulties = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const itemErrors = [];

    // Vérification des champs requis
    const requiredFields = ['id', 'texte', 'categorie', 'difficulte', 'reponse_lat', 'reponse_lng', 'lieu_nom', 'pays', 'region', 'explication', 'source'];
    for (const f of requiredFields) {
      if (q[f] === undefined || q[f] === null || q[f] === '') {
        itemErrors.push(`Champ manquant ou vide : "${f}"`);
      }
    }

    // Unicité ID
    if (q.id) {
      if (ids.has(q.id)) {
        itemErrors.push(`ID en doublon : "${q.id}"`);
      } else {
        ids.add(q.id);
      }
    }

    // Coordonnées GPS valides
    if (typeof q.reponse_lat !== 'number' || isNaN(q.reponse_lat) || q.reponse_lat < -90 || q.reponse_lat > 90) {
      itemErrors.push(`Latitude invalide : ${q.reponse_lat} (doit être un nombre entre -90 et +90)`);
    }

    if (typeof q.reponse_lng !== 'number' || isNaN(q.reponse_lng) || q.reponse_lng < -180 || q.reponse_lng > 180) {
      itemErrors.push(`Longitude invalide : ${q.reponse_lng} (doit être un nombre entre -180 et +180)`);
    }

    // Doublon exact de coordonnées
    if (typeof q.reponse_lat === 'number' && typeof q.reponse_lng === 'number') {
      const coordKey = `${q.reponse_lat.toFixed(3)},${q.reponse_lng.toFixed(3)}`;
      if (coordSet.has(coordKey)) {
        itemErrors.push(`Attention : Coordonnées très proches d'une autre question déjà enregistrée (${coordKey})`);
      } else {
        coordSet.add(coordKey);
      }
    }

    // Validité de la source URL
    if (q.source && (!q.source.startsWith('http://') && !q.source.startsWith('https://'))) {
      itemErrors.push(`URL source invalide (doit commencer par http:// ou https://) : "${q.source}"`);
    }

    // Compteurs statistiques
    categories[q.categorie] = (categories[q.categorie] || 0) + 1;
    regions[q.region] = (regions[q.region] || 0) + 1;
    difficulties[q.difficulte] = (difficulties[q.difficulte] || 0) + 1;

    if (itemErrors.length > 0) {
      errors.push({ id: q.id || `index_${i}`, errors: itemErrors });
    } else {
      validated.push(q);
    }
  }

  // Création du rapport
  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const dateStr = new Date().toISOString();
  let markdown = `# Rapport du Sous-Agent : Vérificateur de Données\n\n`;
  markdown += `*Date d'exécution : ${dateStr}*\n\n`;
  markdown += `## 1. Synthèse Globale\n`;
  markdown += `- **Questions analysées** : ${questions.length}\n`;
  markdown += `- **Questions conformes** : ${validated.length} / ${questions.length} (${Math.round((validated.length / questions.length) * 100)}%)\n`;
  markdown += `- **Questions rejetées / en alerte** : ${errors.length}\n\n`;

  markdown += `## 2. Répartition par Région du Monde\n`;
  for (const [region, count] of Object.entries(regions)) {
    markdown += `- **${region}** : ${count} question(s)\n`;
  }

  markdown += `\n## 3. Répartition par Catégorie Métier\n`;
  for (const [cat, count] of Object.entries(categories)) {
    markdown += `- **${cat}** : ${count} question(s)\n`;
  }

  markdown += `\n## 4. Répartition par Niveau de Difficulté\n`;
  for (const [diff, count] of Object.entries(difficulties)) {
    markdown += `- **${diff}** : ${count} question(s)\n`;
  }

  markdown += `\n## 5. Détail des Vérifications\n`;
  if (errors.length === 0) {
    markdown += `✅ **Toutes les questions respectent rigoureusement les critères d'intégrité géographique, d'unicité et de validité des sources.**\n`;
  } else {
    markdown += `⚠️ **Anomalies détectées :**\n`;
    for (const err of errors) {
      markdown += `- **[${err.id}]** : ${err.errors.join(', ')}\n`;
    }
  }

  fs.writeFileSync(REPORT_FILE, markdown, 'utf-8');
  console.log(`✅ Rapport généré avec succès dans : ${REPORT_FILE}`);
  console.log(`Total validé : ${validated.length} / ${questions.length}`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

runVerification();
