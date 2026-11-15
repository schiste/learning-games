# Dix sur dix

Des jeux tactiles, libres et gratuits pour apprendre les mathématiques du CP au CE2 — et pour commencer à lire. Le site fonctionne dans un navigateur, sans compte, sans publicité et sans collecte de données.

## L’aventure des nombres

Les maths forment un seul parcours guidé : **11 chapitres et 65 étapes**, dans l’ordre où l’on apprend. L’étape suivante est toujours proposée, mais aucune n’est verrouillée.

1. **Compter** — toucher chaque objet en comptant, reconnaître le dé, comparer.
2. **Faire 10** — le cadre de dix, les maisons des nombres, le chrono du 10.
3. **Logique** — colliers à motifs, mini-sudoku de formes, suites, nombre mystère.
4. **Dizaines et unités** — construire et lire avec des cubes et des barres de dix, la ligne des nombres.
5. **Ajouter et enlever** — la grenouille sur la ligne, passer la dizaine (8 + 5 = 8 + 2 + 3), les doubles.
6. **Problèmes** — choisir le bon calcul avec un schéma en barres, puis calculer.
7. **L’heure et la monnaie** — lire l’horloge, payer le prix exact.
8. **Les grands nombres** — centaines et milliers, y compris les zéros comme dans 1 093.
9. **Multiplier et partager** — sacs et rectangles, partage équitable avec reste, toutes les tables.
10. **Les fractions** — lire et colorier des parts égales.
11. **Énigmes** — suites, sudoku de chiffres, détective des nombres.

Chaque étape s’appuie sur l’un des 18 « moteurs » de jeu (compter, cadre de dix, blocs de numération, ligne des nombres, horloge, monnaie, schéma en barres, sudoku…) avec sa propre configuration : la même manipulation sert au CP puis au CE2, et l’aide visuelle disparaît progressivement.

### Jamais d’échec, toujours une piste

- Chaque consigne est lue à voix haute (🔊) : un enfant qui ne lit pas encore peut jouer.
- Une erreur ne termine jamais une manche : elle reste visible avec une piste précise (« Il manque des dizaines : tu en as 2, il en faut 4 »).
- Un compte à rebours ⚡ transforme la rapidité en points bonus ; quand il est vide, rien n’est perdu : « Prends ton temps ».

### Scores et joueurs

- **Plusieurs joueurs** par appareil (« Qui joue ? »), chacun avec son animal et ses progrès, gardés uniquement dans ce navigateur.
- **Par étape** : jusqu’à 3 étoiles et un record de points. **Par chapitre** : la somme des meilleurs records. **Par joueur** : points cumulés, étoiles, étapes terminées et jours de suite.

### Les bases, par cœur

Les compléments à 10, les additions et soustractions, les doubles, le passage de la dizaine et **toutes les tables de 2 à 9** sont suivis fait par fait. Une réponse rapide fait monter le calcul d’une boîte (révision espacée de type Leitner : 0, 1, 2, 4, 7 puis 14 jours) ; une erreur le fait revenir au début. La **Révision du jour** propose d’abord les calculs fragiles, et **Mes progrès** montre ce qui est su par cœur, table par table.

## Apprendre à lire

Le parcours « Lire » propose neuf jeux : Le piano, J’entends, Les lettres, Les syllabes, Le mot juste, Je frappe, La phrase, L’intrus et La dictée. Il suit les principes publics de Lecture Piano CP : entrée par les graphèmes, fusion tactile des sons, passage des sons simples aux sons complexes et étayage progressif. Les consignes, syllabes, mots, phrases et graphismes ont été créés spécialement pour ce projet ; ce parcours indépendant n’est ni un produit officiel ni une reproduction des ouvrages des Éditions Retz.

## Jouer

Le site public est disponible sur **https://schiste.github.io/learning-games/**. Les maths s’ouvrent par défaut (**#maths**), la lecture avec **https://schiste.github.io/learning-games/#lecture**. Une étape s’ouvre directement avec `#maths/<étape>`, par exemple `#maths/bridge-add`.

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

- `src/App.tsx` contient l’en-tête et la navigation ; `src/route.ts` lit l’adresse.
- `src/math/curriculum.ts` décrit les chapitres et les étapes : chaque étape = un moteur + une configuration.
- `src/math/games/` contient les 18 moteurs de jeu ; `src/math/StepPlayer.tsx` enchaîne les manches, le compte à rebours et les points.
- `src/math/logic.ts`, `puzzles.ts` et `everyday.ts` génèrent les exercices (fonctions pures, testées).
- `src/math/facts.ts` énumère les faits numériques et applique la révision espacée.
- `src/math/profiles.ts` gère les joueurs, les scores et le stockage local.
- `src/ReadingPage.tsx` et `src/readingLogic.ts` contiennent le parcours de lecture.
- `.github/workflows/deploy.yml` vérifie puis publie le site sur GitHub Pages.

## Contribuer

Les idées de jeux, retours d’enseignants, améliorations d’accessibilité, traductions et contributions techniques sont les bienvenus. Consultez [CONTRIBUTING.md](CONTRIBUTING.md) avant de proposer un changement.

## Licence

Copyright © 2026 les contributeurs de learning-games.

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 uniquement** (`AGPL-3.0-only`). Consultez [LICENSE](LICENSE).
