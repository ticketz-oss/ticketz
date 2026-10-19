import mcpConfig from "../../config/mcp";

export type OAuthCompanyOption = {
  id: number;
  name: string;
  iconUrl?: string;
};

type ViewOptions = {
  handle: string;
  scopes: string[];
  email?: string;
  companies?: OAuthCompanyOption[];
  selectedCompanyId?: number;
  error?: string;
};

const escapeHtml = (value: string): string =>
  String(value).replace(/[&<>'"]/g, char => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    };
    return entities[char];
  });

const scopeLabels: Record<string, string> = {
  "conversations:read": "Consultar conversas, contatos e agendamentos",
  "reports:read": "Consultar relatórios e indicadores",
  "quick_messages:read": "Consultar respostas rápidas",
  "quick_messages:write": "Criar e editar respostas rápidas",
  "schedules:write": "Criar e editar agendamentos"
};

const permissionList = (scopes: string[]): string =>
  scopes
    .map(
      scope =>
        `<li><span class="permission-check" aria-hidden="true">✓</span><span>${escapeHtml(
          scopeLabels[scope] || scope
        )}</span></li>`
    )
    .join("");

const errorBox = (message?: string): string =>
  message
    ? `<div class="error" role="alert"><strong>Não foi possível continuar.</strong><span>${escapeHtml(
        message
      )}</span></div>`
    : "";

const companyInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("") || "EW";

const companyIcon = (company: OAuthCompanyOption): string =>
  `<span class="company-avatar" aria-hidden="true"><span>${escapeHtml(
    companyInitials(company.name)
  )}</span>${
    company.iconUrl ? `<img src="${escapeHtml(company.iconUrl)}" alt="">` : ""
  }</span>`;

const emailStep = ({ handle, error }: ViewOptions): string => `
  <div class="step"><span>1</span><div><strong>Identifique sua conta</strong><small>Etapa 1 de 2</small></div></div>
  <h1>Qual é o seu e-mail?</h1>
  <p class="intro">Use o mesmo e-mail de administrador com que você entra no Espaço Whats.</p>
  ${errorBox(error)}
  <form method="post" action="${escapeHtml(mcpConfig.issuer)}/oauth/authorize/identify">
    <input type="hidden" name="handle" value="${escapeHtml(handle)}">
    <label for="email">E-mail</label>
    <input id="email" type="email" name="email" maxlength="254" required autocomplete="username" autofocus placeholder="voce@empresa.com.br">
    <button class="primary" type="submit">Continuar <span aria-hidden="true">→</span></button>
    <button class="cancel" type="submit" formnovalidate formaction="${escapeHtml(
      mcpConfig.issuer
    )}/oauth/authorize/cancel">Cancelar conexão</button>
  </form>`;

const companyChoices = (
  companies: OAuthCompanyOption[],
  selectedCompanyId?: number
): string => {
  if (companies.length === 1) {
    const company = companies[0];
    return `<input type="hidden" name="company_id" value="${company.id}">
      <div class="workspace-found">${companyIcon(
        company
      )}<div><small>Empresa encontrada</small><strong>${escapeHtml(
        company.name
      )}</strong></div></div>`;
  }

  return `<fieldset><legend>Selecione a empresa que deseja conectar</legend><div class="workspace-list" role="radiogroup">${companies
    .map(
      (company, index) =>
        `<label class="workspace-option"><input type="radio" name="company_id" value="${
          company.id
        }" required ${
          company.id === selectedCompanyId ||
          (!selectedCompanyId && index === 0)
            ? "checked"
            : ""
        }>${companyIcon(company)}<span class="workspace-copy"><strong>${escapeHtml(
          company.name
        )}</strong><small>Conta administradora</small></span></label>`
    )
    .join("")}</div></fieldset>`;
};

