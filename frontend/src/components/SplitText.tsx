import { Fragment } from "react";
import { motion } from "motion/react";

interface Props {
  text: string;
  className?: string;
  initialDelay?: number;
  wordDelay?: number;
}

/**
 * Renders text as individual words, each animating in with a staggered
 * blur+fade+slide entrance. Wraps naturally at container boundaries.
 */
export default function SplitText({
  text,
  className = "",
  initialDelay = 0,
  wordDelay = 0.07,
}: Props) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: initialDelay + i * wordDelay,
              duration: 0.65,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
          {i < words.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </Fragment>
      ))}
    </span>
  );
}
