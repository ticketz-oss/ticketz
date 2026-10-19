export const baseUrl = "https://sua-empresa.espacowhats.com.br/backend";

export const flowExamples = [
  {
    method: "POST",
    path: "/auth/login",
    body: {
      email: "integracao@example.com",
      password: "SUA_SENHA",
      slug: "sua-empresa"
    }
  },
  {
    method: "POST",
    path: "/contacts/findOrInsert",
    body: { name: "Contato de exemplo", number: "5568999990000" }
  },
  {
    method: "POST",
    path: "/tickets",
    body: { contactId: 123, userId: 7, queueId: 2 }
  },
  {
    method: "POST",
    path: "/messages/456",
    body: { body: "Olá! Como podemos ajudar?" }
  }
];

export function curlExample(step) {
  const { method, path, body } = flowExamples[step];
  return `curl --request ${method} \\\n  --url '${baseUrl}${path}' \\\n  ${step === 0 ? "--cookie-jar cookies.txt" : "--header 'Authorization: Bearer SEU_TOKEN_DE_SESSAO'"} \\\n  --header 'Content-Type: application/json' \\\n  --data '${JSON.stringify(body, null, 2)}'`;
}

export const mediaExample = `curl --request POST \\\n  --url '${baseUrl}/messages/456' \\\n  --header 'Authorization: Bearer SEU_TOKEN_DE_SESSAO' \\\n  --form 'body=Confira o documento' \\\n  --form 'medias=@./documento.pdf'`;

export const refreshExample = `curl --request POST \\\n  --url '${baseUrl}/auth/refresh_token' \\\n  --cookie cookies.txt \\\n  --cookie-jar cookies.txt`;

export const apiLink = (module, operation, tag) =>
  `/api?modulo=${encodeURIComponent(module)}${operation ? `#tag/${encodeURIComponent(tag)}/operation/${operation}` : ""}`;

export const isDocumentationPath = pathname =>
  /^\/(api|documentacao)\/?$/.test(pathname);
