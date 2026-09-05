# Dix sur dix

Des jeux tactiles, libres et gratuits pour aider les enfants à comprendre les compléments à 10.

Le parcours propose douze activités, des manipulations visuelles jusqu’au calcul mental, à la soustraction et aux problèmes de stratégie. Le site fonctionne dans un navigateur, sans compte, sans publicité et sans collecte de données.

Chaque jeu possède trois niveaux de complexité — **Découverte**, **Entraînement** et **Défi** — qui font évoluer les nombres, les aides visuelles, le nombre de choix ou la taille du plateau sans changer les règles du jeu.

Les activités disponibles sont La boîte, Les mains, Le panier, La grenouille, Les quilles, Les trous, Les paires, Le chrono, La caisse, La balance, Le chemin et Le partage. Les quatre jeux « Je maîtrise » introduisent la monnaie et la soustraction, l’égalité, les parcours mêlant additions et soustractions, puis la répartition sous contraintes. Les jeux chronométrés sont clairement identifiés ; une erreur ne termine jamais une partie et reste affichée avec une piste concrète pour réessayer. Les réponses numériques fonctionnent au toucher, à la souris et au clavier.

Le chrono dure toujours 60 secondes. Son fond se remplit progressivement pour rendre le temps visible : le niveau 1 propose deux termes, les niveaux 2 et 3 passent à trois termes, et le niveau 3 limite tous les nombres et les réponses à la plage de 0 à 5.

## Jouer

Le site public est disponible sur **https://schiste.github.io/learning-games/**.

## Développer

Prérequis : Node.js 24 ou une version LTS récente.

```bash
npm install
npm run dev
```

Les vérifications exécutées en intégration continue sont regroupées dans une commande :

```bash
npm run check
```

## Organisation

- `src/App.tsx` contient les douze jeux et l’interface.
- `src/gameLogic.ts` contient la génération des exercices et les fonctions testables.
- `src/styles.css` porte le système visuel responsive.
- `.github/workflows/deploy.yml` vérifie puis publie le site sur GitHub Pages.

## Contribuer

Les idées de jeux, retours d’enseignants, améliorations d’accessibilité, traductions et contributions techniques sont les bienvenus. Consultez [CONTRIBUTING.md](CONTRIBUTING.md) avant de proposer un changement.

## Licence

Copyright © 2026 les contributeurs de learning-games.

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 uniquement** (`AGPL-3.0-only`). Consultez [LICENSE](LICENSE).
