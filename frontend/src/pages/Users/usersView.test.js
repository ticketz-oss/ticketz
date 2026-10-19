import { filterUsersByQueue, groupUsersByProfile } from "./usersView";
import { messages } from "../../translate/languages";

const users = [
  { id: 1, profile: "user", queues: [{ id: 10 }] },
  { id: 2, profile: "admin", queues: [{ id: 20 }] },
  { id: 3, profile: "user", queues: [{ id: 10 }, { id: 20 }] },
  { id: 4, profile: "auditor", queues: [] }
];

test("filtra usuários por fila aceitando o valor textual do Select", () => {
  expect(filterUsersByQueue(users, "10").map(user => user.id)).toEqual([1, 3]);
  expect(filterUsersByQueue(users, "")).toBe(users);
});

test("separa administradores e usuários na ordem visual esperada", () => {
  const groups = groupUsersByProfile(users);

  expect(groups.map(group => group.profile)).toEqual([
    "admin",
    "user",
    "auditor"
  ]);
  expect(groups[0].users.map(user => user.id)).toEqual([2]);
  expect(groups[1].users.map(user => user.id)).toEqual([1, 3]);
  expect(groups[2].users.map(user => user.id)).toEqual([4]);
});

test("trata perfil ausente como usuário sem perder o registro", () => {
  const groups = groupUsersByProfile([{ id: 5 }]);

  expect(groups).toEqual([{ profile: "user", users: [{ id: 5 }] }]);
});

test("mantém os textos da visualização em todos os idiomas e localiza User em pt-BR", () => {
  Object.values(messages).forEach(language => {
    expect(language.translations.users.filters.queue).toBeTruthy();
    expect(language.translations.users.table.queues).toBeTruthy();
    expect(language.translations.users.profiles.user).toBeTruthy();
  });

  expect(messages.pt.translations.users.profiles.user).toBe("Usuário");
  expect(users[0].profile).toBe("user");
});
