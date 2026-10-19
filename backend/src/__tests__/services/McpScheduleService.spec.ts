import Schedule from "../../models/Schedule";
import mcpConfig from "../../config/mcp";
import {
  McpAuthContext,
  validateScopes
} from "../../services/McpServices/OAuthService";
import {
  TOOL_SCOPES,
  sanitizeFilters
} from "../../services/McpServices/McpServerService";
import CreateService from "../../services/ScheduleServices/CreateService";
import PreviewService from "../../services/ScheduleServices/PreviewService";
import ShowService from "../../services/ScheduleServices/ShowService";
import UpdateService from "../../services/ScheduleServices/UpdateService";
import { getTenantTimezone } from "../../services/McpServices/tenantTimezone";
import { getIO } from "../../libs/socket";
import {
  SCHEDULE_LIMITS,
  ScheduleToolInput,
  UpdateScheduleToolInput,
  createSchedule,
  previewSchedule,
  updateSchedule
} from "../../services/McpServices/McpScheduleService";

jest.mock("../../services/ScheduleServices/CreateService");
jest.mock("../../services/ScheduleServices/PreviewService");
jest.mock("../../services/ScheduleServices/ShowService");
jest.mock("../../services/ScheduleServices/UpdateService");
jest.mock("../../services/McpServices/tenantTimezone");
// A fábrica precisa já devolver uma promise: o i18nService chama
// GetCompanySetting no carregamento do módulo, antes de qualquer beforeEach.
jest.mock("../../helpers/CheckSettings", () => ({
  __esModule: true,
  GetCompanySetting: jest.fn().mockResolvedValue("individual"),
  default: jest.fn().mockResolvedValue("")
}));
// O i18nService inicializa traduções lendo o banco no carregamento do módulo,
// e a cadeia variables.ts -> Mustache o alcança. A saudação não é o objeto
// destes testes, então o módulo inteiro fica fora.
jest.mock("../../services/TranslationServices/i18nService", () => ({
  __esModule: true,
  _t: (text: string) => text,
  i18n: { t: (text: string) => text },
  i18nReady: Promise.resolve(),
  getUniqueLanguages: jest.fn().mockResolvedValue([]),
  initializeI18n: jest.fn().mockResolvedValue(undefined),
  reloadTranslations: jest.fn().mockResolvedValue(undefined),
  updateDefaultLanguage: jest.fn()
}));
jest.mock("../../libs/socket");

const createService = CreateService as jest.MockedFunction<
  typeof CreateService
>;
const previewService = PreviewService as jest.MockedFunction<
  typeof PreviewService
>;
const showService = ShowService as jest.MockedFunction<typeof ShowService>;
const updateService = UpdateService as jest.MockedFunction<
  typeof UpdateService
>;
const tenantTimezone = getTenantTimezone as jest.MockedFunction<
  typeof getTenantTimezone
>;
const socket = getIO as jest.MockedFunction<typeof getIO>;

const auth: McpAuthContext = {
  grantId: "grant-1",
  userId: 7,
  companyId: 3,
  clientId: "ticketz_test",
  scopes: ["conversations:read", "schedules:write"],
  expiresAt: 0
};

const record = (fields: Partial<Schedule> = {}): Schedule =>
  ({
    id: 21,
    kind: "ONCE",
    status: "PENDENTE",
    active: true,
    audienceMode: "SELECTED",
    body: "Lembrete da sua consulta amanhã.",
    sendAt: new Date("2026-08-21T18:00:00.000Z"),
    sendTime: null,
    timezone: "America/Sao_Paulo",
    nextRunAt: new Date("2026-08-21T18:00:00.000Z"),
    totalRecipients: 1,
    commemorativeDate: null,
    audienceContacts: [
      {
        contactId: 11,
        contact: { id: 11, name: "Ana", number: "5511999999999" }
      }
    ],
    mediaPath: "arquivo-secreto.png",
    mediaName: "arquivo-secreto.png",
    mediaType: "image/png",
    createdAt: new Date("2026-08-20T10:00:00.000Z"),
    updatedAt: new Date("2026-08-20T10:00:00.000Z"),
    ...fields
  }) as unknown as Schedule;

const input = (fields: Partial<ScheduleToolInput> = {}): ScheduleToolInput => ({
  kind: "ONCE",
  body: "Lembrete da sua consulta amanhã.",
  audience_mode: "SELECTED",
  contact_ids: [11],
  send_at: "2026-08-21T15:00:00",
  ...fields
});

