import { createHmac, timingSafeEqual } from "crypto";
import AppError from "../../errors/AppError";
import mcpConfig from "../../config/mcp";
import { getIO } from "../../libs/socket";
import Schedule from "../../models/Schedule";
import CreateService, {
  SchedulePayload
} from "../ScheduleServices/CreateService";
import PreviewService from "../ScheduleServices/PreviewService";
import ShowService from "../ScheduleServices/ShowService";
import UpdateService from "../ScheduleServices/UpdateService";
import { validateTimezone } from "../ScheduleServices/recurrence";
import { AudienceMode, ScheduleKind } from "../ScheduleServices/audience";
import { McpAuthContext } from "./OAuthService";
import { getTenantTimezone } from "./tenantTimezone";

// Limites da camada MCP. bodyMinLength é o mesmo 5 que o CreateService já
// exige: fica aqui só para ser publicado no contexto do modelo, a validação
// continua sendo a do domínio para não existirem dois mínimos.
export const SCHEDULE_LIMITS = {
  bodyMinLength: 5,
  bodyMaxLength: 5000,
  maxSelectedContacts: 100,
  confirmationTtlMinutes: 30
};

export type ScheduleToolInput = {
  kind: ScheduleKind;
  body: string;
  audience_mode: AudienceMode;
  contact_ids?: number[];
  send_at?: string;
  send_time?: string;
  timezone?: string;
  commemorative_date_id?: number;
};

export type UpdateScheduleToolInput = {
  schedule_id: number;
  kind?: ScheduleKind;
  body?: string;
  audience_mode?: AudienceMode;
  contact_ids?: number[];
  send_at?: string;
  send_time?: string;
  timezone?: string;
  commemorative_date_id?: number;
  confirmation_token?: string;
  confirmed?: boolean;
};

export type PreviewScheduleToolInput = Partial<ScheduleToolInput> & {
  schedule_id?: number;
};

export type ConfirmedScheduleToolInput = ScheduleToolInput & {
  confirmation_token?: string;
  confirmed?: boolean;
};

type ScheduleView = {
  id: number;
  kind: ScheduleKind;
  status: string;
  active: boolean;
  audienceMode: AudienceMode;
  body: string;
  sendAt: string | null;
  sendTime: string | null;
  timezone: string;
  nextRunAt: string | null;
  totalRecipients: number;
  commemorativeDate: { id: number; name: string } | null;
  contacts: Array<{ id: number; name: string; number: string }>;
  createdAt: Date;
  updatedAt: Date;
};

const isoOrNull = (value?: Date | null): string | null =>
  value ? new Date(value).toISOString() : null;

