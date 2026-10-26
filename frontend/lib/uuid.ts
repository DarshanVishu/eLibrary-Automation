'use client';

// UUID v4 with browser-safe fallback (no crypto.randomUUID requirement).
// Works in older mobile browsers that still support crypto.getRandomValues.
export function uuidv4(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && 'randomUUID' in c && typeof (c as any).randomUUID === 'function') {
    return (c as any).randomUUID();
  }
  if (!c?.getRandomValues) {
    // Last resort: not cryptographically strong, but avoids runtime crash.
    const s = `${Date.now()}-${Math.random()}-${Math.random()}`.replace(/\./g, '');
    return `fallback-${s}`;
  }

  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  // RFC 4122 version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
}
