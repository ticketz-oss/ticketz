# Conexão pelo cliente e cobrança direta da Meta

Guia do Espaço Whats, revisado em 29/09/2026. O cliente conecta a própria conta WhatsApp pelo login da Meta e administra o pagamento do uso da API na própria Meta. A assinatura do Espaço Whats continua separada. O sistema não coleta cartão, não oferece crédito para mensagens e não assume a cobrança da Meta.

A homologação com um novo cliente real foi adiada. Código implementado ou aplicativo publicado não devem ser apresentados como homologação concluída.

## O que o cliente faz

1. Cria uma empresa com **API oficial**. A escolha é permanente.
2. Em **Conexões**, inicia a conexão pela Meta usando uma conta que administra os ativos da própria empresa.
3. No fluxo da Meta, seleciona ou cria a conta WhatsApp e informa/verifica o número quando solicitado. O PIN de registro é diferente do código recebido por SMS ou ligação.
4. Concluída a autorização, abre **Pagamentos na Meta** e seleciona a conta WhatsApp correta para cadastrar ou revisar o meio de pagamento diretamente lá.
5. Retorna ao Espaço Whats. **Conectado** indica a integração técnica; **Pagamento não verificado** não significa que o cartão foi recusado ou que falta pagamento.

A autorização e o pagamento exigem ações do cliente dentro da Meta. Uma confirmação visual no Espaço Whats não substitui as decisões e verificações da Meta.

## Preparação pelo operador

O aplicativo escolhido pelo operador para o fluxo comercial tem ID `1100018862681124`, com o nome pretendido **Espaço Whats**. Na conferência de 29/09/2026, os runtimes geral e dedicado da ACNorte ainda estavam configurados com `25837857089132470`. O App Secret foi validado por leitura autenticada na Graph API, e o Configuration ID público `28156735987329187` foi confirmado na lista `config_ids` desse aplicativo. A configuração se chama **Ticketz Embedded Signup**. Não trocar o runtime dedicado nem seu callback. A tentativa autorizada de renomear via API recebeu código 10 da Meta; o nome continua **Espaço Whats - AC Norte**, exigindo uma conta com permissão administrativa no painel. O ID identifica o aplicativo; não comprova aprovação, publicação ou acesso a contas de outros clientes. Não registrar App Secret, tokens, PINs ou dados financeiros em tickets, capturas públicas ou neste documento.

