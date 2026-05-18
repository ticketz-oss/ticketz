import Queue from "bull";
import moment from "moment";
import { QueryTypes } from "sequelize";
import { isEmpty, isNil, isArray } from "lodash";
import path from "path";
import { AnyMessageContent } from "libzapitu-rf";
import Campaign from "../models/Campaign";
import ContactList from "../models/ContactList";
import ContactListItem from "../models/ContactListItem";
import Contact from "../models/Contact";
import CampaignSetting from "../models/CampaignSetting";
import CampaignShipping from "../models/CampaignShipping";
import Whatsapp from "../models/Whatsapp";
import { getMessageFileOptions } from "../services/WbotServices/SendWhatsAppMedia";
import { getIO } from "../libs/socket";
import ShowService from "../services/CampaignService/ShowService";
import sequelize from "../database";
import { logger } from "../utils/logger";
import { randomValue } from "../helpers/randomValue";
import { parseToMilliseconds } from "../helpers/parseToMilliseconds";
import GetWhatsappWbot from "../helpers/GetWhatsappWbot";
import OutOfTicketMessage from "../models/OutOfTicketMessages";
import { Session } from "../libs/wbot";
import { mustacheValues } from "../helpers/Mustache";

const connection = process.env.REDIS_URI || "";
export const campaignQueue = new Queue("CampaignQueue", connection);

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

interface CampaignVariable {
  key: string;
  value: string;
}

interface PreparedCampaignShipping {
  number: string;
  contactId: number;
  campaignId: number;
  message?: string;
  confirmationMessage?: string;
}

