import Whatsapp from "../../../models/Whatsapp";
import Message from "../../../models/Message";
import HandleMetaInboundMessageService from "../HandleMetaInboundMessageService";
import ProcessMetaWebhookEventService from "../ProcessMetaWebhookEventService";

jest.mock("../../../models/Whatsapp", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../models/Message", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));
jest.mock("../../../libs/socket", () => ({ getIO: jest.fn() }));
jest.mock("../../../utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn() }
}));
jest.mock("../HandleMetaInboundMessageService", () => ({
  __esModule: true,
  default: jest.fn()
}));

const environment = { ...process.env };
const incoming = { id: "wamid.inbound", from: "5511999999999", type: "text" };
const payload = {
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: "phone-1" },
            messages: [incoming],
            statuses: [{ id: "wamid.status", status: "read" }]
          }
        }
      ]
    }
  ]
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...environment };
  delete process.env.TENANT_RUNTIME_COMPANY_ID;
  delete process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS;
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    id: 4,
    companyId: 9,
    status: "CONNECTED",
    apiMode: "official"
  });
  (Message.findOne as jest.Mock).mockResolvedValue(null);
});

afterAll(() => {
  process.env = environment;
});

it("routes messages through the official phone binding and scopes acknowledgements to that tenant", async () => {
  await ProcessMetaWebhookEventService(payload);
  expect(Whatsapp.findOne).toHaveBeenCalledWith({
    where: { metaPhoneNumberId: "phone-1", apiMode: "official" }
  });
  expect(HandleMetaInboundMessageService).toHaveBeenCalledWith(
    expect.objectContaining({ companyId: 9 }),
    undefined,
    incoming
  );
  expect(Message.findOne).toHaveBeenCalledWith({
    where: { id: "wamid.status", companyId: 9 }
  });
});

it("ignores both inbound messages and receipts for an excluded tenant", async () => {
  process.env.TENANT_RUNTIME_EXCLUDED_COMPANY_IDS = "9";
  await ProcessMetaWebhookEventService(payload);
  expect(HandleMetaInboundMessageService).not.toHaveBeenCalled();
  expect(Message.findOne).not.toHaveBeenCalled();
});

it("ignores another tenant in a dedicated runtime", async () => {
  process.env.TENANT_RUNTIME_COMPANY_ID = "5";
  process.env.QUEUE_PREFIX = "dedicated-5";
  await ProcessMetaWebhookEventService(payload);
  expect(HandleMetaInboundMessageService).not.toHaveBeenCalled();
  expect(Message.findOne).not.toHaveBeenCalled();
});

it("keeps disconnected official connections inactive", async () => {
  (Whatsapp.findOne as jest.Mock).mockResolvedValue({
    id: 4,
    companyId: 9,
    status: "DISCONNECTED",
    apiMode: "official"
  });
  await ProcessMetaWebhookEventService(payload);
  expect(HandleMetaInboundMessageService).not.toHaveBeenCalled();
  expect(Message.findOne).not.toHaveBeenCalled();
});
