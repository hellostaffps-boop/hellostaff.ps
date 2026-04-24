import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

export default function AnimatedCounter({
  value,
  direction = "up",
  duration = 1,
  className = "",
  formatOptions = {},
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });
  const [hasStarted, setHasStarted] = useState(false);

  const motionValue = useMotionValue(direction === "up" ? 0 : value);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true);
      motionValue.set(direction === "up" ? value : 0);
    }
  }, [isInView, value, direction, motionValue, hasStarted]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
        ...formatOptions,
      });
      setDisplayValue(formatter.format(Math.round(latest)));
    });
  }, [springValue, formatOptions]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
