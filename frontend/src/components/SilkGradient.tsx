import React from "react";

export function SilkGradient({ active }: { active: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[-5] transition-opacity duration-1000 ease-in-out ${
        active ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundColor: "#FFFFFF",
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 52%, rgba(0, 0, 0, 0.136) 100%), linear-gradient(191deg, #FFFFFF 54%, #78B8F9 57%, #5667FF 60%, #4D2FF9 100%)"
      }}
    />
  );
}
