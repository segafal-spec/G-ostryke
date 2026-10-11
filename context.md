# BizGames — Documentation du Projet (Source de Vérité)

> Ce fichier est la **source de vérité centrale** du projet **BizGames**.
> Il doit être consulté et mis à jour à chaque évolution majeure de l'architecture, du schéma de données ou de l'implémentation.
>
> **Version produit actuelle : compte obligatoire + jeu 100 % gratuit + monétisation publicitaire + compétition sociale privée.**

---

## 1. Vision du Produit

**BizGames** est un jeu quotidien gratuit de géographie business et économique mondiale.

Le joueur doit localiser sur une carte 3D des lieux liés à l'économie, aux entreprises et au business mondial.

Le produit est conçu autour de 5 piliers :

1. **Jeu quotidien**
2. **Géographie réelle**
3. **Compétition et classement**
4. **Social et challenges privés**
5. **Monétisation 100 % publicitaire**

### Règle fondamentale

**BizGames est 100 % gratuit.**

Il n'existe pas de version payante, d'abonnement BizGames Pro ou de fonctionnalité essentielle réservée aux abonnés.

Le modèle économique repose sur les **revenus publicitaires**.

---

# 2. Accès au Jeu — Compte Obligatoire

Le mode invité est **supprimé**.

Pour accéder au jeu et commencer une partie, l'utilisateur doit obligatoirement créer un compte ou se connecter.

### Parcours

```text
Landing Page
      ↓
Créer un compte / Se connecter
      ↓
Dashboard / Jeu
      ↓
Partie
```

### Authentification

Les méthodes prévues sont :

- Google Auth
- Email + mot de passe

Le compte utilisateur permet de conserver :

- pseudo
- historique des parties
- meilleur score
- streak
- statistiques
- classement
- groupes
- challenges
- salons privés
- invitations

L'objectif est de disposer d'une identité joueur persistante afin de développer la rétention, la compétition et les fonctionnalités sociales.

---

# 3. Principe du Jeu

Chaque jour, le joueur reçoit un **round quotidien** composé de 5 questions.

Les questions portent notamment sur :

- entreprises
- sièges sociaux
- fusions-acquisitions
- bourses
- giga-usines
- hubs technologiques
- énergie
- industrie
- commerce
- finance
- automobile
- luxe
- transport
- agriculture
- autres événements ou lieux économiques.

### Mécanique

Le joueur doit identifier la localisation correcte sur la carte.

Le niveau géographique dépend de la question :

- pays
- région
- département
- autre zone géographique définie par le jeu.

### Score

Chaque question rapporte jusqu'à **5 000 points**.

Maximum :

**25 000 points par round de 5 questions.**

Le score peut être calculé à partir de la distance entre le choix du joueur et la localisation correcte lorsque le mode de question utilise une localisation précise.

---

# 4. Carte 3D — Élément Central du Jeu

La carte 3D est un élément central de BizGames.

Elle ne doit pas être uniquement décorative.

Le système doit afficher les **véritables frontières géographiques**.

## Niveaux géographiques

### Pays

Les frontières internationales réelles doivent permettre de distinguer les pays.

### Régions

Pour les questions régionales, les véritables limites administratives des régions doivent être utilisées.

### Départements

Pour les questions départementales, les véritables limites des départements doivent être utilisées.

### Principe

```text
Question
   ↓
Type de zone demandé
   ↓
Pays / Région / Département
   ↓
Affichage des véritables frontières
   ↓
Sélection par le joueur
   ↓
Validation
   ↓
Score
```

Le niveau géographique doit être clairement indiqué au joueur avant sa réponse.

---

# 5. Globe 3D

Le globe 3D utilise Three.js / WebGL.

Fonctionnalités prévues :

- globe terrestre interactif
- rotation
- zoom
- sélection tactile
- frontières géographiques
- mise en évidence des zones
- animation lors de la validation
- affichage de la bonne réponse
- arcs géodésiques lorsque le mode utilise un point précis
- atmosphère et identité visuelle Solar-Punk.

Une carte 2D Leaflet peut rester disponible comme solution alternative technique ou de secours.

---

# 5A. Cartographie Libre — MapLibre

