import "../../../database";
import WhatsappStatusPost from "../../../models/WhatsappStatusPost";

// Registering the models only builds metadata; no connection is opened.
jest.mock("../../../config/database", () => ({ dialect: "postgres" }));

describe("WhatsappStatusPost model", () => {
  it("registers WhatsappStatusPost with the unique company/idempotency index", () => {
    const attributes = Object.keys(WhatsappStatusPost.getAttributes());
    [
      "id",
      "companyId",
      "whatsappId",
      "createdByUserId",
      "kind",
      "body",
      "mediaPath",
      "mediaMime",
      "backgroundColor",
      "font",
      "audienceMode",
      "contactListId",
      "audienceCount",
      "scheduledAt",
      "state",
      "remoteMessageId",
      "attemptStartedAt",
      "publishedAt",
      "expiresAt",
      "failureCode",
      "idempotencyKey",
      "createdAt",
      "updatedAt"
    ].forEach(name => expect(attributes).toContain(name));
    expect(WhatsappStatusPost.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unique: true,
          fields: ["companyId", "idempotencyKey"]
        })
      ])
    );
    expect(WhatsappStatusPost.getAttributes().state.defaultValue).toBe("draft");
  });
});
