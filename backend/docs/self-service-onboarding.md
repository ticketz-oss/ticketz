# Cadastro pelo site e teste gratuito

`POST /companies/cadastro` cria empresa, administrador e identidade visual na mesma transação. Aceita JSON sem imagens ou `multipart/form-data` com imagens opcionais. O cadastro depende da configuração pública `allowSignup` e do captcha, quando configurado.

Campos: `name`, `email`, `phone` (com DDI), `password`, `planId`, `slug`, `dueDay` (1–31), `timezone`, `whatsappMode` (`official`/`unofficial`), `aiAddon` opcional e `primaryColor` (`#RRGGBB`). O plano precisa ser público. Logo, banner e imagem lateral usam os campos `logo`, `banner` e `sideImage`; PNG/JPEG/WebP, até 5 MB por arquivo. As imagens são decodificadas e salvas em WebP sem metadados.

O servidor fixa os seguintes valores, independentemente do conteúdo enviado pelo cliente:

| Campo em Companies | Significado |
| --- | --- |
| `signupSource = self_service` | Cliente criou a própria conta pelo site |
| `trialDays = 7` | Duração do teste |
| `trialStartedAt` | Instante UTC de início |
| `trialExpiresAt` | Instante UTC de expiração, exatamente 7 dias depois |
| `trialEndsAt` | Data civil UTC mantida para compatibilidade com o faturamento |
| `dueDay` | Dia escolhido para vencimentos futuros |
| `dueDate` | Primeiro vencimento estritamente após a data do teste; dias inexistentes são ajustados ao último dia do mês |

Não são solicitados cartão nem dados de pagamento. Nenhuma fatura é gerada durante o teste. O status `active`/`expired` é calculado pelas datas, sem depender de uma tarefa agendada para mudar um booleano. A resposta do cadastro e o serviço de avisos da assinatura expõem `trial: { startsAt, endsAt, status }`. Login e renovação da sessão também retornam as datas na empresa do usuário.

As configurações de marca reutilizam o painel existente: `appName`, cores claro/escuro e `loginTemplate`. O ícone (`logo`) alimenta `appLogoFavicon` e `linkPreviewImage`: barra recolhida, aba do navegador e metadados do link. O banner (`banner`) alimenta `appLogoLight` e `appLogoDark`: marca completa no login e na barra aberta. Sem banner, o ícone é usado também como marca completa. A imagem lateral (`sideImage`) alimenta `loginSidePanelImage`, usada no painel ao lado do formulário de login; o painel fica oculto em telas pequenas. Nenhuma dessas imagens é colocada como fundo do formulário.

A prévia do cadastro usa uma página isolada (`/preview/branding`) com os mesmos componentes do login e da navegação do sistema, em dimensões reais de computador ou celular. Recebe apenas o rascunho de marca da página pai por mensagens de mesma origem, sem autenticação nem acesso a dados privados. O conteúdo de atendimento é ilustrativo. A prévia de link mostra a imagem e o título publicados pelo backend; cada aplicativo de mensagens decide a apresentação final. Após criar a conta, o botão de entrada aponta para o login do subdomínio do tenant.

Contas históricas não são classificadas como cadastro espontâneo por inferência. A migração conserva as existentes como `admin`, identifica empresas com `partnerId` como `partner` e mantém as novas datas nulas para essas contas.

O modal de expiração, a adesão ao pagamento e o cancelamento da assinatura são próximos passos. A política atual de acesso e de cobrança após o teste continua sendo a do sistema; esta mudança fornece as datas e a origem necessárias para o futuro fluxo.