BizGames doit utiliser une solution de cartographie **libre et ouverte**.

### Technologie cartographique

La solution cible est **MapLibre GL JS** pour l’affichage et l’interaction cartographique. Le projet doit privilégier MapLibre et des données cartographiques ouvertes afin de limiter les dépendances à des API propriétaires payantes.

La carte doit permettre d’afficher les véritables limites des pays, régions, départements et autres subdivisions nécessaires au jeu. Les données géographiques doivent être suffisamment précises pour permettre la sélection d’une zone par le joueur.

**Ne pas remplacer les véritables frontières par des formes graphiques approximatives.**

### Objectif technique

L’architecture cartographique doit rester compatible avec une montée en charge importante et limiter les coûts liés aux services cartographiques propriétaires.

---

# 5B. Indicatifs Géographiques

BizGames doit utiliser un **indicatif de exactement deux lettres** pour identifier les pays et les régions lorsqu’un indicatif est affiché dans l’interface.

Exemples pays :

```text
France → FR
Allemagne → DE
Italie → IT
Espagne → ES
Belgique → BE
Luxembourg → LU
```

Pour les régions, utiliser également un identifiant de **2 lettres** lorsque le territoire dispose d’un code régional adapté au système. Si aucun code officiel à deux lettres n’existe, définir un identifiant interne cohérent de deux lettres, sans modifier le nom officiel de la région.

Le code à deux lettres est un élément d’affichage et d’identification. Les données internes peuvent conserver le nom complet, les coordonnées et l’identifiant administratif complet nécessaires au fonctionnement du jeu.

---

# 6. Round Quotidien

Chaque jour possède un round officiel composé de 5 questions.

Structure :

```text
Date
 ↓
5 questions
 ↓
Partie
 ↓
Score / 25 000
 ↓
Résultat
 ↓
Classement
 ↓
Partage
```

Le round quotidien constitue le principal rendez-vous du joueur.

L'objectif est de créer une habitude :

**venir chaque jour → jouer → obtenir son score → comparer → partager → revenir le lendemain.**

---

# 7. Progression et Streak

Chaque joueur possède notamment :

- parties jouées
- meilleur score
- score moyen
- streak actuel
- meilleur streak
- temps moyen
- précision géographique
- progression par catégorie.

Les streaks récompensent la régularité.

---

# 8. Classements

BizGames possède plusieurs niveaux de classement.

## Classement du jour

Classement des joueurs ayant participé au round quotidien.

Affichage :

- Top 3
- rang du joueur
- score
- temps
- pseudo
- avatar.

## Classement général

Classement basé notamment sur :

- performances historiques
- streaks
- statistiques.

## Classements privés

Chaque groupe ou challenge peut posséder son propre classement.

---

# 9. Fonctionnalités Sociales

La dimension sociale devient un axe majeur du produit.

BizGames doit permettre aux utilisateurs de jouer :

- seuls
- avec leurs amis
- avec leurs collègues
- avec une communauté
- dans des groupes privés
- dans des challenges privés.

---

# 10. Groupes de Joueurs

Un utilisateur peut créer un groupe.

Exemples :

- Entreprise
- École
- Promotion
- Association
- Groupe d'amis
- Communauté business
- Équipe sportive
- Communauté professionnelle.

### Création d'un groupe

Le créateur définit :

- nom du groupe
- description
- image/avatar
- règles éventuelles
- visibilité
- membres autorisés.

### Membres

Un groupe peut contenir plusieurs joueurs.

Chaque groupe possède :

- liste des membres
- classement interne
- historique des challenges
- challenges actifs
- invitations
- éventuellement un salon privé.

---

# 11. Invitations

Un joueur doit pouvoir inviter d'autres personnes.

Les invitations peuvent être envoyées via :

- lien d'invitation
- code d'invitation
- partage social
- email
- mécanismes de partage disponibles sur mobile.

Exemple :

```text
"Rejoins mon groupe BizGames"

Code : BG-HEC-2026

[Rejoindre le groupe]
```

Une invitation doit permettre de rejoindre directement le groupe après authentification.

---

# 12. Challenges Privés

Un utilisateur doit pouvoir créer un **challenge privé** et inviter plusieurs personnes.

