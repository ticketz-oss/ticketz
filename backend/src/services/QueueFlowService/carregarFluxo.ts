import { createHash } from "crypto";
import { Op, Transaction } from "sequelize";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import AppError from "../../errors/AppError";

export const carregarRegistros = async (
  queueId: number,
  companyId: number,
  transaction?: Transaction
) => {
  const fila = await Queue.findOne({
    where: { id: queueId, companyId },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {})
  });
  if (!fila) throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
  const opcoes: QueueOption[] = [];
  let nivel = await QueueOption.findAll({
    where: { queueId, parentId: null },
    transaction
  });
  const vistos = new Set<number>();
  while (nivel.length) {
    nivel.forEach(no => {
      if (vistos.has(no.id)) throw new AppError("ERR_FLOW_INVALID", 400);
      vistos.add(no.id);
      opcoes.push(no);
    });
    nivel = await QueueOption.findAll({
      where: { parentId: { [Op.in]: nivel.map(no => no.id) } },
      transaction
    });
  }
  return { fila, opcoes };
};

export const versaoFluxo = (fila: Queue, opcoes: QueueOption[]) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        fila.updatedAt,
        opcoes
          .map(no => [no.id, no.updatedAt])
          .sort((a, b) => Number(a[0]) - Number(b[0]))
      ])
    )
    .digest("hex");

const carregarFluxo = async (queueId: number, companyId: number) => {
  const { fila, opcoes } = await carregarRegistros(queueId, companyId);
  const layout = (fila.flowLayout || {}) as Record<
    string,
    { position?: { x: number; y: number }; kind?: string }
  >;
  return {
    version: versaoFluxo(fila, opcoes),
    name: fila.name,
    nodes: [
      {
        id: "inicio",
        kind: "inicio",
        title: fila.name,
        message: fila.greetingMessage || "",
        isActive: true,
        position: layout.inicio?.position || { x: 40, y: 120 }
      },
      ...opcoes
        .sort((a, b) => a.order - b.order || a.id - b.id)
        .map((no, indice) => ({
          id: String(no.id),
          optionId: no.id,
          kind: no.exitChatbot
            ? "humano"
            : no.forwardQueueId
              ? "transferir"
              : layout[no.id]?.kind || (no.mediaPath ? "midia" : "menu"),
          title: no.title,
          message: no.message || "",
          isActive: no.isActive,
          forwardQueueId: no.forwardQueueId,
          mediaName: no.mediaName,
          position: layout[no.id]?.position || { x: 360, y: indice * 180 },
          positioned: !!layout[no.id]?.position
        }))
    ],
    edges: opcoes.map(no => ({
      source: no.parentId ? String(no.parentId) : "inicio",
      target: String(no.id)
    }))
  };
};
export default carregarFluxo;
