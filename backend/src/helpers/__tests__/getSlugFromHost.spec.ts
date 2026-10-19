import getSlugFromHost from "../getSlugFromHost";

const previous = process.env.APP_BASE_DOMAIN;
afterEach(() => {
  if (previous === undefined) delete process.env.APP_BASE_DOMAIN;
  else process.env.APP_BASE_DOMAIN = previous;
});

test("resolves local tenant link previews without configuring a production domain", () => {
  delete process.env.APP_BASE_DOMAIN;
  expect(getSlugFromHost("acme.localhost:3000")).toBe("acme");
  expect(getSlugFromHost("localhost:3000")).toBe("");
  expect(getSlugFromHost("acme.unrelated.test")).toBe("");
  expect(getSlugFromHost("admin.localhost:3000")).toBe("");
});

test("preserves explicit production domain isolation", () => {
  process.env.APP_BASE_DOMAIN = "espacowhats.com.br";
  expect(getSlugFromHost("acme.espacowhats.com.br")).toBe("acme");
  expect(getSlugFromHost("acme.localhost:3000")).toBe("");
  expect(getSlugFromHost("acme.other.com.br")).toBe("");
});
