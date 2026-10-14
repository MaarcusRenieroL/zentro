"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { animate, useReducedMotion } from "motion/react";

const played = new Set<string>();

/**
 * A figure that counts up once, the first time it appears in a session. Later
 * mounts, reduced motion and server rendering show the final value.
 */
export function CountUp({
  value,
  id,
  className,
}: {
  value: number;
  /** Identifies the figure so it only animates on its first mount. */
  id: string;
  className?: string;
}): ReactElement {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const first = useRef(!played.has(id));

  useEffect(() => {
    if (!first.current || reduced || value === 0) {
      played.add(id);
      setShown(value);

      return;
    }

    played.add(id);
    first.current = false;
    setShown(0);

    const controls = animate(0, value, {
      duration: 0.7,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (latest) => setShown(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, id, reduced]);

  return (
    <span className={className} data-figure>
      {shown}
    </span>
  );
}
