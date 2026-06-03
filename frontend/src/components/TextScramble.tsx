import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";

interface Props {
  text: string;
  className?: string;
  /** Seconds before the scramble starts */
  delay?: number;
  /** Milliseconds per iteration tick */
  speed?: number;
}

/**
 * Renders text that scrambles through random characters before
 * resolving into the real string — left to right, character by character.
 */
export default function TextScramble({
  text,
  className = "",
  delay = 0,
  speed = 35,
}: Props) {
  const [display, setDisplay] = useState<string[]>(() =>
    text.split("").map((c) => (c === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)]))
  );

  useEffect(() => {
    let iteration = 0;
    let intervalId: ReturnType<typeof setInterval>;

    const startTimer = setTimeout(() => {
      intervalId = setInterval(() => {
        setDisplay(
          text.split("").map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
        );
        iteration += 0.6;
        if (iteration >= text.length) {
          clearInterval(intervalId);
          setDisplay(text.split(""));
        }
      }, speed);
    }, delay * 1000);

    return () => {
      clearTimeout(startTimer);
      clearInterval(intervalId);
    };
  }, [text, delay, speed]);

  return (
    <span className={className} aria-label={text}>
      {display.join("")}
    </span>
  );
}
