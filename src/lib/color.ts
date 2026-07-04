export function alpha(hex: string, opacity: number): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return hex;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
}

export function mix(hex1: string, hex2: string, weight: number): string {
  const v1 = hex1.replace("#", "");
  const v2 = hex2.replace("#", "");
  if (v1.length !== 6 || v2.length !== 6) return hex1;

  const w = Math.max(0, Math.min(1, weight));
  const r = Math.round(Number.parseInt(v1.slice(0, 2), 16) * (1 - w) + Number.parseInt(v2.slice(0, 2), 16) * w);
  const g = Math.round(Number.parseInt(v1.slice(2, 4), 16) * (1 - w) + Number.parseInt(v2.slice(4, 6), 16) * w);
  const b = Math.round(Number.parseInt(v1.slice(4, 6), 16) * (1 - w) + Number.parseInt(v2.slice(4, 6), 16) * w);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
