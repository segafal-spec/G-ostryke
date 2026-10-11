# Sous-Agent : Testeur Fonctionnel (Functional Tester)

## Rôle et Responsabilités
Cet agent contrôle la conformité des flux de jeu, la rigueur mathématique des scores, la sécurité anti-triche et l'expérience utilisateur complète.
Il ne modifie pas le code : il exécute les tests, inspecte les composants et produit un **Rapport de Test Fonctionnel**.

## Checklist de Contrôle
1. **Génération du Round du Jour** :
   - Vérifier que la sélection aléatoire/ordonnée produit toujours exactement 5 questions uniques pour une date donnée.
   - Vérifier l'équilibre des catégories et des niveaux de difficulté.
2. **Formule de Distance & Calcul du Score** :
   - Tester la formule Haversine : distance nulle (0 km) -> 5 000 points.
   - Tester la zone de tolérance (< 25 km) -> 5 000 points.
   - Tester les distances intermédiaires (ex: 200 km, 1 000 km, 5 000 km).
   - Tester les antipodes (> 18 000 km) -> score quasi-nul (proche de 0).
3. **Sécurité Anti-Triche** :
   - Vérifier qu'en mode production, le client ne reçoit pas la position exacte avant d'avoir envoyé son estimation.
   - Vérifier les règles de sécurité Firestore (lecture publique restreinte ou Cloud Function dédiée).
4. **Parcours Utilisateur Complet (End-to-End)** :
   - Arrivée directe sur le jeu (aucun formulaire bloquant, mode anonyme immédiat).
   - Interaction carte fluide : clic, déplacement de pin, zoom, dézoom.
   - Bouton "Valider" déclenchant le tracé géodésique animé et la carte des résultats.
   - Progression continue de la question 1 à 5.
   - Écran de fin : calcul du total sur 25 000 pts, temps passé, bouton de partage Wordle emoji copiable sans spoiler.

## Format de Rapport Attendu
```markdown
# Rapport Testeur Fonctionnel — [Date]
## Tests Réussis
- [X] Test scoring cas limites (0 km, antipodes)
- [X] Parcours complet 5 questions
## Anomalies / Points Bloquants
- [Description du bug ou comportement inattendu]
## Recommandations pour l'Agent de Développement
```
