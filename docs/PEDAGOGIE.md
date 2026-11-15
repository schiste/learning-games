# Les choix pédagogiques de Dix sur dix

Ce document relie chaque choix de conception à la recherche qui le justifie, et indique où il se trouve dans le code. Il sert de garde-fou : une nouvelle activité devrait respecter ces principes, ou expliquer pourquoi elle s’en écarte.

## 1. Un seul parcours, du concret vers l’abstrait

- **Principe.** Utiliser un ensemble choisi de représentations concrètes puis imagées (cadres de dix, blocs de numération, ligne des nombres, schémas en barres), puis les retirer progressivement.
- **Source.** IES (2021), *Assisting Students Struggling with Mathematics*, recommandation 3 « Representations » (niveau de preuve fort) ; EEF (2020), *Improving Mathematics in the Early Years and Key Stage 1*.
- **Dans le code.** `src/math/curriculum.ts` : une même manipulation revient avec une aide qui disparaît (`frame: true` puis `frame: false` pour « Faire 10 », lignes graduées puis lignes vides).

## 2. La ligne des nombres au centre

- **Principe.** La ligne des nombres sert à comprendre la grandeur des nombres, l’addition (avancer) et la soustraction (reculer). Estimer sur une ligne **sans graduations** est fortement lié au sens du nombre et à la réussite en mathématiques de 5 à 10 ans ; les jeux linéaires l’améliorent.
- **Sources.** IES (2021), recommandation 4 « Number Lines » (preuve forte) ; Siegler & Booth (2004), Siegler & Ramani (2009).
- **Dans le code.** `games/LineGame.tsx` (placer, sauter de 1 en 1 et de 10 en 10) et `games/EstimateGame.tsx` (ligne vide : seules les extrémités sont écrites).
- **Limite.** Le lien entre linéarité et réussite est discuté (Muldoon et al., 2013) et le transfert de l’entraînement n’est que partiel.

## 3. Des exemples résolus avant de s’exercer

- **Principe.** Montrer une stratégie résolue pas à pas avant la pratique.
- **Source.** Barbieri et al. (2023), méta-analyse de l’effet des exemples résolus en mathématiques : effet moyen g = 0,48. Ajouter des questions d’auto-explication **n’a pas** amélioré l’effet.
- **Dans le code.** Champ `example` des étapes dans `curriculum.ts`, affiché par `WorkedExample.tsx` (ligne par ligne, lu à voix haute, sans question supplémentaire). Un test vérifie que chaque calcul écrit dans un exemple est juste.

## 4. Les problèmes : reconnaître la structure

- **Principe.** Enseigner explicitement les grandes structures de problèmes (ajout, retrait, comparaison, groupes égaux, partage), les représenter, puis choisir l’opération. Apprendre aussi à repérer une donnée inutile.
- **Sources.** IES (2021), recommandation 5 « Word Problems » (preuve forte) ; Peltier & Vannest (2017), méta-analyse de l’enseignement par schémas ; travaux de Fuchs et Jitendra.
- **Dans le code.** `everyday.ts` (`SCHEMA`, option `distractor`) et `games/ProblemGame.tsx` : schéma en barres, choix de l’opération **avant** le calcul ; au CE2, le nom de la structure n’apparaît qu’après le choix.

## 5. La fluence : des activités chronométrées bien conduites

- **Principe.** Inclure régulièrement de courtes activités chronométrées pour automatiser les faits numériques, **à condition** de :
  1. ne chronométrer que ce qui a déjà été enseigné, avec une stratégie efficace en main ;
  2. rappeler une stratégie avant de commencer ;
  3. commencer par les faits faciles (n + 1, doubles ; × 2, × 5, × 10) puis élargir, et mélanger ensuite les types de faits ;
  4. corriger immédiatement en faisant **utiliser la stratégie** ;
  5. viser la justesse avant la vitesse (le score ne compte que les bonnes réponses) ;
  6. suivre ses propres scores sur un graphique **privé** et chercher à « égaler ou battre » son score précédent ;
  7. présenter un seul calcul à la fois pour limiter l’anxiété.
- **Source.** IES (2021), recommandation 6 « Timed Activities » (preuve forte, 27 études), pages 51 à 55.
- **Dans le code.** `games/SprintGame.tsx` (rappel de stratégie, une question à la fois, score « du premier coup », indice de stratégie après une erreur), `facts.ts` (`factDifficulty`, `factStrategy`, `SET_STRATEGY`, `sprintFact` qui élargit le champ au fil des réussites), `ChronoPage.tsx` (Défis chrono : records et graphiques personnels, chrono conseillé seulement après les étapes qui l’enseignent), `profiles.ts` (`recordChrono`).
- **Débat.** Le NCTM déconseille les tests chronométrés et une partie de la littérature les associe à l’anxiété ; une étude de 2024 n’a pas trouvé d’anxiété accrue avec des tâches chronométrées, et les recommandations IES reposent sur des activités courtes et accompagnées. Nous suivons IES en appliquant toutes ses précautions, et le chrono ne fait jamais perdre : un compte à rebours vide ne retire que le bonus.

