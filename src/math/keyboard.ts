import { useEffect, useRef, useState } from "react";

/** Lets children answer with the keyboard: digits are buffered briefly so two-digit numbers like 10 or 15 work. */
export function useKeyboardNumbers(onPick: (number: number) => void, allowed: number[], enabled = true) {
  const [typed, setTyped] = useState("");
  const pickRef = useRef(onPick);
  const allowedKey = allowed.join(",");

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!enabled) return;
    const allowedValues = allowedKey.split(",").filter(Boolean).map(Number);
    let buffer = "";
    let timer: number | undefined;
    const reset = () => {
      buffer = "";
      setTyped("");
      if (timer) window.clearTimeout(timer);
      timer = undefined;
    };
    const commit = () => {
      const value = Number(buffer);
      if (buffer && allowedValues.includes(value)) {
        reset();
        pickRef.current(value);
      } else {
        reset();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "Escape" || event.key === "Backspace") {
        reset();
        return;
      }
      if (event.key === "Enter" && buffer) {
        event.preventDefault();
        commit();
        return;
      }
      if (!/^\d$/.test(event.key)) return;

      event.preventDefault();
      let candidate = `${buffer}${event.key}`;
      let matches = allowedValues.filter((value) => String(value).startsWith(candidate));
      if (!matches.length) {
        candidate = event.key;
        matches = allowedValues.filter((value) => String(value).startsWith(candidate));
      }
      if (!matches.length) {
        reset();
        return;
      }

      buffer = candidate;
      setTyped(candidate);
      if (timer) window.clearTimeout(timer);
      const exact = allowedValues.includes(Number(candidate));
      const hasLongerMatch = matches.some((value) => String(value).length > candidate.length);
      if (exact && !hasLongerMatch) {
        commit();
      } else {
        timer = window.setTimeout(commit, 450);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (timer) window.clearTimeout(timer);
    };
  }, [allowedKey, enabled]);

  return enabled ? typed : "";
}
