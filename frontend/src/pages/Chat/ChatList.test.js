import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatList from "./ChatList";
import { AuthContext } from "../../context/Auth/AuthContext";

jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({})
}));
jest.mock("../../components/AvatarUsuario", () => () => null);
jest.mock("../../components/interface/MenuAcoes", () => () => null);
jest.mock("../../components/ConfirmationModal", () => () => null);
jest.mock("../../translate/i18n", () => ({
  i18n: { language: "pt_PT", t: key => key }
}));

test("renders internal chat list activity dates with the supported pt_PT locale", () => {
  const { container } = render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: { id: 1 } }}>
        <ChatList
          chats={[
            {
              id: 7,
              uuid: "team",
              title: "Equipa",
              updatedAt: "2026-10-05T14:21:00Z"
            }
          ]}
        />
      </AuthContext.Provider>
    </MemoryRouter>
  );
  expect(container.querySelector("time").textContent).toBe("05/10");
});
