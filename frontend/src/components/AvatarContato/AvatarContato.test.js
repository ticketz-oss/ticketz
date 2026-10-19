import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import AvatarContato from "./index";
import api from "../../services/api";
import { avatarIlustrado } from "../../helpers/avatarIlustrado";
jest.mock("../../services/api", () => ({ post: jest.fn() }));
jest.mock("../OneWorksMotion", () => ({ src, alt, onError }) => (
  <img src={src} alt={alt} onError={onError} />
));
beforeEach(() => {
  api.post.mockReset();
  api.post.mockResolvedValue({ data: {} });
});
it("loads directly without downloading/storing image files or querying the API", () => {
  render(
    <AvatarContato
      contact={{
        id: 1,
        name: "Cliente",
        profilePicUrl: "https://pps.whatsapp.net/a"
      }}
    />
  );
  expect(screen.getByRole("img").getAttribute("referrerpolicy")).toBe(
    "no-referrer"
  );
  expect(api.post).not.toHaveBeenCalled();
});
it("tries the existing high-resolution URL before refreshing", () => {
  render(
    <AvatarContato
      contact={{ id: 1, profilePicUrl: "bad", profileHiresPictureUrl: "good" }}
    />
  );
  fireEvent.error(screen.getByRole("img"));
  expect(screen.getByRole("img").getAttribute("src")).toBe("good");
  expect(api.post).not.toHaveBeenCalled();
});
it("recovers a missing photo automatically", async () => {
  api.post.mockResolvedValue({ data: { profilePicUrl: "new" } });
  render(<AvatarContato contact={{ id: 1 }}>AB</AvatarContato>);
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toBe("new")
  );
  expect(api.post).toHaveBeenCalledWith("/contacts/1/picture/refresh");
});
it("stops after one refresh when both URLs fail", async () => {
  api.post.mockResolvedValue({ data: { profilePicUrl: "bad" } });
  render(
    <AvatarContato contact={{ id: 1, profilePicUrl: "bad" }}>AB</AvatarContato>
  );
  fireEvent.error(screen.getByRole("img"));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("img").getAttribute("src")).toBe(
    avatarIlustrado("contato", 1)
  );
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("AB")).toBeTruthy();
});
it("ignores a stale response after switching contacts", async () => {
  let resolve;
  api.post.mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  const { rerender } = render(<AvatarContato contact={{ id: 1 }} />);
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  rerender(<AvatarContato contact={{ id: 2, profilePicUrl: "other" }} />);
  await act(async () => resolve({ data: { profilePicUrl: "stale" } }));
  expect(screen.getByRole("img").getAttribute("src")).toBe("other");
});
it("resets failures on updated URLs and avoids other channels", async () => {
  const { rerender } = render(
    <AvatarContato contact={{ id: 1, channel: "telegram" }}>AB</AvatarContato>
  );
  await act(async () => {});
  expect(api.post).not.toHaveBeenCalled();
  rerender(<AvatarContato contact={{ id: 1, profilePicUrl: "updated" }} />);
  expect(screen.getByRole("img").getAttribute("src")).toBe("updated");
});

it("keeps group initials when there is no picture", async () => {
  render(<AvatarContato contact={{ id: 3, isGroup: true }}>GP</AvatarContato>);
  await act(async () => {});
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("GP")).toBeTruthy();
});

it("opens the image actually displayed after a broken contact photo", () => {
  render(
    <AvatarContato
      contact={{
        id: 9,
        name: "Ana",
        profilePicUrl: "bad",
        channel: "telegram"
      }}
      preview
    />
  );
  fireEvent.error(screen.getByRole("img"));
  const button = screen.getByRole("button", { name: "Ana" });
  expect(button.className).toContain("one-works-avatar");
  fireEvent.click(button);
  expect(
    screen.getByRole("dialog").querySelector("img").getAttribute("src")
  ).toBe(avatarIlustrado("contato", 9));
});
