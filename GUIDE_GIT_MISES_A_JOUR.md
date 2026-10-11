# 📘 Guide Débutant : Gérer les Versions (v2) et les Mises à Jour

Bienvenue ! Ce guide pas à pas t'explique avec des mots simples comment gérer l'évolution de ton projet **BizGames**, créer une **Version 2 (v2)** sans casser la première, et publier tes mises à jour sur **GitHub** et **Firebase**.

---

## 🧭 1. Les concepts clés expliqués simplement

| Concept | Métaphore simple | À quoi ça sert ? |
| :--- | :--- | :--- |
| **Commit** | Une *photo instantanée* de ton code | Enregistrer un point de sauvegarde avec un message explicatif. |
| **Branche (Branch)** | Un *brouillon parallèle* | Travailler sur la Version 2 sans toucher à la Version 1 qui fonctionne. |
| **Main** | La *version officielle* | La branche propre, stable et déployée en ligne. |
| **Push** | *Envoyer dans le Cloud* | Transférer tes commits locaux vers GitHub. |
| **Tag / Release** | Une *étiquette officielle* (ex: `v1.0.0`, `v2.0.0`) | Marquer les grandes étapes du projet dans GitHub. |

---

## 🎯 2. Comment créer une deuxième version (v2)

Pour développer une Version 2 sans risquer de casser la Version 1 qui tourne actuellement pour les joueurs, on crée une **branche**.

### Étape 2.1 : Marquer la Version 1 actuelle (Optionnel mais conseillé)
Avant de commencer la v2, on colle une étiquette `v1.0.0` sur le code actuel :

```bash
# 1. Créer le tag v1.0.0
git tag -a v1.0.0 -m "Version 1.0.0 : Lancement initial stable"

# 2. Envoyer le tag sur GitHub
git push origin v1.0.0
```

### Étape 2.2 : Créer et basculer sur la branche `v2`
Ouvre ton terminal dans le dossier du projet et tape :

```bash
# Créer une nouvelle branche nommée 'v2' et basculer dessus
git checkout -b v2
```

> 💡 **Ce qui se passe :** Tu es maintenant dans un espace de travail dédié à la v2. Toutes tes modifications, ajouts ou tests n'affecteront pas la branche `main` tant que tu ne l'auras pas décidé.

### Étape 2.3 : Envoyer la branche v2 sur GitHub
Pour que GitHub connaisse aussi cette nouvelle branche :

```bash
git push -u origin v2
```

---

## 🔄 3. Le cycle quotidien : Comment faire des mises à jour

Chaque fois que tu modifies du code (ajoutes une fonctionnalité, corriges un bug, changes un texte), voici les **3 étapes magiques** :

### Étape 1 : Regarder ce qui a changé
```bash
git status
```
*Le terminal t'affiche en rouge ou vert les fichiers modifiés.*

### Étape 2 : Préparer et enregistrer la sauvegarde (Commit)
```bash
# Ajouter tous les fichiers modifiés
git add .

# Enregistrer avec un message clair expliquant ce que tu as fait
git commit -m "Ajout de la nouvelle interface pour la v2"
```

### Étape 3 : Envoyer sur GitHub
```bash
git push
```
*Et voilà ! Tes modifications sont sauvegardées en sécurité sur GitHub.*

---

## 🚀 4. Quand la v2 est prête : la fusionner dans `main`

Une fois que ta Version 2 est terminée et testée :

### Méthode 1 : En ligne de commande
```bash
# 1. Revenir sur la branche principale
git checkout main

# 2. Récupérer toutes les nouveautés de la v2
git merge v2

# 3. Envoyer la branche main mise à jour sur GitHub
git push origin main

# 4. Créer le tag officiel v2.0.0
git tag -a v2.0.0 -m "Version 2.0.0 : Nouvelle version finalisée"
git push origin v2.0.0
```

### Méthode 2 : Sur l'interface GitHub (Pull Request)
1. Va sur ton dépôt GitHub : [https://github.com/segafal-spec/G-ostryke](https://github.com/segafal-spec/G-ostryke)
2. GitHub affichera un bandeau jaune : **"v2 had recent pushes - Compare & pull request"**.
3. Clique dessus, vérifie les changements et clique sur **Merge pull request**.
4. Dans ton terminal local, tape simplement :
   ```bash
   git checkout main
   git pull
   ```

---

## 🌐 5. Mettre à jour le site en ligne (Firebase Hosting)

GitHub stocke ton code source, mais pour que les joueurs voient la nouvelle version sur **https://bizgames-game.web.app**, il faut compiler et déployer :

```bash
# 1. Compiler les fichiers de production
npm run build

# 2. Déployer sur Firebase
firebase deploy --only hosting --non-interactive
```

---

## 📋 6. Anti-sèche (Les commandes indispensables)

| Action | Commande |
| :--- | :--- |
| Voir la branche active et les fichiers modifiés | `git status` |
| Voir toutes les branches | `git branch` |
| Changer de branche (ex: aller sur `main`) | `git checkout main` |
| Sauvegarder tout | `git add .` puis `git commit -m "mon message"` |
| Envoyer sur GitHub | `git push` |
| Récupérer ce qui est sur GitHub | `git pull` |
| Compiler pour le web | `npm run build` |
| Publier en ligne | `firebase deploy --only hosting` |

---

> 🔒 **Règle de sécurité importante :** Ne modifie jamais le fichier `.gitignore` pour y retirer `.env`. Tes clés secrètes doivent toujours rester sur ton ordinateur et ne jamais être envoyées sur GitHub.
