import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import ProspeccaoLead from "../../models/ProspeccaoLead";
import Ticket from "../../models/Ticket";
import { CheckNumberAndCreateContact } from "../WbotServices/CheckNumber";
import CreateTicketService from "../TicketServices/CreateTicketService";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  leadId: number;
  companyId: number;
  userId: number;
  rascunho?: string;
  whatsappId?: number;
}

interface Response {
  ticketId: number;
  ticketUuid: string;
  contactId: number;
  rascunho: string;
}

// O endereço e o Instagram viram informação adicional do contato: é o que o
// atendente precisa ver na conversa e não cabe no nome nem no número.
const informacoesAdicionais = (lead: ProspeccaoLead) => {
  const campos: { name: string; value: string }[] = [];
  if (lead.endereco) campos.push({ name: "Localização", value: lead.endereco });
  if (lead.instagramHandle) {
    campos.push({
      name: "Instagram",
      value: `https://instagram.com/${lead.instagramHandle}`
    });
  }
  if (lead.categoria) campos.push({ name: "Categoria", value: lead.categoria });
  return campos;
};

// O contato já existente não é sobrescrito, mas o que a prospecção descobriu e
// ainda falta lá é informação nova e útil.
const aplicaInformacoesAdicionais = async (
  contact: Contact,
  lead: ProspeccaoLead
): Promise<void> => {
  const atuais = await ContactCustomField.findAll({
    where: { contactId: contact.id }
  });
  const nomes = new Set(atuais.map(campo => campo.name));
  const faltando = informacoesAdicionais(lead).filter(
    campo => !nomes.has(campo.name)
  );
  if (!faltando.length) return;
  await ContactCustomField.bulkCreate(
    faltando.map(campo => ({ ...campo, contactId: contact.id })) as never
  );
};

const AbrirConversaDoLeadService = async ({
  leadId,
  companyId,
  userId,
  rascunho,
  whatsappId
}: Request): Promise<Response> => {
  const lead = await ProspeccaoLead.findOne({
    where: { id: leadId, companyId }
  });
  if (!lead) throw new AppError("ERR_PROSPECCAO_LEAD_NAO_ENCONTRADO", 404);
  if (!lead.telefone) {
    throw new AppError("ERR_PROSPECCAO_LEAD_SEM_TELEFONE", 400);
  }

  const textoFinal = String(rascunho ?? lead.rascunho ?? "").trim();

  // Criar o contato direto pelo CreateContactService deixava o número sem
  // conferência no WhatsApp e sem mapeamento de LID: o ticket abria, mas o
  // envio morria em ERR_WAPP_CONTACT_NOT_FOUND. Este é o mesmo caminho que a
  // tela de Contatos usa, e por ser find-or-create ele também conserta contatos
  // criados antes desta correção. De quebra, o número gravado passa a ser o que
  // o WhatsApp confirma, resolvendo divergência de nono dígito.
  const whatsapp = whatsappId
    ? await Whatsapp.findOne({ where: { id: whatsappId, companyId } })
    : null;
  if (whatsappId && !whatsapp) throw new AppError("ERR_WAPP_NOT_FOUND", 404);
  const contact = whatsapp
    ? await CheckNumberAndCreateContact(
        lead.telefone,
        lead.nome || lead.telefone,
        companyId,
        whatsapp
      )
    : await CheckNumberAndCreateContact(
        lead.telefone,
        lead.nome || lead.telefone,
        companyId
      );
  if (!contact) {
    throw new AppError("ERR_PROSPECCAO_SEM_CONEXAO", 503);
  }

  await aplicaInformacoesAdicionais(contact, lead);

  let ticket: Ticket;
  try {
    ticket = await CreateTicketService({
      contactId: contact.id,
      userId,
      companyId,
      whatsappId
    });
  } catch (erro) {
    // CreateTicketService recusa quando o contato já tem conversa aberta com
    // outra pessoa. Levar para a conversa existente é melhor do que falhar.
    const aberto = await Ticket.findOne({
      where: {
        contactId: contact.id,
        companyId,
        status: { [Op.in]: ["open", "pending"] }
      },
      order: [["updatedAt", "DESC"]]
    });
    if (!aberto) throw erro;
    ticket = aberto;
  }

  await lead.update({
    contactId: contact.id,
    ticketId: ticket.id,
    rascunho: textoFinal || lead.rascunho,
    abertoEm: lead.abertoEm || new Date()
  });

  return {
    ticketId: ticket.id,
    ticketUuid: ticket.uuid,
    contactId: contact.id,
    rascunho: textoFinal
  };
};

export default AbrirConversaDoLeadService;
