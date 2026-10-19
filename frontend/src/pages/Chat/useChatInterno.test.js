import React from "react";
import { act, render } from "@testing-library/react";
import { MemoryRouter, Route, useHistory } from "react-router-dom";
import useChatInterno from "./useChatInterno";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";

jest.mock("../../services/api", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../../errors/toastError", () => jest.fn());
jest.mock("../../context/Auth/AuthContext", () => ({
  AuthContext: require("react").createContext({})
}));
jest.mock("../../context/Socket/SocketContext", () => ({
  SocketContext: require("react").createContext({})
}));

let chat;
let history;
let handlers;
const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};
const record = id => ({ id, chatId: 7, senderId: 2 });
const response = (records, hasMore = false) => ({ data: { records, hasMore } });
const Probe = () => {
  chat = useChatInterno();
  history = useHistory();
  return null;
};
const setup = async () => {
  await act(async () =>
    render(
      <MemoryRouter initialEntries={["/chats/alpha"]}>
        <AuthContext.Provider value={{ user: { id: 1, companyId: 3 } }}>
          <SocketContext.Provider
            value={{
              GetSocket: () => ({
                on: (event, callback) => {
                  handlers[event] = callback;
                },
                disconnect: jest.fn()
              })
            }}
          >
            <Route path="/chats/:id?">
              <Probe />
            </Route>
          </SocketContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    )
  );
};
beforeEach(() => {
  handlers = {};
  api.post.mockResolvedValue({ data: {} });
  api.get.mockImplementation(url => {
    if (url === "/chats/alpha")
      return Promise.resolve({ data: { id: 7, uuid: "alpha" } });
    if (url === "/chats/beta")
      return Promise.resolve({ data: { id: 8, uuid: "beta" } });
    if (url === "/chats/7/messages")
      return Promise.resolve(response([record(1), record(2)]));
    return Promise.resolve(response([]));
  });
});
test("reconnect catches up through every missed page without duplicating existing history", async () => {
  await setup();
  api.get.mockImplementation((url, config) => {
    if (url === "/chats") return Promise.resolve(response([]));
    if (config.params.pageNumber === 1)
      return Promise.resolve(response([record(5), record(6)], true));
    return Promise.resolve(response([record(2), record(3), record(4)], true));
  });
  await act(async () => handlers.wsRefreshRequired(true));
  expect(chat.mensagens.map(item => item.id)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(api.get).toHaveBeenCalledWith("/chats/7/messages", {
    params: { pageNumber: 2 }
  });
});
test("late history from a closed conversation cannot replace messages or mark it read", async () => {
  const pending = deferred();
  api.get.mockImplementation(url => {
    if (url === "/chats/alpha")
      return Promise.resolve({ data: { id: 7, uuid: "alpha" } });
    return pending.promise;
  });
  await setup();
  await act(async () => history.push("/chats"));
  await act(async () => pending.resolve(response([record(9)])));
  expect(chat.mensagens).toEqual([]);
  expect(chat.conversa).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});
test("reconnect response from previous conversation never contaminates new conversation", async () => {
  await setup();
  const pending = deferred();
  const original = api.get.getMockImplementation();
  api.get.mockImplementation((url, config) =>
    url === "/chats/7/messages" ? pending.promise : original(url, config)
  );
  act(() => handlers.wsRefreshRequired(true));
  await act(async () => history.push("/chats/beta"));
  await act(async () => pending.resolve(response([record(10)])));
  expect(chat.conversa.id).toBe(8);
  expect(chat.mensagens).toEqual([]);
});
