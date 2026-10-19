import { createPortal } from "react-dom";
import React, { useContext, useMemo, useRef, useState } from "react";
import { Prompt } from "react-router-dom";
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  MarkerType
} from "@xyflow/react";
import { useTheme } from "@material-ui/core/styles";
import {
  Search,
  Undo2,
  Redo2,
  Scan,
  Minus,
  Plus,
  LayoutGrid,
  Play,
  Check,
  Loader2,
  PanelLeft,
  X,
  Trash2
} from "lucide-react";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Botao, BotaoIcone, Janela, useIdentidade } from "../interface";
import { catalogo } from "./catalogo";
import {
  conectarBlocos,
  filhosDe,
  organizarBlocos,
  podeConectar,
  problemasFluxo,
  removerBloco,
  terminais
} from "./modeloFluxo";
import useFluxo from "./useFluxo";
import BlocoFluxo from "./BlocoFluxo";
import InspetorBloco from "./InspetorBloco";
import SimuladorFluxo from "./SimuladorFluxo";
import "@xyflow/react/dist/style.css";
import "./editor.css";

const tipos = { bloco: BlocoFluxo };

export default function EditorFluxo({ queueId, filas }) {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const identidade = useIdentidade();
  const editor = useFluxo(queueId, user.companyId);
  const { fluxo, atualizar } = editor;
  const [selecionado, setSelecionado] = useState("inicio");
  const [busca, setBusca] = useState("");
  const [testando, setTestando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [dimensoes, setDimensoes] = useState({});
  const instancia = useRef(null);
  const no = fluxo?.nodes.find(item => item.id === selecionado);

  const nodes = useMemo(
    () =>
      fluxo?.nodes.map(item => ({
        id: item.id,
        type: "bloco",
        position: item.position,
        measured: dimensoes[item.id],
        selected: item.id === selecionado,
        data: {
          no: item,
          filhos: filhosDe(fluxo, item.id).filter(filho => filho.isActive),
          fila: filas.find(fila => fila.id === item.forwardQueueId)?.name
        },
        ariaLabel: item.title,
        deletable: item.kind !== "inicio"
      })) || [],
    [fluxo, selecionado, filas, dimensoes]
  );
  const edges = useMemo(
    () =>
      fluxo?.edges.map(aresta => ({
        ...aresta,
        id: `${aresta.source}-${aresta.target}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: {
          stroke:
            aresta.target === selecionado
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
          strokeWidth: aresta.target === selecionado ? 2 : 1.3
        }
      })) || [],
    [fluxo, selecionado, theme]
  );

  if (editor.carregando)
    return (
      <div className="fluxo-vazio">
        <Loader2 className="fluxo-carregando" />
        {i18n.t("fluxos.carregando")}
      </div>
    );
  if (editor.erro || !fluxo)
    return (
      <div className="fluxo-vazio">
        <p>{i18n.t("fluxos.erroCarregar")}</p>
        <Botao onClick={editor.carregar}>
          {i18n.t("fluxos.tentarNovamente")}
        </Botao>
      </div>
    );

  const adicionar = (kind, position) => {
    const id = `novo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pai =
      no && !terminais.includes(no.kind)
        ? no
        : fluxo.nodes.find(item => item.kind === "inicio");
    const novo = {
      id,
      kind,
      title: i18n.t(`fluxos.tipos.${kind}`),
      message: "",
      isActive: true,
      forwardQueueId: null,
      position: position || {
        x: pai.position.x + 340,
        y: pai.position.y + filhosDe(fluxo, pai.id).length * 200
      }
    };
    atualizar({
      ...fluxo,
      nodes: [...fluxo.nodes, novo],
      edges: [...fluxo.edges, { source: pai.id, target: id }]
    });
    setSelecionado(id);
    setPaleta(false);
    if (!position)
      instancia.current?.setCenter(
        novo.position.x + 116,
        novo.position.y + 90,
        { zoom: 0.85, duration: 200 }
      );
  };
  const conectar = (source, target) =>
    atualizar(
      source
        ? conectarBlocos(fluxo, source, target)
        : {
            ...fluxo,
            edges: fluxo.edges.filter(aresta => aresta.target !== target)
          }
    );
  const mover = (id, direcao) => {
    const irmaos = filhosDe(fluxo, no.id);
    const indice = irmaos.findIndex(item => item.id === id);
    const outro = irmaos[indice + direcao];
    if (!outro) return;
    const copia = [...fluxo.nodes];
    const de = copia.findIndex(item => item.id === id),
      para = copia.findIndex(item => item.id === outro.id);
    [copia[de], copia[para]] = [copia[para], copia[de]];
    atualizar({ ...fluxo, nodes: copia });
  };
  const pendencias = problemasFluxo(fluxo);
  const destinoAcoes = document.getElementById("acoes-pagina");
  const acoes = (
    <div className="ew-ui acoes-fluxo" style={identidade}>
      <span className={`ew-badge ${editor.alterado ? "" : "ew-badge--brand"}`}>
        {i18n.t(editor.alterado ? "fluxos.rascunho" : "fluxos.emUso")}
      </span>
      <div>
        <Botao onClick={() => setTestando(true)}>
          <Play size={15} />
          {i18n.t("fluxos.testar")}
        </Botao>
        <Botao
          variante="primary"
          disabled={
            editor.publicando || !editor.alterado || !!pendencias.length
          }
          onClick={editor.publicar}
        >
          {editor.publicando ? (
            <Loader2 size={15} className="fluxo-carregando" />
          ) : (
            <Check size={15} />
          )}
          {i18n.t("fluxos.publicar")}
        </Botao>
      </div>
    </div>
  );
  return (
    <section
      className="ew-ui fluxo-editor"
      style={identidade}
      aria-label={i18n.t("fluxos.editor")}
    >
      <Prompt when={editor.alterado} message={i18n.t("fluxos.sairRascunho")} />
      {destinoAcoes ? createPortal(acoes, destinoAcoes) : acoes}
      <fieldset
        disabled={editor.publicando}
        className={`fluxo-builder ${no ? "com-inspetor" : ""} ${paleta ? "paleta-aberta" : ""}`}
      >
        <aside className="fluxo-painel fluxo-paleta">
          <header className="ew-panel-head">
            <h3>{i18n.t("fluxos.blocos")}</h3>
            <BotaoIcone
              titulo={i18n.t("fluxos.fechar")}
              onClick={() => setPaleta(false)}
            >
              <X size={15} />
            </BotaoIcone>
          </header>
          <div className="fluxo-painel-corpo">
            <label className="fluxo-busca">
              <Search size={15} />
              <input
                value={busca}
                onChange={event => setBusca(event.target.value)}
                placeholder={i18n.t("fluxos.buscarBloco")}
                aria-label={i18n.t("fluxos.buscarBloco")}
              />
            </label>
            {["conversa", "atendimento"].map(grupo => (
              <section className="fluxo-grupo" key={grupo}>
                <h4>{i18n.t(`fluxos.${grupo}`)}</h4>
                {catalogo
                  .filter(
                    item =>
                      item.grupo === grupo &&
                      item.kind !== "inicio" &&
                      i18n
                        .t(`fluxos.tipos.${item.kind}`)
                        .toLowerCase()
                        .includes(busca.toLowerCase())
                  )
                  .map(item => (
                    <button
                      type="button"
                      className="fluxo-paleta-item"
                      key={item.kind}
                      draggable
                      onDragStart={event => {
                        event.dataTransfer.setData(
                          "application/reactflow",
                          item.kind
                        );
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => adicionar(item.kind)}
                    >
                      <item.icone size={17} />
                      {i18n.t(`fluxos.tipos.${item.kind}`)}
                    </button>
                  ))}
              </section>
            ))}
            <p className="ew-muted fluxo-dica">{i18n.t("fluxos.dicaPaleta")}</p>
          </div>
        </aside>
        <div className="fluxo-painel fluxo-area">
          <header className="ew-panel-head">
            <BotaoIcone
              titulo={i18n.t("fluxos.blocos")}
              onClick={() => setPaleta(!paleta)}
            >
              <PanelLeft size={16} />
            </BotaoIcone>
            <h3>{fluxo.name}</h3>
            <span className="ew-badge">
              {i18n.t("fluxos.contagem", { count: fluxo.nodes.length })}
            </span>
            <BotaoIcone
              titulo={i18n.t("fluxos.desfazer")}
              disabled={!editor.historico.antes.length}
              onClick={editor.desfazer}
            >
              <Undo2 size={16} />
            </BotaoIcone>
            <BotaoIcone
              titulo={i18n.t("fluxos.refazer")}
              disabled={!editor.historico.depois.length}
              onClick={editor.refazer}
            >
              <Redo2 size={16} />
            </BotaoIcone>
          </header>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={tipos}
            onInit={valor => {
              instancia.current = valor;
              const inicio = fluxo.nodes.find(item => item.kind === "inicio");
              valor.setViewport({
                x: 30 - inicio.position.x,
                y: 100 - inicio.position.y,
                zoom: 1
              });
            }}
            minZoom={0.15}
            maxZoom={1.6}
            colorMode={theme.mode === "dark" ? "dark" : "light"}
            deleteKeyCode={null}
            nodesDraggable={!editor.publicando}
            nodesConnectable={!editor.publicando}
            onNodeClick={(_, item) => setSelecionado(item.id)}
            onPaneClick={() => setSelecionado(null)}
            onConnect={({ source, target }) => conectar(source, target)}
            isValidConnection={({ source, target }) =>
              podeConectar(fluxo, source, target)
            }
            onReconnect={(anterior, ligacao) =>
              atualizar(
                conectarBlocos(
                  {
                    ...fluxo,
                    edges: fluxo.edges.filter(
                      aresta =>
                        !(
                          aresta.source === anterior.source &&
                          aresta.target === anterior.target
                        )
                    )
                  },
                  ligacao.source,
                  ligacao.target
                )
              )
            }
            onNodeDragStart={editor.registrar}
            onNodesChange={mudancas => {
              const medidas = mudancas.filter(
                mudanca => mudanca.type === "dimensions" && mudanca.dimensions
              );
              if (medidas.length)
                setDimensoes(atuais => ({
                  ...atuais,
                  ...Object.fromEntries(
                    medidas.map(mudanca => [mudanca.id, mudanca.dimensions])
                  )
                }));
              const posicoes = mudancas.filter(
                mudanca => mudanca.type === "position" && mudanca.position
              );
              if (!posicoes.length || editor.publicando) return;
              atualizar(
                atual => ({
                  ...atual,
                  nodes: atual.nodes.map(item => {
                    const mudanca = posicoes.find(
                      valor => valor.id === item.id
                    );
                    return mudanca
                      ? { ...item, position: mudanca.position }
                      : item;
                  })
                }),
                posicoes.some(mudanca => mudanca.dragging === undefined)
              );
            }}
            onMove={(_, viewport) => setZoom(Math.round(viewport.zoom * 100))}
            onDragOver={event => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={event => {
              event.preventDefault();
              const kind = event.dataTransfer.getData("application/reactflow");
              if (
                catalogo.some(item => item.kind === kind && kind !== "inicio")
              )
                adicionar(
                  kind,
                  instancia.current.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY
                  })
                );
            }}
            ariaLabelConfig={{
              "minimap.ariaLabel": i18n.t("fluxos.minimapa"),
              "node.a11yDescription.default": i18n.t("fluxos.ajudaTeclado"),
              "controls.ariaLabel": i18n.t("fluxos.canvas")
            }}
          >
            <Background gap={20} size={1} color={theme.palette.divider} />
            <MiniMap pannable zoomable nodeColor={theme.palette.primary.main} />
            <Panel position="bottom-left">
              <div className="fluxo-controles">
                <BotaoIcone
                  titulo={i18n.t("fluxos.reduzirZoom")}
                  onClick={() => instancia.current.zoomOut()}
                >
                  <Minus size={16} />
                </BotaoIcone>
                <span>{zoom}%</span>
                <BotaoIcone
                  titulo={i18n.t("fluxos.aumentarZoom")}
                  onClick={() => instancia.current.zoomIn()}
                >
                  <Plus size={16} />
                </BotaoIcone>
                <BotaoIcone
                  titulo={i18n.t("fluxos.enquadrar")}
                  onClick={() =>
                    instancia.current.fitView({ padding: 0.2, duration: 200 })
                  }
                >
                  <Scan size={16} />
                </BotaoIcone>
                <BotaoIcone
                  titulo={i18n.t("fluxos.organizar")}
                  onClick={() => {
                    atualizar(organizarBlocos(fluxo));
                    requestAnimationFrame(() =>
                      instancia.current.fitView({ padding: 0.2, duration: 200 })
                    );
                  }}
                >
                  <LayoutGrid size={16} />
                </BotaoIcone>
              </div>
            </Panel>
          </ReactFlow>
          <footer className="fluxo-status" aria-live="polite">
            {pendencias.length
              ? i18n.t("fluxos.pendencias", { count: pendencias.length })
              : i18n.t("fluxos.pronto")}
          </footer>
        </div>
        {no && (
          <InspetorBloco
            no={no}
            fluxo={fluxo}
            filas={filas.filter(fila => fila.id !== Number(queueId))}
            atualizar={patch =>
              atualizar({
                ...fluxo,
                nodes: fluxo.nodes.map(item =>
                  item.id === no.id ? { ...item, ...patch } : item
                )
              })
            }
            conectar={conectar}
            adicionar={adicionar}
            mover={mover}
            remover={() => setConfirmar(true)}
            fechar={() => setSelecionado(null)}
            arquivo={editor.arquivos[no.id]}
            anexar={arquivo => editor.anexar(no.id, arquivo)}
            removerMidia={() => editor.anexar(no.id, null)}
          />
        )}
      </fieldset>
      <Janela
        aberta={testando}
        aoMudar={setTestando}
        titulo={i18n.t("fluxos.testar")}
        descricao={i18n.t("fluxos.simulacaoDescricao")}
      >
        <SimuladorFluxo fluxo={fluxo} filas={filas} />
      </Janela>
      <Janela
        aberta={confirmar}
        aoMudar={setConfirmar}
        titulo={i18n.t("fluxos.excluirBloco")}
        descricao={i18n.t("fluxos.excluirDescricao")}
      >
        <div className="ew-dialog-body">
          <Botao
            variante="danger"
            onClick={() => {
              atualizar(removerBloco(fluxo, selecionado));
              setSelecionado(null);
              setConfirmar(false);
            }}
          >
            <Trash2 size={16} />
            {i18n.t("fluxos.excluir")}
          </Botao>
        </div>
      </Janela>
    </section>
  );
}
