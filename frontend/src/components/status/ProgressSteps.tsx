"use client";
import React from "react";

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex gap-2 text-sm">
      {steps.map((s, i) => (
        <li 
          key={s} 
          className="px-2 py-1 rounded border"
          style={i <= current ? {
            background: 'var(--primary)',
            color: '#fff',
            borderColor: 'var(--primary)'
          } : {
            background: 'var(--card-bg)',
            color: 'var(--foreground)',
            borderColor: 'var(--border-soft)'
          }}
        >
          {s}
        </li>
      ))}
    </ol>
  );
}

