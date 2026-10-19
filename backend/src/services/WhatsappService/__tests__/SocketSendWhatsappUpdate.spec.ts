import { getIO } from "../../../libs/socket";
import Whatsapp from "../../../models/Whatsapp";
import { sendWhatsappUpdate } from "../SocketSendWhatsappUpdate";

jest.mock("../../../libs/socket", () => ({ getIO: jest.fn() }));

describe("sendWhatsappUpdate", () => {
  it("includes apiMode so a freshly created official connection shows the Meta connect button without a page refresh", () => {
    const emit = jest.fn();
    (getIO as jest.MockedFunction<typeof getIO>).mockReturnValue({
      to: jest.fn().mockReturnValue({ emit })
    } as unknown as ReturnType<typeof getIO>);

    const whatsapp = {
      id: 7,
      companyId: 1,
      name: "Oficial",
      channel: "whatsapp",
      status: "DISCONNECTED",
      qrcode: "",
      isDefault: false,
      updatedAt: new Date(),
      apiMode: "official",
      session: ""
    } as unknown as Whatsapp;

    sendWhatsappUpdate(whatsapp);

    const payload = emit.mock.calls[0][1];
    expect(payload.whatsapp.apiMode).toBe("official");
  });
});
