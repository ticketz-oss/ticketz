import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import ReactCanvasConfetti from "react-canvas-confetti";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@material-ui/core/styles";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { Janela, useIdentidade } from "../interface";
import Mascote from "../Mascote";
import { montarPassos } from "./steps";
import {
  GuiaTour,
  atualizarGuia,
  gesticularGuia,
  posicionarGuia
} from "./guide";
import { Balao, Grito, Onomatopeias } from "./manga";
import {
  DURACAO_MONTAGEM,
  esvaziarApp,
  jogarConfetes,
  montarNavegacao,
  prepararSom,
  tocarSom
} from "./celebration";
import "./welcomeTour.css";

// Company setting created as "pending" for every new company. It becomes
// "celebrated" as soon as the build up starts (a reload skips straight to the
// congratulations) and "done" once the admin answers, so it is never repeated.
export const TOUR_SETTING = "welcomeTour";

// Time for the drawer to finish expanding before the tour measures it.
const ESPERA_NAVEGACAO = 350;
// How long Luiza keeps a goodbye reaction before leaving the screen.
const DESPEDIDA = 900;
// The balloon tail of the tour, the same wedge drawn by manga.js.
const RABICHO_TOUR =
  '<svg class="ew-tour-rabicho" viewBox="0 0 110 70" aria-hidden="true" ' +
  'focusable="false"><path d="M70 1 Q 54 38 4 66 Q 66 48 104 1"/></svg>';
// Drum beats drawn as sound effects while the app is built.
const BATIDA = 430;
// How long the shout stays before Luiza talks again.
const GRITO = 2200;

const salvarEstado = value =>
  api.put(`/settings/${TOUR_SETTING}`, { value }).catch(() => {});

const raizApp = () => document.querySelector(".estrutura-app");

// The welcome state travels with the authenticated user, so the app can start
// empty before its first paint; older sessions fall back to asking for it.
const estadoDoUsuario = user =>
  user?.company?.settings?.find?.(setting => setting.key === TOUR_SETTING)
    ?.value;

// Gets the next area ready before driver.js measures it: the sidebar scrolls
// the item into its visible part (driver.js only checks the window, not the
// sidebar's own scroll), and the screen being explained opens behind it.
const prepararPasso = (passo, navegar) => {
  passo?.element?.scrollIntoView?.({ block: "center", behavior: "auto" });
  if (passo?.rota && window.location.pathname !== passo.rota)
    navegar(passo.rota);
};
// Time for the opened screen to settle before the balloon is placed.
const ESPERA_PASSO = 90;

