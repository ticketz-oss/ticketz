import { promises as fs } from "fs";
import { Transaction } from "sequelize";
import Setting from "../../../models/Setting";
import { saveSignupBranding } from "../SignupBrandingService";

jest.mock("fs", () => ({
  promises: { mkdir: jest.fn(), writeFile: jest.fn() }
}));
jest.mock("../../../config/upload", () => ({
  __esModule: true,
  default: { directory: "/test-public" }
}));
jest.mock("../../../models/Setting", () => ({
  __esModule: true,
  default: { bulkCreate: jest.fn() }
}));
const transaction = {} as Transaction;
const image = (field: string, content: string) => ({
  field,
  buffer: Buffer.from(content)
});
const settings = () =>
  Object.fromEntries(
    (Setting.bulkCreate as jest.Mock).mock.calls[0][0].map(({ key, value }) => [
      key,
      value
    ])
  );

beforeEach(() => {
  jest.resetAllMocks();
  (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
  (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
});

test("persists each image in the exact settings shown in the onboarding preview", async () => {
  const written: string[] = [];
  await saveSignupBranding(
    42,
    "Acme",
    "#5500ff",
    [
      image("logo", "icon"),
      image("banner", "banner"),
      image("sideImage", "art")
    ],
    transaction,
    written
  );
  const values = settings();
  const writes = (fs.writeFile as jest.Mock).mock.calls;
  const contentFor = (key: string) =>
    Buffer.from(
      writes.find(([file]) =>
        String(file).endsWith(values[key].split("/").pop())
      )[1]
    ).toString();
  expect(contentFor("appLogoFavicon")).toBe("icon");
  expect(contentFor("linkPreviewImage")).toBe("icon");
  expect(contentFor("appLogoLight")).toBe("banner");
  expect(contentFor("appLogoDark")).toBe("banner");
  expect(contentFor("loginSidePanelImage")).toBe("art");
  expect(values).not.toHaveProperty("loginBackgroundContent");
  expect(written).toHaveLength(5);
  expect(Setting.bulkCreate).toHaveBeenCalledWith(expect.any(Array), {
    transaction
  });
});

test("falls back to the icon for the full brand when a banner is omitted", async () => {
  await saveSignupBranding(
    42,
    "Acme",
    "#5500ff",
    [image("logo", "icon")],
    transaction,
    []
  );
  expect(settings()).toHaveProperty("appLogoLight");
  expect(settings()).toHaveProperty("appLogoDark");
  expect(
    (fs.writeFile as jest.Mock).mock.calls.map(([, buffer]) =>
      Buffer.from(buffer).toString()
    )
  ).toEqual(["icon", "icon", "icon", "icon"]);
});

test("does not create asset files when all images are optional and omitted", async () => {
  await saveSignupBranding(42, "Acme", "#5500ff", [], transaction, []);
  expect(fs.mkdir).not.toHaveBeenCalled();
  expect(settings()).toEqual({
    appName: "Acme",
    primaryColorLight: "#5500ff",
    primaryColorDark: "#5500ff",
    loginTemplate: "aurora"
  });
});

test("does not save incomplete branding and records every file for rollback", async () => {
  (fs.writeFile as jest.Mock).mockRejectedValueOnce(new Error("disk full"));
  const written: string[] = [];
  await expect(
    saveSignupBranding(
      42,
      "Acme",
      "#5500ff",
      [image("logo", "icon")],
      transaction,
      written
    )
  ).rejects.toThrow("disk full");
  expect(Setting.bulkCreate).not.toHaveBeenCalled();
  expect(written).toHaveLength(4);
});
