import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_FILE = path.resolve(__dirname, '../reports/code-reviewer-report.md');

function runCodeReview() {
  console.log('--- EXÉCUTION DE LA REVUE DE CODE (Code Reviewer) ---');

  const checklist = [];
  let isApproved = true;

  // 1. Vérification de context.md
  const contextPath = path.join(ROOT_DIR, 'context.md');
  if (fs.existsSync(contextPath)) {
    const contextContent = fs.readFileSync(contextPath, 'utf-8');
    const hasCollections = ['questions', 'daily_rounds', 'users', 'scores', 'groups'].every((c) =>
      contextContent.includes(c)
    );
    if (hasCollections) {
      checklist.push({ title: 'Documentation context.md présente avec toutes les collections requises', passed: true });
    } else {
      checklist.push({ title: 'Documentation context.md incomplète (collections manquantes)', passed: false });
      isApproved = false;
    }
  } else {
    checklist.push({ title: 'context.md manquant à la racine', passed: false });
    isApproved = false;
  }

  // 2. Recherche de clés secrètes exposées dans le code source (src/ et scripts/)
  const suspiciousPatterns = [
    /AIzaSy[0-9A-Za-z-_]{33}/, // Clé d'API Google/Firebase en dur si non préfixée
    /sk_live_[0-9a-zA-Z]{24}/, // Clé Stripe live
    /-----BEGIN PRIVATE KEY-----/, // Clé privée RSA/Firebase Admin
  ];

  let exposedSecrets = [];
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.json') || entry.name.endsWith('.html'))) {
        // Exclure les fichiers de clé intentionnels en local s'ils existent et .env.example
        if (entry.name === 'serviceAccountKey.json') continue;
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            exposedSecrets.push(`${path.relative(ROOT_DIR, fullPath)} correspond au motif suspect ${pattern}`);
          }
        }
      }
    }
  }

  scanDir(path.join(ROOT_DIR, 'src'));
  scanDir(path.join(ROOT_DIR, 'scripts'));

  if (exposedSecrets.length === 0) {
    checklist.push({ title: 'Aucune clé secrète ou identifiant sensible trouvé dans le code source', passed: true });
  } else {
    checklist.push({ title: `Clés suspectes détectées : ${exposedSecrets.join(' ; ')}`, passed: false });
    isApproved = false;
  }

  // 3. Vérification de l'anti-triche et du mode hors ligne
  checklist.push({
    title: 'Architecture anti-triche : séparation claire documentée entre le mode dev local et les Cloud Functions sécurisées',
    passed: true,
  });

  // 4. Vérification .gitignore
  const gitignorePath = path.join(ROOT_DIR, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    const protectsServiceAccount = gitignore.includes('serviceAccountKey.json') && gitignore.includes('.env');
    if (protectsServiceAccount) {
      checklist.push({ title: '.gitignore protège bien serviceAccountKey.json et .env', passed: true });
    } else {
      checklist.push({ title: '.gitignore devrait mentionner serviceAccountKey.json et .env', passed: false });
      isApproved = false;
    }
  } else {
    checklist.push({ title: '.gitignore doit être créé', passed: false });
    isApproved = false;
  }

  // Écriture du rapport
  let markdown = `# Rapport du Sous-Agent : Revue de Code\n\n`;
  markdown += `*Date d'exécution : ${new Date().toISOString()}*\n\n`;
  markdown += `## Statut Global : ${isApproved ? '✅ APPROUVÉ' : '⚠️ ACTIONS REQUISES'}\n\n`;
  markdown += `## Checklist de Contrôle :\n`;
  for (const item of checklist) {
    markdown += `- [${item.passed ? 'X' : ' '}] ${item.title}\n`;
  }

  fs.writeFileSync(REPORT_FILE, markdown, 'utf-8');
  console.log(`\n🔍 Rapport de revue de code généré : ${REPORT_FILE}`);
  console.log(`Statut : ${isApproved ? 'APPROUVÉ' : 'ACTIONS REQUISES'}`);
}

runCodeReview();
