"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";

interface CountUpProps {
  target: number;
  decimals?: number;
  className?: string;
}

function formatNumber(value: number, decimals: number) {
  const parts = value.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
}

function CountUp({ target, decimals = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(formatNumber(0, decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.5,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setDisplay(formatNumber(v, decimals)),
    });
    return () => controls.stop();
  }, [inView, target, decimals]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export { CountUp };