### Exemple

```text
Challenge : CEO Challenge Luxembourg

10 participants

Début : 01/10/2026
Fin : 07/10/2026

Classement privé
```

Le créateur peut définir :

- nom du challenge
- participants
- période
- nombre de parties
- type de questions lorsque disponible
- niveau géographique
- règles du challenge.

Le challenge possède son propre classement.

---

# 13. Salons Privés

BizGames doit également pouvoir proposer des **salons privés**.

Un salon est un espace de discussion / compétition réservé à un groupe de joueurs.

Exemples :

- Salon HEC Paris
- Salon équipe commerciale
- Salon collègues
- Salon famille
- Salon communauté business.

Le salon peut permettre :

- discussion entre membres
- lancement de challenges
- invitations
- partage des scores
- classement du salon
- notifications d'activité.

L'accès à un salon privé doit être contrôlé par invitation, code ou validation du propriétaire/modérateur.

---

# 14. Architecture Sociale

L'architecture sociale cible est :

```text
UTILISATEUR
    │
    ├── Parties
    ├── Scores
    ├── Streak
    ├── Statistiques
    │
    ├── GROUPES
    │     ├── Membres
    │     ├── Classement
    │     ├── Challenges
    │     └── Salon privé
    │
    ├── CHALLENGES
    │     ├── Participants
    │     ├── Scores
    │     └── Classement
    │
    └── INVITATIONS
```

---

# 15. Partage Social

Après une partie, le joueur doit pouvoir partager son résultat sans révéler les réponses.

Le format est inspiré du partage Wordle.

Réseaux ciblés :

- WhatsApp
- X
- LinkedIn
- Telegram
- Facebook
- Reddit
- partage natif mobile.

Le partage doit pouvoir contenir :

- score
- grille emoji
- streak
- lien BizGames
- invitation à relever le défi.

---

# 16. Monétisation — 100 % Publicitaire

**BizGames est entièrement gratuit.**

Le modèle économique repose sur les publicités.

### Sources de revenus potentielles

- affichage publicitaire
- publicité vidéo
- publicité vidéo récompensée
- formats publicitaires adaptés au mobile
- sponsoring de challenges
- campagnes publicitaires ciblées lorsque les plateformes publicitaires les autorisent.

### Principe

```text
UTILISATEURS
     ↓
PARTIES
     ↓
TEMPS PASSÉ
     ↓
IMPRESSIONS PUBLICITAIRES
     ↓
REVENUS ADS
```

L'objectif économique est donc de maximiser :

- nombre d'utilisateurs
- utilisateurs actifs quotidiens
- nombre de parties
- fréquence de retour
- durée des sessions
- impressions publicitaires
- taux de remplissage
- RPM / eCPM.

---

# 17. Publicité Vidéo

La publicité vidéo peut être utilisée dans le parcours de jeu lorsque cela respecte les règles de la plateforme publicitaire utilisée.

Exemple de mécanique :

```text
Niveau 1
   ↓
Niveau 2
   ↓
Publicité
   ↓
Niveau 3
   ↓
Niveau 4
   ↓
Publicité
   ↓
Niveau 5
   ↓
Résultat
```

La publicité ne doit pas dégrader excessivement l'expérience utilisateur.

Les emplacements publicitaires doivent être pensés pour :

- mobile
- desktop
- vitesse de chargement
- visibilité
- expérience de jeu.

---

# 18. Suppression du Modèle BizGames Pro

Le concept **BizGames Pro / abonnement premium est supprimé**.

Il ne faut pas développer de fonctionnalités payantes réservées à un abonnement.

Les fonctionnalités principales du produit doivent rester accessibles gratuitement.

La stratégie est :

**Audience maximale + engagement maximal + publicité.**

---

# 19. Contenu

Le vivier de questions doit être continuellement développé.

Catégories initiales :

- tech
- finance
- commerce
- énergie
- automobile
- agriculture
- industrie
- retail
- mines
- transport
- aéronautique
- luxe
- santé.

Chaque question doit idéalement contenir :

- identifiant
- énoncé
- catégorie
- difficulté
- niveau géographique
- coordonnées si nécessaire
- lieu
- pays
- région
- département lorsque pertinent
- année
- explication
- source
- statut actif
- statut vérifié.

