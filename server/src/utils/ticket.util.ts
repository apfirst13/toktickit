import crypto from "crypto";

export function generateTicketNumber(): string {
  return `TIK-${Date.now().toString().slice(-6)}${crypto.randomInt(1000, 9999)}`;
}
