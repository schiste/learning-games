import { DICE_SPOTS } from "./logic";

/**
 * A ten-frame (or five-frame): two rows of five, filled row by row.
 * `filled` counters are blue, `added` counters (the child's taps) are yellow.
 */
export function TenFrame({ size = 10, limit = size, filled, added = 0, onTapEmpty, label }: {
  size?: 5 | 10;
  /** Cells beyond `limit` are greyed out, e.g. a house of 8 uses 8 of the 10 cells. */
  limit?: number;
  filled: number;
  added?: number;
  onTapEmpty?: () => void;
  label?: string;
}) {
  return (
    <div className={`m-frame is-${size}`} role={onTapEmpty ? "group" : "img"} aria-label={label ?? `${filled + added} sur ${size}`}>
      {Array.from({ length: size }, (_, index) => {
        if (index >= limit) return <span key={index} className="m-frame-cell is-off" />;
        const kind = index < filled ? "is-filled" : index < filled + added ? "is-added" : "is-empty";
        if (kind === "is-empty" && onTapEmpty) {
          return <button key={index} className="m-frame-cell is-empty is-tappable" onClick={onTapEmpty} aria-label="ajouter un jeton" />;
        }
        return <span key={index} className={`m-frame-cell ${kind}`}><i /></span>;
      })}
    </div>
  );
}

export function Dice({ value }: { value: number }) {
  const spots = DICE_SPOTS[value] ?? [];
  return (
    <div className="dice" role="img" aria-label={`dé : ${value}`}>
      {Array.from({ length: 9 }, (_, index) => <span key={index}>{spots.includes(index) && <i />}</span>)}
    </div>
  );
}
