import { Op } from "sequelize";
import ProspeccaoLead from "../../models/ProspeccaoLead";
import Contact from "../../models/Contact";
import { Lead } from "./ProspeccaoApi";

// O lead pode vir com o telefone formatado do Google Maps ou com o WhatsApp do
// Instagram, que já traz DDI. Normalizamos para dígitos porque é essa string
// que serve de chave de deduplicação entre buscas.
export const normalizaTelefone = (
  ...candidatos: (string | null | undefined)[]
): string => {
  const utilizavel = candidatos
    .map(candidato => String(candidato ?? "").replace(/\D/g, ""))
    .find(digitos => digitos.length >= 8);
  if (!utilizavel) return "";
  // 12-13 dígitos começando em 55 já é brasileiro com DDI; 10-11 é DDD mais
  // número local, faltando o DDI. Qualquer outro tamanho é estrangeiro (a
  // busca aceita outros países) e vai como veio, sem inventar prefixo.
  if (utilizavel.startsWith("55") && utilizavel.length >= 12) return utilizavel;
  if (utilizavel.length === 10 || utilizavel.length === 11) {
    return `55${utilizavel}`;
  }
  return utilizavel;
};

// O mesmo celular brasileiro circula com e sem o nono dígito, e o Google Maps
// não é consistente nisso. Sem considerar as duas formas, a mesma empresa
// voltaria como lead novo numa busca seguinte. Mesma tolerância que o
// CreateContactService já aplica na agenda.
export const variacoesDoTelefone = (telefone: string): string[] => {
  if (!telefone) return [];
  if (
    telefone.startsWith("55") &&
    telefone.length === 13 &&
    telefone[4] === "9"
  ) {
    return [telefone, `${telefone.slice(0, 4)}${telefone.slice(5)}`];
  }
  if (telefone.startsWith("55") && telefone.length === 12) {
    return [telefone, `${telefone.slice(0, 4)}9${telefone.slice(4)}`];
  }
  return [telefone];
};

interface Request {
  companyId: number;
  jobId: string;
  leads: Lead[];
  executionId?: number;
  origin?: "MANUAL" | "AUTO";
}

interface Resultado {
  novos: number;
  atualizados: number;
  ignorados: number;
  newLeadIds: number[];
}

// Roda a cada poll da busca: os leads chegam primeiro como "pendente" e vão
// ganhando rascunho aos poucos, então a ingestão precisa ser idempotente e
// atualizar o que já entrou.
const SyncProspeccaoLeadsService = async ({
  companyId,
  jobId,
  leads,
  executionId,
  origin = "MANUAL"
}: Request): Promise<Resultado> => {
  const resultado: Resultado = {
    novos: 0,
    atualizados: 0,
    ignorados: 0,
    newLeadIds: []
  };
  if (!leads.length) return resultado;

  const externalIds = leads.map(lead => lead.id);
  const existentes = await ProspeccaoLead.findAll({
    where: { companyId, externalId: { [Op.in]: externalIds } }
  });
  const porExternalId = new Map(existentes.map(l => [l.externalId, l]));

  // Telefones que a base já conhece de buscas anteriores. Um lead repetido não
  // volta para a tela: já foi trabalhado uma vez.
  const telefones = leads
    .map(lead => normalizaTelefone(lead.telefone, lead.instagram_whatsapp))
    .filter(Boolean)
    .flatMap(variacoesDoTelefone);
  const jaConhecidos = telefones.length
    ? await ProspeccaoLead.findAll({
        attributes: ["telefone", "externalId"],
        where: { companyId, telefone: { [Op.in]: telefones } }
      })
    : [];
  // Indexado por todas as formas do número, para que 8 e 9 dígitos apontem
  // para o mesmo lead já conhecido.
  const telefonePorExternalId = new Map<string, number>();
  jaConhecidos.forEach(l => {
    variacoesDoTelefone(l.telefone).forEach(variacao => {
      telefonePorExternalId.set(variacao, l.externalId);
    });
  });
  const contatosConhecidos = telefones.length
    ? await Contact.findAll({
        attributes: ["number"],
        where: { companyId, number: { [Op.in]: telefones } }
      })
    : [];
  const telefonesDeContatos = new Set<string>();
  contatosConhecidos.forEach(contato => {
    variacoesDoTelefone(normalizaTelefone(contato.number)).forEach(variacao =>
      telefonesDeContatos.add(variacao)
    );
  });

  // Laço sequencial de propósito: cada lead novo alimenta o mapa de telefones
  // que o próximo consulta, então uma mesma busca não entra duplicada.
  for (let i = 0; i < leads.length; i += 1) {
    const lead = leads[i];
    const telefone = normalizaTelefone(lead.telefone, lead.instagram_whatsapp);
    const campos = {
      jobId,
      nome: lead.nome,
      telefone: telefone || null,
      telefoneExibicao: lead.telefone,
      categoria: lead.categoria,
      endereco: lead.endereco,
      instagramHandle: lead.instagram_handle,
      instagramBio: lead.instagram_bio,
      instagramSeguidores: lead.instagram_seguidores,
      idiomaSugerido: lead.idioma_sugerido,
      status: lead.status,
      erro: lead.erro
    };

    const existente = porExternalId.get(lead.id);
    if (existente) {
      // Rascunho editado na tela e já salvo não pode ser sobrescrito pelo
      // texto original a cada poll.
      const rascunho =
        existente.abertoEm || !lead.rascunho
          ? existente.rascunho
          : lead.rascunho;
      await existente.update({ ...campos, rascunho });
      resultado.atualizados += 1;
      continue;
    }

    const donoDoTelefone = telefone
      ? telefonePorExternalId.get(telefone)
      : undefined;
    if (donoDoTelefone !== undefined && donoDoTelefone !== lead.id) {
      resultado.ignorados += 1;
      continue;
    }
    if (
      variacoesDoTelefone(telefone).some(item => telefonesDeContatos.has(item))
    ) {
      resultado.ignorados += 1;
      continue;
    }

    const criado = await ProspeccaoLead.create({
      ...campos,
      companyId,
      externalId: lead.id,
      executionId,
      origin,
      deliveryStatus: origin === "AUTO" ? "QUEUED" : null,
      rascunho: lead.rascunho
    } as Partial<ProspeccaoLead> as ProspeccaoLead);
    variacoesDoTelefone(telefone).forEach(variacao => {
      telefonePorExternalId.set(variacao, lead.id);
    });
    resultado.novos += 1;
    resultado.newLeadIds.push(criado.id);
  }

  return resultado;
};

export default SyncProspeccaoLeadsService;
