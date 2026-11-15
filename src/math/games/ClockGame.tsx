import { useState } from "react";
import { beep, speakFrench } from "../../audio";
import { clockRound, formatTime, handAngles, type ClockConfig, type Time } from "../everyday";
import { now, useTimeouts, type RoundProps } from "../hooks";
import { Hint, Prompt } from "../ui";

export function ClockFace({ time }: { time: Time }) {
  const angles = handAngles(time);
  return (
    <svg className="c-face" viewBox="0 0 200 200" role="img" aria-label="Horloge">
      <circle cx="100" cy="100" r="94" className="c-rim" />
      {Array.from({ length: 60 }, (_, index) => (
        <line key={index} x1="100" y1={index % 5 ? 12 : 10} x2="100" y2={index % 5 ? 17 : 24} className={index % 5 ? "c-tick" : "c-tick is-hour"} transform={`rotate(${index * 6} 100 100)`} />
      ))}
      {Array.from({ length: 12 }, (_, index) => {
        const angle = ((index + 1) * 30 * Math.PI) / 180;
        return <text key={index} x={100 + 64 * Math.sin(angle)} y={100 - 64 * Math.cos(angle) + 7} className="c-number">{index + 1}</text>;
      })}
      <line x1="100" y1="100" x2="100" y2="52" className="c-hour" transform={`rotate(${angles.hour} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="24" className="c-minute" transform={`rotate(${angles.minute} 100 100)`} />
      <circle cx="100" cy="100" r="6" className="c-pin" />
    </svg>
  );
}

/** Read the clock: the short hand gives the hour, the long hand the minutes. */
export default function ClockGame({ config, onSolved }: RoundProps<ClockConfig>) {
  const [round] = useState(() => clockRound(config));
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const later = useTimeouts();
  const answer = formatTime(round.time);

  const choose = (time: Time) => {
    const label = formatTime(time);
    if (solved || wrong.includes(label)) return;
    if (label === answer) {
      const solvedAt = now();
      setSolved(true);
      beep(880, 0.12);
      speakFrench(`Oui, il est ${round.time.hour} heures ${round.time.minute || ""}`, 0.95);
      later(() => onSolved({ mistakes: wrong.length, solvedAt }), 1200);
    } else {
      setWrong([...wrong, label]);
      beep(220, 0.14);
    }
  };

  return (
    <div className="m-game clock-game" data-scene={JSON.stringify({ answer })}>
      <Prompt text="Quelle heure est-il ?" speech="Quelle heure est-il ? La petite aiguille montre les heures, la grande les minutes." />
      <ClockFace time={round.time} />
      <div className="m-choices">
        {round.choices.map((time) => {
          const label = formatTime(time);
          return (
            <button key={label} className={`m-choice c-choice ${wrong.includes(label) ? "is-wrong" : ""} ${solved && label === answer ? "is-right" : ""}`} onClick={() => choose(time)} disabled={wrong.includes(label)}>
              {label}
            </button>
          );
        })}
      </div>
      <Hint message={wrong.length && !solved ? "La petite aiguille montre l’heure. La grande montre les minutes : chaque chiffre vaut 5 minutes." : ""} />
    </div>
  );
}
