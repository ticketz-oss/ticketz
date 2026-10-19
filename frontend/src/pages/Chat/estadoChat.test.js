import {
  atualizarConversas,
  mesclarConversa,
  mesclarMensagens
} from "./estadoChat";

test("reconcilia resposta HTTP e socket sem duplicar mensagens", () => {
  expect(
    mesclarMensagens(
      [{ id: 2, message: "antes" }],
      [{ id: 1 }, { id: 2, message: "depois" }]
    )
  ).toEqual([{ id: 1 }, { id: 2, message: "depois" }]);
});
test("mantém nomes e fotos quando o socket só informa contadores", () => {
  const user = { id: 3, name: "Ana", profilePicUrl: "/foto.webp" };
  expect(
    mesclarConversa(
      { users: [{ userId: 3, user, unreads: 4 }] },
      { users: [{ userId: 3, unreads: 0 }] }
    ).users
  ).toEqual([{ userId: 3, user, unreads: 0 }]);
});
test("atualiza a conversa certa e ordena por atividade", () => {
  expect(
    atualizarConversas(
      [
        { id: 1, updatedAt: "2026-01-01" },
        { id: 2, updatedAt: "2026-01-02" }
      ],
      { id: 1, updatedAt: "2026-01-03" }
    ).map(chat => chat.id)
  ).toEqual([1, 2]);
});
