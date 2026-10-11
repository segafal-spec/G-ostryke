# Directives Générales pour les Agents IA — BizGames

## 🚨 RÈGLE FONDAMENTALE : DÉPLOIEMENT SYSTÉMATIQUE APRÈS CHAQUE MODIFICATION

> **INSTRUCTION STRICTE ET IMPÉRATIVE :**
> **À chaque modification de code, de configuration ou de contenu dans ce projet, l'agent IA DOIT OBLIGATOIREMENT ET SYSTÉMATIQUEMENT compiler et déployer l'application en production sur Firebase Hosting.**

### Procédure obligatoire post-modification de code :

Dès qu'un fichier (`.jsx`, `.js`, `.css`, `.json`, `.html`, règles, etc.) est édité ou créé :

1. **Validation du Build :**
   ```bash
   npm run build
   ```
   *Vérifier qu'aucune erreur de syntaxe ou de bundling ne subsiste.*

2. **Déploiement en Production immédiat :**
   ```bash
   firebase deploy --only hosting --non-interactive
   ```
   *(Si les règles Firestore ou Storage ont également été modifiées, exécuter `firebase deploy --non-interactive`)*

3. **Vérification de l'URL de production :**
   - URL publique active : **https://bizgames-game.web.app**
   - Console Firebase : **https://console.firebase.google.com/project/bizgames-game/overview**

4. **Restitution à l'utilisateur :**
   - Toujours confirmer à l'utilisateur que le build a réussi et que le déploiement a été effectué avec succès en fournissant le lien de test.

---

## 📌 RAPPELS DU MODÈLE PRODUIT

1. **100 % Gratuit** :
   - Aucun plan payant, aucun abonnement "Pro", "VIP" ou tarif mensuel.
   - Tout le contenu (manche quotidienne, entraînement libre par secteur, aléatoire, archives) est 100% accessible et gratuit pour tous les joueurs.
   - Monétisation 100% publicitaire.

2. **Qualité & Fluidité** :
   - Tester le responsive mobile et desktop.
   - Maintenir le bilinguisme Français / Anglais.
