import {
  apiLink,
  curlExample,
  isDocumentationPath,
  mediaExample
} from "./examples";

test("only documentation routes bypass the authenticated application", () => {
  ["/api", "/api/", "/documentacao", "/documentacao/"].forEach(path =>
    expect(isDocumentationPath(path)).toBe(true)
  );
  [
    "/api/platform/v1/health",
    "/backend/messages/1",
    "/documentation",
    "/tickets",
    "/"
  ].forEach(path => expect(isDocumentationPath(path)).toBe(false));
});

test("examples keep cookies for login and session bearer for messages", () => {
  expect(curlExample(0)).toContain("--cookie-jar cookies.txt");
  expect(curlExample(0)).not.toContain("Authorization");
  expect(curlExample(3)).toContain("/backend/messages/456");
  expect(curlExample(3)).toContain("Bearer SEU_TOKEN_DE_SESSAO");
  [curlExample(0), curlExample(3), mediaExample].forEach(example => {
    expect(example).not.toMatch(/\n\+/);
    expect(example).not.toContain("undefined");
  });
  expect(mediaExample).toContain("medias=@./documento.pdf");
  expect(mediaExample).not.toContain("Content-Type:");
});

test("catalog links select the module and the corresponding Redoc operation", () => {
  expect(apiLink("message", "post-messages-ticketId", "Mensagens")).toBe(
    "/api?modulo=message#tag/Mensagens/operation/post-messages-ticketId"
  );
});