// A view é explícita de propósito: mediaPath, mediaName e mediaType existem no
// registro mas ficam fora daqui. Devolvê-los entregaria ao modelo referências
// de arquivos do servidor, e ele não tem como criar mídia nenhuma.
const toView = (record: Schedule): ScheduleView => ({
  id: record.id,
  kind: record.kind,
  status: record.status,
  active: record.active,
  audienceMode: record.audienceMode,
  body: record.body,
  sendAt: isoOrNull(record.sendAt),
  sendTime: record.sendTime || null,
  timezone: record.timezone,
  nextRunAt: isoOrNull(record.nextRunAt),
  totalRecipients: record.totalRecipients,
  commemorativeDate: record.commemorativeDate
    ? { id: record.commemorativeDate.id, name: record.commemorativeDate.name }
    : null,
  contacts: (record.audienceContacts || [])
    .map(item => item.contact)
    .filter(Boolean)
    .map(contact => ({
      id: contact.id,
      name: contact.name,
      number: contact.number
    })),
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

// O mínimo de 5 caracteres e as variáveis Mustache continuam sendo checados
// pelo domínio; aqui só entra o teto que protege o payload da tool.
const normalizeBody = (body: string): string => {
  const value = (body || "").trim();
  if (value.length > SCHEDULE_LIMITS.bodyMaxLength) {
    throw new AppError("ERR_SCHEDULE_MESSAGE_TOO_LONG", 400);
  }
  return value;
};

// Um payload com centenas de IDs viria de alucinação, não de um pedido real.
// A conferência de tenant não é feita aqui: resolveAudience já rejeita IDs de
// outra empresa comparando a contagem encontrada com a pedida.
const normalizeContactIds = (ids?: number[]): number[] | undefined => {
  if (ids === undefined) return undefined;
  const unique = Array.from(new Set(ids.map(Number).filter(Boolean))).sort(
    (left, right) => left - right
  );
  if (unique.length > SCHEDULE_LIMITS.maxSelectedContacts) {
    throw new AppError("ERR_SCHEDULE_TOO_MANY_RECIPIENTS", 400);
  }
  return unique;
};

const resolveTimezone = (
  companyId: number,
  timezone?: string
): Promise<string> =>
  timezone
    ? Promise.resolve(validateTimezone(timezone))
    : getTenantTimezone(companyId);

type ResolvedScheduleInput = ScheduleToolInput & { timezone: string };

const invalidPayload = (): never => {
  throw new AppError("ERR_SCHEDULE_INVALID_PAYLOAD", 400);
};

const resolveCreateInput = async (
  auth: McpAuthContext,
  input: PreviewScheduleToolInput
): Promise<ResolvedScheduleInput> => {
  if (!input.kind || input.body === undefined || !input.audience_mode) {
    return invalidPayload();
  }
  return {
    kind: input.kind,
    body: normalizeBody(input.body),
    audience_mode: input.audience_mode,
    contact_ids: normalizeContactIds(input.contact_ids),
    send_at: input.send_at,
    send_time: input.send_time,
    timezone: await resolveTimezone(auth.companyId, input.timezone),
    commemorative_date_id: input.commemorative_date_id
  };
};

const resolveUpdateInput = (
  current: Schedule,
  input: UpdateScheduleToolInput
): ResolvedScheduleInput => {
  const kind = input.kind || current.kind;
  if (
    (kind === "ONCE" && input.send_time !== undefined) ||
    (kind !== "ONCE" && input.send_at !== undefined) ||
    (kind !== "COMMEMORATIVE" && input.commemorative_date_id !== undefined)
  ) {
    throw new AppError("ERR_SCHEDULE_FIELD_NOT_APPLICABLE", 400);
  }

  const audienceMode = input.audience_mode || current.audienceMode;
  const currentContactIds = (current.audienceContacts || []).map(
    item => item.contactId
  );
  const contactIds =
    audienceMode === "ALL"
      ? undefined
      : normalizeContactIds(input.contact_ids || currentContactIds);
  const wasOnce = current.kind === "ONCE";
  const wasCommemorative = current.kind === "COMMEMORATIVE";

  return {
    kind,
    body: normalizeBody(input.body ?? current.body),
    audience_mode: audienceMode,
    contact_ids: contactIds,
    send_at:
      kind === "ONCE"
        ? input.send_at ||
          (wasOnce
            ? isoOrNull(current.sendAt || current.nextRunAt) || undefined
            : undefined)
        : undefined,
    send_time:
      kind === "ONCE"
        ? undefined
        : input.send_time || (!wasOnce ? current.sendTime : undefined),
    timezone: input.timezone
      ? validateTimezone(input.timezone)
      : current.timezone,
    commemorative_date_id:
      kind === "COMMEMORATIVE"
        ? input.commemorative_date_id ||
          (wasCommemorative
            ? current.commemorativeDateId || current.commemorativeDate?.id
            : undefined)
        : undefined
  };
};

const confirmationPayload = (
  auth: McpAuthContext,
  operation: "create" | `update:${number}`,
  input: ResolvedScheduleInput,
  expiresAt: number
): string =>
  JSON.stringify({
    companyId: auth.companyId,
    userId: auth.userId,
    operation,
    expiresAt,
    kind: input.kind,
    body: input.body,
    audienceMode: input.audience_mode,
    contactIds: input.contact_ids || [],
    sendAt: input.send_at || null,
    sendTime: input.send_time || null,
    timezone: input.timezone,
    commemorativeDateId: input.commemorative_date_id || null
  });

const confirmationSignature = (payload: string): string =>
  createHmac("sha256", mcpConfig.cursorSecret)
    .update(payload)
    .digest("base64url");

const createConfirmationToken = (
  auth: McpAuthContext,
  operation: "create" | `update:${number}`,
  input: ResolvedScheduleInput
): { token: string; expiresAt: string } => {
  const expiresAt =
    Date.now() + SCHEDULE_LIMITS.confirmationTtlMinutes * 60 * 1000;
  const signature = confirmationSignature(
    confirmationPayload(auth, operation, input, expiresAt)
  );
  return {
    token: `${expiresAt}.${signature}`,
    expiresAt: new Date(expiresAt).toISOString()
  };
};

const verifyConfirmation = (
  auth: McpAuthContext,
  operation: "create" | `update:${number}`,
  input: ResolvedScheduleInput,
  token?: string,
  confirmed?: boolean
): void => {
  if (confirmed !== true) {
    throw new AppError("ERR_SCHEDULE_CONFIRMATION_REQUIRED", 400);
  }
  const [rawExpiry, receivedSignature] = String(token || "").split(".");
  const expiresAt = Number(rawExpiry);
  if (!expiresAt || !receivedSignature || expiresAt < Date.now()) {
    throw new AppError("ERR_SCHEDULE_PREVIEW_REQUIRED", 400);
  }
  const expectedSignature = confirmationSignature(
    confirmationPayload(auth, operation, input, expiresAt)
  );
  const expected = Uint8Array.from(Buffer.from(expectedSignature));
  const received = Uint8Array.from(Buffer.from(receivedSignature));
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new AppError("ERR_SCHEDULE_PREVIEW_MISMATCH", 400);
  }
};

// A sala do socket é o próprio tenant: o evento carrega o texto e os
// destinatários do agendamento, então um emit global vazaria isso para
// qualquer cliente que escutasse o nome do evento.
const emit = (
  companyId: number,
  action: "create" | "update",
  schedule: Schedule
): void => {
  try {
    getIO()
      .to(`company-${companyId}-mainchannel`)
      .emit(`company-${companyId}-schedule`, { action, schedule });
  } catch {
    // O socket não é o canal de verdade da operação: o agendamento já está
    // gravado e a tela recarrega a lista. Falhar aqui desfaria uma escrita boa.
  }
};

const toPayload = (
  auth: McpAuthContext,
  input: ResolvedScheduleInput
): SchedulePayload => ({
  body: input.body,
  kind: input.kind,
  audienceMode: input.audience_mode,
  contactIds: normalizeContactIds(input.contact_ids),
  sendAt: input.send_at,
  sendTime: input.send_time,
  commemorativeDateId: input.commemorative_date_id,
  timezone: input.timezone,
  // companyId e userId vêm sempre do token verificado, nunca do argumento da
  // ferramenta: é o que impede o modelo de escrever em outro tenant ou de
  // registrar o agendamento no nome de outro usuário.
  companyId: auth.companyId,
  userId: auth.userId
});

export const previewSchedule = async (
  auth: McpAuthContext,
  input: PreviewScheduleToolInput
) => {
  const current = input.schedule_id
    ? await ShowService(input.schedule_id, auth.companyId)
    : null;
  const resolved = current
    ? resolveUpdateInput(current, {
        ...input,
        schedule_id: current.id
      } as UpdateScheduleToolInput)
    : await resolveCreateInput(auth, input);
  const operation = current
    ? (`update:${current.id}` as const)
    : ("create" as const);
  const preview = await PreviewService(toPayload(auth, resolved));
  const confirmation = createConfirmationToken(auth, operation, resolved);

  return {
    preview: {
      eligibleCount: preview.eligibleCount,
      excludedCount: preview.excludedCount,
      missingVariables: preview.missingVariables,
      estimatedDurationSeconds: preview.estimatedDurationSeconds,
      nextRunAt: preview.nextRunAt.toISOString(),
      timezone: resolved.timezone,
      // Informativo, não impeditivo: o domínio aceita data passada e a tela
      // também, então rejeitar aqui faria o ChatGPT divergir do sistema. O
      // modelo usa isso para avisar o usuário antes de confirmar a criação.
      isInPast: preview.nextRunAt.getTime() < Date.now(),
      sampleRenderedMessage: preview.renderedMessage,
      confirmationToken: confirmation.token,
      confirmationTokenExpiresAt: confirmation.expiresAt
    },
    persisted: false,
    coverage: { returnedRecords: 0 }
  };
};

export const createSchedule = async (
  auth: McpAuthContext,
  input: ConfirmedScheduleToolInput
) => {
  const resolved = await resolveCreateInput(auth, input);
  verifyConfirmation(
    auth,
    "create",
    resolved,
    input.confirmation_token,
    input.confirmed
  );
  const created = await CreateService(toPayload(auth, resolved));
  // O CreateService recarrega sem os contatos da audiência; reler pelo
  // ShowService dá a mesma forma de registro que o update devolve.
  const schedule = await ShowService(created.id, auth.companyId);

  emit(auth.companyId, "create", schedule);

  return { schedule: toView(schedule), coverage: { returnedRecords: 1 } };
};

export const updateSchedule = async (
  auth: McpAuthContext,
  input: UpdateScheduleToolInput
) => {
  // ShowService busca por id + companyId: agendamento de outra empresa não é
  // encontrado, então nem chega ao UpdateService.
  const current = await ShowService(input.schedule_id, auth.companyId);
  const changed = [
    input.kind,
    input.body,
    input.audience_mode,
    input.contact_ids,
    input.send_at,
    input.send_time,
    input.timezone,
    input.commemorative_date_id
  ].some(value => value !== undefined);
  if (!changed) {
    throw new AppError("ERR_SCHEDULE_NOTHING_TO_UPDATE", 400);
  }
  const resolved = resolveUpdateInput(current, input);
  verifyConfirmation(
    auth,
    `update:${current.id}`,
    resolved,
    input.confirmation_token,
    input.confirmed
  );
  const scheduleData: Partial<SchedulePayload> = {
    kind: resolved.kind,
    body: resolved.body,
    audienceMode: resolved.audience_mode,
    contactIds: resolved.contact_ids,
    sendAt: resolved.send_at,
    sendTime: resolved.send_time,
    timezone: resolved.timezone,
    commemorativeDateId: resolved.commemorative_date_id
  };

  const schedule = await UpdateService({
    scheduleData,
    id: current.id,
    companyId: auth.companyId
  });

  emit(auth.companyId, "update", schedule);

  return { schedule: toView(schedule), coverage: { returnedRecords: 1 } };
};
