/** @jest-environment node */

import { optimisticMove, tasksInColumn } from "./taskBoardState";
import {
  DEADLINE_WARNING_RATIO,
  deadlineState,
  toTaskIsoDate
} from "./taskBoardV2";

const columns = {
  todo: { id: 1, isDone: false },
  doing: { id: 2, isDone: false },
  done: { id: 3, isDone: true }
};

const seed = [
  { id: 1, title: "A", columnId: 1, position: 0, completedAt: null },
  { id: 2, title: "B", columnId: 1, position: 1, completedAt: null },
  { id: 3, title: "C", columnId: 2, position: 0, completedAt: null }
];

describe("task board optimistic movement", () => {
  it("reorders tasks inside a column", () => {
    const moved = optimisticMove(seed, 1, columns.todo, 1);
    expect(tasksInColumn(moved, 1).map(task => task.id)).toEqual([2, 1]);
  });

  it("moves a task between columns and normalizes both lists", () => {
    const moved = optimisticMove(seed, 2, columns.doing, 0);
    expect(tasksInColumn(moved, 1).map(task => task.id)).toEqual([1]);
    expect(tasksInColumn(moved, 2).map(task => task.id)).toEqual([2, 3]);
  });

  it("sets and clears the visible completion date", () => {
    const completed = optimisticMove(seed, 1, columns.done, 0);
    const doneTask = tasksInColumn(completed, 3)[0];
    expect(doneTask.completedAt).toBeTruthy();

    const reopened = optimisticMove(completed, 1, columns.todo, 0);
    expect(tasksInColumn(reopened, 1)[0].completedAt).toBeNull();
  });
});

describe("task board v2 rules", () => {
  const task = {
    createdAt: "2026-09-04T10:00:00.000Z",
    dueAt: "2026-09-04T14:00:00.000Z",
    completedAt: null
  };

  it("uses the named 75% deadline boundary", () => {
    expect(DEADLINE_WARNING_RATIO).toBe(0.75);
    expect(deadlineState(task, new Date("2026-09-04T12:59:59.000Z"))).toBe(
      "ok"
    );
    expect(deadlineState(task, new Date("2026-09-04T13:00:00.000Z"))).toBe(
      "warning"
    );
    expect(deadlineState(task, new Date("2026-09-04T14:00:01.000Z"))).toBe(
      "overdue"
    );
  });

  it("does not flag completed or undated tasks", () => {
    expect(deadlineState({ ...task, completedAt: task.dueAt })).toBe("none");
    expect(deadlineState({ ...task, dueAt: null })).toBe("none");
  });

  it("converts datetime-local values to absolute ISO instants", () => {
    expect(toTaskIsoDate("2026-09-04T14:30")).toMatch(/^2026-09-04T/);
    expect(toTaskIsoDate("")).toBeNull();
  });
});
