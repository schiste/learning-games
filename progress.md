Original prompt: Craft games 2 (Les quilles) and 3 (La grenouille) properly; add a complexity grade to every game so each game increases in complexity; visually identify timed games; keep a no-failure experience while displaying mistakes clearly.

Follow-up prompt: Give timed games a progressively filling background, support keyboard number entry, keep every timer at 60 seconds, and increase timer complexity through two-term then three-term equations with level 3 inputs restricted to 0–5.

Current prompt: Implement four new expert games (La caisse, La balance, Le chemin, Le partage) and remove the introductory heading/copy block for now.

New prompt: Add a second page with the same « Je découvre / Je m’entraîne / Je maîtrise » progression so children understand the decimal place-value system from tens through numbers such as 1,093.

Current refinement prompt: Re-review the decimal games critically and improve the activities that are not intuitive enough for a child discovering place value.

## Progress

- 2026-09-05: Defined three shared complexity grades: Découverte, Entraînement, Défi.
- 2026-09-05: Planned Les quilles as a bowl → observe fallen pins → identify remaining pins loop.
- 2026-09-05: Planned La grenouille as a tactile number-line journey → count jumps → identify the complement loop.
- 2026-09-05: Added level-aware generators for starting numbers, baskets, equation forms, memory-deck sizes, and bowling rounds. Seven logic tests pass.
- 2026-09-05: Built the bowling lane and frog pond play loops. Added per-game complexity controls, visible timed-game markers, and explicit non-punitive mistake feedback across every answer-based game.
- 2026-09-05: First browser playthrough caught an unstable frog target caused by transform-based pulsing; changed the pulse to color/shadow only so rapid touch targets remain stationary.
- 2026-09-05: Mobile screenshot found the current pad could clip after a viewport resize; the pond now recenters on both frog movement and viewport changes.
- 2026-09-05: End-to-end browser checks pass for both new games, wrong-answer states, level 3, memory mismatches, the timed badge, deterministic timer completion, and 360 px layout with zero overflow or console errors.
- 2026-09-05: Added and tested timer-question generation: level 1 uses two terms, levels 2–3 use three terms with varied missing positions, and level 3 constrains every value to 0–5.
- 2026-09-05: Added buffered keyboard input to numeric choices and pads, including unambiguous two-key entry for 10. All timer levels now last 60 seconds and elapsed time fills the stage background upward.
- 2026-09-05: Browser regression passes across all three timer levels: keyboard answers, fixed 60-second duration, half/full background fill, 0–5 challenge inputs, mobile layout, and console checks.
- 2026-09-05: Added tested round generators for change-making, subset-sum balancing, bounded addition/subtraction paths, and ten-object sharing constraints. Twelve logic tests pass.
- 2026-09-05: Built La caisse, La balance, Le chemin, and Le partage as four distinct tap-first expert mechanics, each with three complexity levels and persistent, actionable mistake feedback.
- 2026-09-05: Removed the introductory copy block and added a compact third navigation row, « Je maîtrise », directly below the site header.
- 2026-09-05: Browser-tested every new game at levels 1, 2, and 3, including incorrect attempts, undo/removal controls, successful completion, semantic text state, and the 360 px layout with zero overflow or console errors.
- 2026-09-05: Defined and tested a shared decimal progression: tens/units at level 1, hundreds at level 2, and thousands with internal zeroes at level 3. Added generators for regrouping, counters, number lines, place-value machines, decompositions, and digit clues. Eighteen tests pass.
- 2026-09-05: Built the « Construire les nombres » page with nine distinct activities across « Je découvre », « Je m’entraîne », and « Je maîtrise », plus direct hash navigation that preserves the original « Faire 10 » route.
- 2026-09-05: Applied one stable color to each decimal place throughout the page, supported keyboard entry in Le code, and kept actionable mistake feedback in every answer-based activity.
- 2026-09-05: Browser-tested all nine games at all three levels, topic switching, keyboard entry, internal-zero exercises, incorrect attempts, successful completion, and the 360 px layout with zero document overflow or console errors.
- 2026-09-05: Interaction audit found several clarity gaps despite functional tests passing: Les paquets hid the invariant total and separated the action from the objects; L’abaque wrapped from 0 to 9 when subtracting; Le compteur was an arithmetic multiple-choice instead of a carry demonstration; comparison feedback named the wrong first place to inspect; La ligne hid its step; Le code only allowed destructive left-to-right correction; and several expert representations relied too heavily on notation.
- 2026-09-05: Reworked Les paquets around direct object tapping and a visible invariant total; rebuilt Le compteur as a one-press carry demonstration; made abacus limits explicit; and added a persistent place-color key with full position names.
- 2026-09-05: Replaced dense decomposition text with aligned color chips, highlighted the first differing comparison column, exposed number-line steps, gave La machine visible distance and move tokens, aligned detective clues by place, and made every code position directly editable.
- 2026-09-05: Replayed all nine activities through their important action/error/success chains. Desktop and 360 px screenshots were inspected; all nine mobile layouts have zero document overflow, keyboard input remains functional, and no browser errors were reported.

## TODO

- No known implementation tasks for this iteration.

## Suggestions for the next iteration

- Add optional spoken instructions while keeping every cue available visually.
- Consider a locally stored child-friendly progress trail across activities.
- Consider extracting the growing game registry and individual games from `App.tsx` before the next large batch of activities.
