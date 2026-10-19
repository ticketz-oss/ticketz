import Whatsapp from "../../../models/Whatsapp";
import { getMetaGraphApiClient } from "../MetaGraphApiClient";
import { listMetaTemplates } from "../MetaTemplateRegistryService";

jest.mock("../MetaGraphApiClient", () => ({
  getMetaGraphApiClient: jest.fn(),
  withAuth: jest.fn(() => ({ headers: { Authorization: "Bearer test" } }))
}));
const get = jest.fn();
const connection = { metaWabaId: "123", metaAccessToken: "test" } as Whatsapp;
beforeEach(() => {
  jest.clearAllMocks();
  get.mockReset();
  (getMetaGraphApiClient as jest.Mock).mockReturnValue({ get });
});
it("collects every page using the original Graph endpoint and only the cursor", async () => {
  get
    .mockResolvedValueOnce({
      data: {
        data: [{ id: "1" }],
        paging: {
          next: "https://graph.facebook.com/v21.0/123/message_templates?after=next&access_token=untrusted"
        }
      }
    })
    .mockResolvedValueOnce({ data: { data: [{ id: "2" }] } });
  await expect(listMetaTemplates(connection)).resolves.toEqual([
    { id: "1" },
    { id: "2" }
  ]);
  expect(get).toHaveBeenNthCalledWith(
    2,
    "/123/message_templates",
    expect.objectContaining({
      params: expect.objectContaining({ after: "next" })
    })
  );
  expect(get.mock.calls[1][1].params.access_token).toBeUndefined();
});
it.each([
  "https://evil.example/123/message_templates?after=x",
  "http://graph.facebook.com/123/message_templates?after=x",
  "https://graph.facebook.com/999/message_templates?after=x"
])("rejects an unsafe next page %s", async next => {
  get.mockResolvedValue({ data: { data: [], paging: { next } } });
  await expect(listMetaTemplates(connection)).rejects.toMatchObject({
    message: "ERR_META_TEMPLATE_PAGINATION"
  });
  expect(get).toHaveBeenCalledTimes(1);
});
it("rejects repeated cursors instead of looping", async () => {
  get.mockResolvedValue({
    data: {
      data: [],
      paging: {
        next: "https://graph.facebook.com/123/message_templates?after=x"
      }
    }
  });
  await expect(listMetaTemplates(connection)).rejects.toMatchObject({
    message: "ERR_META_TEMPLATE_PAGINATION"
  });
  expect(get).toHaveBeenCalledTimes(2);
});
