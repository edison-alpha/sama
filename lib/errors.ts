import type { Dict } from "@/lib/i18n/dict";

/** Wallet and RPC errors carry long provider dumps. Users see one plain sentence (PRD §19.1). */
export function friendlyError(error: unknown, d: Dict): string {
  const message = (error as Error)?.message ?? String(error);
  if (/reject|denied|cancel/i.test(message)) return d.errors.rejected;
  if (/chain|network/i.test(message) && /switch|wrong|mismatch|unsupported/i.test(message)) return d.errors.wrongNetwork;
  if (/insufficient funds|gas required exceeds/i.test(message)) return d.errors.noGas;
  return message.split("\n")[0]?.slice(0, 240) || d.errors.generic;
}
