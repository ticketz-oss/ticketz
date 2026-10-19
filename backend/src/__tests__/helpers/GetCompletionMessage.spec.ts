import getCompletionMessage from "../../helpers/GetCompletionMessage";

describe("getCompletionMessage", () => {
  it("does not create a default completion message", () => {
    expect(getCompletionMessage(undefined)).toBeNull();
    expect(getCompletionMessage(null)).toBeNull();
    expect(getCompletionMessage("   ")).toBeNull();
  });

  it("keeps a configured completion message", () => {
    expect(getCompletionMessage("  Obrigado pelo contato  ")).toBe(
      "Obrigado pelo contato"
    );
  });
});
