import { Op } from "sequelize";
import sequelize from "../../database";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import carregarFluxo, { carregarRegistros, versaoFluxo } from "./carregarFluxo";
import { validarFluxo } from "./validarFluxo";

const publicarFluxo = async (
  queueId: number,
  companyId: number,
  entrada: unknown
) => {
  const fluxo = validarFluxo(entrada);
  const idMap: Record<string, number> = {};
  await sequelize.transaction(async transaction => {
    const { fila, opcoes } = await carregarRegistros(
      queueId,
      companyId,
      transaction
    );
    if (versaoFluxo(fila, opcoes) !== fluxo.version)
      throw new AppError("ERR_FLOW_CONFLICT", 409);
    const existentes = new Map(opcoes.map(no => [no.id, no]));
    if (fluxo.nodes.some(no => no.optionId && !existentes.has(no.optionId))) {
      throw new AppError("ERR_NO_PERMISSION", 403);
    }
    const destinos = [
      ...new Set(
        fluxo.nodes
          .filter(no => no.kind === "transferir")
          .map(no => no.forwardQueueId)
      )
    ];
    const filas = await Queue.count({
      where: { id: { [Op.in]: destinos }, companyId },
      transaction
    });
    if (filas !== destinos.length || destinos.includes(queueId))
      throw new AppError("ERR_FLOW_QUEUE_REQUIRED", 400);
    const mantidos = new Set(fluxo.nodes.map(no => no.optionId));
    const removidos = opcoes
      .filter(no => !mantidos.has(no.id))
      .map(no => no.id);
    if (
      removidos.length &&
      (await Ticket.count({
        where: {
          queueOptionId: { [Op.in]: removidos },
          status: { [Op.in]: ["open", "pending"] }
        },
        transaction
      }))
    ) {
      throw new AppError("ERR_FLOW_IN_USE", 409);
    }
    const inicio = fluxo.nodes.find(no => no.kind === "inicio");
    const pais = new Map(
      fluxo.edges.map(ligacao => [ligacao.target, ligacao.source])
    );
    const ids = new Map<string, number>([[inicio.id, null]]);
    const layout: Record<string, unknown> = {
      inicio: { position: inicio.position }
    };
    const ordem = new Map<string, number>();
    const tecla = new Map<string, number>();
    let pendentes = fluxo.nodes.filter(no => no.kind !== "inicio");
    while (pendentes.length) {
      const nivel = pendentes.filter(no => ids.has(pais.get(no.id)));
      for (let indiceNivel = 0; indiceNivel < nivel.length; indiceNivel += 1) {
        const no = nivel[indiceNivel];
        const pai = pais.get(no.id);
        const numero = (tecla.get(pai) || 0) + (no.isActive ? 1 : 0);
        const indice = ordem.get(pai) || 0;
        const dados = {
          queueId,
          parentId: ids.get(pai),
          title: no.title,
          message: no.message,
          isActive: no.isActive,
          exitChatbot: no.kind === "humano",
          forwardQueueId: no.kind === "transferir" ? no.forwardQueueId : null,
          order: indice,
          option: no.isActive ? String(numero) : null
        };
        const registro = no.optionId
          ? await existentes.get(no.optionId).update(dados, { transaction })
          : await QueueOption.create(dados, { transaction });
        ids.set(no.id, registro.id);
        idMap[no.id] = registro.id;
        layout[registro.id] = { position: no.position, kind: no.kind };
        ordem.set(pai, indice + 1);
        tecla.set(pai, numero);
      }
      pendentes = pendentes.filter(no => !ids.has(no.id));
    }
    if (removidos.length)
      await QueueOption.destroy({
        where: { id: { [Op.in]: removidos } },
        transaction
      });
    await fila.update(
      { greetingMessage: inicio.message, flowLayout: layout },
      { transaction }
    );
  });
  return { ...(await carregarFluxo(queueId, companyId)), idMap };
};
export default publicarFluxo;
