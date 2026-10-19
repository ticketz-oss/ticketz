import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";
import { getIO } from "../../libs/socket";
import { GetCompanySetting } from "../../helpers/CheckSettings";
import CreateService from "../QuickMessageService/CreateService";
import FindService from "../QuickMessageService/FindService";
import UpdateService from "../QuickMessageService/UpdateService";
import { McpAuthContext } from "./OAuthService";

export const QUICK_MESSAGE_LIMITS = {
  shortcodeMinLength: 3,
  shortcodeMaxLength: 50,
  messageMinLength: 3,
  messageMaxLength: 5000
};

type QuickMessageView = {
  id: number;
  shortcode: string;
  usageHint: string;
  message: string;
  ownerUserId: number | null;
  ownedByConnectedUser: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const toView = (
  record: QuickMessage,
  auth: McpAuthContext
): QuickMessageView => ({
  id: record.id,
  shortcode: record.shortcode,
  usageHint: `/${record.shortcode}`,
  message: record.message,
  ownerUserId: record.userId ?? null,
  ownedByConnectedUser: record.userId === auth.userId,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

// "individual" (padrão) mostra só as respostas do próprio usuário; qualquer
// outro valor libera as da empresa inteira. Mesma regra do FindService, que é
// quem monta a lista da tela e do atalho "/" no chat.
const readVisibility = async (companyId: number): Promise<string> => {
  const setting = await GetCompanySetting(
    companyId,
    "quickMessages",
    "individual"
  );
  return setting === "individual" ? "individual" : "company";
};

// A escrita só pode alcançar o que a leitura já alcançava: reusar o FindService
// mantém uma única definição de "resposta rápida acessível" para as três tools.
const listAccessible = (auth: McpAuthContext): Promise<QuickMessage[]> =>
  FindService({ companyId: auth.companyId, userId: auth.userId });

const normalizeShortcode = (value: string): string => {
  // O usuário digita "/atalho" no chat, mas o registro guarda só "atalho".
  const shortcode = value.trim().replace(/^\/+/, "").trim();

  if (/\s/.test(shortcode)) {
    throw new AppError("ERR_QUICKMESSAGE_SHORTCODE_HAS_WHITESPACE", 400);
  }
  if (shortcode.length < QUICK_MESSAGE_LIMITS.shortcodeMinLength) {
    throw new AppError("ERR_QUICKMESSAGE_SHORTCODE_TOO_SHORT", 400);
  }
  if (shortcode.length > QUICK_MESSAGE_LIMITS.shortcodeMaxLength) {
    throw new AppError("ERR_QUICKMESSAGE_SHORTCODE_TOO_LONG", 400);
  }

  return shortcode;
};

const normalizeMessage = (value: string): string => {
  const message = value.trim();

  if (message.length < QUICK_MESSAGE_LIMITS.messageMinLength) {
    throw new AppError("ERR_QUICKMESSAGE_MESSAGE_TOO_SHORT", 400);
  }
  if (message.length > QUICK_MESSAGE_LIMITS.messageMaxLength) {
    throw new AppError("ERR_QUICKMESSAGE_MESSAGE_TOO_LONG", 400);
  }

  return message;
};

// Não existe UNIQUE no banco, então dois atalhos iguais conviveriam e o
// autocomplete do chat resolveria por texto. Bloquear aqui dá ao modelo um erro
// determinístico em vez de duplicar silenciosamente.
const assertShortcodeIsFree = (
  records: QuickMessage[],
  shortcode: string,
  ignoreId?: number
): void => {
  const clash = records.find(
    record =>
      record.id !== ignoreId &&
      record.shortcode.toLowerCase() === shortcode.toLowerCase()
  );

  if (clash) {
    throw new AppError("ERR_QUICKMESSAGE_SHORTCODE_ALREADY_EXISTS", 409);
  }
};

const emit = (
  companyId: number,
  action: "create" | "update",
  record: QuickMessage
): void => {
  try {
    getIO().emit(`company-${companyId}-quickmessage`, { action, record });
  } catch {
    // O socket não é o canal de verdade da operação: a resposta rápida já está
    // gravada e a tela recarrega a lista. Falhar aqui desfaria uma escrita boa.
  }
};

export const listQuickMessages = async (auth: McpAuthContext) => {
  const records = await listAccessible(auth);
  const visibility = await readVisibility(auth.companyId);

  return {
    quickMessages: records.map(record => toView(record, auth)),
    visibility,
    coverage: {
      matchedRecords: records.length,
      returnedRecords: records.length,
      remainingRecords: 0,
      nextCursor: null
    }
  };
};

export const createQuickMessage = async (
  auth: McpAuthContext,
  input: { shortcode: string; message: string }
) => {
  const shortcode = normalizeShortcode(input.shortcode);
  const message = normalizeMessage(input.message);

  assertShortcodeIsFree(await listAccessible(auth), shortcode);

  const record = await CreateService({
    shortcode,
    message,
    companyId: auth.companyId,
    userId: auth.userId
  });

  emit(auth.companyId, "create", record);

  return {
    quickMessage: toView(record, auth),
    visibility: await readVisibility(auth.companyId),
    coverage: { returnedRecords: 1 }
  };
};

export const updateQuickMessage = async (
  auth: McpAuthContext,
  input: { quick_message_id: number; shortcode?: string; message?: string }
) => {
  if (input.shortcode === undefined && input.message === undefined) {
    throw new AppError("ERR_QUICKMESSAGE_NOTHING_TO_UPDATE", 400);
  }

  const accessible = await listAccessible(auth);
  const current = accessible.find(item => item.id === input.quick_message_id);

  if (!current) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  const shortcode =
    input.shortcode === undefined
      ? current.shortcode
      : normalizeShortcode(input.shortcode);
  const message =
    input.message === undefined
      ? current.message
      : normalizeMessage(input.message);

  assertShortcodeIsFree(accessible, shortcode, current.id);

  // Sem userId no payload o dono original é preservado: editar pelo ChatGPT não
  // pode transferir a resposta rápida de um atendente para o administrador
  // conectado.
  const record = await UpdateService({
    id: current.id,
    companyId: auth.companyId,
    shortcode,
    message
  });

  emit(auth.companyId, "update", record);

  return {
    quickMessage: toView(record, auth),
    visibility: await readVisibility(auth.companyId),
    coverage: { returnedRecords: 1 }
  };
};