async function handleVerifyCampaigns() {
  /**
   * @todo
   * Implementar filtro de campanhas
   */
  const campaigns: { id: number; scheduledAt: string }[] =
    await sequelize.query(
      `select id, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() and now() + '1 hour'::interval and status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );

  if (campaigns.length) {
    logger.info(`Campanhas encontradas: ${campaigns.length}`);
  }
  campaigns.forEach(campaign => {
    try {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = scheduledAt.diff(now, "milliseconds");
      logger.info(
        `Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`
      );
      campaignQueue.add(
        "ProcessCampaign",
        {
          id: campaign.id,
          delay
        },
        {
          removeOnComplete: true
        }
      );
    } catch (err) {
      logger.error({ message: err?.message }, "Error verifying campaigns");
    }
  });
}

async function getCampaign(id: number) {
  return Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getSettings(campaign) {
  const settings = await CampaignSetting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let messageInterval = 20;
  let longerIntervalAfter = 20;
  let greaterInterval = 60;
  let variables: CampaignVariable[] = [];

  settings.forEach(setting => {
    if (setting.key === "messageInterval") {
      messageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
    if (setting.key === "variables") {
      variables = JSON.parse(setting.value);
    }
  });

  return {
    messageInterval,
    longerIntervalAfter,
    greaterInterval,
    variables
  };
}

function getCampaignValidMessages(campaign): string[] {
  const messages: string[] = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getCampaignValidConfirmationMessages(campaign): string[] {
  const messages: string[] = [];

  if (
    !isEmpty(campaign.confirmationMessage1) &&
    !isNil(campaign.confirmationMessage1)
  ) {
    messages.push(campaign.confirmationMessage1);
  }

  if (
    !isEmpty(campaign.confirmationMessage2) &&
    !isNil(campaign.confirmationMessage2)
  ) {
    messages.push(campaign.confirmationMessage2);
  }

  if (
    !isEmpty(campaign.confirmationMessage3) &&
    !isNil(campaign.confirmationMessage3)
  ) {
    messages.push(campaign.confirmationMessage3);
  }

  if (
    !isEmpty(campaign.confirmationMessage4) &&
    !isNil(campaign.confirmationMessage4)
  ) {
    messages.push(campaign.confirmationMessage4);
  }

  if (
    !isEmpty(campaign.confirmationMessage5) &&
    !isNil(campaign.confirmationMessage5)
  ) {
    messages.push(campaign.confirmationMessage5);
  }

  return messages;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractCampaignTokens(body: string): string[] {
  const matches = body.match(/{[^{}]+}/g);

  if (!matches) {
    return [];
  }

  return [...new Set(matches.map(token => token.slice(1, -1)))];
}

function buildCampaignNativeValues(
  contact: Contact | ContactListItem
): Record<string, string> {
  const resolvedValues = mustacheValues(undefined, contact);
  const name = contact?.name || contact?.number || "{nome}";
  const firstname = contact?.name
    ? contact.name.trim().split(" ")[0]
    : contact?.number || "{primeiro_nome}";
  const email = contact?.email || "{email}";
  const number = contact?.number || "{numero}";
  const date = new Date().toLocaleDateString("en-GB");
  const greeting =
    typeof resolvedValues.greeting === "string"
      ? resolvedValues.greeting
      : "{saudacao}";
  const time =
    typeof resolvedValues.time === "string" ? resolvedValues.time : "{hora}";

  return {
    nome: name,
    name,
    primeiro_nome: firstname,
    firstname,
    email,
    numero: number,
    number,
    telefone: number,
    phone: number,
    saudacao: greeting,
    greeting,
    hora: time,
    time,
    data: date,
    date
  };
}

function buildCampaignCustomVariableEntries(variables: CampaignVariable[]) {
  return variables
    .filter(variable => variable?.key)
    .map(variable => [variable.key, variable.value ?? ""] as [string, string]);
}

function buildCampaignExtraInfoEntries(contact: Contact | null) {
  if (!contact?.extraInfo?.length) {
    return [] as [string, string][];
  }

  const uniqueEntries = new Map<string, string>();

  contact.extraInfo.forEach(field => {
    const key = field?.name?.trim();

    if (!key || uniqueEntries.has(key)) {
      return;
    }

    uniqueEntries.set(key, field.value ?? "");
  });

  return Array.from(uniqueEntries.entries());
}

async function findCampaignContact(
  companyId: number,
  contact: ContactListItem
): Promise<Contact | null> {
  if (!contact?.number) {
    return null;
  }

  return Contact.findOne({
    where: {
      companyId,
      number: contact.number
    },
    include: ["extraInfo"]
  });
}

function replaceCampaignTokens(
  body: string,
  replacementEntries: [string, string][]
) {
  let finalMessage = body;

  replacementEntries.forEach(([key, value]) => {
    if (!key) {
      return;
    }

    const regex = new RegExp(`\\{${escapeRegExp(key)}\\}`, "g");
    finalMessage = finalMessage.replace(regex, value ?? "");
  });

  return finalMessage;
}

async function getProcessedMessage(
  msg: string,
  variables: CampaignVariable[],
  contact: ContactListItem,
  companyId: number
) {
  let nativeValues = buildCampaignNativeValues(contact);
  const customVariableEntries = buildCampaignCustomVariableEntries(variables);
  const requestedTokens = extractCampaignTokens(msg);
  const knownTokenNames = new Set([
    ...Object.keys(nativeValues),
    ...customVariableEntries.map(([key]) => key)
  ]);

  let extraInfoEntries: [string, string][] = [];

  const shouldLoadContactRecord = requestedTokens.some(
    token =>
      token === "saudacao" ||
      token === "greeting" ||
      !knownTokenNames.has(token)
  );

  if (shouldLoadContactRecord) {
    const contactRecord = await findCampaignContact(companyId, contact);

    if (contactRecord) {
      nativeValues = buildCampaignNativeValues(contactRecord);
      extraInfoEntries = buildCampaignExtraInfoEntries(contactRecord).filter(
        ([key]) => !(key in nativeValues) && !knownTokenNames.has(key)
      );
    }
  }

  return replaceCampaignTokens(msg, [
    ...Object.entries(nativeValues),
    ...customVariableEntries,
    ...extraInfoEntries
  ]);
}

async function verifyAndFinalizeCampaign(campaign: Campaign) {
  const data = await ShowService(campaign.id);

  if (data.valids === data.delivered) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
  }

  const io = getIO();
  io.emit(`company-${campaign.companyId}-campaign`, data);
}

async function prepareContact(
  campaign: Campaign,
  variables: CampaignVariable[],
  contact: ContactListItem,
  delay: number,
  messages: string[],
  confirmationMessages: string[]
) {
  const campaignShipping: PreparedCampaignShipping = {
    number: contact.number,
    contactId: contact.id,
    campaignId: campaign.id
  };

  if (messages.length) {
    const radomIndex = randomValue(0, messages.length);
    const message = await getProcessedMessage(
      messages[radomIndex],
      variables,
      contact,
      campaign.companyId
    );
    campaignShipping.message = `${message}`;
  }

  if (campaign.confirmation) {
    if (confirmationMessages.length) {
      const radomIndex = randomValue(0, confirmationMessages.length);
      const message = await getProcessedMessage(
        confirmationMessages[radomIndex],
        variables,
        contact,
        campaign.companyId
      );
      campaignShipping.confirmationMessage = `${message}`;
    }
  }

  const [record, created] = await CampaignShipping.findOrCreate({
    where: {
      campaignId: campaignShipping.campaignId,
      contactId: campaignShipping.contactId
    },
    defaults: campaignShipping
  });

  if (
    !created &&
    record.deliveredAt === null &&
    record.confirmationRequestedAt === null
  ) {
    record.set(campaignShipping);
    await record.save();
  }

  if (record.deliveredAt === null && record.confirmationRequestedAt === null) {
    const nextJob = await campaignQueue.add(
      "DispatchCampaign",
      {
        campaignId: campaign.id,
        campaignShippingId: record.id,
        contactListItemId: contact.id
      },
      {
        delay
      }
    );

    await record.update({ jobId: `${nextJob.id}` });
  }
}

async function handleProcessCampaign(job) {
  try {
    const { id }: ProcessCampaignData = job.data;
    let { delay }: ProcessCampaignData = job.data;
    const campaign = await getCampaign(id);
    const settings = await getSettings(campaign);
    if (campaign) {
      const { contacts } = campaign.contactList;
      const messages = getCampaignValidMessages(campaign);
      const confirmationMessages = campaign.confirmation
        ? getCampaignValidConfirmationMessages(campaign)
        : null;
      if (isArray(contacts)) {
        let index = 0;
        contacts.forEach(contact => {
          prepareContact(
            campaign,
            settings.variables,
            contact,
            delay,
            messages,
            confirmationMessages
          ).then(() => {
            logger.info(
              `Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contact.name};Delay=${delay}`
            );
          });

          index += 1;
          if (index % settings.longerIntervalAfter === 0) {
            // intervalo maior após intervalo configurado de mensagens
            delay += parseToMilliseconds(settings.greaterInterval);
          } else {
            delay += parseToMilliseconds(
              randomValue(0, settings.messageInterval)
            );
          }
        });
        await campaign.update({ status: "EM_ANDAMENTO" });
      }
    }
  } catch (err) {
    logger.error({ message: err?.message }, "Error processing campaign");
  }
}

async function sendCampaignMessage(
  whatsappId: number,
  wbot: Session,
  jid: string,
  content: AnyMessageContent
) {
  try {
    const message = await wbot.sendMessage(jid, content);
    wbot.cacheMessage(message);
    OutOfTicketMessage.create({
      id: message.key.id,
      dataJson: JSON.stringify(message),
      whatsappId
    });
    return message;
  } catch (err) {
    logger.error({ message: err?.message }, "Error sending campaign message");
    return null;
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { data } = job;
    const { campaignShippingId, campaignId }: DispatchCampaignData = data;
    const campaign = await Campaign.findByPk(campaignId, {
      include: ["contactList", { model: Whatsapp, as: "whatsapp" }]
    });

    if (!campaign) {
      logger.error({ data }, "Campaign not found");
      return;
    }

    const wbot = await GetWhatsappWbot(campaign.whatsapp);

    logger.info(
      `Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`
    );

    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );

    const chatId = `${campaignShipping.number}@s.whatsapp.net`;

    if (campaign.confirmation && campaignShipping.confirmation === null) {
      await sendCampaignMessage(campaign.whatsappId, wbot, chatId, {
        text: campaignShipping.confirmationMessage
      });
      await campaignShipping.update({ confirmationRequestedAt: moment() });
    } else {
      await sendCampaignMessage(campaign.whatsappId, wbot, chatId, {
        text: campaignShipping.message
      });
      if (campaign.mediaPath) {
        const filePath = path.resolve("public", campaign.mediaPath);
        const content = await getMessageFileOptions(
          campaign.mediaName,
          filePath
        );
        if (Object.keys(content).length) {
          await sendCampaignMessage(campaign.whatsappId, wbot, chatId, content);
        }
      }
      await campaignShipping.update({ deliveredAt: moment() });
    }

    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(
      `Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`
    );
  } catch (err: unknown) {
    logger.error((err as Error).message);
  }
}

export async function startCampaignQueues() {
  campaignQueue.process("VerifyCampaignsDatabase", handleVerifyCampaigns);
  campaignQueue.process("ProcessCampaign", handleProcessCampaign);
  campaignQueue.process("DispatchCampaign", handleDispatchCampaign);
  campaignQueue.process("DispatchConfirmedCampaign", handleDispatchCampaign);

  campaignQueue.add(
    "VerifyCampaignsDatabase",
    {},
    {
      repeat: { cron: "*/20 * * * * *" },
      removeOnComplete: true
    }
  );
}
