export const fonteInterface =
  '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

export const coresInterface = modo =>
  modo === "dark"
    ? {
        fundo: "#0D1117",
        superficie: "#151A21",
        suave: "#1C222B",
        texto: "#F2F4F7",
        secundario: "#939CA9",
        borda: "#262E39"
      }
    : {
        fundo: "#F7F7F8",
        superficie: "#FFFFFF",
        suave: "#F3F4F6",
        texto: "#1D1D1F",
        secundario: "#71717A",
        borda: "#E4E4E7"
      };

export const tipografiaInterface = {
  fontFamily: fonteInterface,
  fontSize: 13,
  h4: { fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" },
  h5: { fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" },
  h6: { fontSize: 17, fontWeight: 600 },
  button: { textTransform: "none", fontWeight: 600, fontSize: 13 }
};
