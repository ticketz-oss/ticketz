import { avatarIlustrado } from "./avatarIlustrado";
import templates from "./oneworksTemplates.json";

it("assigns stable local assets by type and persistent ID", () => {
  expect(avatarIlustrado("contato", 42)).toBe(avatarIlustrado("contato", 42));
  expect(avatarIlustrado("usuario", 42)).not.toBe(
    avatarIlustrado("contato", 42)
  );
  expect(avatarIlustrado("contato", undefined)).toBeUndefined();
  for (let id = 1; id <= 1000; id += 1) {
    const template = avatarIlustrado("contato", id).match(/\/([^/]+)\.svg$/)[1];
    expect(templates).toContain(template);
  }
});