export const iniciarTour = (identidade, navegar = () => {}) => {
  const steps = montarPassos(document, key => i18n.t(key));
  if (!steps.length) return null;
  let avancando = null;
  const irPara = indice => {
    clearTimeout(avancando);
    prepararPasso(steps[indice], navegar);
    avancando = setTimeout(() => tour.moveTo(indice), ESPERA_PASSO);
  };
  let reacaoPasso;
  let saindo = false;
  const reposicionar = () => {
    const balao = document.querySelector(".driver-popover.ew-tour");
    if (balao) posicionarGuia(balao);
  };
  const sair = (reacao, gesto) => {
    if (saindo) return null;
    saindo = true;
    clearTimeout(reacaoPasso);
    window.removeEventListener("resize", reposicionar);
    atualizarGuia({ reacao });
    if (gesto) gesticularGuia(gesto);
    return new Promise(resolve =>
      setTimeout(() => {
        atualizarGuia({ visivel: false });
        resolve();
      }, DESPEDIDA)
    );
  };

  const tour = driver({
    steps,
    showProgress: true,
    smoothScroll: !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    stagePadding: 6,
    stageRadius: 10,
    overlayOpacity: 0.55,
    popoverClass: "ew-tour",
    // Keep driver.js placeholders intact through i18next interpolation.
    progressText: i18n.t("welcomeTour.progress", {
      current: "{{current}}",
      total: "{{total}}"
    }),
    onNextClick: () => {
      if (tour.isLastStep()) {
        tour.destroy();
        return;
      }
      irPara(tour.getActiveIndex() + 1);
    },
    onPrevClick: () => irPara(tour.getActiveIndex() - 1),
    nextBtnText: i18n.t("welcomeTour.next"),
    prevBtnText: i18n.t("welcomeTour.previous"),
    doneBtnText: i18n.t("welcomeTour.done"),
    onPopoverRender: (popover, { state }) => {
      Object.entries(identidade).forEach(([nome, valor]) =>
        popover.wrapper.style.setProperty(nome, valor)
      );
      if (!popover.wrapper.querySelector(".ew-tour-rabicho"))
        popover.wrapper.insertAdjacentHTML("beforeend", RABICHO_TOUR);
      const indice = state.activeIndex;
      const reacao = steps[indice]?.reacao || "happy";
      // She hops over to the new balloon listening, then reacts to the area
      // she is presenting. Hello and goodbye come with a wave.
      atualizarGuia({ visivel: true, reacao: "listening" });
      if (indice === 0) gesticularGuia("wave");
      if (indice === steps.length - 1) gesticularGuia("cheer");
      // driver.js places the balloon after this callback; measure it on the
      // next frame, with a timer in case frames are paused.
      requestAnimationFrame(() => posicionarGuia(popover.wrapper));
      setTimeout(() => posicionarGuia(popover.wrapper), 80);
      clearTimeout(reacaoPasso);
      reacaoPasso = setTimeout(() => atualizarGuia({ reacao }), 420);
      popover.nextButton.addEventListener("mouseenter", () =>
        atualizarGuia({ reacao: "excited" })
      );
      popover.closeButton.addEventListener("mouseenter", () =>
        atualizarGuia({ reacao: "sad" })
      );
    },
    // Finishing is celebrated; leaving early gets a sad goodbye first.
    onDestroyStarted: () => {
      if (!tour.hasNextStep()) {
        tour.destroy();
        sair("celebrate", "cheer");
        return;
      }
      const despedida = sair("sad");
      if (despedida) despedida.then(() => tour.destroy());
    }
  });
  window.addEventListener("resize", reposicionar);
  tour.drive();
  return tour;
};

export const useTourNavegacao = abrirNavegacao => {
  const identidade = useIdentidade();
  const history = useHistory();
  const espera = useRef();
  useEffect(() => () => clearTimeout(espera.current), []);
  return () => {
    abrirNavegacao();
    clearTimeout(espera.current);
    espera.current = setTimeout(
      () => iniciarTour(identidade, rota => history.push(rota)),
      ESPERA_NAVEGACAO
    );
  };
};

// The customer's answers, drawn as reply balloons.
const Resposta = ({ principal, atraso = 0, children, ...props }) => (
  <motion.button
    type="button"
    className={`ew-manga-resposta ${principal ? "is-principal" : ""}`}
    initial={{ opacity: 0, y: 12, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      delay: atraso,
      type: "spring",
      stiffness: 500,
      damping: 24
    }}
    {...props}
  >
    {children}
  </motion.button>
);

const TEXTOS = {
  convite: "welcomeTour.invite",
  montando: "welcomeTour.build",
  pronto: "welcomeTour.modal"
};

