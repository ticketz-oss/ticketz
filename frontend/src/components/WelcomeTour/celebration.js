// The first-login build up: the app starts empty (only its background), and
// Luiza assembles it piece by piece while the drum roll plays. Every piece
// reports back, so she can react to what just appeared; the climax (success
// sound and confetti thrown by her) lands when the last piece is in place.

// Length of public/sounds/drumroll.mp3, so the build ends with the roll.
export const DURACAO_MONTAGEM = 5400;
// How long a piece stays as a sketch before it becomes real.
const ESBOCO = 320;

const somUrl = nome => `${process.env.PUBLIC_URL || ""}/sounds/${nome}.mp3`;

// Browsers block audio until the page has had a click. `tocar` reports a
// block through its promise, so the welcome can ask for that click instead
// of playing the build up in silence.
export const prepararSom = (nome, volume = 0.6) => {
  let audio = null;
  try {
    audio = new Audio(somUrl(nome));
    audio.volume = volume;
  } catch (_) {
    audio = null;
  }
  return {
    tocar: () => {
      try {
        return Promise.resolve(audio?.play()).then(() => {
          if (!audio) throw new Error("NO_AUDIO");
        });
      } catch (erro) {
        return Promise.reject(erro);
      }
    },
    parar: () => {
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
    }
  };
};

export const tocarSom = (nome, volume) => {
  const som = prepararSom(nome, volume);
  som.tocar().catch(() => {});
  return som.parar;
};

const PECAS =
  ".agent-preview-launcher, .nav-abrir-atendimento, " +
  "nav .MuiListSubheader-root, nav [data-tour], .nav-ferramentas, .nav-perfil";
const BASES = ".MuiDrawer-paper, main";

// Hides the whole app, keeping only its background, until the build starts.
export const esvaziarApp = raiz => raiz?.setAttribute("data-ew-vazio", "");

const marcar = (elementos, estado) =>
  elementos.forEach(elemento =>
    elemento.setAttribute("data-ew-montagem", estado)
  );

// Builds the app from nothing across `duracao`: the sidebar panel slides in
// empty, each piece pops in as a sketch and becomes real, and the page
// content comes into focus last. `aoPeca` is told about every piece that
// appears. Returns a function that finishes everything at once (also used
// when the dialog is closed early) and removes the markers.
export const montarNavegacao = (raiz, duracao, aoPeca = () => {}) => {
  const pecas = [...raiz.querySelectorAll(PECAS)];
  const bases = [...raiz.querySelectorAll(BASES)];
  const painel = bases.filter(base => base.tagName !== "MAIN");
  const conteudo = bases.filter(base => base.tagName === "MAIN");
  marcar([...bases, ...pecas], "oculto");
  raiz.removeAttribute("data-ew-vazio");

  // Leave the last fifth of the roll for tension before the climax.
  const janela = duracao * 0.8;
  const inicio = Math.min(260, janela * 0.1);
  const passo =
    pecas.length > 1 ? (janela - inicio - ESBOCO) / (pecas.length - 1) : 0;
  const timers = [setTimeout(() => marcar(painel, "pronto"), 0)];
  pecas.forEach((peca, indice) => {
    const quando = inicio + Math.max(indice * passo, 0);
    timers.push(
      setTimeout(() => {
        marcar([peca], "esboco");
        aoPeca({
          indice,
          total: pecas.length,
          grupo: peca.classList.contains("MuiListSubheader-root")
        });
      }, quando),
      setTimeout(() => marcar([peca], "pronto"), quando + ESBOCO)
    );
  });
  timers.push(
    setTimeout(() => marcar(conteudo, "esboco"), janela * 0.45),
    setTimeout(() => marcar(conteudo, "pronto"), janela)
  );

  let encerrado = false;
  return () => {
    if (encerrado) return;
    encerrado = true;
    timers.forEach(clearTimeout);
    raiz.removeAttribute("data-ew-vazio");
    const todos = [...bases, ...pecas];
    marcar(todos, "pronto");
    // Drop the markers once the last transition has finished.
    setTimeout(
      () =>
        todos.forEach(elemento => elemento.removeAttribute("data-ew-montagem")),
      700
    );
  };
};

// Confetti thrown from Luiza's hands at the top of each throw: each hand
// throws up and slightly outwards.
export const jogarConfetes = (confetti, maos, cores) => {
  if (!confetti || !maos?.length) return;
  const centro = maos.reduce((soma, mao) => soma + mao.x, 0) / maos.length;
  maos.forEach(mao => {
    confetti({
      colors: cores,
      disableForReducedMotion: true,
      particleCount: 45,
      angle: mao.x < centro ? 115 : 65,
      spread: 48,
      startVelocity: 44,
      gravity: 0.95,
      ticks: 240,
      scalar: 0.95,
      zIndex: 1500,
      origin: { x: mao.x, y: mao.y }
    });
  });
};
