"use client";

import { useEffect, useState } from "react";
import { useSpring } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

export const AnimatedNumber = ({ value, decimals = 0, suffix = "" }: AnimatedNumberProps) => {
  const spring = useSpring(0, { stiffness: 120, damping: 30 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => setDisplay(latest));
    return unsubscribe;
  }, [spring]);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};
