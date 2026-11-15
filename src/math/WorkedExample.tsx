import { useEffect, useState } from "react";
import { speakFrench } from "../audio";

/**
 * "Regarde comment on fait": a worked example revealed one line at a time, at the child's pace,
 * each line read aloud. It ends with « À moi ! » and asks no extra questions.
 */
export default function WorkedExample({ lines, onDone }: { lines: string[]; onDone: () => void }) {
  const [shown, setShown] = useState(1);
  const last = shown >= lines.length;

  useEffect(() => {
    speakFrench(lines[shown - 1], 0.9);
  }, [lines, shown]);

  return (
    <div className="m-game worked-example" data-scene={JSON.stringify({ example: true, shown, total: lines.length })}>
      <p className="worked-title"><span aria-hidden="true">👀</span> Regarde comment on fait</p>
      <ol className="worked-lines">
        {lines.slice(0, shown).map((line, index) => (
          <li key={index} className={index === shown - 1 ? "is-new" : ""}>{line}</li>
        ))}
      </ol>
      {last
        ? <button className="m-primary is-big" onClick={onDone}>À moi ! ▶</button>
        : <button className="m-secondary" onClick={() => setShown(shown + 1)}>Suite ▶</button>}
    </div>
  );
}
