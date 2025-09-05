"use client";
import React from "react";

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex gap-2 text-sm">
      {steps.map((s, i) => (
        <li key={s} className={`px-2 py-1 rounded border ${i <= current ? "bg-black text-white border-black" : "bg-white border-gray-300"}`}>
          {s}
        </li>
      ))}
    </ol>
  );
}

