/** @jest-environment node */

import {
  filterTransferQueues,
  shouldShowConnectionSelection
} from "./transferOptions";

const connections = [
  { id: 1, queues: [{ id: 10 }, { id: 11 }] },
  { id: 2, queues: [{ id: 12 }, { id: 13 }] }
];

it("filters queues first by connection and then by the selected user", () => {
  expect(filterTransferQueues(connections, 2, null)).toEqual([
    { id: 12 },
    { id: 13 }
  ]);
  expect(
    filterTransferQueues(connections, 2, { queues: [{ id: 13 }] })
  ).toEqual([{ id: 13 }]);
});

it("shows the connection step only for direct tickets with alternatives", () => {
  expect(shouldShowConnectionSelection(connections, false)).toBe(true);
  expect(shouldShowConnectionSelection([connections[0]], false)).toBe(false);
  expect(shouldShowConnectionSelection(connections, true)).toBe(false);
});
