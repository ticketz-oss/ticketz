import { loadClerkBrowser } from "./loadClerkBrowser";
const key = `pk_test_${btoa("sample.clerk.accounts.dev$")}`;
beforeEach(() => {
  document.getElementById("espaco-clerk-sdk")?.remove();
  delete window.Clerk;
});
afterEach(() => {
  jest.useRealTimers();
});
test("loads pinned official browser SDK without a React dependency or hosted UI", async () => {
  const result = loadClerkBrowser(key);
  const script = document.getElementById("espaco-clerk-sdk");
  expect(script.src).toBe(
    "https://sample.clerk.accounts.dev/npm/@clerk/clerk-js@6.31.1/dist/clerk.browser.js"
  );
  expect(script.getAttribute("data-clerk-publishable-key")).toBe(key);
  window.Clerk = { publishableKey: key, load: jest.fn() };
  script.onload();
  await expect(result).resolves.toBe(window.Clerk);
});
test("rejects malformed domains, foreign loaded instances and failed downloads", async () => {
  await expect(
    loadClerkBrowser(`pk_test_${btoa("evil.com/path$")}`)
  ).rejects.toThrow();
  const result = loadClerkBrowser(key);
  window.Clerk = { publishableKey: "another-instance", load: jest.fn() };
  document.getElementById("espaco-clerk-sdk").onload();
  await expect(result).rejects.toThrow();
  expect(document.getElementById("espaco-clerk-sdk")).toBeNull();
  const download = loadClerkBrowser(key);
  document.getElementById("espaco-clerk-sdk").onerror();
  await expect(download).rejects.toThrow();
});
test("SDK timeout fails closed and cleans the script", async () => {
  jest.useFakeTimers();
  const result = loadClerkBrowser(key);
  const rejection = expect(result).rejects.toThrow();
  jest.advanceTimersByTime(20000);
  await rejection;
  expect(document.getElementById("espaco-clerk-sdk")).toBeNull();
});