## 6. La stratégie avant la mémorisation

- **Principe.** Les faits passent par trois phases : compter, raisonner (faits dérivés : doubles + 1, faire 10, 7 × 6 = 5 × 6 + 2 × 6), puis récupérer en mémoire.
- **Source.** Baroody (1985, 2006) ; séquences recommandées par le NCTM.
- **Dans le code.** Les étapes de stratégie (« Passer la dizaine », « Les grands rectangles »…) précèdent les chronos ; `factStrategy` donne une stratégie pour chacun des faits suivis (un test vérifie qu’elle mène à la bonne réponse).

## 7. Mémoire espacée et pratique entrelacée

- **Principe.** Revenir sur un fait à intervalles croissants (récupération espacée) et mélanger les types de problèmes plutôt que les traiter en blocs.
- **Sources.** Littérature sur la pratique de récupération et l’espacement ; Rohrer et al. (2020), essai randomisé sur la pratique entrelacée en mathématiques (d = 0,83 un mois plus tard).
- **Dans le code.** `facts.ts` : boîtes de Leitner 0 à 5, intervalles 0, 1, 2, 4, 7, 14 jours ; une réponse rapide fait monter le fait, une erreur le fait revenir au début. « Révision du jour » (`ReviewPlayer.tsx`) et chronos mélangés (`facts: "mixed"`).
- **Limite.** L’essai de Rohrer porte sur des élèves de 5e (grade 7) ; les preuves directes à l’école élémentaire sont plus rares.

## 8. Retour immédiat, sans échec

- **Principe.** Chaque erreur reçoit une piste précise et l’enfant corrige lui-même ; une erreur ne termine jamais une manche.
- **Source.** IES (2021), recommandation 6, étape 5 ; pratique générale du retour correctif.
- **Dans le code.** `Hint` et `useAnswer` (`ui.tsx`, `hooks.ts`) : la piste nomme ce qui ne va pas (« Il manque des dizaines : tu en as 2, il en faut 4 »).

## 9. Langage mathématique précis

- **Principe.** Utiliser des mots exacts et constants : unités, dizaines, centaines, somme, différence, tiers, quart.
- **Source.** IES (2021), recommandation 2 « Mathematical Language » (preuve forte).
- **Dans le code.** Les consignes, indices et noms de fractions (`fractionWords`) emploient le vocabulaire scolaire et chaque consigne est lue à voix haute.

## Ce que nous n’avons pas retenu

- **Classements entre enfants.** Les scores ne se comparent qu’à soi-même (IES recommande des graphiques privés).
- **Messages de « mentalité de croissance ».** Les effets mesurés des interventions sur l’état d’esprit sont faibles ; nous préférons des pistes concrètes.

## Références

- Institute of Education Sciences (2021). *Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades* (WWC 2021006). https://ies.ed.gov/ncee/wwc/practiceguide/26
- Education Endowment Foundation (2020). *Improving Mathematics in the Early Years and Key Stage 1*. https://educationendowmentfoundation.org.uk/tools/guidance-reports/early-maths/
- Barbieri, C. A., et al. (2023). A meta-analysis of the worked examples effect on mathematics performance. *Educational Psychology Review*. https://link.springer.com/content/pdf/10.1007/s10648-023-09745-1.pdf
- Rohrer, D., Dedrick, R. F., Hartwig, M. K., & Cheung, C.-N. (2020). A randomized controlled trial of interleaved mathematics practice. *Journal of Educational Psychology*. https://ies.ed.gov/ncee/wwc/Study/88770
- Siegler, R. S., & Ramani, G. B. (2009). Playing linear number board games — but not circular ones — improves low-income preschoolers’ numerical understanding. https://www.cmu.edu/dietrich/psychology/cs/research-teaching/docs/SieglerBoardGamesCDPerp2009.pdf
- Peltier, C., & Vannest, K. J. (2017). A meta-analysis of schema instruction on the problem-solving performance of elementary school students. *Review of Educational Research*, 87(5).
- Baroody, A. J. (1985). Mastery of basic number combinations: Internalization of relationships or facts? *Journal for Research in Mathematics Education*.
- Education Week (2024). Do timed tasks really worsen math anxiety? https://www.edweek.org/teaching-learning/do-timed-tasks-really-worsen-math-anxiety/2024/08
