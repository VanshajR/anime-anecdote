"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// energy spark palette — One For All green → smash gold → white
const SPARK_COLORS = ["#a6ff7a", "#7cff6b", "#ffd23f", "#fff7cf", "#ffffff"];

/**
 * Hidden Konami easter egg: a coded recreation of an anime "charge-up → color-cycle
 * → radial detonation" energy burst (per the reference gif). No source art embedded.
 */
export function KonamiConfetti() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = key === SEQUENCE[pos] ? pos + 1 : key === SEQUENCE[0] ? 1 : 0;
      if (pos === SEQUENCE.length) {
        pos = 0;
        fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fire = () => {
    setActive(true);
    // spark burst timed to the detonation beat (~2.5s into the 3.2s sequence)
    window.setTimeout(() => {
      confetti({
        particleCount: 170,
        spread: 360,
        startVelocity: 58,
        gravity: 0.9,
        decay: 0.92,
        scalar: 1.2,
        ticks: 170,
        origin: { x: 0.5, y: 0.5 },
        colors: SPARK_COLORS,
      });
    }, 2500);
    window.setTimeout(() => setActive(false), 3300);
  };

  if (!active) return null;

  return (
    <div className="cb-backdrop pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      <div className="cb-shake absolute inset-0">
        {/* rising light pillar */}
        <div className="cb-beam absolute bottom-0 left-1/2 h-[60vh] w-[14px] -translate-x-1/2" />
        {/* color-cycling radial speed lines */}
        <div className="cb-rays absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2" />
        {/* lens flare at beam tip */}
        <div className="cb-flare absolute left-1/2 top-1/2 h-[44vmin] w-[44vmin] -translate-x-1/2 -translate-y-1/2" />
        {/* white-hot detonating core */}
        <div className="cb-core absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
