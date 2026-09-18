import React from "react";

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast toast-in">{message}</div>;
}
