const MEDIA_LABELS: Record<string, string> = {
  image: "Imagem",
  audio: "Áudio",
  video: "Vídeo",
  document: "Documento",
  sticker: "Figurinha"
};

// Nome de arquivo so vira texto na tela quando e nome de verdade, o que na
// pratica so acontece em documento. Audio, imagem e video chegam (ou saem) com
// nome sintetico - derivado do wamid na entrada, do gravador na saida - e esse
// nome aparecendo como legenda ou na lista de tickets e ruido puro.
export const mediaLabel = (kind: string, realFilename?: string): string =>
  realFilename || MEDIA_LABELS[kind] || "Arquivo";

export default mediaLabel;
