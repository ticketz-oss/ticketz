import { Op } from "sequelize";
import CommemorativeDate from "../../models/CommemorativeDate";
import Contact from "../../models/Contact";
import User from "../../models/User";
import { customFieldNames, resolveAudience } from "./audience";
import { estimateCadenceSeconds, getScheduleCadence } from "./cadence";
import {
  calculateNextRun,
  normalizePayload,
  SchedulePayload
} from "./CreateService";
import {
  normalizeVariableKey,
  renderScheduleMessage,
  validateScheduleVariables
} from "./variables";

export type SchedulePreview = {
  eligibleCount: number;
  excludedCount: number;
  missingVariables: Record<string, number>;
  estimatedDurationSeconds: number;
  nextRunAt: Date;
  renderedMessage: string;
};

// "Tem valor para esta variável?" na visão do contato. Só interessa se o
// resultado é vazio ou não, então variáveis que não dependem do contato
// devolvem um valor qualquer preenchido.
const contactValue = (
  contact: Contact,
  variable: string,
  commemorativeDate?: CommemorativeDate,
  currentUser?: User
): string => {
  if (variable === "email") return contact.email;
  if (variable === "idioma") return contact.language;
  if (variable === "data_comemorativa") return commemorativeDate?.name || "";
  if (variable === "atendente" || variable === "user")
    return currentUser?.name || "";
  if (variable === "apelido")
    return contact.nickname || contact.name?.split(" ")[0];
  if (variable === "aniversario") {
    return contact.birthdayDay && contact.birthdayMonth ? "ok" : "";
  }
  if (variable.startsWith("extra.")) {
    const key = variable.slice(6);
    return (
      contact.extraInfo?.find(info => normalizeVariableKey(info.name) === key)
        ?.value || ""
    );
  }
  return "ok";
};

// Simulação sem persistência: roda as mesmas validações, a mesma resolução de
// audiência e o mesmo cálculo de ocorrência que o CreateService, para que a
// prévia da tela e a do MCP nunca divirjam do que a criação realmente fará.
const PreviewService = async (
  input: SchedulePayload
): Promise<SchedulePreview> => {
  const payload = normalizePayload(input);
  const { companyId } = payload;
  const custom = await customFieldNames(companyId);
  const usedVariables = validateScheduleVariables(payload.body, custom);
  const contacts = await resolveAudience({
    companyId,
    kind: payload.kind,
    audienceMode: payload.audienceMode,
    contactIds: payload.contactIds
  });
  const occurrence = await calculateNextRun(payload);
  const commemorativeDate = payload.commemorativeDateId
    ? await CommemorativeDate.findOne({
        where: { id: payload.commemorativeDateId, companyId }
      })
    : null;
  const currentUser = payload.userId
    ? await User.findByPk(payload.userId, { attributes: ["id", "name"] })
    : null;
  const candidateCount = await Contact.count({
    where: {
      companyId,
      channel: "whatsapp",
      isGroup: false,
      ...(payload.audienceMode === "SELECTED"
        ? { id: { [Op.in]: payload.contactIds || [] } }
        : {})
    }
  });
  const missingVariables = usedVariables.reduce(
    (result, variable) => {
      const missing = contacts.filter(
        contact =>
          !contactValue(contact, variable, commemorativeDate, currentUser)
      ).length;
      if (missing) result[variable] = missing;
      return result;
    },
    {} as Record<string, number>
  );
  const cadence = await getScheduleCadence(companyId);
  return {
    eligibleCount: contacts.length,
    excludedCount: Math.max(0, candidateCount - contacts.length),
    missingVariables,
    estimatedDurationSeconds: estimateCadenceSeconds(contacts.length, cadence),
    nextRunAt: occurrence,
    renderedMessage: renderScheduleMessage(payload.body, {
      contact: contacts[0],
      currentUser,
      commemorativeDate,
      occurrence,
      timezone: payload.timezone
    })
  };
};

export default PreviewService;
