import canReopenTicket from "./canReopenTicket";

it("allows an agent to reopen a ticket assigned to them", () => {
  expect(
    canReopenTicket({ id: 5, profile: "user" }, { user: { id: 5 }, userId: 5 })
  ).toBe(true);
});

it("denies an agent reopening a ticket assigned to another user", () => {
  expect(
    canReopenTicket({ id: 5, profile: "user" }, { user: { id: 8 }, userId: 8 })
  ).toBe(false);
});

it("allows an admin to reopen a ticket assigned to another user", () => {
  expect(
    canReopenTicket({ id: 5, profile: "admin" }, { user: { id: 8 }, userId: 8 })
  ).toBe(true);
});
