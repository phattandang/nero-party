import { Fragment } from "react";
import { motion } from "motion/react";

interface Props {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  viewport?: { margin?: string };
  style?: React.CSSProperties;
}

/**
 * Clip-path word reveal — each word slides up from behind an invisible mask.
 * The signature motion of Lusion, Active Theory, and Awwwards-tier sites.
 * Renders inline so it wraps naturally at container width.
 */
export function MotionText({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.055,
  once = true,
  viewport = { margin: "-5%" },
  style,
}: Props) {
  const words = children.split(" ");

  return (
    <Tag className={className} style={style}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {/* The overflow:hidden here is the "mask" — text slides up from inside it */}
          <span
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "bottom",
              paddingBottom: "0.06em",
            }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={{ y: "115%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once, ...viewport }}
              transition={{
                delay: delay + i * stagger,
                duration: 0.88,
                ease: [0.16, 1, 0.3, 1], // expo.out
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}