const passwordStep = ({
  handle,
  email = "",
  companies = [],
  selectedCompanyId,
  error
}: ViewOptions): string => `
  <div class="step"><span>2</span><div><strong>Confirme o acesso</strong><small>Etapa 2 de 2</small></div></div>
  <h1>Digite sua senha</h1>
  <div class="identified-email"><span>${escapeHtml(
    email
  )}</span><button type="submit" form="restart-form">Trocar</button></div>
  ${errorBox(error)}
  <form id="restart-form" method="post" action="${escapeHtml(
    mcpConfig.issuer
  )}/oauth/authorize/restart"><input type="hidden" name="handle" value="${escapeHtml(
    handle
  )}"></form>
  <form method="post" action="${escapeHtml(mcpConfig.issuer)}/oauth/authorize/approve">
    <input type="hidden" name="handle" value="${escapeHtml(handle)}">
    <input type="hidden" name="email" value="${escapeHtml(email)}">
    ${companyChoices(companies, selectedCompanyId)}
    <label for="password">Senha</label>
    <div class="password-field"><input id="password" type="password" name="password" required autocomplete="current-password" autofocus placeholder="Digite sua senha"></div>
    <label class="consent"><input type="checkbox" name="consent" value="yes" required><span>Compreendo e autorizo o compartilhamento dos dados conforme os acessos informados nesta página.</span></label>
    <button class="primary" type="submit">Conectar ao ChatGPT <span aria-hidden="true">→</span></button>
    <button class="cancel" type="submit" formnovalidate formaction="${escapeHtml(
      mcpConfig.issuer
    )}/oauth/authorize/cancel">Cancelar conexão</button>
  </form>`;

