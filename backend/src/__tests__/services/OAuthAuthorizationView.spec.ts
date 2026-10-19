import mcpConfig from "../../config/mcp";
import { renderAuthorizationPage } from "../../services/McpServices/OAuthAuthorizationView";

const scopes = [
  "conversations:read",
  "reports:read",
  "quick_messages:write",
  "schedules:write"
];

describe("OAuth authorization view", () => {
  it("starts with only the administrator e-mail and no tenant jargon", () => {
    const html = renderAuthorizationPage(
      { handle: "request-1", scopes },
      "email"
    );

    expect(html).toContain('name="email"');
    expect(html).not.toContain('name="password"');
    expect(html).not.toMatch(/tenant|slug/i);
    expect(html).toContain("Consultar conversas, contatos e agendamentos");
    expect(html).toContain(`${mcpConfig.issuer}/oauth/authorize/identify`);
  });

  it("automatically shows the only workspace before asking for the password", () => {
    const html = renderAuthorizationPage(
      {
        handle: "request-2",
        scopes,
        email: "admin@example.com",
        companies: [{ id: 8, name: "Clínica Exemplo" }]
      },
      "password"
    );

    expect(html).toContain("Empresa encontrada");
    expect(html).toContain("Clínica Exemplo");
    expect(html).toContain('name="company_id" value="8"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="consent"');
  });

  it("shows company names and icons when the same e-mail has multiple companies", () => {
    const html = renderAuthorizationPage(
      {
        handle: "request-3",
        scopes,
        email: "admin@example.com",
        companies: [
          {
            id: 3,
            name: "Unidade Centro",
            iconUrl: `${mcpConfig.issuer}/public/branding/3/favicon.png?inline=1`
          },
          { id: 4, name: "Unidade Norte" }
        ]
      },
      "password"
    );

    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toContain("Selecione a empresa que deseja conectar");
    expect(html).toContain("branding/3/favicon.png?inline=1");
    expect(html).toContain(">UN<");
  });

  it("escapes account data before rendering it into the HTML", () => {
    const html = renderAuthorizationPage(
      {
        handle: 'request-<script>alert("x")</script>',
        scopes,
        email: 'admin"><script>alert(1)</script>@example.com',
        companies: [{ id: 5, name: "Clínica <script>alert(2)</script>" }]
      },
      "password"
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });
});