La qualité et la vérification des questions sont essentielles à la crédibilité de BizGames.

---

# 20. Base de Données Firestore

Collections principales :

```text
questions
daily_rounds
users
scores
groups
challenges
private_rooms
invitations
```

### `questions`

Vivier de questions.

### `daily_rounds`

Round officiel de chaque journée.

### `users`

Profils joueurs.

### `scores`

Historique des parties.

### `groups`

Groupes de joueurs.

### `challenges`

Challenges privés ou communautaires.

### `private_rooms`

Salons privés.

### `invitations`

Invitations à rejoindre groupes, challenges ou salons.

---

# 21. Profil Joueur

Le dashboard doit présenter :

### PLAY

- Round du jour
- Classement du jour

### YOUR GAME

- statistiques
- streak
- historique
- résultats détaillés
- groupes
- challenges
- salons.

### SOCIAL

- mes groupes
- mes challenges
- invitations
- salons privés.

### ABOUT

- fonctionnement du jeu
- fonctionnement du score
- règles.

---

# 22. Dashboard

Le dashboard doit être :

- simple
- rapide
- intuitif
- mobile-first
- visuellement premium.

Informations prioritaires :

```text
Bonjour [Pseudo]

🔥 Streak : 7 jours

Today's Round
[ JOUER ]

Score : 21 450

Classement du jour : #42

Mes groupes
Mes challenges
Mes salons
```

---

# 23. Identité Visuelle

Thème :

**Solar-Punk Eco-Titan 2085**

Univers visuel :

- économie mondiale du futur
- technologies
- énergie solaire
- giga-usines
- finance
- architecture biophilique
- globe futuriste.

Palette :

- noir / obsidienne
- vert émeraude
- cyan
- or solaire.

Le style doit rester :

**haut de gamme + futuriste + professionnel + lisible.**

---

# 24. Stack Technique

### Frontend

- React 18.3.1
- Vite 6.2.0
- Three.js / WebGL
- MapLibre GL JS
- Leaflet 1.9.4 (solution 2D de secours si nécessaire)
- CSS moderne
- Glassmorphism
- lucide-react
- canvas-confetti.

### Backend

- Firebase
- Firestore
- Firebase Authentication
- Firebase Hosting
- Cloud Functions lorsque nécessaire.

### Scripts

- Node.js
- scripts d'ingestion
- génération des rounds
- tests automatisés.

---

# 25. Production

Projet Firebase :

`bizgames-game`

URL de production :

`https://bizgames-game.web.app`

Base Firestore :

`europe-west1`

Les règles Firestore doivent garantir :

- protection des profils
- protection des groupes privés
- contrôle des invitations
- contrôle des challenges
- contrôle des salons
- protection des données sensibles
- impossibilité de modifier librement les scores validés.

---

# 26. Sécurité Anti-Triche

Les coordonnées de réponse ne doivent pas être exposées au client avant la validation lorsque cela permettrait de tricher.

Les scores doivent être contrôlés autant que possible côté serveur.

Les données critiques doivent être protégées par les règles Firestore et, lorsque nécessaire, par Cloud Functions.

Les scores historiques doivent être immuables ou contrôlés.

---

# 27. Mobile / PWA

BizGames doit être pensé en priorité pour smartphones et tablettes.

Fonctionnalités :

- responsive design
- safe areas iOS/Android
- interactions tactiles
- bottom sheets
- installation PWA
- partage natif
- chargement rapide.

---

# 28. Objectifs Produit

Les indicateurs clés à suivre sont :

### Acquisition

- nouveaux comptes/jour
- coût d'acquisition éventuel
- sources de trafic
- taux de conversion visite → compte.

### Activation

- % des nouveaux comptes jouant leur première partie
- temps entre inscription et première partie.

### Engagement

- parties/utilisateur
- sessions/utilisateur
- durée moyenne
- questions jouées.

### Rétention

- rétention J1
- J7
- J30
- streak moyen.

### Social

- groupes créés
- invitations envoyées
- taux d'acceptation
- challenges créés
- participants/challenge
- salons actifs.

### Monétisation