const emit = jest.fn();
const room = jest.fn(() => ({ emit }));

const confirmedCreateInput = async (
  fields: Partial<ScheduleToolInput> = {}
) => {
  const payload = input(fields);
  const result = await previewSchedule(auth, payload);
  return {
    ...payload,
    confirmation_token: result.preview.confirmationToken,
    confirmed: true as const
  };
};

const confirmedUpdateInput = async (
  fields: Omit<UpdateScheduleToolInput, "confirmation_token" | "confirmed">
) => {
  const result = await previewSchedule(auth, fields);
  return {
    ...fields,
    confirmation_token: result.preview.confirmationToken,
    confirmed: true as const
  };
};

beforeEach(() => {
  tenantTimezone.mockResolvedValue("America/Sao_Paulo");
  createService.mockResolvedValue(record());
  showService.mockResolvedValue(record());
  updateService.mockResolvedValue(record({ body: "Texto novo do lembrete." }));
  previewService.mockResolvedValue({
    eligibleCount: 4,
    excludedCount: 1,
    missingVariables: { apelido: 2 },
    estimatedDurationSeconds: 30,
    nextRunAt: new Date("2026-08-21T18:00:00.000Z"),
    renderedMessage: "Lembrete da sua consulta amanhã."
  });
  socket.mockReturnValue({ to: room, emit } as never);
});

