import { isCurrentSession } from "../../services/WbotServices/SessionFence";

test("rejects stale and absent session identities", () => {
  expect(isCurrentSession("new", "old")).toBe(false);
  expect(isCurrentSession(null, "old")).toBe(false);
  expect(isCurrentSession(null, "")).toBe(false);
  expect(isCurrentSession("active", "active")).toBe(true);
});

test("rejects a stopped socket even if its session is still active", () => {
  expect(isCurrentSession("active", "active", false)).toBe(false);
});
