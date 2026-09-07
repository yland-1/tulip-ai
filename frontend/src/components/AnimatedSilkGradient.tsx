import React, { useEffect, useRef } from "react";

export function AnimatedSilkGradient({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const ph = elapsed * 1.0;
      const amt = 0.55;
      const dir = 1;
      const spin = ph * dir;

      // sway angle: base 191 + sin(spin * 0.6) * 24 * amt
      const angle = 191 + Math.sin(spin * 0.6) * 24 * amt;

      if (containerRef.current) {
        containerRef.current.style.backgroundImage = `radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 52%, rgba(0, 0, 0, 0.136) 100%), linear-gradient(${angle}deg, #FFFFFF 54%, #78B8F9 57%, #5667FF 60%, #4D2FF9 100%)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (active) {
      startTime = performance.now(); // reset time so animation starts clean
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[-5] transition-opacity duration-1000 ease-in-out ${
        active ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundColor: "#FFFFFF",
      }}
    />
  );
}