const WelcomeTour = ({
  user,
  abrirNavegacao,
  duracaoMontagem = DURACAO_MONTAGEM
}) => {
  const theme = useTheme();
  const reduzir = useReducedMotion();
  const [fase, definirFase] = useState(null);
  const [reacao, definirReacao] = useState("idle");
  const [pulso, definirPulso] = useState(0);
  const [gesto, definirGesto] = useState(null);
  const [fala, definirFala] = useState("");
  const [gritando, definirGritando] = useState(false);
  const [batidas, definirBatidas] = useState([]);
  const comemorar = useRef(false);
  const confetti = useRef(null);
  const encerrarMontagem = useRef(() => {});
  const pararSom = useRef(() => {});
  const timers = useRef([]);
  const fazerTour = useTourNavegacao(abrirNavegacao);
  const admin = user?.profile === "admin";
  const company = user?.company?.name || "";
  const m = (chave, opcoes) => i18n.t(`welcomeTour.manga.${chave}`, opcoes);

  const depois = (ms, acao) => timers.current.push(setTimeout(acao, ms));
  const reagir = proxima => {
    definirReacao(proxima);
    definirPulso(atual => atual + 1);
  };
  const gesticular = (nome, vezes) =>
    definirGesto({ nome, vezes, id: Date.now() + Math.random() });

  const comecar = som => {
    pararSom.current = som.parar;
    salvarEstado("celebrated");
    definirFase("montando");
  };

  const tentarComecar = ativo => {
    // A blocked autoplay keeps the app empty and turns into an invitation;
    // its click unlocks the sound and starts the build.
    const som = prepararSom("drumroll", 0.55);
    som
      .tocar()
      .then(() => ativo() && comecar(som))
      .catch(() => {
        if (!ativo()) return;
        reagir("sleeping");
        definirFala(m("convite"));
        definirFase("convite");
      });
  };

  // Empty the app before the first paint when the build up is coming.
  useLayoutEffect(() => {
    if (admin && !reduzir && estadoDoUsuario(user) === "pending")
      esvaziarApp(raizApp());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!admin || !user?.id) return undefined;
    let ativo = true;
    const iniciar = estado => {
      if (!ativo) return;
      if (estado === "celebrated") {
        definirFala(m("deVolta"));
        definirFase("pronto");
        reagir("happy");
        gesticular("wave");
      } else if (estado === "pending" && reduzir) {
        salvarEstado("celebrated");
        comemorar.current = true;
        definirFase("pronto");
      } else if (estado === "pending") {
        esvaziarApp(raizApp());
        tentarComecar(() => ativo);
      }
    };
    const conhecido = estadoDoUsuario(user);
    if (conhecido !== undefined) iniciar(conhecido);
    else
      api
        .get(`/settings/${TOUR_SETTING}`)
        .then(({ data }) => iniciar(data))
        .catch(() => {});
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, user?.id, reduzir]);

  // Asleep in the invitation: a "Zzz" every breath.
  useEffect(() => {
    if (fase !== "convite") return undefined;
    let id = 0;
    const respirar = setInterval(() => {
      id += 1;
      const batida = { id, texto: "Zzz" };
      definirBatidas([batida]);
    }, 1600);
    return () => {
      clearInterval(respirar);
      definirBatidas([]);
    };
  }, [fase]);

  // The build up. Luiza reacts to every piece that appears: a new group of
  // the menu surprises her, the first pieces get a curious look, the middle
  // ones a happy hand, and near the end she gets anxious until she holds her
  // breath for the climax.
  useEffect(() => {
    if (fase !== "montando") return undefined;
    comemorar.current = true;
    abrirNavegacao();
    const falas = i18n.t("welcomeTour.manga.falas", { returnObjects: true });
    definirFala(falas[0]);
    reagir("excited");
    gesticular("cheer");
    let ansiosa = false;
    encerrarMontagem.current = montarNavegacao(
      raizApp() || document.body,
      duracaoMontagem,
      ({ indice, total, grupo }) => {
        const progresso = (indice + 1) / total;
        if (progresso > 0.75) {
          definirFala(falas[3]);
          if (!ansiosa) {
            ansiosa = true;
            gesticular("fidget", 4);
          }
          reagir(indice % 2 ? "excited" : "surprised");
        } else if (grupo) {
          reagir("surprised");
        } else if (progresso > 0.45) {
          definirFala(falas[2]);
          if (indice % 2 === 0) reagir(indice % 4 ? "working" : "happy");
        } else if (progresso > 0.12) {
          definirFala(falas[1]);
          if (indice % 2 === 0) reagir("curious");
        }
      }
    );

    const sfx = i18n.t("welcomeTour.manga.sfx", { returnObjects: true });
    let id = 0;
    const tambor = setInterval(() => {
      id += 1;
      const batida = {
        id,
        texto: sfx[id % sfx.length],
        forte: id * BATIDA > duracaoMontagem * 0.6
      };
      definirBatidas(atuais => [...atuais.slice(-1), batida]);
      setTimeout(
        () =>
          definirBatidas(atuais =>
            atuais.filter(item => item.id !== batida.id)
          ),
        BATIDA + 220
      );
    }, BATIDA);

    // The last beat: silence, a held breath.
    depois(duracaoMontagem * 0.82, () => {
      clearInterval(tambor);
      definirBatidas([{ id: 9999, texto: "!!", forte: true }]);
      definirFala(falas[4]);
      reagir("surprised");
    });
    depois(duracaoMontagem, () => definirFase("pronto"));
    return () => {
      clearInterval(tambor);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, duracaoMontagem]);

  // The climax: success sound, the shout, and Luiza throws the confetti.
  useEffect(() => {
    if (fase !== "pronto" || !comemorar.current) return undefined;
    comemorar.current = false;
    encerrarMontagem.current();
    pararSom.current();
    pararSom.current = tocarSom("success", 0.7);
    definirBatidas([]);
    definirGritando(true);
    reagir("celebrate");
    gesticular("throw", 3);
    const calma = setTimeout(() => {
      definirGritando(false);
      definirFala(m("pronto", { company }));
      reagir("happy");
    }, GRITO);
    return () => clearTimeout(calma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  useEffect(
    () => () => {
      encerrarMontagem.current();
      pararSom.current();
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const concluir = () => {
    encerrarMontagem.current();
    raizApp()?.removeAttribute("data-ew-vazio");
    if (fase !== "pronto") pararSom.current();
    definirFase(null);
    salvarEstado("done");
  };

  const montarAoClicar = () => {
    reagir("waking");
    const som = prepararSom("drumroll", 0.55);
    som.tocar().catch(() => {});
    comecar(som);
  };

  const cores = [
    theme.palette.primary.main,
    "#ffffff",
    "#22c55e",
    "#facc15",
    "#38bdf8"
  ];
  const textos = TEXTOS[fase] || TEXTOS.pronto;
  const respondendo = fase === "pronto" && !gritando;

  return (
    <>
      <Janela
        aberta={!!fase}
        aoMudar={aberto => !aberto && concluir()}
        classe="ew-dialog--manga"
        classeOverlay={fase === "pronto" ? "" : "ew-overlay--montagem"}
        tituloOculto
        // Focus the panel itself, not the close button (its tooltip would
        // sit on top of the scene); Tab still moves through the answers.
        focoInicial={event => {
          event.preventDefault();
          event.currentTarget?.focus?.();
        }}
        titulo={i18n.t(`${textos}.title`)}
        descricao={i18n.t(`${textos}.description`, { company })}
      >
        <div className="ew-manga" data-fase={fase || ""}>
          <div
            className={`ew-manga-painel ${gritando ? "is-climax" : ""}`}
            aria-live="polite"
          >
            <span className="ew-manga-linhas" aria-hidden="true" />
            <Onomatopeias batidas={batidas} />
            <div className="ew-manga-luiza">
              <Mascote
                reacao={reacao}
                pulso={pulso}
                gesto={gesto}
                tamanho={190}
                aoPico={maos => jogarConfetes(confetti.current, maos, cores)}
              />
            </div>
            <div className="ew-manga-fala">
              {gritando ? (
                <Grito texto={m("grito")} />
              ) : (
                fala && <Balao texto={fala} />
              )}
            </div>
            {fase === "montando" && (
              <div
                className="ew-manga-progresso"
                role="progressbar"
                aria-label={i18n.t("welcomeTour.build.title")}
                style={{ "--ew-montagem": `${duracaoMontagem}ms` }}
              >
                <span />
              </div>
            )}
          </div>
          {(fase === "convite" || respondendo) && (
            <div className="ew-manga-respostas">
              {fase === "convite" ? (
                <Resposta
                  principal
                  onClick={montarAoClicar}
                  onMouseEnter={() => reagir("waking")}
                  onFocus={() => reagir("waking")}
                >
                  {m("convidar")}
                </Resposta>
              ) : (
                <>
                  <Resposta
                    atraso={0.15}
                    onClick={concluir}
                    onMouseEnter={() => reagir("sad")}
                    onMouseLeave={() => reagir("happy")}
                    onFocus={() => reagir("sad")}
                  >
                    {m("nao")}
                  </Resposta>
                  <Resposta
                    principal
                    atraso={0.3}
                    onClick={() => {
                      concluir();
                      fazerTour();
                    }}
                    onMouseEnter={() => reagir("excited")}
                    onMouseLeave={() => reagir("happy")}
                    onFocus={() => reagir("excited")}
                  >
                    {m("sim")}
                  </Resposta>
                </>
              )}
            </div>
          )}
          {respondendo && (
            <motion.p
              className="ew-manga-dica"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
            >
              {m("dica")}
            </motion.p>
          )}
        </div>
      </Janela>
      {fase && (
        <ReactCanvasConfetti
          className="ew-welcome-confetti"
          onInit={({ confetti: instancia }) => {
            confetti.current = instancia;
          }}
        />
      )}
      <GuiaTour />
    </>
  );
};

export default WelcomeTour;
