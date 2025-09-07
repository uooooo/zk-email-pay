"use client";
import React from "react";

export function AlertBanner({ type = "error", message }: { type?: "error" | "info" | "success"; message?: string }) {
  if (!message) return null;
  
  const getStyle = (type: "error" | "info" | "success") => {
    switch (type) {
      case "error":
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#dc2626'
        };
      case "success":
        return {
          background: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          color: '#059669'
        };
      case "info":
      default:
        return {
          background: 'var(--accent-light)',
          borderColor: 'var(--primary)',
          color: 'var(--foreground)'
        };
    }
  };
  
  return (
    <div className="border rounded px-3 py-2 text-sm" style={getStyle(type)}>
      {message}
    </div>
  );
}