- impressions publicitaires
- RPM
- eCPM
- revenus/jour
- revenus/utilisateur
- revenus par session.

---

# 29. Vision Globale

BizGames doit devenir une plateforme de jeu quotidien autour de la géographie économique.

Le moteur de croissance est :

```text
JEU GRATUIT
      ↓
COMPTE OBLIGATOIRE
      ↓
PARTIE QUOTIDIENNE
      ↓
SCORE
      ↓
STREAK
      ↓
CLASSEMENT
      ↓
PARTAGE
      ↓
INVITATION
      ↓
GROUPES
      ↓
CHALLENGES
      ↓
SALONS PRIVÉS
      ↓
PLUS DE JOUEURS
      ↓
PLUS DE PARTIES
      ↓
PLUS D'IMPRESSIONS PUBLICITAIRES
      ↓
REVENUS PUBLICITAIRES
```

---

# 30. Priorités de Développement

## PRIORITÉ 1 — Accès

- supprimer totalement le mode invité
- compte obligatoire
- Google Auth
- Email / mot de passe
- gestion du profil.

## PRIORITÉ 2 — Géographie

- globe 3D
- MapLibre / cartographie libre
- données cartographiques ouvertes
- véritables frontières
- pays
- régions
- départements
- sélection précise des zones
- indicatifs géographiques de 2 lettres.

## PRIORITÉ 3 — Jeu

- round quotidien
- score
- streak
- classement
- historique.

## PRIORITÉ 4 — Social

- groupes
- invitations
- challenges
- classements privés
- salons privés.

## PRIORITÉ 5 — Publicité

- intégration publicitaire
- emplacements
- vidéo
- optimisation mobile
- mesure des revenus.

## PRIORITÉ 6 — Croissance

- partage social
- invitations
- challenges viraux
- communautés
- acquisition organique.

---

# 31. Règle de Produit pour Antigravity

Lors de toute modification du projet, respecter les principes suivants :

1. **Ne jamais réintroduire le mode invité.**
2. **Ne jamais introduire un abonnement payant sans nouvelle décision explicite.**
3. **BizGames doit rester 100 % gratuit.**
4. **La monétisation principale repose sur la publicité.**
5. **Les frontières géographiques doivent correspondre aux véritables limites des territoires utilisés par le jeu.**
6. **La cartographie doit privilégier MapLibre et des données cartographiques libres/ouvertes afin de limiter les dépendances propriétaires et les coûts.**
7. **Les indicatifs affichés pour les pays et régions doivent comporter exactement 2 lettres.**
8. **Les groupes, challenges et salons privés doivent être conçus comme des fonctionnalités sociales centrales.**
9. **Le mobile doit être traité comme une plateforme prioritaire.**
10. **Le jeu doit rester rapide, simple et intuitif.**
11. **Toute fonctionnalité sociale doit respecter les permissions et la confidentialité des groupes privés.**
12. **Le `context.md` doit être mis à jour après toute modification majeure de l’architecture.**
13. **Déploiement systématique post-modification :** À chaque modification de code frontend, de styles, de configuration ou de données, l'agent IA doit obligatoirement lancer la compilation (`npm run build`) et déployer immédiatement en production sur Firebase Hosting (`firebase deploy --only hosting --non-interactive`). L'URL de production active est `https://bizgames-game.web.app`.

---

# 32. Résumé Exécutif

**BizGames est un jeu gratuit de géographie business avec un défi quotidien de 5 questions.**

Le joueur doit obligatoirement créer un compte.

Le cœur du jeu est un **globe 3D interactif utilisant les véritables frontières des pays, régions et départements**.

Le joueur gagne des points, construit son streak, apparaît dans les classements et peut partager ses résultats.

La dimension sociale permet de :

- créer des groupes
- inviter des amis ou collègues
- organiser des challenges
- créer des salons privés
- créer des classements privés.

Le produit est **100 % gratuit**.

Le modèle économique repose sur la **publicité**, avec comme objectifs principaux l'acquisition massive, la rétention quotidienne, l'engagement social et l'augmentation du nombre d'impressions publicitaires.

**BizGames = jeu quotidien + business + géographie + compétition + social + publicité.**
