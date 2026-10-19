import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TagsLine, { uniqueTags } from "./index";
jest.mock("../../translate/i18n", () => ({ i18n: { t: key => key } }));

test("deduplicates contact and ticket tags by id without dropping distinct tags", () => {
  expect(
    uniqueTags({
      tags: [{ id: 1, name: "AC Norte" }],
      contact: {
        tags: [
          { id: "1", name: "AC Norte" },
          { id: 2, name: "Financeiro" }
        ]
      }
    })
  ).toHaveLength(2);
  expect(uniqueTags({})).toEqual([]);
});
test("wraps tags and expands overflow without opening the ticket", () => {
  const open = jest.fn();
  const ticket = {
    tags: [1, 2, 3, 4, 5].map(id => ({ id, name: `Etiqueta ${id}` }))
  };
  render(
    <div onClick={open}>
      <TagsLine ticket={ticket} />
    </div>
  );
  expect(screen.queryByText("Etiqueta 4")).toBeNull();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Etiqueta 5")).toBeTruthy();
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  expect(open).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.queryByText("Etiqueta 5")).toBeNull();
});
