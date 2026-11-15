import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { countSolutions, SHAPES, sudokuConflict, sudokuRound, type SudokuConfig } from "../puzzles";
import { Hint, Prompt } from "../ui";

const RULE: Record<"row" | "column" | "box", string> = {
  row: "cette ligne",
  column: "cette colonne",
  box: "ce carré",
};

/**
 * Mini-sudoku 4×4: choose a symbol, then tap an empty cell (tap it again to erase).
 * A move that breaks a rule is refused with the rule it breaks; the puzzle always has exactly one solution.
 */
export default function SudokuGame({ config, onSolved }: RoundProps<SudokuConfig>) {
  const [round] = useState(() => sudokuRound(config));
  const [grid, setGrid] = useState(round.puzzle);
  const [brush, setBrush] = useState(0);
  const [hint, setHint] = useState("");
  const [flash, setFlash] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const symbol = (value: number) => (config.symbols === "shapes" ? SHAPES[value] : String(value + 1));

  const place = (cell: number) => {
    if (solved || round.puzzle[cell] !== null) return;
    if (grid[cell] !== null) {
      // Tapping a symbol the child placed erases it.
      const next = [...grid];
      next[cell] = null;
      setGrid(next);
      setHint("");
      beep(300, 0.05);
      return;
    }
    const conflict = sudokuConflict(grid, cell, brush);
    if (conflict) {
      setHint(`Il y a déjà ${symbol(brush)} dans ${RULE[conflict]}.`);
      setFlash(cell);
      setMistakes(mistakes + 1);
      beep(220, 0.14);
      later(() => setFlash(null), 500);
      return;
    }
    const next = [...grid];
    next[cell] = brush;
    setGrid(next);
    beep(560, 0.06);
    // A legal move can still lead to a dead end; say so early instead of letting the child get stuck.
    setHint(countSolutions(next, 1) === 0 ? "Attention : avec ce choix, une case ne pourra plus être remplie. Touche une case que tu as remplie pour l’effacer." : "");
    if (next.every((value) => value !== null)) {
      // Rules were enforced at every move, so a full grid is the unique solution.
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench("Bravo, la grille est complète !", 0.95);
      later(() => onSolved({ mistakes, solvedAt }), 1300);
    }
  };

  return (
    <div className="m-game sudoku-game" data-scene={JSON.stringify({ solution: round.solution, grid })}>
      <Prompt text="Chaque ligne, chaque colonne et chaque carré a un seul de chaque." speech="Remplis la grille. Dans chaque ligne, chaque colonne et chaque carré, il faut un seul de chaque." />
      <div className="k-palette" role="radiogroup" aria-label="Symbole">
        {[0, 1, 2, 3].map((value) => (
          <button key={value} role="radio" aria-checked={brush === value} className={`k-brush ${brush === value ? "is-active" : ""}`} onClick={() => setBrush(value)} aria-label={`Choisir ${symbol(value)}`}>
            {symbol(value)}
          </button>
        ))}
      </div>
      <div className={`k-grid ${solved ? "is-solved" : ""}`}>
        {grid.map((value, cell) => {
          const given = round.puzzle[cell] !== null;
          return (
            <button key={cell} className={`k-cell ${given ? "is-given" : ""} ${flash === cell ? "is-wrong" : ""}`} onClick={() => place(cell)} disabled={given} aria-label={value === null ? "case vide" : symbol(value)}>
              {value === null ? "" : symbol(value)}
            </button>
          );
        })}
      </div>
      <Hint message={hint} />
    </div>
  );
}
