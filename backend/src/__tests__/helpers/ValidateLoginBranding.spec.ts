import validateLoginBranding from "../../helpers/validateLoginBranding";

const expectInvalid = (key: string, value: unknown): void => {
  let thrown: unknown;
  try {
    validateLoginBranding(key, value);
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toMatchObject({
    message: "ERR_INVALID_LOGIN_BRANDING",
    statusCode: 400
  });
};

describe("validateLoginBranding", () => {
  it.each([
    ["loginHeadline", 120],
    ["loginDescription", 240]
  ] as const)("accepts %s exactly at its character limit", (key, limit) => {
    expect(() => validateLoginBranding(key, "a".repeat(limit))).not.toThrow();
    expect(() => validateLoginBranding(key, "")).not.toThrow();
    expect(() =>
      validateLoginBranding(key, "Olá, bem-vindo à AC Norte!")
    ).not.toThrow();
  });

  it.each([
    ["loginHeadline", 120],
    ["loginDescription", 240]
  ] as const)("rejects %s above its character limit", (key, limit) => {
    expectInvalid(key, "a".repeat(limit + 1));
  });

  it.each([null, undefined, 123, true, {}, [], ["text"]])(
    "rejects non-string login content %j",
    value => {
      expectInvalid("loginHeadline", value);
      expectInvalid("loginDescription", value);
    }
  );

  it.each(["", "aurora", "minimal"])(
    "accepts the supported template %s",
    value => {
      expect(() => validateLoginBranding("loginTemplate", value)).not.toThrow();
    }
  );

  it.each([
    "unknown",
    "Aurora",
    " aurora ",
    "<script>",
    null,
    undefined,
    0,
    false,
    {},
    ["aurora"]
  ])("rejects unsupported or incorrectly typed template %j", value => {
    expectInvalid("loginTemplate", value);
  });

  it("does not impose login validation on unrelated existing settings", () => {
    expect(() =>
      validateLoginBranding("primaryColorLight", "#102030")
    ).not.toThrow();
    expect(() => validateLoginBranding("otherSetting", true)).not.toThrow();
    expect(() => validateLoginBranding("constructor", "value")).not.toThrow();
  });
});
