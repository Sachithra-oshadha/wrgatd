/**
 * Deterministic identity color-coding for people and projects.
 * Same seed (name) always resolves to the same spectrum color, so a
 * person or project keeps a consistent color across the whole app.
 */
const SPECTRUM = [
  { bg: "bg-spectrum-1/12", text: "text-spectrum-1", ring: "ring-spectrum-1/25", dot: "bg-spectrum-1" },
  { bg: "bg-spectrum-2/12", text: "text-spectrum-2", ring: "ring-spectrum-2/25", dot: "bg-spectrum-2" },
  { bg: "bg-spectrum-3/12", text: "text-spectrum-3", ring: "ring-spectrum-3/25", dot: "bg-spectrum-3" },
  { bg: "bg-spectrum-4/12", text: "text-spectrum-4", ring: "ring-spectrum-4/25", dot: "bg-spectrum-4" },
  { bg: "bg-spectrum-5/12", text: "text-spectrum-5", ring: "ring-spectrum-5/25", dot: "bg-spectrum-5" },
  { bg: "bg-spectrum-6/12", text: "text-spectrum-6", ring: "ring-spectrum-6/25", dot: "bg-spectrum-6" },
] as const;

export function spectrumColor(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return SPECTRUM[hash % SPECTRUM.length];
}