O [exemplo oficial de Tech Provider da Meta](https://github.com/fbsamples/business-messaging-sample-tech-provider-app/blob/main/README.md#going-to-production) orienta verificar a empresa vinculada, criar uma configuração Tech Provider, submeter as permissões necessárias ao App Review e publicar o aplicativo. Também exige conferir os domínios/redirects do Facebook Login for Business e o webhook `messages`. Em modo não publicado, o exemplo limita o uso a pessoas com papel no aplicativo.

No painel autenticado do aplicativo, registrar como **confirmado** ou **pendente**, com a data da conferência:

| Item | Evidência necessária |
| --- | --- |
| Empresa vinculada | Business Portfolio correto e Business Verification concluída no painel |
| Tech Provider | Cadastro, termos e verificações de acesso solicitadas pela Meta concluídos; conferir as etapas que o painel efetivamente apresentar |
| Permissões | App Review e Advanced Access para `whatsapp_business_management` e `whatsapp_business_messaging` |
| Publicação | Aplicativo publicado para empresas externas, sem restrição de uso apenas a administradores/testadores |
| Configuração | Configuração específica de WhatsApp Embedded Signup/Tech Provider vinculada ao mesmo aplicativo |
| Login | Domínios e URLs HTTPS reais autorizados no Facebook Login for Business e no JavaScript SDK |
| Política e suporte | URLs públicas reais, política de privacidade e informações de exclusão/contato exigidas pelo painel |
| Recebimento | Assinatura do campo `messages`, callback e verificação funcionando no runtime correto |

Não marcar itens como concluídos apenas porque `META_APP_ID`, `META_APP_SECRET` ou `META_CONFIG_ID` estão definidos. Uma chamada de leitura bem-sucedida no número existente da ACNorte também não comprova a habilitação para cadastrar terceiros.

## Criar a configuração do login

No Facebook Login for Business, criar uma configuração destinada ao **WhatsApp Embedded Signup**, adequada a **Tech Provider** e à Cloud API. Selecionar os ativos WhatsApp e as duas permissões acima. O fluxo pretendido usa o token empresarial do cliente (Business Integration System User), com a opção sem expiração quando oferecida e aplicável pelo painel. Não usar o token pessoal de desenvolvimento nem presumir que qualquer token seja irrevogável.

Copiar apenas o Configuration ID público para `META_CONFIG_ID` do runtime geral. Manter o Graph API version configurado de forma consistente no backend e no SDK. Não selecionar compartilhamento de linha de crédito, solução de parceiro com cobrança agregada ou permissões adicionais sem uma necessidade concreta do produto.

A amostra oficial [troca o código do login por um token no servidor](https://github.com/fbsamples/business-messaging-sample-tech-provider-app/blob/main/app/api/beUtils.ts). O servidor do Espaço Whats deve validar os ativos retornados antes de registrar o número; dados recebidos do navegador não constituem, sozinhos, prova do vínculo entre número e conta.

`business_management` não deve ser acrescentada automaticamente por instruções antigas de cobrança por parceiro. A configuração desta entrega é Cloud API com cobrança direta; conferir permissões adicionais somente se um recurso efetivamente utilizado ou a revisão do aplicativo exigir.

## Preservar a ACNorte

O callback existente da ACNorte deve permanecer como está. Não substituir o callback global do aplicativo apenas para habilitar o login de novas empresas.

O sistema tem runtimes distintos, com filtros de empresa. Novas contas devem receber o encaminhamento por WABA que a integração do runtime geral já prevê; contas da ACNorte continuam no dedicado. Conferir a subscrição e o callback efetivos por conta antes da futura homologação. Um callback que recebe HTTP 200 no host errado pode descartar o evento pelo filtro de runtime.

Não recadastrar, desregistrar, desconectar ou trocar o provedor do número da ACNorte durante a configuração deste fluxo. Uma empresa oficial não pode ser convertida para não oficial, nem o inverso.

## Contrato de pagamento desta entrega

O endpoint autenticado de onboarding retorna `billingMode: "direct"` e `billingStatus: "unverified"`, com link para `https://business.facebook.com/billing_hub/`. O link abre a área da Meta; o cliente seleciona sua conta. A aplicação não afirma que o cartão está presente, que há saldo ou que os dados de pagamento estão aprovados.

`connectionStatus`, `wabaId` e `phoneNumberId` servem para o estado técnico da conexão pertencente à empresa autenticada. Eles não alteram o estado financeiro. O endpoint de configuração expõe somente configuração pública, a modalidade de cobrança direta e `signupAvailable`, que verifica a preparação técnica do runtime. Esse indicador não comprova publicação, App Review ou pagamento. O botão de conexão permanece visível quando a integração está indisponível, com mensagem neutra; o cliente nunca precisa solicitar credenciais ao administrador.

A [amostra oficial da Meta consulta `health_status`](https://github.com/fbsamples/business-messaging-sample-tech-provider-app/blob/main/app/api/beUtils.ts) para identificar sinais de problemas de pagamento. Essa consulta não foi incorporada nesta entrega: ausência de erro não é uma confirmação de cartão. Não criar um endpoint presumido de cartão/pagamento nem converter ausência de resposta em aprovação.

## Publicação e homologação posterior

Antes de publicar, executar os testes de isolamento entre empresas, preservação Baileys, login/cancelamento, validação dos ativos, ausência de credenciais nas respostas e estado financeiro não verificado. Confirmar que o formulário do método da empresa continua imutável e que o fluxo manual de suporte não virou requisito para o cliente.

Depois de obter o Configuration ID e concluir as etapas do painel, homologar com uma empresa oficial nova e um número autorizado para isso. Verificar autorização pelo cliente, registro, webhook, envio/recebimento e administração do pagamento na Meta. Registrar resultados sem segredos. Essa homologação continua pendente até ser executada; não utilizar a conta produtiva da ACNorte como substituto desse teste.

## Limites da conferência documental

As páginas atuais de `developers.facebook.com` e a ajuda de pagamento exigiram login ou retornaram HTTP 429 nesta revisão. A fonte primária acessível foi o repositório `fbsamples`, mantido pela Meta. Confirmar no painel autenticado as opções, nomes e etapas disponíveis para o aplicativo; não declarar aprovação da conta sem inspecioná-la.

Referências para abertura pelo operador autenticado:

- [Onboarding de clientes como Tech Provider](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-customers-as-a-tech-provider)
- [Configuração de pagamento no WhatsApp Manager](https://www.facebook.com/business/help/488291839463771)
- [Painel de aplicativos Meta](https://developers.facebook.com/apps/)
