// Ids do YouTube tem 11 caracteres do alfabeto base64url.
const BARE_ID = /^[A-Za-z0-9_-]{11}$/;

// Cobre watch?v=, youtu.be/, /embed/, /shorts/ e /live/, com ou sem parametros
// extras depois (&t=30, ?si=..., &list=...).
const FROM_URL =
  /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/;

/**
 * Normaliza o campo de video para o id puro do YouTube.
 *
 * O admin cola a URL inteira da barra de enderecos — o comportamento natural —
 * e antes disso o valor ia cru para o banco e era interpolado em
 * img.youtube.com/vi/<video> e youtube.com/watch?v=<video>, produzindo capa
 * quebrada e pagina de erro. Aceita tanto o id quanto qualquer forma de link.
 *
 * Retorna null quando nao ha id reconhecivel (ex.: link de Vimeo), e nesse caso
 * o conteudo precisa usar o campo "link".
 */
const parseYoutubeId = (value?: string | null): string | null => {
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
