import {
  beginWhatsAppSessionStart,
  isWhatsAppSessionStartPending
} from "../../services/WbotServices/SessionStartTracker";

test("tracks a start until explicitly finished", () => {
  const finishStart = beginWhatsAppSessionStart(7);
  expect(isWhatsAppSessionStartPending(7)).toBe(true);
  finishStart();
  expect(isWhatsAppSessionStartPending(7)).toBe(false);
});

test("keeps the start pending while overlapping starts remain", () => {
  const finishFirst = beginWhatsAppSessionStart(8);
  const finishSecond = beginWhatsAppSessionStart(8);
  finishFirst();
  expect(isWhatsAppSessionStartPending(8)).toBe(true);
  finishSecond();
  expect(isWhatsAppSessionStartPending(8)).toBe(false);
});
