jest.mock("../../../libs/cache", () => ({
  cacheLayer: { get: jest.fn(), set: jest.fn(), del: jest.fn() }
}));
import { cacheLayer } from "../../../libs/cache";
import GetProfilePicUrl, {
  invalidateProfilePicture
} from "../GetProfilePicUrl";

const bot = { id: 7, profilePictureUrl: jest.fn() };
beforeEach(() => {
  jest.resetAllMocks();
});
it("returns the first fetched URL, not only subsequent cache hits", async () => {
  bot.profilePictureUrl.mockResolvedValue("https://pps.whatsapp.net/photo.jpg");
  expect(await GetProfilePicUrl("123@s.whatsapp.net", "preview", bot)).toBe(
    "https://pps.whatsapp.net/photo.jpg"
  );
  expect(cacheLayer.set).toHaveBeenCalledWith(
    "picurl:v2:7:preview:123@s.whatsapp.net",
    "https://pps.whatsapp.net/photo.jpg",
    "EX",
    3600
  );
});
it("isolates cached URLs by WhatsApp session and photo size", async () => {
  (cacheLayer.get as jest.Mock).mockResolvedValue("cached");
  expect(await GetProfilePicUrl("123", "image", bot)).toBe("cached");
  await GetProfilePicUrl("123", "preview", { ...bot, id: 8 });
  expect(cacheLayer.get).toHaveBeenNthCalledWith(1, "picurl:v2:7:image:123");
  expect(cacheLayer.get).toHaveBeenNthCalledWith(2, "picurl:v2:8:preview:123");
  expect(bot.profilePictureUrl).not.toHaveBeenCalled();
});
it("invalidates both sizes using the same scoped keys", async () => {
  await invalidateProfilePicture("123", bot);
  expect(cacheLayer.del).toHaveBeenCalledWith("picurl:v2:7:preview:123");
  expect(cacheLayer.del).toHaveBeenCalledWith("picurl:v2:7:image:123");
});
it("does not cache empty or expired URLs", async () => {
  bot.profilePictureUrl
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce("https://pps.whatsapp.net/p?oe=1");
  await GetProfilePicUrl("123", "preview", bot);
  await GetProfilePicUrl("123", "image", bot);
  expect(cacheLayer.set).not.toHaveBeenCalled();
});
it("caps the cache lifetime before the signed URL expires", async () => {
  const expiry = Math.floor(Date.now() / 1000) + 600;
  bot.profilePictureUrl.mockResolvedValue(
    `https://pps.whatsapp.net/p?oe=${expiry.toString(16)}`
  );
  await GetProfilePicUrl("123", "image", bot);
  const ttl = (cacheLayer.set as jest.Mock).mock.calls[0][3];
  expect(ttl).toBeGreaterThan(530);
  expect(ttl).toBeLessThanOrEqual(540);
});
