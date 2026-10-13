/* Documentation only: inspect TypeScript syntax without importing the backend. */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const sourceRoot = path.join(root, "backend/src");
const overrides = require("./api-docs/operations.cjs");
const modules = require("./api-docs/modules.cjs");
const cache = new Map();
const text = node => node?.getText() || "";
const unwrap = node =>
  ts.isAsExpression(node) || ts.isParenthesizedExpression(node)
    ? unwrap(node.expression)
    : node;
function parse(file) {
  if (cache.has(file)) return cache.get(file);
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );
  const imports = new Map();
  const routers = new Map();
  const functions = new Map();
  const types = new Map();
  const namedImports = new Map();
  let exported;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const spec = statement.moduleSpecifier.text;
      if (spec.startsWith(".")) {
        const resolved = path.resolve(path.dirname(file), spec) + ".ts";
        const clause = statement.importClause;
        if (clause?.name) imports.set(clause.name.text, resolved);
        if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings))
          imports.set(clause.namedBindings.name.text, resolved);
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings))
          for (const item of clause.namedBindings.elements)
            namedImports.set(item.name.text, {
              file: resolved,
              name: text(item.propertyName || item.name)
            });
      }
    }
    if (ts.isExportAssignment(statement)) exported = text(statement.expression);
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    )
      types.set(statement.name.text, statement);
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations) {
        if (
          declaration.initializer &&
          /^(express\.)?Router\(\)$/.test(text(declaration.initializer))
        )
          routers.set(text(declaration.name), []);
        if (
          declaration.initializer &&
          ts.isArrowFunction(declaration.initializer)
        )
          functions.set(text(declaration.name), declaration.initializer);
      }
    if (ts.isFunctionDeclaration(statement) && statement.name)
      functions.set(statement.name.text, statement);
    if (
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression)
    ) {
      const call = statement.expression;
      if (ts.isPropertyAccessExpression(call.expression)) {
        const router = text(call.expression.expression);
        if (routers.has(router))
          routers.get(router).push({
            call,
            method: call.expression.name.text,
            args: [...call.arguments]
          });
      }
    }
  }
  const parsed = {
    source,
    imports,
    namedImports,
    types,
    routers,
    functions,
    exported
  };
  cache.set(file, parsed);
  return parsed;
}
function handlerFor(args, parsed) {
  let found;
  const visit = node => {
    if (
      ts.isPropertyAccessExpression(node) &&
      parsed.imports.has(text(node.expression))
    ) {
      const file = parsed.imports.get(text(node.expression));
      if (file.includes(`${path.sep}controllers${path.sep}`))
        found = {
          file,
          name: node.name.text,
          node: parse(file).functions.get(node.name.text)
        };
    }
    ts.forEachChild(node, visit);
  };
  args.forEach(visit);
  return found;
}
function observed(handler) {
  const result = {
    query: new Set(),
    body: new Set(),
    statuses: new Set(),
    errors: new Set(),
    response: new Set()
  };
  if (!handler?.node) return result;
  const aliases = new Map();
  const visited = new Set();
  const parsed = parse(handler.file);
  const typeFields = (node, file, seen = new Set()) => {
    if (!node) return [];
    if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node))
      return node.members
        .filter(item => ts.isPropertySignature(item) && item.name)
        .map(item => text(item.name).replace(/^['"]|['"]$/g, ""));
    if (ts.isTypeAliasDeclaration(node) || ts.isParenthesizedTypeNode(node))
      return typeFields(node.type, file, seen);
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node))
      return node.types.flatMap(item => typeFields(item, file, seen));
    if (ts.isTypeReferenceNode(node)) {
      const name = text(node.typeName);
      if (["Partial", "Required", "Readonly"].includes(name))
        return typeFields(node.typeArguments?.[0], file, seen);
      const key = file + ":" + name;
      if (seen.has(key)) return [];
      seen.add(key);
      const context = parse(file);
      if (context.types.has(name))
        return typeFields(context.types.get(name), file, seen);
      const imported = context.namedImports.get(name);
      if (imported && fs.existsSync(imported.file))
        return typeFields(
          parse(imported.file).types.get(imported.name),
          imported.file,
          seen
        );
    }
    return [];
  };
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const from = text(unwrap(node.initializer));
      if (
        (from === "req.body" || from === "req.query") &&
        ts.isIdentifier(node.name)
      ) {
        aliases.set(node.name.text, from.slice(4));
        const type =
          node.type ||
          (ts.isAsExpression(node.initializer)
            ? node.initializer.type
            : undefined);
        typeFields(type, handler.file).forEach(field =>
          result[from.slice(4)].add(field)
        );
      }
    }
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isObjectBindingPattern(node.name)
    ) {
      const from = text(unwrap(node.initializer));
      if (from === "req.query" || from === "req.body")
        for (const field of node.name.elements) {
          if (!field.dotDotDotToken)
            result[from.slice(4)].add(text(field.propertyName || field.name));
        }
    }
    if (ts.isPropertyAccessExpression(node)) {
      const from = text(node.expression);
      if (text(node) === "req.body") result.hasBody = true;
      if (from === "req.query" || from === "req.body")
        result[from.slice(4)].add(node.name.text);
      if (aliases.has(from)) result[aliases.get(from)].add(node.name.text);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.arguments.some(arg => text(arg) === "req")
    ) {
      const helper = parsed.functions.get(node.expression.text);
      if (helper?.body && !visited.has(helper)) {
        visited.add(helper);
        visit(helper.body);
      }
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      if (
        node.expression.name.text === "status" &&
        ts.isNumericLiteral(node.arguments[0])
      )
        result.statuses.add(node.arguments[0].text);
      if (
        node.expression.name.text === "json" &&
        node.arguments[0] &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        for (const field of node.arguments[0].properties)
          if (field.name) result.response.add(text(field.name));
      }
    }
    if (
      ts.isNewExpression(node) &&
      text(node.expression) === "AppError" &&
      node.arguments?.[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      result.errors.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(handler.node.body);
  return result;
}
const operations = [];
function walk(file, prefix = "", routerName, inherited = []) {
  const parsed = parse(file);
  const router = routerName || parsed.exported;
  if (!parsed.routers.has(router))
    throw new Error(`Unknown router ${file}: ${router}`);
  const scoped = [];
  for (const entry of parsed.routers.get(router)) {
    const { method, call } = entry;
    const args = [...entry.args];
    const routePath =
      args[0] && ts.isStringLiteral(args[0]) ? args.shift().text : "";
    if (method === "use") {
      let mounted = false;
      for (const arg of args) {
        const name = text(arg);
        if (parsed.routers.has(name)) {
          walk(file, prefix + routePath, name, inherited);
          mounted = true;
        } else if (
          parsed.imports.get(name)?.includes(`${path.sep}routes${path.sep}`)
        ) {
          walk(
            parsed.imports.get(name),
            prefix + routePath,
            undefined,
            inherited
          );
          mounted = true;
        }
      }
      if (!mounted)
        scoped.push({
          prefix: routePath,
          middleware: args.map(text).join(" ")
        });
      continue;
    }
    if (
      !["get", "post", "put", "patch", "delete", "head", "options"].includes(
        method
      )
    )
      throw new Error(`Unsupported route method: ${method}`);
    const fullPath = (prefix + routePath).replace(/\/$/, "") || "/";
    const middleware = [
      ...inherited,
      ...scoped
        .filter(item => !item.prefix || routePath.startsWith(item.prefix))
        .map(item => item.middleware),
      ...args.map(text)
    ].join(" ");
    const handler = handlerFor(args, parsed);
    const fields = observed(handler);
    const moduleKey = path.basename(file, "Routes.ts");
    const module = modules[moduleKey];
    if (!module) throw new Error(`Missing documentation module: ${moduleKey}`);
    let auth = "flow";
    if (/\bisAuth\b/.test(middleware)) auth = "session";
    if (/\bapiTokenAuth\b/.test(middleware)) auth = "contactToken";
    if (/\bisPartnerAuth\b/.test(middleware)) auth = "partner";
    if (/\bplatformKeyAuth\b/.test(middleware)) auth = "platform";
    if (fullPath === "/mcp") auth = "oauth";
    if (fullPath === "/agent/tools") auth = "agent";
    const restrictions = [];
    if (/\bisAdmin\b/.test(middleware))
      restrictions.push(
        method === "get"
          ? "Administrador ou usuário com acesso à tela, quando o middleware da rota permite"
          : "Perfil administrador"
      );
    if (/\bisSuper\b|\bagentSuper\b/.test(middleware))
      restrictions.push(
        "Permissão administrativa restrita (superadministrador ou verificação específica da rota)"
      );
    if (/\bisBillingAdmin\b/.test(middleware))
      restrictions.push("Administrador financeiro autorizado");
    if (/\bisProspeccaoUser\b/.test(middleware))
      restrictions.push("Acesso autorizado ao módulo de prospecção");
    if (/\bisCompliant\b/.test(middleware))
      restrictions.push(
        "Assinatura em conformidade; bloqueio retorna HTTP 402"
      );
    if (/Limiter|limiter|rateLimit/.test(middleware))
      restrictions.push(
        "Limite de requisições específico desta operação; respeite HTTP 429"
      );
    if (/platformIdempotency/.test(middleware))
      restrictions.push("Idempotência nas mutações via Idempotency-Key");
    const upload = middleware.match(/upload\.(single|array)\("([^"]+)"/);
    const source = path.relative(root, file).replace(/\\/g, "/");
    const line =
      parsed.source.getLineAndCharacterOfPosition(call.getStart()).line + 1;
    const id = `${method}-${fullPath}`
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/-$/, "");
    operations.push({
      id,
      method,
      path: fullPath,
      moduleKey,
      module,
      auth,
      restrictions,
      fields,
      upload,
      handler,
      source,
      line
    });
  }
}
walk(path.join(sourceRoot, "routes/index.ts"));
// app.ts serves uploaded files before the mounted routers.
operations.push({
  id: "get-public-file",
  method: "get",
  path: "/public/{file}",
  moduleKey: "files",
  module: modules.files,
  auth: "flow",
  restrictions: [],
  fields: {
    query: new Set(["inline"]),
    body: new Set(),
    statuses: new Set(["200", "404", "500"]),
    errors: new Set(),
    response: new Set()
  },
  source: "backend/src/app.ts",
  line: 57
});
const authNames = {
  session: "Sessão do usuário (JWT)",
  contactToken: "Token de contatos ou sessão (JWT)",
  partner: "Sessão do parceiro (JWT)",
  platform: "Chave da plataforma (restrita)",
  oauth: "OAuth do MCP (condicionado à habilitação)",
  agent: "Credencial temporária do agente",
  flow: "Autenticação/validação própria do fluxo"
};
const security = {
  session: [{ sessionBearer: [] }],
  contactToken: [{ sessionBearer: [] }, { contactToken: [] }],
  partner: [{ partnerBearer: [] }],
  platform: [{ platformKey: [] }],
  oauth: [{ mcpBearer: [] }],
  agent: [{ agentBearer: [] }],
  flow: []
};
const spec = {
  openapi: "3.0.3",
  info: {
    title: "API do Espaço Whats",
    version: "2026-10-13",
    description:
      "Referência dos recursos existentes. [Comece pelos guias](/documentacao) ou selecione um módulo acima. Os exemplos são ilustrativos; acesso depende das permissões e da configuração da empresa. Cada operação informa o nível de revisão do seu contrato.",
    license: { name: "AGPL-3.0", url: "https://github.com/GuiZeroUm/ticketz" }
  },
  servers: [
    {
      url: "https://{empresa}.espacowhats.com.br/backend",
      description: "Endereço da sua empresa",
      variables: {
        empresa: {
          default: "sua-empresa",
          description: "Subdomínio fornecido no cadastro"
        }
      }
    }
  ],
  tags: [],
  paths: {},
  components: {
    securitySchemes: {
      sessionBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token retornado por POST /auth/login. Autoriza de acordo com o usuário e a empresa."
      },
      contactToken: {
        type: "http",
        scheme: "bearer",
        description:
          "Token de integração configurado para a empresa. Aceito somente nas operações de contatos que declaram este esquema; opera com o administrador da empresa."
      },
      partnerBearer: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Sessão própria do portal de parceiros; não substitui o JWT do usuário."
      },
      platformKey: {
        type: "apiKey",
        in: "header",
        name: "X-Platform-Key",
        description:
          "Chave administrativa da plataforma. Não é fornecida automaticamente ao cliente e não substitui o token de usuário."
      },
      mcpBearer: {
        type: "http",
        scheme: "bearer",
        description:
          "Token OAuth emitido para o MCP. Requer habilitação e escopos próprios."
      },
      agentBearer: {
        type: "http",
        scheme: "bearer",
        description:
          "Credencial curta emitida pelo fluxo de sessão do agente; não é uma API key permanente."
      },
      refreshCookie: {
        type: "apiKey",
        in: "cookie",
        name: "jrt",
        description: "Cookie HttpOnly de renovação emitido no login."
      }
    }
  }
};
const catalog = { version: spec.info.version, modules: [], operations: [] };
// Lead with message sending, while retaining every mounted operation.
operations.sort((a, b) =>
  a.id === "post-messages-ticketId"
    ? -1
    : b.id === "post-messages-ticketId"
      ? 1
      : 0
);
for (const op of operations) {
  const { method, fields } = op;
  const openPath = op.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
  if (spec.paths[openPath]?.[method])
    throw new Error(`Duplicate ${method} ${openPath}`);
  const detail = overrides[`${method.toUpperCase()} ${op.path}`];
  const verbs = {
    get: "Consultar",
    post: "Executar",
    put: "Atualizar",
    patch: "Atualizar parcialmente",
    delete: "Remover"
  };
  const description = [
    `**Acesso:** ${authNames[op.auth]}.`,
    ...op.restrictions,
    detail?.description ||
      `Operação do módulo ${op.module.name}. ${op.module.description}`,
    ...(detail
      ? []
      : [
          "Os campos abaixo são leituras observadas no controlador. Tipos, obrigatoriedade, validações delegadas aos serviços e formato final de resposta não são inferidos. Esta operação faz parte do sistema existente, não representa um contrato público versionado independente."
        ]),
    ...(fields.response.size && !detail?.responses
      ? [
          `Chaves de resposta observadas (podem variar por caminho de execução): ${[...fields.response].map(key => `\`${key}\``).join(", ")}.`
        ]
      : []),
    ...(fields.errors.size
      ? [
          `Erros declarados neste controlador: ${[...fields.errors].map(key => `\`${key}\``).join(", ")}. Outros erros podem vir dos serviços e permissões.`
        ]
      : []),
    `[Implementação desta rota](https://github.com/GuiZeroUm/ticketz/blob/main/${op.source}#L${op.line})`
  ].join("\n\n");
  const parameters = [...openPath.matchAll(/\{([^}]+)\}/g)].map(([, name]) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "Identificador do recurso na URL."
  }));
  if (op.auth === "platform" && ["post", "patch", "delete"].includes(method))
    parameters.push({
      name: "Idempotency-Key",
      in: "header",
      required: true,
      schema: { type: "string", format: "uuid" },
      description:
        "UUID v4 único por operação lógica. Reutilize apenas para repetir a mesma requisição."
    });
  for (const name of fields.query)
    parameters.push({
      name,
      in: "query",
      schema: { type: "string" },
      description:
        "Parâmetro lido pelo controlador. Consulte as regras do módulo."
    });
  const operation = {
    tags: [op.module.name],
    operationId: op.id,
    summary:
      detail?.summary || `${verbs[method] || method.toUpperCase()} ${op.path}`,
    description,
    security: security[op.auth],
    parameters,
    responses: {
      default: {
        description:
          "Resposta ou erro do fluxo. Consulte as regras, os códigos do módulo e as permissões."
      }
    },
    "x-codeSamples": detail?.samples || [],
    "x-source": { file: op.source, line: op.line },
    "x-contract-level": detail ? "reviewed" : "observed"
  };
  if (!detail)
    for (const status of fields.statuses)
      operation.responses[status] = {
        description:
          Number(status) < 400
            ? "Resposta do controlador; o conteúdo depende da operação."
            : "Falha de validação, acesso ou execução."
      };
  if (fields.body.size || fields.hasBody || op.upload) {
    const properties = Object.fromEntries(
      [...fields.body].map(name => [
        name,
        {
          description:
            "Campo observado no controlador ou no tipo declarado; tipo e obrigatoriedade não inferidos.",
          ...(name === "companyId" &&
          ["session", "contactToken"].includes(op.auth)
            ? {
                readOnly: true,
                description:
                  "Empresa definida pelo contexto autenticado. Não use este campo para selecionar outra empresa."
              }
            : {})
        }
      ])
    );
    if (op.upload)
      properties[op.upload[2]] =
        op.upload[1] === "array"
          ? { type: "array", items: { type: "string", format: "binary" } }
          : { type: "string", format: "binary" };
    operation.requestBody = {
      description:
        "Campos identificados na implementação. Os serviços podem validar campos adicionais.",
      content: {
        [op.upload ? "multipart/form-data" : "application/json"]: {
          schema: { type: "object", properties, additionalProperties: true }
        }
      }
    };
  }
  if (detail) {
    for (const key of ["requestBody", "responses", "parameters", "security"])
      if (detail[key])
        operation[key] =
          key === "parameters"
            ? [...parameters.filter(p => p.in === "path"), ...detail.parameters]
            : detail[key];
  }
  spec.paths[openPath] ||= {};
  spec.paths[openPath][method] = operation;
  catalog.operations.push({
    id: op.id,
    method: method.toUpperCase(),
    path: op.path,
    module: op.moduleKey,
    summary: operation.summary,
    auth: op.auth,
    reviewed: !!detail
  });
}
const priority = [
  "message",
  "contact",
  "ticket",
  "auth",
  "whatsapp",
  "whatsappSession"
];
const moduleKeys = [...new Set(operations.map(op => op.moduleKey))].sort(
  (a, b) => {
    const rank = key => (priority.includes(key) ? priority.indexOf(key) : 99);
    return (
      rank(a) - rank(b) || modules[a].name.localeCompare(modules[b].name, "pt")
    );
  }
);
for (const key of moduleKeys) {
  const module = modules[key];
  const count = operations.filter(op => op.moduleKey === key).length;
  catalog.modules.push({ id: key, ...module, count });
  spec.tags.push({ name: module.name, description: module.description });
}
spec["x-tagGroups"] = [
  { name: "Recursos", tags: spec.tags.map(tag => tag.name) }
];
const outputs = { "openapi.json": spec, "api-catalog.json": catalog };
let stale = false;
for (const [name, data] of Object.entries(outputs)) {
  const target = path.join(root, "frontend/public", name);
  const serialized = JSON.stringify(data, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    if (
      !fs.existsSync(target) ||
      fs.readFileSync(target, "utf8") !== serialized
    ) {
      console.error(`Out of date: ${name}`);
      stale = true;
    }
  } else fs.writeFileSync(target, serialized);
}
if (stale) process.exitCode = 1;
console.log(
  `${operations.length} operations, ${catalog.modules.length} modules, ${catalog.operations.filter(op => op.reviewed).length} reviewed contracts.`
);
