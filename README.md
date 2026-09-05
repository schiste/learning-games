# Dix sur dix

Des jeux tactiles, libres et gratuits pour aider les enfants à comprendre les compléments à 10 et la construction des nombres dans le système décimal.

Deux parcours proposent vingt-et-une activités, des premières manipulations visuelles jusqu’au calcul mental, à la valeur de position et aux problèmes de stratégie. Le site fonctionne dans un navigateur, sans compte, sans publicité et sans collecte de données.

Chaque jeu possède trois niveaux de complexité — **Découverte**, **Entraînement** et **Défi** — qui font évoluer les nombres, les aides visuelles, le nombre de choix ou la taille du plateau sans changer les règles du jeu.

Les activités disponibles sont La boîte, Les mains, Le panier, La grenouille, Les quilles, Les trous, Les paires, Le chrono, La caisse, La balance, Le chemin et Le partage. Les quatre jeux « Je maîtrise » introduisent la monnaie et la soustraction, l’égalité, les parcours mêlant additions et soustractions, puis la répartition sous contraintes. Les jeux chronométrés sont clairement identifiés ; une erreur ne termine jamais une partie et reste affichée avec une piste concrète pour réessayer. Les réponses numériques fonctionnent au toucher, à la souris et au clavier.

Le parcours « Construire les nombres » ajoute neuf jeux répartis entre « Je découvre », « Je m’entraîne » et « Je maîtrise » : Les paquets, L’abaque, Les cartes, Le compteur, Le plus grand, La ligne, La machine, Le détective et Le code. Chaque activité progresse des dizaines et unités aux centaines, puis aux milliers, avec une attention particulière portée à la place des zéros dans des nombres comme 1 093. Les unités, dizaines, centaines et milliers conservent les mêmes couleurs dans tout le parcours. Les échanges sont animés de droite à gauche pour montrer que 10 unités forment 1 dizaine, 10 dizaines forment 1 centaine et 10 centaines forment 1 millier.

Le chrono dure toujours 60 secondes. Son fond se remplit progressivement pour rendre le temps visible : le niveau 1 propose deux termes, les niveaux 2 et 3 passent à trois termes, et le niveau 3 limite tous les nombres et les réponses à la plage de 0 à 5.

## Jouer

Le site public est disponible sur **https://schiste.github.io/learning-games/**. Le parcours de numération est également accessible directement avec **https://schiste.github.io/learning-games/#nombres**.

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

- `src/App.tsx` contient le parcours des compléments à 10 et la navigation entre les thèmes.
- `src/DecimalPage.tsx` contient les neuf jeux de construction des nombres.
- `src/gameLogic.ts` contient la génération des exercices et les fonctions testables.
- `src/decimalLogic.ts` contient les générateurs et outils de valeur de position.
- `src/styles.css` et `src/decimal.css` portent le système visuel responsive.
- `.github/workflows/deploy.yml` vérifie puis publie le site sur GitHub Pages.

## Contribuer

Les idées de jeux, retours d’enseignants, améliorations d’accessibilité, traductions et contributions techniques sont les bienvenus. Consultez [CONTRIBUTING.md](CONTRIBUTING.md) avant de proposer un changement.

## Licence

Copyright © 2026 les contributeurs de learning-games.

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 uniquement** (`AGPL-3.0-only`). Consultez [LICENSE](LICENSE).
