Original prompt: Craft games 2 (Les quilles) and 3 (La grenouille) properly; add a complexity grade to every game so each game increases in complexity; visually identify timed games; keep a no-failure experience while displaying mistakes clearly.

Follow-up prompt: Give timed games a progressively filling background, support keyboard number entry, keep every timer at 60 seconds, and increase timer complexity through two-term then three-term equations with level 3 inputs restricted to 0–5.

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

## TODO

- None for this iteration.

## Suggestions for the next iteration

- Add optional spoken instructions while keeping every cue available visually.
- Consider a locally stored child-friendly progress trail across activities.
