import { loadGoogleClerk } from "./googleAuth";
import { loadClerkBrowser } from "./loadClerkBrowser";

jest.mock("./api", () => ({}));
jest.mock("../helpers/getCompanySlug", () => () => "teste");
jest.mock("./loadClerkBrowser", () => ({ loadClerkBrowser: jest.fn() }));

test("a mobile browser entry initializes Clerk redirect defaults in the mobile flow", async () => {
  window.history.replaceState(null, "", "/login/mobile/google/callback");
  const clerk = {
    loaded: true,
    client: {},
    load: jest.fn().mockResolvedValue(undefined)
  };
  loadClerkBrowser.mockResolvedValue(clerk);
  await loadGoogleClerk({
    publishableKey: "pk_test_example",
    providers: { google: { enabled: true } }
  });
  expect(clerk.load).toHaveBeenCalledWith(
    expect.objectContaining({
      signInUrl: "/login/mobile/google/error",
      signUpUrl: "/login/mobile/google/error",
      signInForceRedirectUrl: "/login/mobile/google/complete",
      signUpForceRedirectUrl: "/login/mobile/google/complete",
      localization: { locale: "pt-BR" }
    })
  );
});