const styles = `
  :root{color-scheme:light;--navy:#101b32;--navy-soft:#1b2a46;--blue:#0000ff;--blue-dark:#0000c9;--ink:#142033;--muted:#607086;--line:#dfe5ee;--surface:#f4f7fb;--warning:#fff8eb;--warning-line:#f4bd62;--danger:#b42318;--danger-bg:#fff1f0}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;font-family:Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 10% 10%,#e5edff 0,transparent 30%),radial-gradient(circle at 90% 90%,#e7f8f2 0,transparent 28%),var(--surface);color:var(--ink);padding:28px;display:flex;align-items:center;justify-content:center}
  .card{width:min(940px,100%);min-height:620px;background:#fff;border:1px solid rgba(16,27,50,.08);border-radius:28px;box-shadow:0 28px 80px rgba(31,49,77,.16);overflow:hidden;display:grid;grid-template-columns:360px 1fr}
  .brand{position:relative;overflow:hidden;padding:44px 38px;color:#fff;background:linear-gradient(145deg,#101b32 0%,#162a50 58%,#155dfc 150%);display:flex;flex-direction:column}
  .brand:before,.brand:after{content:"";position:absolute;border-radius:50%;border:1px solid rgba(255,255,255,.12)}
  .brand:before{width:320px;height:320px;right:-190px;top:-100px}.brand:after{width:260px;height:260px;left:-170px;bottom:-110px}
  .logo{position:relative;z-index:1;display:flex;align-items:center;gap:12px;font-weight:700;font-size:21px;letter-spacing:-.3px}
  .logo-mark{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#fff 0%,#dbe7ff 100%);color:var(--blue);display:grid;place-items:center;font-weight:900;box-shadow:0 9px 24px rgba(0,0,0,.18)}
  .brand-copy{position:relative;z-index:1;margin:auto 0}.brand-copy .eyebrow{display:inline-flex;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.11);font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
  .brand-copy h2{font-size:32px;line-height:1.12;letter-spacing:-1.1px;margin:18px 0 14px}.brand-copy p{color:#c8d4e8;line-height:1.6;margin:0}
  .permissions{position:relative;z-index:1;margin-top:34px;padding-top:25px;border-top:1px solid rgba(255,255,255,.14)}
  .permissions>strong{display:block;font-size:13px;margin-bottom:13px}.permissions ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}.permissions li{display:flex;gap:9px;color:#dbe5f5;font-size:13px;line-height:1.35}.permission-check{flex:none;width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:rgba(55,224,156,.16);color:#57e3a8;font-size:12px;font-weight:900}
  .content{padding:46px 54px;display:flex;flex-direction:column;justify-content:center;min-width:0}
  .step{display:flex;align-items:center;gap:11px;margin-bottom:27px}.step>span{width:36px;height:36px;border-radius:12px;background:#e9f0ff;color:var(--blue);font-weight:800;display:grid;place-items:center}.step div{display:flex;flex-direction:column;gap:2px}.step strong{font-size:13px}.step small{font-size:12px;color:var(--muted)}
  h1{font-size:31px;line-height:1.18;letter-spacing:-.9px;margin:0 0 10px}.intro{color:var(--muted);line-height:1.55;margin:0 0 25px}
  form{width:100%}label,legend{display:block;font-size:14px;font-weight:700;margin:20px 0 8px}input[type=email],input[type=password]{width:100%;height:52px;border:1px solid #bcc7d6;border-radius:11px;padding:0 15px;font:inherit;color:var(--ink);background:#fff;outline:none;transition:border-color .16s,box-shadow .16s}input::placeholder{color:#94a0b1}input:focus{border-color:var(--blue);box-shadow:0 0 0 4px rgba(21,93,252,.12)}
  button{font:inherit}.primary{width:100%;min-height:52px;border:0;border-radius:11px;margin-top:22px;padding:0 18px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 22px rgba(21,93,252,.2);transition:background .16s,transform .16s}.primary:hover{background:var(--blue-dark);transform:translateY(-1px)}.cancel{display:block;margin:15px auto 0;border:0;background:transparent;color:var(--muted);font-weight:600;cursor:pointer;padding:6px}.cancel:hover{color:var(--ink)}
  .privacy{margin:25px 0 0;padding:15px 16px;border:1px solid var(--warning-line);border-radius:12px;background:var(--warning);font-size:12px;line-height:1.48;color:#6f4b16}.privacy strong{color:#53350d}
  .error{display:flex;flex-direction:column;gap:3px;margin:17px 0;padding:13px 14px;border:1px solid #f5b8b3;border-radius:11px;background:var(--danger-bg);color:var(--danger);font-size:13px;line-height:1.4}
  .identified-email{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:17px 0 6px;padding:11px 13px;border-radius:10px;background:#f3f6fa;color:#4d5d72;font-size:13px}.identified-email span{overflow:hidden;text-overflow:ellipsis}.identified-email button{flex:none;border:0;background:transparent;color:var(--blue);font-weight:700;cursor:pointer}
  .workspace-found{display:flex;align-items:center;gap:12px;margin:17px 0 3px;padding:14px;border:1px solid #b9e6d2;border-radius:12px;background:#f0fbf6}.workspace-found>div{display:flex;flex-direction:column;gap:3px}.workspace-found small{color:#527064;font-size:11px;text-transform:uppercase;letter-spacing:.4px;font-weight:700}.workspace-found strong{font-size:15px}
  .company-avatar{position:relative;width:42px;height:42px;flex:none;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#e9efff,#d9e4ff);color:var(--blue);display:grid;place-items:center;font-size:13px;font-weight:800}.company-avatar>span{display:block}.company-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#fff}
  fieldset{border:0;padding:0;margin:17px 0 4px}fieldset legend{margin:0 0 9px}.workspace-list{display:grid;gap:8px;max-height:224px;overflow-y:auto;padding:2px}.workspace-option{display:flex;align-items:center;gap:11px;border:1px solid var(--line);border-radius:11px;padding:10px 12px;margin:0;cursor:pointer;transition:border-color .16s,background .16s}.workspace-option:has(input:checked){border-color:var(--blue);background:#f3f7ff}.workspace-option input{accent-color:var(--blue);order:3;margin-left:auto}.workspace-copy{display:flex;flex-direction:column;gap:2px;min-width:0}.workspace-copy strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workspace-option small{font-weight:400;color:var(--muted)}
  .consent{display:flex;align-items:flex-start;gap:10px;margin-top:19px;font-weight:400;color:#4d5d72;line-height:1.45}.consent input{margin-top:3px;accent-color:var(--blue);width:16px;height:16px;flex:none}.consent span{font-size:13px}
  @media(max-width:760px){body{padding:14px;align-items:flex-start}.card{display:block;border-radius:21px;min-height:0}.brand{padding:24px}.brand-copy{margin:28px 0 0}.brand-copy h2{font-size:25px}.brand-copy p{display:none}.permissions{display:none}.content{padding:30px 24px 32px}h1{font-size:27px}}
  @media(max-width:420px){body{padding:0;background:#fff}.card{border:0;border-radius:0;box-shadow:none;min-height:100vh}.brand{border-radius:0;padding:18px 20px}.brand-copy{display:none}.content{padding:27px 20px}.step{margin-bottom:22px}}
`;

export const renderAuthorizationPage = (
  options: ViewOptions,
  step: "email" | "password"
): string => {
  const body = step === "email" ? emailStep(options) : passwordStep(options);

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Conectar Espaço Whats ao ChatGPT</title><style>${styles}</style></head><body><main class="card"><aside class="brand"><div class="logo"><span class="logo-mark">EW</span><span>Espaço Whats</span></div><div class="brand-copy"><span class="eyebrow">Integração oficial</span><h2>Seu atendimento mais inteligente com o ChatGPT.</h2><p>Consulte informações e automatize tarefas do Espaço Whats diretamente na conversa.</p></div><div class="permissions"><strong>Com sua autorização, o ChatGPT poderá:</strong><ul>${permissionList(
    options.scopes
  )}</ul></div></aside><section class="content">${body}<div class="privacy"><strong>Seus dados continuam protegidos.</strong> O ChatGPT só acessará as informações necessárias quando você solicitar. Conversas podem conter dados pessoais ou sensíveis.</div></section></main></body></html>`;
};
