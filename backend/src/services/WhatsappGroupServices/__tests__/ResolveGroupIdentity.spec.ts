import {
  getGroupContactCacheKey,
  resolveGroupIdentity
} from "../ResolveGroupIdentity";

it("isolates the group cache by company and WhatsApp connection", () => {
  const first = getGroupContactCacheKey(1, 10, "123@g.us");
  const otherCompany = getGroupContactCacheKey(2, 10, "123@g.us");
  const otherConnection = getGroupContactCacheKey(1, 11, "123@g.us");

  expect(new Set([first, otherCompany, otherConnection]).size).toBe(3);
});

it("keeps processing with a temporary name when metadata fails", async () => {
  const onError = jest.fn();

  await expect(
    resolveGroupIdentity(
      "123@g.us",
      async () => {
        throw new Error("temporary outage");
      },
      onError
    )
  ).resolves.toEqual({
    id: "123@g.us",
    name: "Grupo 123",
    metadataLoaded: false
  });
  expect(onError).toHaveBeenCalledTimes(1);
});

it("uses the current WhatsApp subject when metadata is available", async () => {
  await expect(
    resolveGroupIdentity("123@g.us", async () => ({ subject: "Equipe" }))
  ).resolves.toEqual({
    id: "123@g.us",
    name: "Equipe",
    metadataLoaded: true
  });
});