describe("MCP schedule creation", () => {
  it("takes tenant and owner from the token, never from the arguments", async () => {
    await createSchedule(auth, {
      ...(await confirmedCreateInput()),
      // O modelo pode inventar estes campos; eles não estão no schema da tool e
      // não podem alcançar o payload de domínio.
      ...({ companyId: 99, userId: 1 } as Partial<ScheduleToolInput>)
    });

    expect(createService).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 3, userId: 7 })
    );
  });

  it("falls back to the tenant timezone configured for schedules", async () => {
    await createSchedule(
      auth,
      await confirmedCreateInput({ timezone: undefined })
    );

    expect(tenantTimezone).toHaveBeenCalledWith(3);
    expect(createService).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: "America/Sao_Paulo" })
    );
  });

  it("rejects an invalid IANA timezone before reaching the domain", async () => {
    await expect(
      createSchedule(auth, input({ timezone: "Marte/Olimpo" }))
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_INVALID_TIMEZONE" });
    expect(createService).not.toHaveBeenCalled();
  });

  it("emits on the tenant room instead of broadcasting the message body", async () => {
    await createSchedule(auth, await confirmedCreateInput());

    // Um emit global entregaria o texto e os destinatários a qualquer cliente
    // socket que escutasse o nome do evento.
    expect(room).toHaveBeenCalledWith("company-3-mainchannel");
    expect(emit).toHaveBeenCalledWith("company-3-schedule", {
      action: "create",
      schedule: expect.objectContaining({ id: 21 })
    });
  });

  it("keeps the schedule when the socket is down", async () => {
    socket.mockImplementation(() => {
      throw new Error("socket off");
    });

    await expect(
      createSchedule(auth, await confirmedCreateInput())
    ).resolves.toMatchObject({
      schedule: { id: 21 }
    });
  });

  it("never exposes server media references in the returned schedule", async () => {
    const result = await createSchedule(auth, await confirmedCreateInput());

    expect(result.schedule).not.toHaveProperty("mediaPath");
    expect(result.schedule).not.toHaveProperty("mediaName");
    expect(result.schedule).not.toHaveProperty("mediaType");
    expect(result.schedule.contacts).toEqual([
      { id: 11, name: "Ana", number: "5511999999999" }
    ]);
  });

  it("refuses a contact list larger than the MCP payload limit", async () => {
    const ids = Array.from(
      { length: SCHEDULE_LIMITS.maxSelectedContacts + 1 },
      (_, index) => index + 1
    );

    await expect(
      createSchedule(auth, input({ contact_ids: ids }))
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_TOO_MANY_RECIPIENTS" });
    expect(createService).not.toHaveBeenCalled();
  });

  it("refuses a body longer than the MCP payload limit", async () => {
    await expect(
      createSchedule(auth, {
        ...input({ body: "a".repeat(SCHEDULE_LIMITS.bodyMaxLength + 1) }),
        confirmed: true,
        confirmation_token: "invalid"
      })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_MESSAGE_TOO_LONG" });
    expect(createService).not.toHaveBeenCalled();
  });

  it("leaves the minimum length and the variable check to the domain", async () => {
    // Reimplementar o mínimo de 5 caracteres aqui criaria duas definições da
    // mesma regra: o CreateService é quem recusa, com o mesmo código de erro
    // que a tela e o REST devolvem.
    createService.mockRejectedValue(
      Object.assign(new Error("ERR_SCHEDULE_INVALID_MESSAGE"), {
        statusCode: 400
      })
    );

    await expect(
      createSchedule(auth, await confirmedCreateInput({ body: "oi" }))
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_INVALID_MESSAGE" });
    expect(createService).toHaveBeenCalledWith(
      expect.objectContaining({ body: "oi" })
    );
  });

  it("does not send media even when the schedule kind repeats yearly", async () => {
    await createSchedule(
      auth,
      await confirmedCreateInput({
        kind: "BIRTHDAY",
        audience_mode: "ALL",
        contact_ids: undefined,
        send_at: undefined,
        send_time: "09:00"
      })
    );

    const payload = createService.mock.calls[0][0];
    expect(payload.mediaPath).toBeUndefined();
    expect(payload).toMatchObject({
      kind: "BIRTHDAY",
      audienceMode: "ALL",
      sendTime: "09:00"
    });
  });

  it("refuses to persist before the user confirmation", async () => {
    const result = await previewSchedule(auth, input());

    await expect(
      createSchedule(auth, {
        ...input(),
        confirmation_token: result.preview.confirmationToken,
        confirmed: false
      })
    ).rejects.toMatchObject({
      message: "ERR_SCHEDULE_CONFIRMATION_REQUIRED"
    });
    expect(createService).not.toHaveBeenCalled();
  });

  it("refuses a preview token after any schedule field changes", async () => {
    const result = await previewSchedule(auth, input());

    await expect(
      createSchedule(auth, {
        ...input({ body: "Um texto diferente do que foi aprovado." }),
        confirmation_token: result.preview.confirmationToken,
        confirmed: true
      })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_PREVIEW_MISMATCH" });
    expect(createService).not.toHaveBeenCalled();
  });
});

describe("MCP schedule preview", () => {
  it("reports the audience and the variables without persisting anything", async () => {
    const result = await previewSchedule(auth, input());

    expect(result.persisted).toBe(false);
    expect(createService).not.toHaveBeenCalled();
    expect(result.preview).toMatchObject({
      eligibleCount: 4,
      excludedCount: 1,
      missingVariables: { apelido: 2 },
      estimatedDurationSeconds: 30,
      nextRunAt: "2026-08-21T18:00:00.000Z",
      timezone: "America/Sao_Paulo",
      sampleRenderedMessage: "Lembrete da sua consulta amanhã.",
      confirmationToken: expect.any(String),
      confirmationTokenExpiresAt: expect.any(String)
    });
  });

  it("flags a past date as information instead of rejecting it", async () => {
    // O domínio aceita data no passado e a tela também. Recusar só no MCP faria
    // o ChatGPT divergir do sistema.
    previewService.mockResolvedValue({
      eligibleCount: 1,
      excludedCount: 0,
      missingVariables: {},
      estimatedDurationSeconds: 0,
      nextRunAt: new Date("2020-01-01T10:00:00.000Z"),
      renderedMessage: "Lembrete antigo."
    });

    const result = await previewSchedule(
      auth,
      input({ send_at: "2020-01-01T07:00:00" })
    );

    expect(result.preview.isInPast).toBe(true);
  });

  it("does not flag a future date", async () => {
    previewService.mockResolvedValue({
      eligibleCount: 1,
      excludedCount: 0,
      missingVariables: {},
      estimatedDurationSeconds: 0,
      nextRunAt: new Date("2099-01-01T10:00:00.000Z"),
      renderedMessage: "Lembrete futuro."
    });

    const result = await previewSchedule(auth, input());

    expect(result.preview.isInPast).toBe(false);
  });

  it("simulates with the same tenant and owner the creation would use", async () => {
    await previewSchedule(auth, input());

    expect(previewService).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 3, userId: 7 })
    );
  });

  it("merges stored fields when previewing an edit", async () => {
    await previewSchedule(auth, {
      schedule_id: 21,
      body: "Texto novo do lembrete."
    });

    expect(showService).toHaveBeenCalledWith(21, 3);
    expect(previewService).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "ONCE",
        body: "Texto novo do lembrete.",
        audienceMode: "SELECTED",
        contactIds: [11],
        sendAt: "2026-08-21T18:00:00.000Z",
        timezone: "America/Sao_Paulo"
      })
    );
  });
});

