import AppError from "../../../errors/AppError";
import {
  assertTaskBoardDateRange,
  clampTaskPosition,
  cleanTaskBoardColor,
  cleanTaskBoardDescription,
  cleanTaskBoardTitle,
  completedAtForDestination,
  parseTaskBoardDate,
  parseTaskBoardTarget
} from "../taskBoardRules";

describe("task board rules", () => {
  it("normalizes titles and colors", () => {
    expect(cleanTaskBoardTitle("  Revisar proposta  ", 255)).toBe(
      "Revisar proposta"
    );
    expect(cleanTaskBoardColor("#1a2b3c")).toBe("#1A2B3C");
    expect(cleanTaskBoardColor(null)).toBeNull();
  });

  it("rejects invalid titles and colors", () => {
    expect(() => cleanTaskBoardTitle("   ", 255)).toThrow(AppError);
    expect(() => cleanTaskBoardColor("blue")).toThrow(AppError);
  });

  it("validates descriptions and the three approved target types", () => {
    expect(cleanTaskBoardDescription("  Detalhes  ")).toBe("Detalhes");
    expect(parseTaskBoardTarget(undefined)).toBe("GLOBAL");
    expect(parseTaskBoardTarget("user")).toBe("USER");
    expect(parseTaskBoardTarget("QUEUE")).toBe("QUEUE");
    expect(() => parseTaskBoardTarget("COMPANY")).toThrow(
      "ERR_TASK_BOARD_INVALID_TARGET"
    );
    expect(() => cleanTaskBoardDescription("x".repeat(10001))).toThrow(
      "ERR_TASK_BOARD_INVALID_DESCRIPTION"
    );
  });

  it("validates completion date ranges", () => {
    const from = parseTaskBoardDate("2026-08-01T00:00:00.000Z");
    const to = parseTaskBoardDate("2026-08-31T23:59:59.999Z");
    expect(() => assertTaskBoardDateRange(from, to)).not.toThrow();
    expect(() => assertTaskBoardDateRange(to, from)).toThrow(
      "ERR_TASK_BOARD_INVALID_DATE_RANGE"
    );
    expect(() => parseTaskBoardDate("invalid")).toThrow(
      "ERR_TASK_BOARD_INVALID_DATE"
    );
  });

  it("sets and clears the completion timestamp by destination", () => {
    const now = new Date("2026-08-31T12:00:00.000Z");
    expect(completedAtForDestination(true, null, now)).toEqual(now);
    expect(completedAtForDestination(true, now, new Date())).toEqual(now);
    expect(completedAtForDestination(false, now, new Date())).toBeNull();
  });

  it("clamps task positions to the destination list", () => {
    expect(clampTaskPosition(-2, 3)).toBe(0);
    expect(clampTaskPosition(2, 3)).toBe(2);
    expect(clampTaskPosition(8, 3)).toBe(3);
    expect(clampTaskPosition(Number.NaN, 3)).toBe(3);
  });
});
