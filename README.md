# Dix sur dix

Des jeux tactiles, libres et gratuits pour aider les enfants à comprendre les compléments à 10.

Le premier parcours propose six activités, des manipulations visuelles jusqu’au calcul mental chronométré. Le site fonctionne dans un navigateur, sans compte, sans publicité et sans collecte de données.

## Jouer

Le site public sera disponible sur **https://schiste.github.io/learning-games/**.

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

- `src/App.tsx` contient les six jeux et l’interface.
- `src/gameLogic.ts` contient la génération des exercices et les fonctions testables.
- `src/styles.css` porte le système visuel responsive.
- `.github/workflows/deploy.yml` vérifie puis publie le site sur GitHub Pages.

## Contribuer

Les idées de jeux, retours d’enseignants, améliorations d’accessibilité, traductions et contributions techniques sont les bienvenus. Consultez [CONTRIBUTING.md](CONTRIBUTING.md) avant de proposer un changement.

## Licence

Copyright © 2026 les contributeurs de learning-games.

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 uniquement** (`AGPL-3.0-only`). Consultez [LICENSE](LICENSE).
