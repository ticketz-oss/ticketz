const cores = [
  "#46515f",
  "#70536f",
  "#516b55",
  "#7e5e48",
  "#416971",
  "#646c85"
];

export function corAvatar(identificador) {
  const codigo = Array.from(String(identificador || "")).reduce(
    (total, letra) => (total * 31 + letra.charCodeAt(0)) >>> 0,
    0
  );
  return cores[codigo % cores.length];
}
