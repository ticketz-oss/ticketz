const assert = require("node:assert/strict");
const path = require("node:path");
const { lint, createConfig } = require("@redocly/openapi-core");
const spec = require("../public/openapi.json");
const catalog = require("../public/api-catalog.json");

async function check() {
  const config = await createConfig({
    rules: {
      struct: "error",
      "no-unresolved-refs": "error",
      "security-defined": "error",
      "operation-operationId-unique": "error",
      "path-parameters-defined": "error"
    }
  });
  const problems = await lint({
    ref: path.resolve(__dirname, "../public/openapi.json"),
    config
  });
  for (const problem of problems)
    console.error(problem.message, problem.location);
  assert.equal(problems.length, 0, "OpenAPI must be structurally valid");
  assert.equal(
    catalog.operations.length,
    Object.values(spec.paths).reduce(
      (count, item) => count + Object.keys(item).length,
      0
    )
  );
  const send = spec.paths["/messages/{ticketId}"].post;
  assert.deepEqual(
    send.security,
    [{ sessionBearer: [] }],
    "Message sending must not claim API-token authorization"
  );
  assert.equal(
    send.responses["200"].content,
    undefined,
    "Message sending returns an empty body"
  );
  assert.ok(
    send.requestBody.content["multipart/form-data"].schema.properties.medias
  );
  assert.ok(spec.paths["/contacts"].get.security.some(s => s.contactToken));
  assert.deepEqual(spec.paths["/api/platform/v1/tenants"].post.security, [
    { platformKey: [] }
  ]);
  assert.deepEqual(
    spec.paths["/prospeccao/leads"].get.security,
    [{ sessionBearer: [] }],
    "Router-scoped middleware must be inherited"
  );
  assert.ok(
    spec.paths["/auth/mobile/config"],
    "Nested mobile router prefix must be preserved"
  );
  assert.equal(
    spec.paths["/push/test"],
    undefined,
    "Unmounted routers must not be advertised"
  );
  const ids = catalog.operations.map(op => op.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const op of catalog.operations)
    assert.ok(catalog.modules.some(module => module.id === op.module));
  console.log(
    "OpenAPI structure, route coverage, authentication boundaries and message contracts verified."
  );
}
check().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
