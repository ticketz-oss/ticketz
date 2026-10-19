import chatMediaUrl from "./chatMediaUrl";
import { getBackendURL } from "../services/config";
jest.mock("../services/config", () => ({ getBackendURL: jest.fn() }));
beforeEach(() => getBackendURL.mockReturnValue("/backend"));
test.each([
  "https://dev.espacowhats.com.br/backend/public/photo.png?inline=1",
  "http://dev.espacowhats.com.br/public/photo.png?inline=1",
  "/public/photo.png?inline=1",
  "/backend/public/photo.png?inline=1"
])("routes stored uploads through the current tenant: %s", value => {
  expect(chatMediaUrl(value)).toBe("/backend/public/photo.png?inline=1");
});
test("supports a separately configured local backend", () => {
  getBackendURL.mockReturnValue("http://localhost:8080/");
  expect(chatMediaUrl("/public/audio.mp3")).toBe(
    "http://localhost:8080/public/audio.mp3"
  );
});
test.each([
  null,
  undefined,
  "",
  "blob:preview",
  "data:image/png;base64,AAA",
  "https://example.com/image.png"
])("preserves other sources: %s", value => {
  expect(chatMediaUrl(value)).toBe(value);
});
