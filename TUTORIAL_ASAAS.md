# Tutorial: Configuração do Asaas no Ticketz

Este tutorial cobre o cadastro completo de um cliente na plataforma e a configuração do gateway Asaas para emissão de PIX, Boleto e NFS-e.

---

## Parte 1 — Configuração inicial (Administrador)

### 1.1 Acessar as configurações de pagamento

1. Faça login como **administrador** (`admin@...`)
2. No menu lateral, clique em **Configurações**
3. Clique na aba **PAYMENT GATEWAYS**
4. Em "Payment Gateway", selecione **Asaas (PIX + Boleto + NFS-e)**

### 1.2 Configurar a API Key do Asaas

1. Acesse o painel Asaas em [asaas.com](https://asaas.com) com sua conta
2. Vá em **Configurações → Integrações → Chaves de API**
3. Copie a **API Key de Produção** (começa com `$aact_prod_...`)
4. Cole no campo **API Key** nas configurações do Ticketz
5. Selecione o **Ambiente**: Produção (ou Sandbox para testes)

### 1.3 Configurar o Webhook (segurança obrigatória)

O webhook garante que pagamentos sejam confirmados automaticamente assim que o cliente pagar.

**No painel Asaas:**

1. Vá em **Configurações → Integrações → Webhooks**
2. Clique em **Adicionar Webhook**
3. Preencha:
   - **Nome:** ex. `ticketz-producao`
   - **URL:** `https://SEU_DOMINIO/api/subscription/ticketz/webhook`
   - **Versão da API:** v3
   - **Tipo de envio:** Sequencial
   - Clique em **Gerar Token** e copie o token gerado (`whsec_...`)
4. Em **Adicionar Eventos → Cobranças**, marque:
   - ✅ `PAYMENT_RECEIVED`
   - ✅ `PAYMENT_CONFIRMED`
5. Ative o toggle **"Este Webhook ficará ativo?"**
6. Clique em **Salvar**

**No Ticketz:**

1. Cole o token `whsec_...` no campo **Token do Webhook**
2. O campo salva automaticamente ao sair (onBlur)

### 1.4 Configurar NFS-e (Nota Fiscal)

> Pré-requisito: configure os dados de emissão de NF no painel Asaas em **Configurações → Nota Fiscal** antes de emitir a primeira nota.

**No painel Asaas:**

1. Vá em **Configurações → Nota Fiscal**
2. Cadastre os dados da sua empresa emissora (CNPJ, endereço, regime tributário)
3. Em **Serviços**, cadastre o serviço que será usado nas notas (ex: "Licença de software SaaS") e marque-o como **padrão**
4. Configure o certificado digital (A1 ou portal nacional)

**No Ticketz:**

1. Em **Configurações → Payment Gateways → Asaas**, preencha:
   - **Descrição do Serviço:** texto que aparecerá na nota (ex: `Licença de uso de software SaaS`)
   - **Código do Serviço LC116:** código municipal (ex: `14.02.01`)
   - **Alíquota ISS (%):** percentual de ISS (ex: `2`)

---

## Parte 2 — Cadastro de empresa cliente

### 2.1 Criar a empresa na plataforma

1. Como administrador, acesse **Configurações → Empresas**
2. Clique em **Adicionar**
3. Preencha os dados básicos: Nome, E-mail, Telefone, Plano, Vencimento
4. Clique em **Salvar**

### 2.2 Cadastrar os dados fiscais da empresa

Os dados fiscais são necessários para gerar PIX, Boleto e NFS-e.

1. Faça login **como a empresa cliente** (ou oriente o próprio cliente)
2. No menu lateral, clique em **Financeiro**
3. No submenu, clique em **Configurações**
4. Preencha todos os campos:
   - **Nome / Razão Social** — nome completo ou razão social da empresa
   - **CPF / CNPJ** — somente números
   - **CEP** — ao digitar e sair do campo, o endereço é preenchido automaticamente via ViaCEP
   - **Número** — complemento do endereço
   - **Bairro, Cidade, UF** — preenchidos automaticamente pelo CEP
   - **Inscrição Municipal** — se a empresa for prestadora de serviços (necessário para NFS-e)
   - **Inscrição Estadual** — se aplicável
   - **E-mail para NF** — e-mail que receberá as notas fiscais
5. Clique em **Salvar**

> **Importante:** sem CPF/CNPJ cadastrado, não é possível gerar PIX, Boleto ou NFS-e.

---

## Parte 3 — Pagamento de fatura

### 3.1 Acessar as faturas

1. No menu lateral, clique em **Financeiro → Faturas**
2. A lista mostra todas as faturas com status: **Em Aberto**, **Vencido** ou **Pago**

### 3.2 Pagar via PIX

1. Na linha da fatura, clique em **PAGAR**
2. Na tela "Falta pouco!", avance até a etapa **Revisar**
3. Selecione **PIX** como forma de pagamento
4. Clique em **PAGAR**
5. O QR Code PIX será exibido — escaneie com o app do banco
6. O sistema confirma o pagamento automaticamente via webhook (instantâneo)

### 3.3 Pagar via Boleto

1. Na linha da fatura, clique em **PAGAR**
2. Avance até **Revisar**, selecione **Boleto Bancário**
3. Clique em **PAGAR**
4. Clique em **VER BOLETO** para abrir o PDF
5. Pague o boleto no banco ou app bancário
6. A confirmação ocorre via webhook quando o Asaas processar o pagamento (normalmente em minutos após compensação)

> **Se o boleto não atualizar automaticamente:** clique em **VERIFICAR PGTO** na linha da fatura para forçar a consulta ao Asaas.

### 3.4 Verificar pagamento manualmente

Se o status não atualizou após o pagamento (ex.: após restart do sistema):

1. Na fatura com status **Em Aberto**, clique em **VERIFICAR PGTO**
2. O sistema consulta o Asaas em tempo real
3. Se o pagamento foi confirmado, o status muda para **Pago**

---

## Parte 4 — Emissão de NFS-e

### 4.1 Quando emitir

A nota fiscal só pode ser emitida:
- Para faturas com status **Pago**
- No mesmo mês do pagamento (restrição fiscal)

Para emissão retroativa (mês anterior), entre em contato com o suporte.

### 4.2 Como emitir

1. Na linha da fatura **Paga**, clique em **EMITIR NOTA**
2. O sistema emite a nota no Asaas e tenta obter o PDF
3. Possíveis respostas:
   - **PDF abre automaticamente** → nota emitida com sucesso
   - **"Nota fiscal emitida! Aguarde alguns minutos..."** → nota criada mas PDF ainda sendo processado pelo município; clique novamente em alguns minutos
   - **"Nota fiscal já emitida, mas ainda em processamento"** → aguarde e tente novamente

### 4.3 Visualizar nota já emitida

Após a nota ser processada, o botão **EMITIR NOTA** é substituído por **VER NOTA**. Clique para abrir o PDF diretamente.

### 4.4 Resolução de erros comuns na NFS-e

| Erro | Causa | Solução |
|------|-------|---------|
| "Endereço do cliente incompleto" | Número ou Bairro não cadastrados | Preencher em Financeiro → Configurações |
| "CPF/CNPJ não cadastrado" | Campo em branco | Preencher em Financeiro → Configurações |
| "Confira as pendências para emissão" | Certificado digital vencido ou dados fiscais incompletos no Asaas | Acessar Asaas → Configurações → Nota Fiscal |
| "Nota fiscal só pode ser emitida no mês do pagamento" | Tentativa de emissão retroativa | Solicitar ao suporte |

---

## Resumo de URLs do Webhook

| Ambiente | URL |
|----------|-----|
| Produção | `https://SEU_DOMINIO/api/subscription/ticketz/webhook` |
| Homologação | `https://SEU_DOMINIO_HOMOL/api/subscription/ticketz/webhook` |
