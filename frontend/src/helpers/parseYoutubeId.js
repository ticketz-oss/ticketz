// Espelho de backend/src/helpers/parseYoutubeId.ts — nao ha pacote compartilhado
// entre os dois lados, entao a regra vive duplicada e precisa mudar junto.

// Ids do YouTube tem 11 caracteres do alfabeto base64url.
const BARE_ID = /^[A-Za-z0-9_-]{11}$/;

// Cobre watch?v=, youtu.be/, /embed/, /shorts/ e /live/, com ou sem parametros
// extras depois (&t=30, ?si=..., &list=...).
const FROM_URL =
  /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/;

/**
 * Normaliza o campo de video para o id puro do YouTube. O backend ja grava
 * normalizado, mas a leitura tambem passa por aqui por causa dos registros
 * antigos e da previa no formulario.
 *
 * Retorna null quando nao ha id reconhecivel (ex.: link de Vimeo).
 */
const parseYoutubeId = value => {
  const input = (value || "").trim();

  if (!input) {
    return null;
  }

  if (BARE_ID.test(input)) {
    return input;
  }

  const match = input.match(FROM_URL);

  return match ? match[1] : null;
};

export default parseYoutubeId;
