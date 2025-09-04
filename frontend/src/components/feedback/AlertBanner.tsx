"use client";
import React from "react";

export function AlertBanner({ type = "error", message }: { type?: "error" | "info" | "success"; message?: string }) {
  if (!message) return null;
  const color = type === "error" ? "bg-red-100 text-red-900 border-red-300" : type === "success" ? "bg-green-100 text-green-900 border-green-300" : "bg-blue-100 text-blue-900 border-blue-300";
  return (
    <div className={`border rounded px-3 py-2 text-sm ${color}`}>{message}</div>
  );
}

