import { useEffect, useRef, useState } from "react";
import { beep, speakFrench } from "../../audio";
import { useFactMemory } from "../factMemory";
import { now, useAnswer, type RoundProps, type RoundResult } from "../hooks";
import { groupsFactKeys, groupsRound, type GroupsConfig } from "../logic";
import { Hint, NumberChoices, Prompt } from "../ui";

/**
 * Multiplication as equal groups. Tapping a group counts it in steps of its size
 * ("4, 8, 12…"), the bridge from repeated addition to the times table.
 * The array layout can be turned a quarter: 3 rows of 5 is also 5 rows of 3.
 */
export default function GroupsGame({ config, onSolved }: RoundProps<GroupsConfig>) {
  const [round] = useState(() => groupsRound(config));
  const [counted, setCounted] = useState<number[]>([]);
  const latest = useRef<number[]>([]);
  const [turned, setTurned] = useState(false);
  const memory = useFactMemory();
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = now();
  }, []);

  const finish = (result: RoundResult) => {
    for (const key of groupsFactKeys(round)) memory.record(key, result.mistakes === 0, (result.solvedAt ?? now()) - shownAt.current);
    onSolved(result);
  };
  const { pick, wrong, solved, hint } = useAnswer(round.answer, finish, (picked) =>
    Math.abs(picked - round.answer) === round.size || Math.abs(picked - round.answer) === round.groups
      ? `Presque ! Compte bien le nombre de ${config.layout === "bags" ? "sacs" : "lignes"} : touche-les un par un.`
      : `${round.groups} fois ${round.size}, c’est ${Array(round.groups).fill(round.size).join(" + ")}.`,
  );

  const rows = turned ? round.size : round.groups;
  const cols = turned ? round.groups : round.size;

  const tap = (group: number) => {
    if (latest.current.includes(group)) return;
    latest.current = [...latest.current, group];
    setCounted(latest.current);
    beep(500 + latest.current.length * 40, 0.06);
    speakFrench(String(latest.current.length * cols), 1);
  };

  const turn = () => {
    latest.current = [];
    setCounted([]);
    setTurned(!turned);
    speakFrench(`${cols} fois ${rows}, c’est pareil que ${rows} fois ${cols} !`, 0.95);
  };

  return (
    <div className="m-game groups-game" data-scene={JSON.stringify({ groups: round.groups, size: round.size, answer: round.answer })}>
      {config.layout === "bags"
        ? <Prompt text={`${round.groups} sacs de ${round.size} ${round.thing}. Combien en tout ?`} speech={`${round.groups} sacs de ${round.size}. Combien en tout ?`} />
        : <Prompt text={`${rows} lignes de ${cols}. Combien en tout ?`} speech={`${rows} lignes de ${cols}. Combien en tout ?`} />}
      {config.layout === "bags"
        ? (
          <div className="g-bags">
            {Array.from({ length: round.groups }, (_, group) => {
              const order = counted.indexOf(group);
              return (
                <button key={group} className={`g-bag ${order >= 0 ? "is-counted" : ""}`} onClick={() => tap(group)} aria-label={order >= 0 ? `compté : ${(order + 1) * round.size}` : `sac de ${round.size}`}>
                  <span className="g-items" aria-hidden="true">{Array.from({ length: round.size }, (_, index) => <i key={index}>{round.thing}</i>)}</span>
                  {order >= 0 && <b>{(order + 1) * round.size}</b>}
                </button>
              );
            })}
          </div>
        )
        : (
          <>
            <div className="g-array" key={String(turned)}>
              {Array.from({ length: rows }, (_, row) => (
                <button key={row} className={`g-row ${counted.includes(row) ? "is-counted" : ""}`} onClick={() => tap(row)} aria-label={`ligne de ${cols}`}>
                  {Array.from({ length: cols }, (_, index) => <i key={index} />)}
                  {counted.includes(row) && <b>{(counted.indexOf(row) + 1) * cols}</b>}
                </button>
              ))}
            </div>
            <button className="m-secondary" onClick={turn} disabled={solved !== null}>↻ Tourner</button>
          </>
        )}
      <p className="m-note">{counted.length ? `${counted.length} × ${cols} = ${counted.length * cols}` : `Touche ${config.layout === "bags" ? "chaque sac" : "chaque ligne"} pour compter de ${cols} en ${cols}.`}</p>
      <NumberChoices values={round.choices} onPick={pick} wrong={wrong} solved={solved} />
      <Hint message={hint} />
    </div>
  );
}
