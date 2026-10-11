# Règle de Déploiement Systématique (Deployment Rule)

## Scope
Cette règle s'applique à tous les agents IA intervenant sur le projet BizGames.

## Règle Obligatoire
À chaque modification de code frontend, de configuration ou de données :
1. L'agent doit obligatoirement valider le build :
   `npm run build`
2. L'agent doit obligatoirement déployer sur Firebase Hosting :
   `firebase deploy --only hosting --non-interactive`
3. Vérifier que le statut du déploiement est en succès.
4. L'URL de production est : `https://bizgames-game.web.app`.
