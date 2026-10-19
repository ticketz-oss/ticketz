import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AvatarUsuario from "./index";
import { avatarIlustrado } from "../../helpers/avatarIlustrado";
jest.mock("../OneWorksMotion", () => ({ src, alt, onError }) => (
  <img src={src} alt={alt} onError={onError} />
));

it("uses the same illustration when the user name changes", () => {
  const { rerender } = render(
    <AvatarUsuario usuario={{ id: 8, name: "Ana" }} />
  );
  const src = screen.getByRole("img").getAttribute("src");
  expect(src).toBe(avatarIlustrado("usuario", 8));
  rerender(<AvatarUsuario usuario={{ id: 8, name: "Beatriz" }} />);
  expect(screen.getByRole("img").getAttribute("src")).toBe(src);
});

it("uses a real photo first and recovers when its URL changes", () => {
  const { rerender } = render(
    <AvatarUsuario usuario={{ id: 8, name: "Ana", profilePicUrl: "bad" }} />
  );
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    avatarIlustrado("usuario", 8)
  );
  rerender(
    <AvatarUsuario usuario={{ id: 8, name: "Ana", profilePicUrl: "new" }} />
  );
  expect(screen.getByRole("img").getAttribute("src")).toBe("new");
});

it("falls back to initials if the catalog image fails", () => {
  render(<AvatarUsuario usuario={{ id: 8, name: "Ana Lima" }} />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("AL")).toBeTruthy();
});

it("opens a preview of the fallback user avatar", () => {
  render(<AvatarUsuario usuario={{ id: 8, name: "Ana" }} preview />);
  fireEvent.click(screen.getByRole("button", { name: "Ana" }));
  expect(
    screen.getByRole("dialog").querySelector("img").getAttribute("src")
  ).toBe(avatarIlustrado("usuario", 8));
});