describe("MCP schedule update", () => {
  it("only reaches schedules of the connected tenant", async () => {
    showService.mockRejectedValue(
      Object.assign(new Error("ERR_NO_SCHEDULE_FOUND"), { statusCode: 404 })
    );

    await expect(
      updateSchedule(auth, {
        schedule_id: 900,
        body: "Texto novo do lembrete."
      })
    ).rejects.toMatchObject({ message: "ERR_NO_SCHEDULE_FOUND" });
    expect(showService).toHaveBeenCalledWith(900, 3);
    expect(updateService).not.toHaveBeenCalled();
  });

  it("refuses an update that changes nothing", async () => {
    await expect(
      updateSchedule(auth, { schedule_id: 21 })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_NOTHING_TO_UPDATE" });
    expect(updateService).not.toHaveBeenCalled();
  });

  it("resends the stored date as ISO so editing only the text keeps the schedule", async () => {
    // O sendAt gravado volta como Date e parseOneTimeSchedule só entende ISO:
    // sem isto, alterar apenas o texto cairia em ERR_SCHEDULE_INVALID_DATE.
    await updateSchedule(
      auth,
      await confirmedUpdateInput({
        schedule_id: 21,
        body: "Texto novo do lembrete."
      })
    );

    expect(updateService).toHaveBeenCalledWith({
      id: 21,
      companyId: 3,
      scheduleData: {
        kind: "ONCE",
        body: "Texto novo do lembrete.",
        audienceMode: "SELECTED",
        contactIds: [11],
        sendAt: "2026-08-21T18:00:00.000Z",
        sendTime: undefined,
        timezone: "America/Sao_Paulo",
        commemorativeDateId: undefined
      }
    });
  });

  it("builds a complete target without exposing or changing media", async () => {
    await updateSchedule(
      auth,
      await confirmedUpdateInput({
        schedule_id: 21,
        contact_ids: [11, 11, 12]
      })
    );

    const payload = updateService.mock.calls[0][0].scheduleData;
    expect(payload.contactIds).toEqual([11, 12]);
    expect(payload.body).toBe("Lembrete da sua consulta amanhã.");
    expect(payload.sendTime).toBeUndefined();
    expect(payload).not.toHaveProperty("mediaPath");
    expect(payload).not.toHaveProperty("mediaName");
    expect(payload).not.toHaveProperty("mediaType");
  });

  it("refuses a time field that does not apply to the schedule kind", async () => {
    await expect(
      updateSchedule(auth, { schedule_id: 21, send_time: "09:00" })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_FIELD_NOT_APPLICABLE" });

    showService.mockResolvedValue(
      record({ kind: "BIRTHDAY", sendAt: null, sendTime: "09:00" })
    );
    await expect(
      updateSchedule(auth, {
        schedule_id: 21,
        send_at: "2026-08-21T15:00:00"
      })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_FIELD_NOT_APPLICABLE" });
    expect(updateService).not.toHaveBeenCalled();
  });

  it("does not resend a one-time date for a recurring schedule", async () => {
    showService.mockResolvedValue(
      record({ kind: "BIRTHDAY", sendAt: null, sendTime: "09:00" })
    );

    await updateSchedule(
      auth,
      await confirmedUpdateInput({ schedule_id: 21, send_time: "10:30" })
    );

    expect(updateService.mock.calls[0][0].scheduleData).toEqual({
      kind: "BIRTHDAY",
      body: "Lembrete da sua consulta amanhã.",
      audienceMode: "SELECTED",
      contactIds: [11],
      sendAt: undefined,
      commemorativeDateId: undefined,
      timezone: "America/Sao_Paulo",
      sendTime: "10:30"
    });
  });

  it("changes a one-time schedule into an automatic birthday schedule", async () => {
    await updateSchedule(
      auth,
      await confirmedUpdateInput({
        schedule_id: 21,
        kind: "BIRTHDAY",
        audience_mode: "ALL",
        send_time: "09:15"
      })
    );

    expect(updateService.mock.calls[0][0].scheduleData).toMatchObject({
      kind: "BIRTHDAY",
      audienceMode: "ALL",
      contactIds: undefined,
      sendAt: undefined,
      sendTime: "09:15",
      commemorativeDateId: undefined
    });
  });

  it("changes a recurring schedule into a one-time schedule", async () => {
    showService.mockResolvedValue(
      record({ kind: "BIRTHDAY", sendAt: null, sendTime: "09:00" })
    );

    await updateSchedule(
      auth,
      await confirmedUpdateInput({
        schedule_id: 21,
        kind: "ONCE",
        send_at: "2026-09-10T14:30:00"
      })
    );

    expect(updateService.mock.calls[0][0].scheduleData).toMatchObject({
      kind: "ONCE",
      sendAt: "2026-09-10T14:30:00",
      sendTime: undefined,
      commemorativeDateId: undefined
    });
  });

  it("changes a birthday schedule into a commemorative-date schedule", async () => {
    showService.mockResolvedValue(
      record({ kind: "BIRTHDAY", sendAt: null, sendTime: "09:00" })
    );

    await updateSchedule(
      auth,
      await confirmedUpdateInput({
        schedule_id: 21,
        kind: "COMMEMORATIVE",
        commemorative_date_id: 8,
        send_time: "10:00"
      })
    );

    expect(updateService.mock.calls[0][0].scheduleData).toMatchObject({
      kind: "COMMEMORATIVE",
      sendAt: undefined,
      sendTime: "10:00",
      commemorativeDateId: 8
    });
  });

  it("requires a new matching preview when editing", async () => {
    const approved = await confirmedUpdateInput({
      schedule_id: 21,
      body: "Texto aprovado na prévia."
    });

    await expect(
      updateSchedule(auth, {
        ...approved,
        body: "Texto alterado depois da prévia."
      })
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_PREVIEW_MISMATCH" });
    expect(updateService).not.toHaveBeenCalled();
  });

  it("propagates the domain block for a one-time schedule that already started", async () => {
    updateService.mockRejectedValue(
      Object.assign(new Error("ERR_SCHEDULE_ALREADY_STARTED"), {
        statusCode: 400
      })
    );

    await expect(
      updateSchedule(
        auth,
        await confirmedUpdateInput({
          schedule_id: 21,
          body: "Novo texto depois do início."
        })
      )
    ).rejects.toMatchObject({ message: "ERR_SCHEDULE_ALREADY_STARTED" });
  });

  it("emits the update on the tenant room", async () => {
    await updateSchedule(
      auth,
      await confirmedUpdateInput({
        schedule_id: 21,
        body: "Texto novo do lembrete."
      })
    );

    expect(room).toHaveBeenCalledWith("company-3-mainchannel");
    expect(emit).toHaveBeenCalledWith("company-3-schedule", {
      action: "update",
      schedule: expect.objectContaining({ id: 21 })
    });
  });
});

describe("MCP schedule authorization", () => {
  it("keeps simulation on the read scope and gates only the writes", () => {
    // Exigir escopo de escrita para simular inverteria o menor privilégio.
    expect(TOOL_SCOPES.preview_schedule).toBe("conversations:read");
    expect(TOOL_SCOPES.create_schedule).toBe("schedules:write");
    expect(TOOL_SCOPES.update_schedule).toBe("schedules:write");
  });

  it("keeps list_schedules readable by existing read-only connections", () => {
    expect(TOOL_SCOPES.list_schedules).toBe("conversations:read");
  });

  it("declares every registered tool scope as grantable", () => {
    Object.values(TOOL_SCOPES).forEach(scope => {
      expect(mcpConfig.scopes).toContain(scope);
    });
  });

  it("accepts the schedule write scope at the authorization endpoint", () => {
    expect(validateScopes("conversations:read schedules:write")).toEqual([
      "conversations:read",
      "schedules:write"
    ]);
    expect(() => validateScopes("schedules:delete")).toThrow("invalid_scope");
  });

  it("never audits the schedule text", () => {
    expect(
      sanitizeFilters({
        kind: "ONCE",
        body: "Lembrete da sua consulta amanhã.",
        contact_ids: [11, 12],
        send_at: "2026-08-21T15:00:00",
        confirmation_token: "temporary-secret"
      })
    ).toEqual({
      kind: "ONCE",
      contact_ids: [11, 12],
      send_at: "2026-08-21T15:00:00"
    });
  });
});
